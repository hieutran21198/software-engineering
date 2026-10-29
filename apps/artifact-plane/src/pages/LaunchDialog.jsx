// The launch dialog and the Start ADD work dialog (specifications/agent-orchestration.md:
// Workbench, Start rules; mockup artboards 4 and 9). The dialog selects the role default, shows
// the warnings of the start rules as facts that the person confirms with Start, and shows the
// reason of each refused start. Plane decides nothing here: the start rules run in the server.
import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {useShell} from '../page-data.js';
import {repositoryQuery} from '../reload.js';
import {querySettings} from '../agent-settings-api.js';
import {startSession} from '../sessions-api.js';
import {harnessLabel} from '../agent-settings-model.js';
import {ROLE_LABELS, launchWarnings, profileChoices, worktreeChoices} from '../session-model.js';
import {Spinner} from '../ui.jsx';
import {changeTitle, currentChanges} from '../work-model.js';
import './SettingsPage.css';

const FOCUSABLE = 'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const REQUEST_LIMIT = 8 * 1024;
const ROLES = ['coordinator', 'product-owner', 'technical-lead', 'implementer'];
const ROLE_DEFAULT = {coordinator: 'default for coordinators', 'product-owner': 'default for product owners', 'technical-lead': 'default for technical leads', implementer: 'default for implementers'};
const taskName = task => `${task.path.split('/').at(-1).match(/^(\d+)-/)?.[1] || ''} ${task.title}`.trim();
const relativeTask = path => path.split('/tasks/').at(-1);

