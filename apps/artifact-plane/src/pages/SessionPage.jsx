// The session page (specifications/agent-orchestration.md: Workbench, Embedded terminal, States,
// Output, Recovery; mockup artboards 2, 3, 3b and 5). It shows task progress and output, not the
// agent process: no tool call log and no message stream. An ACP session has its permission
// requests, the last agent message and a message field; a terminal session embeds its terminal,
// where the person chats and answers. Plane records no approval and checks no DoD item.
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useShell} from '../page-data.js';
import {repositoryQuery} from '../reload.js';
import {querySettings} from '../agent-settings-api.js';
import {Notice, PageHeader, PhaseSteps, StatusBadge} from '../ui.jsx';
import {useSessionOutput, useSessionStream, useSessions} from '../Sessions.jsx';
import {sessionCommand, sessionDiff, startSession, terminalUrl} from '../sessions-api.js';
import {harnessLabel} from '../agent-settings-model.js';
import {ON_COMPUTER, UNSEEN_WAIT, agentText, diffLines, dodProgress, ago, fileNote, fileTree, headerFacts, isActive, isRole, isTerminal, outputSummary, phaseTarget,
  plural, profileChoices, recoveryChoices, respawnBody, respawnProfiles, sessionTitle, stateView} from '../session-model.js';
import {useNarrow} from './SessionsPage.jsx';

const TEXT_LIMIT = 64 * 1024;

// The phases of the change of a role session, read in the session worktree (amendment 4: a
// coordinator without a change shows the current change of its worktree when exactly one exists).
// The snapshot lists the changes of the selected worktree only; another worktree is read once.
function usePhases(session, snapshot, root) {
  const inferred = Boolean(session) && session.role === 'coordinator' && !session.change, other = inferred && session.worktree !== snapshot.repository.path;
  const [changes, setChanges] = useState(null);
  useEffect(() => {
    if (!other) return;
    const controller = new AbortController();
    repositoryQuery({path: root, worktree: session.worktree, section: 'overview'}, controller.signal)
      .then(result => setChanges(result.data?.workflow?.worktrees?.find(w => w.path === session.worktree)?.changes || []))
      .catch(error => {if (error.name !== 'AbortError') setChanges([]);});
    return () => controller.abort();
  }, [other, session?.worktree, root, session?.state]);
  const view = other ? {...snapshot, workflow: {worktrees: [{path: session.worktree, changes: changes || []}]}} : snapshot;
  const target = session ? phaseTarget(session, view) : null, key = target ? JSON.stringify([session.worktree, target.artifact, target.change]) : null;
  const [state, setState] = useState({key: null, change: null});
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    repositoryQuery({path: root, worktree: session.worktree, artifact: target.artifact, change: target.change, section: 'workflow'}, controller.signal)
      .then(result => setState({key, change: result.data}))
      .catch(error => {if (error.name !== 'AbortError') setState({key, change: null});});
    return () => controller.abort();
  }, [key, root, session?.state]);
  if (!target) return null;
  const listed = (view.workflow?.worktrees || []).find(w => w.path === session.worktree)?.changes?.find(c => c.artifact === target.artifact && c.name === target.change);
  const change = state.key === key && state.change ? {...listed, ...state.change} : listed ? {...listed} : null;
  return {target, change, inferred: !session.change};
}

// A command of the page: busy state, error text and the reply session.
function useCommand(onDone) {
  const [busy, setBusy] = useState(null), [error, setError] = useState(null);
  async function run(name, work) {
    setBusy(name);setError(null);
    try {const result = await work();onDone?.(result);return result;}
    catch (failure) {setError(failure.body?.rule ? `${failure.message} (start rule ${failure.body.rule})` : failure.message);return null;}
    finally {setBusy(null);}
  }
  return {busy, error, run, clear: () => setError(null)};
}

