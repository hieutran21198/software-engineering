import React, {useState} from 'react';
import {Icon, Menu} from './ui.jsx';
import {protectedBranch} from './knowledge-api.js';
import {useSessions} from './Sessions.jsx';
import {waitingText} from './session-model.js';

// Creates a branch from the protected one; the shell refreshes afterwards.
export function CreateBranchForm({onCreate, onDone, idPrefix = 'branch'}) {
  const [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();if (busy) return;setBusy(true);setError('');
    try {await onCreate(name.trim());onDone?.();} catch (failure) {setError(failure.message);} finally {setBusy(false);}
  }
  return <form className="menu-form" aria-label="Create branch" onSubmit={submit}>
    <div className="field"><label htmlFor={`${idPrefix}-name`}>New branch name</label>
      <input id={`${idPrefix}-name`} value={name} onChange={event => setName(event.target.value)} required placeholder="feature/my-change" autoComplete="off" spellCheck={false}/></div>
    {error && <p className="operation-error" role="alert">{error}</p>}
    <div className="form-actions"><button className="primary" disabled={busy} aria-busy={busy}>Create branch</button></div>
  </form>;
}

// The project's controls in the top bar: branch and worktree, uncommitted
// files, refresh with freshness, and the More menu. At 800 pixels and below a
// menu button opens the sidebar drawer.
export default function TopBar({snapshot, worktreePath, onWorktree, opening, busy, stale, uncommitted, onUncommitted, onRefresh, onCreateBranch, drawer, recorded, onOpen, onChangeRepository}) {
  const branch = snapshot.repository.branch, locked = protectedBranch(branch);
  const worktrees = snapshot.workflow?.worktrees || [];
  const label = branch === 'detached' || !branch ? 'Detached HEAD' : branch;
  const project = snapshot.repository.path.split('/').at(-1);
  // Session control appears only with a launch profile (requirement AO18).
  const sessions = useSessions(), waiting = sessions.control ? sessions.waiting.length : 0;
  return <>
    <button className="icon narrow-only" aria-label="Navigation" aria-expanded={drawer.open} aria-controls={drawer.id} onClick={drawer.toggle}>{Icon.menu}</button>
    <div className="topbar-spacer"/>
    {[['wide-only', 'branch-button', <><span className={`status-dot ${locked ? 'locked' : ''}`} aria-hidden="true"/><span className="branch-name">{locked ? `Read only · ${label}` : label}</span>{Icon.chevron}</>],
      ['narrow-only compact-menu', 'unstyled compact-repo', <><b>{project}</b><span><span className={`status-dot ${locked ? 'locked' : ''}`} aria-hidden="true"/>{locked ? `Read only · ${label}` : label}</span></>]].map(([where, buttonClass, button]) =>
      <Menu key={where} className={`branch-control ${where}`} buttonClass={buttonClass} label={`Branch ${label}, ${locked ? 'read only' : 'knowledge can be edited'}. Change worktree`} button={button}>
        {close => <>
          {worktrees.map(w => <button key={w.path} role="menuitemradio" aria-checked={w.path === worktreePath} className="menu-item"
            disabled={w.availability !== 'readable'} onClick={() => {close();onWorktree(w.path);}}>
            <span>{w.detached ? 'Detached HEAD' : w.branch || 'No branch'}{opening === w.path ? ' · opening…' : ''}</span>
            <small>{w.path}</small>
            <small>{[w.head ? w.head.slice(0, 12) : 'No commits', w.availability !== 'readable' ? w.availability : null, w.locked ? 'locked' : null, w.prunable ? 'prunable' : null].filter(Boolean).join(' · ')}</small>
          </button>)}
          {locked && <><hr/><CreateBranchForm onCreate={onCreateBranch} onDone={close} idPrefix={`branch-${project}-${where.split(' ')[0]}`}/></>}
        </>}
      </Menu>)}
    {uncommitted > 0 && <button className="uncommitted-button" onClick={onUncommitted} aria-label={`Uncommitted knowledge, ${uncommitted} ${uncommitted === 1 ? 'file' : 'files'}`}><span className="label">Uncommitted</span><span className="count">{uncommitted}</span></button>}
    {waiting > 0 && <button className="waiting-button" aria-label={waitingText(waiting)} onClick={() => onOpen({kind: 'sessions'})}><span className="count">{waiting}</span><span className="label">{waitingText(waiting).replace(/^\d+ /, '')}</span></button>}
    {stale && !busy && <span className="freshness wide-only" role="status">Not up to date</span>}
    <button className={`icon wide-only ${busy ? 'refreshing' : ''}`} aria-label="Refresh" aria-busy={busy} onClick={onRefresh}>{Icon.refresh}</button>
    <Menu label="More" button={Icon.more}>
      {close => <>
        <button role="menuitem" className="narrow-only" onClick={() => {close();onRefresh();}}>Refresh</button>
        <button role="menuitem" onClick={() => {close();onOpen({kind: 'discover'});}}>Discover behavior<small>Find flows that describe a behavior</small></button>
        <button role="menuitem" onClick={() => {close();onOpen({kind: 'impact'});}}>Impact<small>What a file, document or commit affects</small></button>
        {recorded && <button role="menuitem" onClick={() => {close();onOpen({kind: 'recorded'});}}>Recorded executions<small>Codex attempts observed on this machine</small></button>}
        {sessions.control && <button role="menuitem" onClick={() => {close();onOpen({kind: 'sessions'});}}>Sessions<small>Agent sessions of this repository, their progress and output</small></button>}
        <button role="menuitem" onClick={() => {close();onOpen({kind: 'settings'});}}>Agent settings<small>Harness tools, launch profiles and role defaults</small></button>
        <hr/>
        <button role="menuitem" onClick={() => {close();onChangeRepository();}}>Change repository</button>
      </>}
    </Menu>
  </>;
}
