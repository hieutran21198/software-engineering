// The Sessions page (specifications/agent-orchestration.md, Workbench; mockup artboards 1 and 7):
// the implementation tasks with a session, grouped by change, and the role sessions. Each row
// shows the task or role, the DoD progress, the output summary, the harness tool and model, and
// the state. At phone width the waiting sessions come first, and an ACP permission request can
// be answered in its card.
import React, {useEffect, useState} from 'react';
import {useShell} from '../page-data.js';
import {Notice, PageHeader, StatusBadge} from '../ui.jsx';
import {useSessionOutput, useSessions} from '../Sessions.jsx';
import {sessionCommand} from '../sessions-api.js';
import {ROLE_LABELS, agentText, dodProgress, duration, isActive, outputSummary, phoneOrder, plural, sessionGroups, sessionTitle, stateView, taskLabel} from '../session-model.js';

const NARROW = '(max-width: 800px)';
// The title of a change from any worktree of the snapshot, else its name.
const changeName = (snapshot, group) => (snapshot.workflow?.worktrees || []).flatMap(w => w.changes || []).find(c => c.artifact === group.artifact && c.name === group.change)?.title || group.change;
export function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {const query = window.matchMedia(NARROW), update = () => setNarrow(query.matches);query.addEventListener('change', update);return () => query.removeEventListener('change', update);}, []);
  return narrow;
}

// "3 files +292 −3 · 2 commits" or "1 file +38 −0 · not committed".
export function OutputText({summary}) {
  if (!summary) return <span className="muted">Reading output…</span>;
  if (!summary.files && !summary.commits) return <span className="muted">No output yet</span>;
  const files = plural(summary.files, 'file');
  return <span>{files} <span className="plus">+{summary.added}</span> <span className="minus">−{summary.removed}</span>
    {summary.commits ? ` · ${plural(summary.commits, 'commit')}` : summary.files ? ' · not committed' : ''}</span>;
}
export function DodMeter({progress}) {
  if (!progress) return null;
  const share = progress.total ? Math.round(progress.checked / progress.total * 100) : 0;
  return <span className="dod-meter"><span className="meter" aria-hidden="true"><span style={{width: `${share}%`}}/></span>{progress.checked} of {progress.total} DoD</span>;
}

function SessionRow({session, snapshot, go}) {
  const output = useSessionOutput(session.id, session.updatedAt), state = stateView(session);
  const role = session.role !== 'implementer', title = role ? ROLE_LABELS[session.role] : taskLabel(session, snapshot);
  const action = session.state === 'interrupted' ? 'Recover' : session.state === 'ended' ? 'Respawn' : 'Open';
  return <div className={`session-row ${session.state === 'waiting' ? 'needs-you' : ''}`}>
    <div className="session-task">
      <div className="session-task-title">{title}</div>
      <div className="session-task-detail">{role ? [session.change || 'No change', session.profile?.connection === 'terminal' ? 'terminal' : 'ACP'].join(' · ') : <DodMeter progress={dodProgress(output.data)}/>}</div>
    </div>
    <div className="session-output"><OutputText summary={output.status === 'error' ? null : outputSummary(output.data)}/>{output.status === 'error' && <span className="muted">Output unavailable</span>}</div>
    <div className="session-agent">{agentText(session)}</div>
    <StatusBadge status={state.status}>{state.row}</StatusBadge>
    <button aria-label={`${action} ${role ? `${title} session` : title}`} onClick={() => go({kind: 'session', session: session.id})}>{action}</button>
  </div>;
}