export default function SessionPage({page}) {
  const {snapshot, root, go} = useShell(), sessions = useSessions(), narrow = useNarrow();
  const stream = useSessionStream(page.session, sessions.observing);
  const listed = sessions.sessions.find(s => s.id === page.session) || null;
  const session = stream.session ? {...stream.session, live: stream.live ?? null} : listed;
  const output = useSessionOutput(session?.id, `${stream.output}:${session?.state}`, session?.state === 'working');
  // A role session shows the phases of its change (AO27).
  const phases = usePhases(session && isRole(session) ? session : null, snapshot, root);
  const command = useCommand(() => sessions.refresh());
  if (!session) return <section className="page wide session-page" aria-label="Session page"><div className="column">
    <PageHeader eyebrow={<button className="link" onClick={() => go({kind: 'sessions'})}>Sessions</button>} title="Session"/>
    {sessions.status === 'loaded' && stream.closed ? <p className="muted">This session is not a session of this repository.</p> : <p className="muted" role="status">Reading the session…</p>}
  </div></section>;

  const facts = headerFacts(session), state = stateView(session), terminal = isTerminal(session), role = isRole(session), active = isActive(session);
  const pending = session.live?.pending || [];
  const end = () => {if (window.confirm('End this session? The agent stops. Uncommitted files stay in the worktree.')) command.run('end', () => sessionCommand('end', {session: session.id}));};
  const openApp = () => command.run('open', () => sessionCommand('open-terminal', {session: session.id}));
  const actions = <div className="session-actions">
    <StatusBadge status={state.status}>{state.text}</StatusBadge>
    {!terminal && active && <button disabled={Boolean(command.busy) || !['working', 'waiting'].includes(session.state)} onClick={() => command.run('cancel', () => sessionCommand('cancel', {session: session.id}))}>Stop turn</button>}
    {active && <button className="end-session" disabled={Boolean(command.busy)} onClick={end}>End session</button>}
  </div>;
  return <section className="page wide session-page" aria-label="Session page"><div className="column">
    <PageHeader eyebrow={<><button className="link" onClick={() => go({kind: 'sessions'})}>Sessions</button>{session.change && <> · {session.artifact} · <span className="mono">{session.change}</span></>}</>}
      title={sessionTitle(session, snapshot)}
      subtitle={<>{[role ? null : facts.role, facts.agent, facts.signIn, facts.connection].filter(Boolean).join(' · ')}{facts.branch && <> · <span className="mono">{facts.branch}</span></>} · {facts.started}</>}
      action={actions}/>
    {page.existing && <Notice role="status">This task already has an open session. Plane started no second session.</Notice>}
    {command.error && <Notice tone="error" action={<button onClick={command.clear}>Dismiss</button>}>{command.error}</Notice>}
    {session.error && <Notice tone="error">{session.error}</Notice>}
    {sessions.observing && stream.closed && active && <Notice tone="warning" action={<button onClick={stream.reconnect}>Reconnect</button>}>Plane cannot follow this session now. The page shows the last known state.</Notice>}
    {phases && <div className="session-phases">
      {phases.change ? <PhaseSteps change={phases.change}/> : <p className="muted small">Reading phases…</p>}
      {phases.inferred && <p className="tiny">Phases of {phases.target.artifact}/{phases.target.change}, the current change of this worktree.</p>}
    </div>}
    {role && !phases && session.role === 'coordinator' && <p className="muted small session-phases">No change yet. The phases show when the worktree has exactly one current change.</p>}
    <Recovery session={session} sessions={sessions} go={go}/>
    {!terminal && pending.map(request => <PermissionCard key={request.request} session={session} request={request} command={command}/>)}
    {terminal ? <div className={`session-layout ${active ? 'terminal-layout' : ''}`}>
      {(active || !role) && <div className={active ? 'session-main' : 'session-side'}>
        {active && <TerminalPanel session={session} role={role} narrow={narrow} onOpenApp={openApp} busy={command.busy}/>}
        {!role && <ProgressCards output={output} session={session}/>}
      </div>}
      <OutputCard session={session} output={output} role={role}/>
    </div> : <>
      <div className="session-layout">
        <div className="session-side"><ProgressCards output={output} session={session}/></div>
        <OutputCard session={session} output={output} role={role}/>
      </div>
      {active && <MessageForm session={session} command={command}/>}
    </>}
  </div></section>;
}

