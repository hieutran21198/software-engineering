// The hook command of the executable (artifact-plane specifications/agent-integration.md:
// Hook command, Inferred binding). It records the observation as the observer does,
// then does the work of the event. Each step has its own error boundary and time
// limit, and a failed step gives `{}`. It never stores the payload text of the input.
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {isSea} from 'node:sea';
import {fileURLToPath} from 'node:url';
import {RuntimeStore, repositoryIdentity, inferredBinding} from './runtime-store.js';
import {worktreeStatus, reservedAction, stopCheck} from './agent-guidance.js';
import {workbenchStep} from './workbench.js';

export const MAX_INPUT = 1024 * 1024;
export const LIMITS = {PreToolUse: 2000, SessionStart: 5000, workbench: 4000, stop: 20000};
const OBSERVED = new Set(['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'PermissionRequest', 'Stop', 'Interrupt', 'SessionEnd', 'SubagentStart', 'SubagentStop']);
const TIMEOUT = Symbol('timeout');

// The hook input text, at most MAX_INPUT bytes.
export async function readInput(stream) {
  const chunks = [];let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_INPUT) throw Error('Hook input too large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// The observer step: one allowlisted event in the store. It returns the open store.
export function observe(input, stateDir) {
  if (typeof input.cwd !== 'string' || !input.cwd) throw Error('Hook cwd missing');
  const store = new RuntimeStore({stateDir, roots: repositoryIdentity(input.cwd, {allowNested: true}).roots});
  try {store.observe({...input, event_id: randomUUID()});return store;}
  catch (error) {store.close();throw error;}
}

// Starts `runtime bind ... --binding inferred` of this program as a detached process and does not wait.
export function startBind(binding, stateDir) {
  const program = isSea() ? [] : [fileURLToPath(new URL('./app.js', import.meta.url))];
  const {root, artifact, change, task, session, agent, unit} = binding;
  const args = [...program, 'runtime', 'bind', '--root', root, '--artifact', artifact, '--change', change, '--task', task, '--session', session,
    ...(agent ? ['--agent', agent] : []), ...(unit ? ['--unit', unit] : []), '--binding', 'inferred', ...(stateDir ? ['--state-dir', stateDir] : [])];
  const child = spawn(process.execPath, args, {detached: true, stdio: 'ignore', windowsHide: true});
  child.on('error', () => {});
  child.unref();
}

// The result of fn, or TIMEOUT when it runs longer than ms.
async function within(ms, fn) {
  let timer;
  try {return await Promise.race([Promise.resolve().then(fn), new Promise(done => {timer = setTimeout(done, ms, TIMEOUT);})]);}
  finally {clearTimeout(timer);}
}

// Command Code sends optional extra arguments beside command. Append them with
// shell quoting so the existing policy and task-path parsers see one command.
const quotedArg = arg => `'${arg.replaceAll("'", "'\\''")}'`;
const withShellArgs = input => {
  const toolInput = input?.tool_input, args = toolInput?.args;
  if (typeof toolInput?.command !== 'string' || !Array.isArray(args) || !args.length || !args.every(arg => typeof arg === 'string')) return input;
  return {...input, tool_input: {...toolInput, command: [toolInput.command, ...args.map(quotedArg)].join(' ')}};
};

// Normalizes a hook input object and returns {input, antigravity}.
export function normalizeHookInput(raw, eventOption) {
  const antigravity = !raw.hook_event_name && (typeof raw.conversationId === 'string' || Array.isArray(raw.workspacePaths));
  if (!antigravity) {
    const input = eventOption && !raw.hook_event_name ? {...raw, hook_event_name: eventOption} : raw;
    return {input: withShellArgs(input), antigravity: false};
  }
  const toolCall = raw.toolCall && typeof raw.toolCall === 'object' && !Array.isArray(raw.toolCall) ? raw.toolCall : null;
  const args = toolCall?.args && typeof toolCall.args === 'object' && !Array.isArray(toolCall.args) ? toolCall.args : null;
  const hook_event_name = eventOption
    ? (eventOption === 'PreInvocation' ? 'UserPromptSubmit' : eventOption)
    : toolCall && 'error' in raw ? 'PostToolUse'
    : toolCall ? 'PreToolUse'
    : typeof raw.terminationReason === 'string' || typeof raw.fullyIdle === 'boolean' ? 'Stop'
    : typeof raw.invocationNum === 'number' ? 'UserPromptSubmit'
    : 'SessionStart';
  const cwd = Array.isArray(raw.workspacePaths) ? raw.workspacePaths.find(p => typeof p === 'string' && p) || process.cwd() : process.cwd();
  const stop_hook_active = raw.stop_hook_active === true
    || (typeof raw.terminationReason === 'string' && raw.terminationReason !== '' && raw.terminationReason !== 'NO_TOOL_CALL')
    || (typeof raw.executionNum === 'number' && raw.executionNum > 1);
  return {
    antigravity: true,
    input: {
      hook_event_name,
      session_id: typeof raw.conversationId === 'string' ? raw.conversationId : '',
      cwd,
      turn_id: typeof raw.conversationId === 'string' ? raw.conversationId : '',
      ...(typeof raw.modelName === 'string' ? {model: raw.modelName} : {}),
      ...(typeof (raw.agentId || raw.subagentId) === 'string' ? {agent_id: raw.agentId || raw.subagentId} : {}),
      ...(typeof toolCall?.name === 'string' ? {tool_name: toolCall.name} : {}),
      ...(args ? {tool_input: {
        command: args.CommandLine ?? args.command,
        file_path: args.Path ?? args.AbsolutePath ?? args.FilePath ?? args.file_path,
        path: args.Path ?? args.DirectoryPath ?? args.path,
      }} : {}),
      stop_hook_active,
    },
  };
}

// The output of one hook input text: {output, unavailable}. `unavailable` is true
// when a step failed, timed out or found no ADD repository. Tests replace steps.
export async function hookOutput(text, {stateDir, event: eventOption, limits = LIMITS, steps = {}} = {}) {
  const run = {observe, status: worktreeStatus, workbench: workbenchStep, reserved: reservedAction, infer: inferredBinding, start: startBind, stop: stopCheck, ...steps};
  let unavailable = false, raw;
  const step = async (ms, fn) => {
    try {const result = await within(ms, fn);if (result !== TIMEOUT) return result;}
    catch {/* the step returns {} */}
    unavailable = true;
    return null;
  };
  try {
    raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Hook input is not an object');
  } catch {return {output: eventOption === 'PreToolUse' ? {decision: 'allow'} : {}, unavailable: true};}
  const {input, antigravity} = normalizeHookInput(raw, eventOption);
  const event = input.hook_event_name;
  let output = antigravity && event === 'PreToolUse' ? {decision: 'allow'} : {};
  if (!OBSERVED.has(event)) return {output, unavailable};
  let store = null;
  try {store = run.observe(input, stateDir);} catch {unavailable = true;}
  try {
    if (event === 'SessionStart') {
      // The workbench step runs beside the session context step, with its own limit (specifications/ui-discovery.md: Hook output).
      const [status, workbench] = await Promise.all([step(limits.SessionStart, () => run.status(input.cwd)), step(limits.workbench, () => run.workbench(input.cwd))]);
      if (!status) unavailable = true;
      const line = workbench?.line;
      const context = status?.text && line ? `${status.text}\nWorkbench for people: ${line}` : status?.text || line;
      if (context) output = antigravity
        ? {injectSteps: [{systemMessage: {systemMessage: context}}]}
        : {hookSpecificOutput: {hookEventName: 'SessionStart', additionalContext: context},
          ...(line && ['startup', 'resume'].includes(input.source) ? {systemMessage: line} : {})};
    } else if (event === 'PreToolUse') {
      const deadline = Date.now() + limits.PreToolUse;
      const denied = await step(limits.PreToolUse, () => run.reserved(input));
      if (denied) output = antigravity
        ? {decision: 'deny', reason: denied.reason}
        : {hookSpecificOutput: {hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: denied.reason}};
      else if (deadline > Date.now()) await step(deadline - Date.now(), async () => {
        if (!store) throw Error('Runtime store unavailable');
        const binding = await run.infer(input, store);
        if (binding) run.start(binding, stateDir);
      });
    } else if (event === 'Stop' || event === 'SubagentStop') {
      const failed = await step(limits.stop, () => run.stop(input));
      if (failed) output = {decision: antigravity ? 'continue' : 'block', reason: failed.reason};
    }
  } finally {store?.close();}
  return {output, unavailable};
}
