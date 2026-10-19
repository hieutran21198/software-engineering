// The PR description of the change page (specifications/delivery-support.md, PR
// description): the tier, the criteria results and the Markdown with a Copy
// button. The Plane never pushes or opens a PR; the person pastes the text.
import React, {useEffect, useState} from 'react';
import {useShell} from '../page-data.js';
import {Icon, Section, StatusBadge} from '../ui.jsx';
import {postJSON} from '../request.js';
import {isTerm, termOnce} from './guidance.jsx';

export default function PrDescription({artifact, change}) {
  const {root, worktreePath, epoch} = useShell();
  const [state, setState] = useState({status: 'idle', data: null, error: ''});
  const [attempt, setAttempt] = useState(0), [copied, setCopied] = useState('');
  useEffect(() => {
    if (!root) return;
    const controller = new AbortController();
    setState(current => ({...current, status: 'loading', error: ''}));
    postJSON('/api/review/query', {path: root, worktree: worktreePath, artifact, change, operation: 'description'}, controller.signal)
      .then(response => {if (!controller.signal.aborted) {setState({status: 'loaded', data: response.data, error: ''});setCopied('');}})
      .catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [root, worktreePath, artifact, change, epoch, attempt]);
  const d = state.data;
  if (!d) return <Section title="PR description" label="PR description" id="change-description">
    {state.status === 'error' ? <p className="small" role="alert">{state.error} <button className="link" onClick={() => setAttempt(n => n + 1)}>Retry</button></p> : <p className="muted small" role="status">Writing the PR description…</p>}
  </Section>;
  async function copy() {
    try {await navigator.clipboard.writeText(d.markdown);setCopied('Copied. Paste it into the PR.');}
    catch {setCopied('Copy failed. Select the text below and copy it.');}
  }
  const {tier} = d, terms = termOnce();
  return <Section title="PR description" label="PR description" id="change-description"
    summary={<span className="small muted">{terms('tier', 'Tier')} {isTerm(tier.declared) ? terms(tier.declared, tier.declared) : tier.declared} declared; the criteria give {tier.allowed}.</span>}
    actions={<button onClick={copy}>{Icon.copy}Copy</button>}>
    <p className="small muted description-copied" role="status">{copied}</p>
    {tier.declared === 'small' && tier.allowed !== 'small' && <p className="small claim-note description-mismatch" role="note">The change declares tier small, but the criteria give {tier.allowed}.</p>}
    <ul className="description-criteria" aria-label="Tier criteria">
      {tier.criteria.map(c => <li key={c.id}>
        <span className="mono">{c.id}</span>
        <StatusBadge status={c.result}>{['coordinator', 'unresolved'].includes(c.result) ? terms(c.result) : c.result}</StatusBadge>
        <span className="grow small">{c.detail}</span>
      </li>)}
    </ul>
    <details className="description-text">
      <summary>Markdown, {d.markdown.length.toLocaleString('en-US')} characters</summary>
      <pre aria-label="PR description text">{d.markdown}</pre>
    </details>
    <p className="small muted">Approval is not recorded by this description. The Plane never pushes or opens a PR.</p>
  </Section>;
}