// One pending ACP permission request with the options of the agent (AO6). Plane never answers
// for the person.
function PermissionCard({session, request, command}) {
  const answer = option => command.run('permission', () => sessionCommand('permission', {session: session.id, request: request.request, option: option.optionId}));
  const primary = request.options?.findIndex(o => o.kind === 'allow_once');
  return <section className="permission-card" aria-label="Permission request">
    <div className="permission-text">
      <h2>{request.title}</h2>
      {request.description && <p className="small">{request.description}</p>}
      {request.command && <code className="permission-command">{request.command}</code>}
    </div>
    <div className="permission-options">{(request.options || []).map((option, i) => <button key={option.optionId} className={i === primary ? 'primary' : ''} disabled={Boolean(command.busy)} onClick={() => answer(option)}>{option.name}</button>)}</div>
  </section>;
}

// The DoD checklist of the task, the commits since the start and the last agent message.
function ProgressCards({output, session}) {
  const data = output.data, progress = dodProgress(data), commits = data?.commits || [];
  return <>
    {session.role === 'implementer' && <section className="session-card" aria-label="Definition of Done">
      <h2>Definition of Done{progress ? ` · ${progress.checked} of ${progress.total}` : ''}</h2>
      {!data ? <p className="session-card-empty muted">{output.status === 'error' ? output.error : 'Reading the task…'}</p>
        : progress?.total ? <ul className="dod-items">{data.dod.items.map((item, i) => <li key={i}><input type="checkbox" checked={item.checked} disabled aria-label={item.checked ? 'Done' : 'Not done'}/><span>{item.text}</span></li>)}</ul>
        : <p className="session-card-empty muted">The task has no checklist items.</p>}
    </section>}
    <section className="session-card" aria-label="Commits since start">
      <h2>Commits since start · {commits.length}</h2>
      {commits.length ? <ul className="commit-list">{commits.map(c => <li key={c.id}><span className="mono">{c.id}</span><span>{c.subject}</span></li>)}</ul>
        : <p className="session-card-empty muted">{data ? 'No commit since the session started.' : 'Reading commits…'}</p>}
    </section>
    {session.profile?.connection === 'acp' && <section className="session-card" aria-label="Last message of the agent">
      <h2>Last message of the agent</h2>
      <p className="last-message">{session.live?.lastMessage || <span className="muted">{session.live ? 'No message yet.' : 'The last message shows while the session runner hosts the session.'}</span>}</p>
    </section>}
  </>;
}