// A modal card over the dimmed page: Escape closes it and Tab stays inside. Escape also closes
// it while a start runs, as Cancel does.
function Dialog({title, subtitle, className = '', onClose, children}) {
  const id = useId(), ref = useRef(null), state = useRef({onClose});
  state.current = {onClose};
  useEffect(() => {requestAnimationFrame(() => ref.current?.querySelector('[data-autofocus], ' + FOCUSABLE)?.focus());}, []);
  // Escape closes the dialog wherever the focus is, also after a disabled button lost it.
  useEffect(() => {
    const close = event => {if (event.key === 'Escape' && !event.defaultPrevented) {event.preventDefault();state.current.onClose();}};
    document.addEventListener('keydown', close);return () => document.removeEventListener('keydown', close);
  }, []);
  const keys = event => {
    if (event.key !== 'Tab') return;
    const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter(n => !n.disabled && n.offsetParent !== null), first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  };
  return <div className="dialog-backdrop">
    <section className={`dialog launch-dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} ref={ref} onKeyDown={keys}>
      <div className="launch-head">
        <h2 id={`${id}-title`} className="dialog-title">{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  </div>;
}

// The settings of the dialog: the profiles, their validity and the role defaults.
function useSettings() {
  const [state, setState] = useState({status: 'loading', data: null, error: null});
  useEffect(() => {
    const controller = new AbortController();
    querySettings(controller.signal).then(data => setState({status: 'loaded', data, error: null}))
      .catch(error => {if (error.name !== 'AbortError') setState({status: 'error', data: null, error: error.message});});
    return () => controller.abort();
  }, []);
  return state;
}
// The task graph of a change in a worktree, from the workflow query.
function useTasks(root, worktree, artifact, change) {
  const [state, setState] = useState({status: 'idle', tasks: [], key: null});
  const key = worktree && artifact && change ? JSON.stringify([worktree, artifact, change]) : null;
  useEffect(() => {
    if (!key) {setState({status: 'idle', tasks: [], key: null});return;}
    const controller = new AbortController();
    setState(current => ({status: 'loading', tasks: current.key === key ? current.tasks : [], key}));
    repositoryQuery({path: root, worktree, artifact, change, section: 'workflow'}, controller.signal)
      .then(result => setState({status: 'loaded', tasks: result.data?.taskGraph?.tasks || [], key}))
      .catch(error => {if (error.name !== 'AbortError') setState({status: 'error', tasks: [], key, error: error.message});});
    return () => controller.abort();
  }, [key, root]);
  return state;
}
// The reason of a refused or failed start, with its start rule when the server names one.
const refusal = error => error.body?.rule ? `${error.message} (start rule ${error.body.rule})` : error.message;
// True while the dialog shows. Cancel closes the dialog during a start, but the server does not
// stop a start that it runs: the session then shows on the Sessions page, and the page stays.
function useOpen() {
  const open = useRef(true);
  useEffect(() => {open.current = true;return () => {open.current = false;};}, []);
  return open;
}
// The Start button. While the start runs it shows a spinner and "Starting <harness tool>…" and
// keeps the focus; a second click sends no second start.
function StartButton({busy, disabled, harness, children}) {
  return <button className="primary" disabled={!busy && disabled} aria-disabled={busy || undefined} aria-busy={busy}>
    {busy ? <><Spinner/>{`Starting ${harness}…`}</> : children}
  </button>;
}
// The text of the live region of the dialog foot while the start runs.
const StartingNote = ({harness}) => <><span className="sr-only">Starting {harness}. </span>This can take a few seconds.</>;

// One radio card for each profile: name, default mark, chips and the reason why it cannot start.
function ProfileCards({choices, value, onChange, role, name, busy}) {
  return <fieldset className="editor-group launch-profiles">
    <legend>Launch profile</legend>
    {choices.map(c => <label key={c.id} className={`choice-card launch-profile ${value === c.id ? 'selected' : ''} ${c.reason ? 'disabled' : ''}`}>
      <input type="radio" name={name} value={c.id} checked={value === c.id} disabled={busy || Boolean(c.reason)} onChange={() => onChange(c.id)}/>
      <span className="launch-profile-text">
        <span className="launch-profile-name">{c.name}{c.isDefault && <span className="launch-default"> · {ROLE_DEFAULT[role]}</span>}</span>
        <span className="launch-chips">{c.chips.map(chip => <span key={chip} className="connection-tag">{chip}</span>)}</span>
        {c.reason ? <small className="launch-reason">{c.reason}</small>
          : c.profile.connection === 'terminal' && <small>You type every prompt and permission answer in the terminal.</small>}
      </span>
    </label>)}
  </fieldset>;
}

// The launch dialog. Fixed fields: `role`, `artifact` and `change`, `task` (a task path of the
// task graph). A role that is not fixed has a select, and so do the change and the task.
// `worktree` is the preferred worktree.
export function LaunchDialog({title, role: fixedRole = null, artifact: fixedArtifact = null, change: fixedChange = null, task: fixedTask = null, worktree: preferred = null, onClose, onStarted}) {
  const {snapshot, root, worktreePath, go} = useShell(), settings = useSettings(), id = useId();
  const changes = useMemo(() => {
    const seen = new Map();
    for (const w of snapshot.workflow?.worktrees || []) for (const c of currentChanges(w)) if (!seen.has(`${c.artifact}/${c.name}`)) seen.set(`${c.artifact}/${c.name}`, c);
    return [...seen.values()];
  }, [snapshot]);
  const [role, setRole] = useState(fixedRole || 'implementer');
  const [changeKey, setChangeKey] = useState(fixedChange ? `${fixedArtifact}/${fixedChange}` : changes[0] ? `${changes[0].artifact}/${changes[0].name}` : '');
  const [artifact, change] = changeKey ? changeKey.split('/') : [null, null];
  const worktrees = useMemo(() => worktreeChoices(snapshot, root), [snapshot, root]);
  const [worktree, setWorktree] = useState(null);
  // An implementer starts by default in a worktree of a task branch, not of main or master (start rule 3).
  const fits = w => role !== 'implementer' || !w.protected;
  const chosenWorktree = worktrees.some(w => w.path === worktree) ? worktree
    : ([preferred, worktreePath].map(path => worktrees.find(w => w.path === path && fits(w))).find(Boolean) || worktrees.find(fits) || worktrees[0])?.path || null;
  const graph = useTasks(root, chosenWorktree, artifact, change);
  const [taskPath, setTaskPath] = useState(fixedTask);
  const task = graph.tasks.find(t => t.path === (taskPath || graph.tasks[0]?.path)) || null;
  const {choices, selected} = useMemo(() => profileChoices(settings.data, role), [settings.data, role]);
  const [profile, setProfile] = useState(null);
  const chosenProfile = choices.some(c => c.id === profile && !c.reason) ? profile : selected;
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), open = useOpen();
  const harness = harnessLabel(choices.find(c => c.id === chosenProfile)?.profile.harness);
  useEffect(() => setError(null), [role, changeKey, chosenWorktree, taskPath, chosenProfile]);
  const warnings = launchWarnings({role, task: role === 'implementer' ? task : null, tasks: graph.tasks, artifact, snapshot});
  const listed = changes.find(c => c.artifact === artifact && c.name === change);
  const subtitle = role === 'implementer' && task ? <>Task {taskName(task)} · <span className="mono">{artifact}/{change}</span></>
    : change ? <>{changeTitle(listed) || change} · <span className="mono">{artifact}/{change}</span></> : null;
  const missing = !chosenProfile ? 'Select a profile that can start.' : !change ? 'Select a change.' : !chosenWorktree ? 'No worktree can be read.'
    : role === 'implementer' && !task ? (graph.status === 'loading' ? 'Reading the tasks…' : 'This change has no listed task.') : null;

  async function start(event) {
    event.preventDefault();if (busy || missing) return;
    setBusy(true);setError(null);
    const body = {path: chosenWorktree, role, profile: chosenProfile, artifact, change, ...(role === 'implementer' ? {task: relativeTask(task.path)} : {})};
    try {
      const result = await startSession(body);
      onStarted?.();
      if (!open.current) return;
      onClose();
      go({kind: 'session', session: result.session.id, ...(result.existing ? {existing: true} : {})});
    } catch (failure) {if (open.current) {setError(refusal(failure));setBusy(false);}}
  }
  const roleOptions = fixedRole ? [fixedRole] : ROLES;
  return <Dialog title={title || (fixedRole === 'implementer' ? 'Start implementer' : 'Start session')} subtitle={subtitle} onClose={onClose}>
    <form onSubmit={start} noValidate>
      {(!fixedRole || !fixedChange) && <div className="editor-row">
        {!fixedRole && <div className="field">
          <label htmlFor={`${id}-role`}>Role</label>
          <select id={`${id}-role`} value={role} disabled={busy} onChange={event => setRole(event.target.value)}>{roleOptions.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
        </div>}
        {!fixedChange && <div className="field">
          <label htmlFor={`${id}-change`}>Change</label>
          <select id={`${id}-change`} value={changeKey} disabled={busy} onChange={event => {setChangeKey(event.target.value);setTaskPath(null);}}>
            {!changes.length && <option value="">No current change</option>}
            {changes.map(c => <option key={`${c.artifact}/${c.name}`} value={`${c.artifact}/${c.name}`}>{`${changeTitle(c)} · ${c.artifact}/${c.name}`}</option>)}
          </select>
          {!changes.length && <small>A role session needs a current change. To start new work, use Start ADD work on the Work page.</small>}
        </div>}
      </div>}
      {role === 'implementer' && !fixedTask && <div className="field">
        <label htmlFor={`${id}-task`}>Task</label>
        <select id={`${id}-task`} value={task?.path || ''} disabled={busy || !graph.tasks.length} onChange={event => setTaskPath(event.target.value)}>
          {!graph.tasks.length && <option value="">{graph.status === 'loading' ? 'Reading the tasks…' : 'No listed task'}</option>}
          {graph.tasks.map(t => <option key={t.path} value={t.path}>{`${taskName(t)} · ${t.checked} of ${t.checked + t.unchecked} DoD`}</option>)}
        </select>
      </div>}
      <div className="field">
        <label htmlFor={`${id}-worktree`}>Worktree</label>
        <select id={`${id}-worktree`} value={chosenWorktree || ''} disabled={busy || !worktrees.length} onChange={event => setWorktree(event.target.value)}>
          {!worktrees.length && <option value="">No readable worktree</option>}
          {worktrees.map(w => <option key={w.path} value={w.path}>{w.label}</option>)}
        </select>
        {role === 'implementer' && <small>An implementer works on the branch of this worktree. Plane refuses main and master.</small>}
      </div>
      {settings.status === 'loading' ? <p className="muted" role="status">Reading launch profiles…</p>
        : settings.status === 'error' ? <p className="operation-error" role="alert">{settings.error}</p>
        : choices.length ? <ProfileCards choices={choices} value={chosenProfile} onChange={setProfile} role={role} name={`${id}-profile`} busy={busy}/>
        : <p className="muted">No launch profile yet. Create one on the Agent settings page.</p>}
      <div className="launch-warnings" role="note">
        <strong>Check before you start</strong>
        {warnings.map(w => <span key={w}>{w}</span>)}
      </div>
      {error && <p className="operation-error" role="alert">Plane did not start the session. {error}</p>}
      <div className="editor-foot">
        <p className="small muted" role="status">{busy ? <StartingNote harness={harness}/> : missing && settings.status === 'loaded' ? missing : ''}</p>
        <button type="button" onClick={onClose}>Cancel</button>
        <StartButton busy={busy} disabled={Boolean(missing)} harness={harness}>Start session</StartButton>
      </div>
    </form>
  </Dialog>;
}

// Start ADD work (artboard 9): a coordinator session in a terminal with the request of the
// person in its initial prompt. Plane keeps no copy of the request.
export function StartWorkDialog({onClose, onStarted}) {
  const {snapshot, root, go} = useShell(), settings = useSettings(), id = useId();
  const worktrees = useMemo(() => worktreeChoices(snapshot, root), [snapshot, root]);
  const [request, setRequest] = useState(''), [worktree, setWorktree] = useState(() => (worktrees.find(w => w.path === root) || worktrees[0])?.path || '');
  const {choices, selected} = useMemo(() => profileChoices(settings.data, 'coordinator'), [settings.data]);
  const usable = choices.filter(c => !c.reason);
  const [profile, setProfile] = useState(null);
  const chosen = usable.some(c => c.id === profile) ? profile : selected;
  const [busy, setBusy] = useState(false), [error, setError] = useState(null), open = useOpen();
  const harness = harnessLabel(usable.find(c => c.id === chosen)?.profile.harness);
  const size = new TextEncoder().encode(request).length;
  async function start(event) {
    event.preventDefault();if (busy) return;
    if (!request.trim()) {setError('Write what you need.');return;}
    if (size > REQUEST_LIMIT) {setError('The request must have at most 8 KiB.');return;}
    if (!chosen) {setError('Select a coordinator profile.');return;}
    setBusy(true);setError(null);
    try {
      const result = await startSession({path: worktree, role: 'coordinator', profile: chosen, request});
      onStarted?.();
      if (!open.current) return;
      onClose();
      go({kind: 'session', session: result.session.id});
    } catch (failure) {if (open.current) {setError(`Plane did not start the session. ${refusal(failure)}`);setBusy(false);}}
  }
  return <Dialog title="Start ADD work" className="start-work" onClose={onClose}
    subtitle="A coordinator session interviews you, creates the change and writes Requirement, Specification and Plan. You approve the plan in the conversation.">
    <form onSubmit={start} noValidate>
      <div className="field">
        <label htmlFor={`${id}-request`}>What do you need?</label>
        <textarea id={`${id}-request`} data-autofocus rows={6} value={request} disabled={busy} onChange={event => setRequest(event.target.value)} aria-describedby={`${id}-request-help`}/>
        <small id={`${id}-request-help`}>Write in any language. Plane sends this text to the agent and keeps no copy.{size > REQUEST_LIMIT ? ` The text has ${size} bytes; the limit is 8 KiB.` : ''}</small>
      </div>
      <div className="editor-row">
        <div className="field">
          <label htmlFor={`${id}-worktree`}>Worktree</label>
          <select id={`${id}-worktree`} value={worktree} disabled={busy} onChange={event => setWorktree(event.target.value)}>{worktrees.map(w => <option key={w.path} value={w.path}>{w.label}</option>)}</select>
          <small>The coordinator creates a dedicated branch before it writes knowledge.</small>
        </div>
        <div className="field">
          <label htmlFor={`${id}-profile`}>Coordinator profile</label>
          <select id={`${id}-profile`} value={chosen || ''} disabled={busy || !usable.length} onChange={event => setProfile(event.target.value)}>
            {!usable.length && <option value="">{settings.status === 'loading' ? 'Reading launch profiles…' : 'No terminal profile'}</option>}
            {usable.map(c => <option key={c.id} value={c.id}>{[c.name, c.profile.model, c.isDefault ? 'default' : null].filter(Boolean).join(' · ')}</option>)}
          </select>
          <small>Role sessions run in a terminal: you chat in the harness tool itself, inside the session page or in your terminal app.</small>
        </div>
      </div>
      {settings.status === 'error' && <p className="operation-error" role="alert">{settings.error}</p>}
      {settings.status === 'loaded' && !usable.length && <p className="muted">No terminal profile can start a coordinator. Create one on the Agent settings page.</p>}
      {error && <p className="operation-error" role="alert">{error}</p>}
      <div className="editor-foot">
        <p className="small muted" role="status">{busy && <StartingNote harness={harness}/>}</p>
        <button type="button" onClick={onClose}>Cancel</button>
        <StartButton busy={busy} disabled={!usable.length} harness={harness}>Start</StartButton>
      </div>
    </form>
  </Dialog>;
}
