import React, {useId, useState} from 'react';
import {protectedBranch} from './knowledge-api.js';

const branchName = w => w.branch || (w.detached ? 'Detached HEAD' : 'Unknown branch');
// The branch control lists registered worktrees; choosing one switches the context.
export function SourceBar({snapshot, worktreePath, onSelect, busy, opening, editState, onRefresh, onChangeRepository, drawerOpen, onDrawer, drawerId}) {
  const id = useId(), worktrees = snapshot.workflow?.worktrees || [];
  const name = snapshot.repository.path.split('/').at(-1);
  return <div className="source-bar">
    <button className="drawer-toggle" aria-expanded={drawerOpen} aria-controls={drawerId} onClick={onDrawer}>Navigation</button>
    <strong title={snapshot.repository.path}>{name}</strong>
    <span className="branch-control">
      <label htmlFor={id}>Worktree</label>
      <select id={id} value={worktreePath || ''} disabled={busy && !opening} onChange={event => onSelect(event.target.value)}>
        {worktrees.map(w => <option key={w.path} value={w.path} disabled={w.availability !== 'readable'}>{branchName(w)} · {w.path === worktreePath ? 'active' : w.availability} · {w.path}</option>)}
      </select>
    </span>
    <span className="edit-state" role="status" aria-label="Edit state">{editState}</span>
    {opening && <span role="status" className="tiny">Opening {opening}…</span>}
    <span className="source-actions"><button onClick={onRefresh}>Refresh</button><button onClick={onChangeRepository}>Change repository</button></span>
  </div>;
}
// Protected branches and detached HEAD accept no knowledge edits.
export function ProtectedBanner({branch, onCreate}) {
  const id = useId(), [name, setName] = useState(''), [open, setOpen] = useState(false), [state, setState] = useState({busy: false, message: ''});
  if (!protectedBranch(branch)) return null;
  const valid = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(name) && !['main', 'master'].includes(name);
  async function submit(event) {
    event.preventDefault();if (!valid) return;
    setState({busy: true, message: ''});
    try {await onCreate(name);setState({busy: false, message: ''});setOpen(false);setName('');}
    catch (error) {setState({busy: false, message: error.message});}
  }
  return <div className="protected-banner" role="region" aria-label="Branch protection">
    <p>{branch === 'detached' || !branch ? 'This worktree has a detached HEAD.' : `This worktree has ${branch} checked out.`} You cannot edit knowledge here. Create a branch to edit.</p>
    {open ? <form onSubmit={submit}>
      <label htmlFor={id}>Branch name</label>
      <input id={id} value={name} placeholder="change/my-work" autoComplete="off" spellCheck={false} onChange={event => setName(event.target.value)} aria-invalid={Boolean(name) && !valid}/>
      <button className="primary" disabled={!valid || state.busy} aria-busy={state.busy}>Create</button>
      <button type="button" onClick={() => setOpen(false)}>Cancel</button>
    </form> : <button onClick={() => setOpen(true)}>Create branch</button>}
    {name && !valid && <p className="tiny">Use letters, digits, dot, slash, underscore or hyphen. Do not use main or master.</p>}
    {state.message && <p role="alert" className="tiny">{state.message}</p>}
  </div>;
}