// The output since the start: the changed files as a tree and the diff of the selected file (AO20).
function OutputCard({session, output, role}) {
  const data = output.data, files = data?.files || [], summary = outputSummary(data);
  const [selected, setSelected] = useState(null), tree = useMemo(() => fileTree(files), [data]);
  const current = files.find(f => f.path === selected) || tree[0]?.files[0] || null;
  const [diff, setDiff] = useState({path: null, status: 'idle', data: null, error: null});
  useEffect(() => {
    if (!current) return;
    const controller = new AbortController();
    setDiff(previous => ({path: current.path, status: 'loading', data: previous.path === current.path ? previous.data : null, error: null}));
    sessionDiff(session.id, current.path, controller.signal).then(result => setDiff({path: current.path, status: 'loaded', data: result, error: null}))
      .catch(error => {if (error.name !== 'AbortError') setDiff({path: current.path, status: 'error', data: null, error: error.message});});
    return () => controller.abort();
  }, [session.id, current?.path, data]);
  const keys = event => {
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const items = [...event.currentTarget.querySelectorAll('[role="treeitem"]')], at = items.indexOf(document.activeElement);
    if (at < 0) return;
    event.preventDefault();const next = items[Math.max(0, Math.min(items.length - 1, at + (event.key === 'ArrowDown' ? 1 : -1)))];
    next.focus();setSelected(next.dataset.path);
  };
  const lines = diff.data?.diff ? diffLines(diff.data.diff) : [];
  return <section className="session-card output-card" aria-label="Output since start">
    <h2>Output since start{summary && <> · {plural(summary.files, 'file')} · <span className="plus">+{summary.added}</span> <span className="minus">−{summary.removed}</span>{summary.uncommitted ? ` · ${plural(summary.uncommitted, 'file')} not committed` : ''}</>}</h2>
    {!data ? <p className="session-card-empty muted" role={output.status === 'error' ? 'alert' : 'status'}>{output.status === 'error' ? output.error : 'Reading output…'}</p>
      : !files.length ? <p className="session-card-empty muted">No changed file since the session started.</p>
      : <div className="output-body">
        <div className="output-tree" role="tree" aria-label="Changed files" onKeyDown={keys}>
          {tree.map(group => <div key={group.dir} role="group" aria-label={group.dir || 'Repository root'}>
            <div className="output-dir mono" aria-hidden="true">{group.dir ? group.dir.split('/').slice(0, -1).map((part, i) => <React.Fragment key={i}>{part}/<wbr/></React.Fragment>) : './'}</div>
            {group.files.map(file => <button key={file.path} type="button" role="treeitem" data-path={file.path} aria-selected={file.path === current?.path} tabIndex={file.path === current?.path ? 0 : -1}
              className={`output-file ${file.path === current?.path ? 'on' : ''}`} onClick={() => setSelected(file.path)} aria-label={`${file.path}, ${fileNote(file)}, ${file.binary ? 'binary' : `${file.added} added, ${file.removed} removed`}`}>
              <span className={`file-status ${file.status}`} aria-hidden="true">{file.status}</span>
              <span className="output-name">{file.name}</span>
              {!file.binary && <span className="output-counts" aria-hidden="true">{file.added > 0 && <span className="plus">+{file.added}</span>}{file.removed > 0 && <span className="minus">−{file.removed}</span>}</span>}
            </button>)}
          </div>)}
          {data.truncated && <p className="tiny output-more">Plane lists the first 500 files.</p>}
        </div>
        <div className="output-diff" role="region" aria-label={current ? `Diff of ${current.path}` : 'Diff'}>
          {current && <div className="output-diff-head"><span className="mono">{current.path}</span><span className="connection-tag">{fileNote(current)}</span></div>}
          {diff.status === 'error' ? <p className="session-card-empty muted" role="alert">{diff.error}</p>
            : current?.binary ? <p className="session-card-empty muted">Binary file. Plane shows no diff.</p>
            : !diff.data && diff.status === 'loading' ? <p className="session-card-empty muted" role="status">Reading the diff…</p>
            : <pre className="line-diff session-diff">{lines.map((line, i) => line.kind === 'hunk' ? <span key={i} className="diff-line hunk"><span className="diff-number"/><span className="diff-number"/><span/><code>{line.text}</code>{'\n'}</span>
              : line.kind === 'note' ? <span key={i} className="diff-line note"><span className="diff-number"/><span className="diff-number"/><span/><code>{line.text}</code>{'\n'}</span>
              : <span key={i} className={`diff-line ${line.kind}`}><span className="diff-number">{line.before ?? ''}</span><span className="diff-number">{line.after ?? ''}</span><span aria-label={line.kind === 'add' ? 'Added' : line.kind === 'remove' ? 'Removed' : 'Unchanged'}>{line.kind === 'add' ? '+' : line.kind === 'remove' ? '−' : ' '}</span><code>{line.text}</code>{'\n'}</span>)}</pre>}
          {diff.data?.truncated && <p className="tiny output-more">{diff.data.notice}</p>}
        </div>
      </div>}
  </section>;
}

// The message field of an ACP session: one prompt at a time, after the turn ends.
function MessageForm({session, command}) {
  const [text, setText] = useState(''), ready = session.state === 'idle' && session.hosted !== false, size = new TextEncoder().encode(text).length;
  async function send(event) {
    event.preventDefault();if (!ready || !text.trim() || size > TEXT_LIMIT) return;
    if (await command.run('prompt', () => sessionCommand('prompt', {session: session.id, text}))) setText('');
  }
  return <form className="message-form" aria-label="Message to the agent" onSubmit={send}>
    <div className="field">
      <label htmlFor={`message-${session.id}`}>Message to the agent</label>
      <textarea id={`message-${session.id}`} rows={2} value={text} disabled={!ready} onChange={event => setText(event.target.value)}
        placeholder={ready ? 'Write the next step for the agent.' : 'You can send a message when the turn ends.'}/>
      {size > TEXT_LIMIT && <small>The message has {size} bytes; the limit is 64 KiB.</small>}
    </div>
    <button className="primary" disabled={!ready || !text.trim() || size > TEXT_LIMIT || Boolean(command.busy)} aria-busy={command.busy === 'prompt'}>Send</button>
  </form>;
}

