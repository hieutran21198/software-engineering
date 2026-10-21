import {createHash} from 'node:crypto';
import {realpath} from 'node:fs/promises';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {createRunner} from './transport.js';

// Verified against OpenCode 2.1.2. Shell-create rewrites by other plugins have
// no public call identity and are outside this input mapping (not a sandbox).
const TTL = 5000, CALL_TTL = 60000, MAX_ENTRIES = 1024;
const hash = text => createHash('sha256').update(text).digest('hex');
const callKey = e => JSON.stringify([e.sessionID, e.messageID, e.id]);
const pathAt = (base, path) => resolve(base, path === '~' ? homedir() : path.startsWith('~/') ? resolve(homedir(), path.slice(2)) : path);
const boundedSet = (map, key, value) => {
  map.set(key, value);
  while (map.size > MAX_ENTRIES) map.delete(map.keys().next().value);
};

export function createPlugin({runner, clock = Date.now} = {}) {
  return {
    id: 'artifact-plane',
    async setup(ctx) {
      if (!/^2\./.test(ctx.app.version)) throw Error('Artifact Plane requires OpenCode V2');
      const run = runner || createRunner();
      const sessions = new Map(), calls = new Map(), registrations = [];
      const controller = new AbortController();
      let closed = false;
      const safeRun = async (input, timeout = 8000) => {
        if (closed) return {};
        try {return await run(input, {timeout});} catch {return {};}
      };
      const invalidate = s => {s.turn = undefined;s.window = undefined;s.admitted.clear();};
      async function session(sessionID) {
        const info = await ctx.session.get({sessionID});
        if (!info.location?.directory) throw Error('Session location unavailable');
        const cwd = await realpath(info.location.directory);
        if (closed) throw Error('Plugin unloaded');
        let s = sessions.get(sessionID);
        if (!s) {
          s = {cwd, admitted: new Set(), seq: undefined, turn: undefined};
          boundedSet(sessions, sessionID, s);
        } else if (s.cwd !== cwd) {
          invalidate(s);s.cache = undefined;s.cwd = cwd;
          for (const [key, call] of calls) if (call.event.sessionID === sessionID) calls.delete(key);
        }
        // Keep the runtime label bounded even for hosts with unusually long IDs.
        s.identity = {cwd, session_id: `opencode:${sessionID.length <= 350 ? sessionID : hash(sessionID)}:${hash(cwd)}`,
          agent_id: typeof info.parentID === 'string' && info.parentID ? sessionID : ''};
        return s;
      }
      const inputFor = (s, hook_event_name, turn = s.turn) => ({...s.identity, hook_event_name, ...(turn ? {turn_id: turn} : {})});
      const sweep = () => {for (const [key, call] of calls) if (clock() - call.time >= CALL_TTL) calls.delete(key);};
      const toolInput = (event, s) => {
        const input = event.input;
        if (!input || typeof input !== 'object') return {};
        if (event.tool === 'shell' && typeof input.command === 'string') return {
          cwd: typeof input.workdir === 'string' ? pathAt(s.cwd, input.workdir) : s.cwd,
          tool_name: 'shell', tool_input: {command: input.command},
        };
        if (event.tool === 'read' && typeof input.path === 'string') return {
          tool_name: 'read', tool_input: {file_path: pathAt(s.cwd, input.path)},
        };
        return {tool_name: event.tool};
      };
      // Shell-before is deferred until permission evaluation sees the final mutable
      // event. One promise covers all scanner resources and repeated evaluations.
      const pre = (call, s) => {
        call.pre ??= safeRun({...inputFor(s, 'PreToolUse', call.turn), ...toolInput(call.event, s)});
        return call.pre;
      };
      const guard = fn => async event => {
        if (closed) return;
        try {await fn(event);} catch {/* fail open without logging private input */}
      };
      try {
        registrations.push(await ctx.session.hook('context', guard(async event => {
          const s = await session(event.sessionID), cwd = s.cwd;
          if (!s.cache || clock() - s.cache.at >= TTL) {
            const result = await safeRun(inputFor(s, 'SessionStart'), 12000);
            if (s.cwd !== cwd || closed) return;
            s.cache = {at: clock(), text: result?.hookSpecificOutput?.additionalContext};
          }
          if (typeof s.cache.text === 'string' && s.cache.text) event.system.push({type: 'text', text: s.cache.text});
        })));
        registrations.push(await ctx.tool.hook('execute.before', guard(async event => {
          sweep();
          const s = await session(event.sessionID), key = callKey(event);
          if (calls.has(key)) return;
          const call = {event, cwd: s.cwd, turn: s.turn, time: clock()};
          boundedSet(calls, key, call);
          if (event.tool !== 'shell') await pre(call, s);
        })));
        registrations.push(await ctx.permission.hook('evaluate', guard(async event => {
          if (event.action !== 'shell' || event.source?.type !== 'tool') return;
          sweep();
          const key = callKey({sessionID: event.sessionID, ...event.source});
          const call = calls.get(key);
          if (!call || call.event.tool !== 'shell') return;
          const s = await session(event.sessionID);
          if (call.cwd !== s.cwd || calls.get(key) !== call || call.turn !== s.turn) return;
          const result = await pre(call, s), output = result?.hookSpecificOutput;
          if (!closed && output?.permissionDecision === 'deny' && event.effect !== 'deny') {
            event.effect = 'deny';
            if (typeof output.permissionDecisionReason === 'string') event.message = output.permissionDecisionReason;
          }
        })));
        registrations.push(await ctx.tool.hook('execute.after', guard(async event => {
          const key = callKey(event), call = calls.get(key);
          if (!call) return;
          try {
            const s = await session(event.sessionID);
            if (call.cwd !== s.cwd || calls.get(key) !== call || call.turn !== s.turn) return;
            await pre(call, s);
            await safeRun({...inputFor(s, 'PostToolUse', call.turn), tool_name: call.event.tool});
          } finally {calls.delete(key);}
        })));
      } catch (error) {
        for (const registration of registrations) await registration.dispose();
        await run.close?.();throw error;
      }

      async function observe(event) {
        const id = event.durable?.aggregateID;
        if (!id || !Number.isSafeInteger(event.durable.seq)) return;
        if (!sessions.has(id) && !event.type.startsWith('session.') && event.data?.sessionID !== id) return;
        const s = await session(id), seq = event.durable.seq;
        if (s.seq !== undefined && seq <= s.seq) return;
        if (s.seq === undefined || seq !== s.seq + 1) invalidate(s);
        s.seq = seq;
        const data = event.data;
        if (event.type === 'session.moved') {invalidate(s);s.cache = undefined;return;}
        if (event.type === 'session.inbox.enqueued') {
          if (data?.sessionID !== id || data.item?.type !== 'user' || typeof data.inboxID !== 'string') return;
          s.admitted.add(data.inboxID);
          if (s.admitted.size > MAX_ENTRIES) invalidate(s);
        } else if (event.type === 'session.execution.started') {
          s.turn = undefined;s.window = {count: 0, certain: true};
        } else if (event.type === 'session.inbox.delivered') {
          if (data?.sessionID !== id) {invalidate(s);return;}
          const known = s.admitted.delete(data.inboxID);
          s.turn = known ? data.inboxID : undefined;
          if (s.window) {
            s.window.count++;
            s.window.certain &&= known && s.window.count === 1;
          }
          if (known) await safeRun(inputFor(s, 'UserPromptSubmit'));
        } else if (['session.execution.succeeded', 'session.execution.interrupted', 'session.execution.failed'].includes(event.type)) {
          const turn = s.turn, window = s.window;
          invalidate(s);
          if (data?.sessionID === id && window?.certain && window.count === 1 && turn && event.type !== 'session.execution.failed') {
            await safeRun({...inputFor(s, event.type === 'session.execution.succeeded' ? 'Stop' : 'Interrupt', turn), stop_hook_active: true});
          }
        }
      }
      const stream = (async () => {
        try {
          for await (const event of ctx.event.subscribe({signal: controller.signal})) {
            if (closed) break;
            try {await observe(event);} catch {for (const s of sessions.values()) invalidate(s);}
          }
        } catch {/* stream loss cannot supply a completion */}
        finally {for (const s of sessions.values()) invalidate(s);}
      })();
      return async () => {
        closed = true;controller.abort();await run.close?.();
        await Promise.allSettled(registrations.map(r => r.dispose()));
        sessions.clear();calls.clear();
        // Subscription cancellation is owned by the host. Do not block unload on
        // an uncooperative iterable; the loop checks closed before every event.
        void stream;
      };
    },
  };
}

export default createPlugin();