// A card of the phone width: badges, title, agent, progress and, for an ACP permission
// request, the request with the options of the agent.
function PhoneCard({session, snapshot, go}) {
  const output = useSessionOutput(session.id, session.updatedAt), state = stateView(session), summary = outputSummary(output.data);
  const role = session.role !== 'implementer', pending = session.live?.pending?.[0] || null;
  const [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const {refresh} = useSessions();
  async function answer(option) {
    setBusy(true);setError(null);
    try {await sessionCommand('permission', {session: session.id, request: pending.request, option: option.optionId});refresh();}
    catch (failure) {setError(failure.message);} finally {setBusy(false);}
  }
  const progress = dodProgress(output.data);
  return <article className="session-card-phone" aria-label={sessionTitle(session, snapshot)}>
    <div className="session-card-badges"><StatusBadge status={state.status}>{state.row}</StatusBadge><span className="connection-tag">{session.profile?.connection === 'acp' ? 'ACP' : 'Terminal'}</span></div>
    <h3><button className="link" onClick={() => go({kind: 'session', session: session.id})}>{sessionTitle(session, snapshot)}</button></h3>
    <p className="muted small">{agentText(session)} · {duration(session.startedAt)}</p>
    <p className="small">{[progress && `${progress.checked} of ${progress.total} DoD`].filter(Boolean).join('')}{progress ? ' · ' : ''}<OutputText summary={summary}/></p>
    {session.state === 'waiting' && pending && <div className="phone-permission">
      <p className="phone-permission-title">{pending.title}</p>
      {pending.command && <pre className="mono">{pending.command}</pre>}
      <div className="phone-permission-options">{(pending.options || []).map((o, i) => <button key={o.optionId} className={i === 0 && o.kind === 'allow_once' ? 'primary' : ''} disabled={busy} onClick={() => answer(o)}>{o.name}</button>)}</div>
      {error && <p className="operation-error" role="alert">{error}</p>}
    </div>}
    {session.state === 'waiting' && session.profile?.connection === 'terminal' && <p className="small">Open the terminal on the computer that runs Plane to answer.</p>}
  </article>;
}

export default function SessionsPage() {
  const {snapshot, go} = useShell(), sessions = useSessions(), narrow = useNarrow();
  const groups = sessionGroups(sessions.sessions), rows = [...groups.changes.flatMap(g => g.rows), ...groups.roles];
  const header = <PageHeader title="Sessions" subtitle="Tasks that agents work on, with their progress and output since each session started."
    action={sessions.control && !narrow ? <div className="sessions-actions"><button onClick={() => go({kind: 'settings'})}>Agent settings</button><button className="primary" onClick={() => sessions.openLaunch({title: 'New session'})}>New session</button></div> : null}/>;
  if (!sessions.control) return <section className="page wide sessions-page" aria-label="Sessions page"><div className="column">
    {header}
    {sessions.status === 'loaded' || sessions.status === 'error' ? <div className="empty-state">
      <h2>No launch profile</h2>
      <p className="muted">Plane starts no agent session without a profile. Create one on the Agent settings page.</p>
      <button onClick={() => go({kind: 'settings'})}>Agent settings</button>
    </div> : <p className="muted" role="status">Reading sessions…</p>}
  </div></section>;
  const empty = !rows.length && <div className="empty-state">
    <h2>No session yet</h2>
    <p className="muted">Start an implementer from a task of a change, start a session on a change page, or start ADD work on the Work page.</p>
  </div>;
  if (narrow) {
    const ordered = phoneOrder(rows), waiting = ordered.filter(s => s.state === 'waiting'), running = ordered.filter(s => s.state !== 'waiting' && isActive(s)), stopped = ordered.filter(s => !isActive(s));
    return <section className="page sessions-page phone" aria-label="Sessions page"><div className="column">
      {header}
      {sessions.error && <Notice tone="error">{sessions.error}</Notice>}
      {empty}
      {[['Needs you', waiting], ['Running', running], ['Stopped', stopped]].filter(([, list]) => list.length).map(([name, list]) => <section key={name} className="phone-group" aria-label={name}>
        <h2 className="phone-group-title">{name} · {list.length}</h2>
        {list.map(s => <PhoneCard key={s.id} session={s} snapshot={snapshot} go={go}/>)}
      </section>)}
      <div className="sessions-phone-actions"><button className="primary full" onClick={() => sessions.openLaunch({title: 'New session'})}>New session</button></div>
    </div></section>;
  }
  return <section className="page wide sessions-page" aria-label="Sessions page"><div className="column">
    {header}
    {sessions.error && <Notice tone="error">{sessions.error}</Notice>}
    {empty}
    {groups.changes.map(g => <section key={g.key} className="session-group" aria-label={`${g.change} implementation tasks`}>
      <h2 className="session-group-title">{changeName(snapshot, g)} · implementation tasks <span className="muted mono">{g.artifact}/{g.change}</span></h2>
      {g.rows.map(s => <SessionRow key={s.id} session={s} snapshot={snapshot} go={go}/>)}
    </section>)}
    {groups.roles.length > 0 && <section className="session-group" aria-label="Role sessions">
      <h2 className="session-group-title">Role sessions</h2>
      {groups.roles.map(s => <SessionRow key={s.id} session={s} snapshot={snapshot} go={go}/>)}
    </section>}
    <p className="tiny sessions-note">Output counts come from Git in each worktree since the session started. Plane does not record plan approval, check DoD items or merge.</p>
  </div></section>;
}