// The embedded terminal (AO28): the ttyd page of the relay in a frame of the same origin, the
// waiting notice above it, Full screen and Open in terminal app. Without the relay, or at a
// narrow width, the page offers Open in terminal app only.
function TerminalPanel({session, role, narrow, onOpenApp, busy}) {
  const frame = useRef(null), harness = harnessLabel(session.profile?.harness);
  const [failure, setFailure] = useState(null), [attempt, setAttempt] = useState(0);
  const relay = session.relay, available = relay?.available === true && !failure, waiting = session.state === 'waiting';
  // A refused relay page is the JSON error of the server; the frame is of the same origin.
  const loaded = () => {
    try {
      const document = frame.current?.contentDocument;
      if (document?.contentType === 'application/json') setFailure(JSON.parse(document.body.textContent).error || 'The terminal relay did not answer.');
    } catch {/* the page of the relay */}
  };
  const focus = () => {
    const node = frame.current;if (!node) return;
    node.focus();
    try {node.contentWindow?.focus();node.contentDocument?.querySelector('textarea, [tabindex]')?.focus();} catch {/* the frame keeps the focus */}
  };
  const fullScreen = () => frame.current?.requestFullscreen?.().catch(() => {});
  const openButton = <button className="dark" disabled={busy === 'open'} aria-busy={busy === 'open'} onClick={onOpenApp}>Open in terminal app</button>;
  return <div className="terminal-area">
    {session.agentStatus === 'unknown' && <p className="unseen-wait small"><b>{UNSEEN_WAIT}</b> herdr reports no state for {harness}. Look at the terminal for its questions.</p>}
    {waiting && <div className="terminal-wait" role="status">
      <div className="terminal-wait-text">
        <b>{session.waitingTool ? `${harness} asks to use ${session.waitingTool}` : `${harness} waits for you in the terminal`}</b>
        <span className="small muted">{available && !narrow ? 'Read the request and answer it in the terminal below. Plane does not answer for you.' : 'Answer it in the terminal of the session. Plane does not answer for you.'}</span>
      </div>
      {available && !narrow && <button onClick={focus}>Focus terminal</button>}
    </div>}
    <section className={`terminal-panel ${waiting ? 'waiting' : ''}`} aria-label="Terminal">
      <div className="terminal-head">
        <h2>Terminal · herdr session plane-{session.id}</h2>
        {available && !narrow && <button className="dark" onClick={fullScreen}>Full screen</button>}
        {openButton}
      </div>
      {narrow ? <div className="terminal-placeholder"><b>{ON_COMPUTER}</b><span>The embedded terminal needs a wider window. Open in terminal app shows the session in a terminal window of the computer that runs Plane.</span></div>
        : available ? <iframe key={attempt} ref={frame} className="terminal-frame" title={`Terminal of session ${session.id}`} src={terminalUrl(session.id)} onLoad={loaded}/>
        : <div className="terminal-placeholder">
          <b>The embedded terminal is not available.</b>
          <span>{failure || relay?.reason || 'Plane is connecting to the session runner.'} The session continues in herdr; Open in terminal app shows it.</span>
          {failure && <button className="dark" onClick={() => {setFailure(null);setAttempt(n => n + 1);}}>Try again</button>}
        </div>}
      <p className="terminal-foot">{waiting ? `The dialog belongs to ${harness}. Answer it with the keys that it shows. The permission rules of ${harness} apply as usual.`
        : available && !narrow ? `Click the terminal to type. ${role ? 'You chat and approve the plan here; Plane records no approval.' : 'You work with the agent here.'} Browser shortcuts such as Ctrl+W still go to the browser; use Full screen or the terminal app when you need them.`
        : role ? 'You chat and approve the plan in the terminal of the session; Plane records no approval.' : 'You work with the agent in the terminal of the session.'}</p>
    </section>
  </div>;
}

// The choices of the Recovery table (artboard 5): Resume when the harness session can resume,
// Respawn with the same profile and Respawn with another profile.
function Recovery({session, sessions, go}) {
  const choices = recoveryChoices(session), [settings, setSettings] = useState({status: 'idle', data: null});
  const [other, setOther] = useState(''), [request, setRequest] = useState('');
  const command = useCommand();
  useEffect(() => {
    if (!choices) return;
    const controller = new AbortController();setSettings({status: 'loading', data: null});
    querySettings(controller.signal).then(data => setSettings({status: 'loaded', data})).catch(error => {if (error.name !== 'AbortError') setSettings({status: 'error', data: null, error: error.message});});
    return () => controller.abort();
  }, [Boolean(choices)]);
  if (!choices) return null;
  const others = respawnProfiles(settings.data, session), chosen = others.some(p => p.id === other) ? other : others[0]?.id || '';
  const needsRequest = session.role === 'coordinator' && !session.change;
  const respawn = profile => command.run(`respawn:${profile}`, async () => {
    if (needsRequest && !request.trim()) throw Error('Write what you need.');
    const result = await startSession(respawnBody(session, profile, needsRequest ? request : undefined));
    sessions.refresh();go({kind: 'session', session: result.session.id});
    return result;
  });
  const resume = () => command.run('resume', async () => {const result = await sessionCommand('resume', {session: session.id});sessions.refresh();return result;});
  const same = profileChoices(settings.data, session.role).choices.some(c => c.id === session.profile?.id && !c.reason);
  const stopped = ago(session.endedAt || session.updatedAt);
  return <section className="session-card recovery" aria-label={session.role === 'implementer' ? 'Recover this task' : 'Recover this session'}>
    <h2>{session.role === 'implementer' ? 'Recover this task' : 'Recover this session'}</h2>
    <p className="recovery-facts">{agentText(session)}{session.live?.protocolVersion ? ` · ACP version ${session.live.protocolVersion}` : ''} · stopped {stopped}. Uncommitted files stay in the worktree <span className="mono">{session.worktree}</span>; Plane changed no file.</p>
    {command.error && <p className="operation-error" role="alert">{command.error}</p>}
    {needsRequest && <div className="recovery-choice">
      <div className="field grow"><label htmlFor={`request-${session.id}`}>What do you need?</label>
        <textarea id={`request-${session.id}`} rows={3} value={request} onChange={event => setRequest(event.target.value)}/>
        <small>Plane keeps no copy of the first request. Write it again for the new coordinator.</small></div>
    </div>}
    {choices.resume && <div className="recovery-choice">
      <div className="grow"><b>Resume the same session</b><p className="small muted">{choices.resume}</p></div>
      <button className="primary" disabled={Boolean(command.busy)} aria-busy={command.busy === 'resume'} onClick={resume}>Resume</button>
    </div>}
    <div className="recovery-choice">
      <div className="grow"><b>Respawn with the same profile</b><p className="small muted">{choices.respawn}{settings.status === 'loaded' && !same ? ` The profile ${session.profile?.id} cannot start now; respawn with another profile.` : ''}</p></div>
      <button className={choices.resume ? '' : 'primary'} disabled={Boolean(command.busy) || settings.status !== 'loaded' || !same} aria-busy={command.busy === `respawn:${session.profile?.id}`} onClick={() => respawn(session.profile.id)}>Respawn</button>
    </div>
    <div className="recovery-choice">
      <div className="grow"><label htmlFor={`other-${session.id}`}><b>Respawn with another profile</b></label><p className="small muted">Use this when a quota runs out or the task needs a stronger model.</p></div>
      <select id={`other-${session.id}`} value={chosen} disabled={!others.length} onChange={event => setOther(event.target.value)}>
        {!others.length && <option value="">{settings.status === 'loading' ? 'Reading launch profiles…' : 'No other profile'}</option>}
        {others.map(p => <option key={p.id} value={p.id}>{[p.name, p.profile.model, p.profile.reasoning].filter(Boolean).join(' · ')}</option>)}
      </select>
      <button aria-label="Respawn with the selected profile" disabled={Boolean(command.busy) || !chosen} onClick={() => respawn(chosen)}>Respawn</button>
    </div>
  </section>;
}
