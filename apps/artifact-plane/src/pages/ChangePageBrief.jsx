// The Change brief of the change page (specifications/review-brief.md, Change page):
// seven answers, the claims with their verification step, the hypothesis and flow
// tables, a person's check and a challenge. The brief is derived; it stores nothing.
import React, {useEffect, useState} from 'react';
import {useShell} from '../page-data.js';
import {Badge, Section} from '../ui.jsx';
import {OperationError, useEdit} from '../editing.jsx';
import {postJSON} from '../request.js';

const LADDER_NOTES = {
  'Not analyzed': 'A claim of kind unknown, or an item that the analysis does not cover.',
  'Inferred': 'A claim with basis inferred, or a wording note. No observation.',
  'Explained': 'Text that someone wrote: a rejected-option reason, README text, a documented claim without evidence.',
  'Observed activity': 'The agent ran tools. This shows activity, never a result.',
  'Recorded experiment': 'A supported or refuted claim with evidence, a check record, or a test of the change.',
  'Fact from Git': 'Changed records and files, impact tiers, and fields read from Git.',
  'Re-checked by an agent, not independent': 'A verified claim with verified_by: agent.',
  'Checked by a person': 'A verified claim with verified_by: person.',
};
const LADDER = Object.keys(LADDER_NOTES);
const KIND = {decision: 'Decision', assumption: 'Assumption', hypothesis: 'Hypothesis', root_cause: 'Root cause', unknown: 'Unknown', risk: 'Risk'};
const KIND_ORDER = {decision: 0, root_cause: 1, assumption: 2, unknown: 3, risk: 3, hypothesis: 4};
export const Step = ({step}) => <span className={`ladder-step l${LADDER.indexOf(step)}`} title={LADDER_NOTES[step]}>{step}</span>;
// "verified" never stands alone for an agent record.
const statusText = claim => claim.status === 'verified' && claim.verifiedBy === 'agent' ? 'verified by an agent, not independent' : claim.status;
const short = path => path?.replace(/^docs\/artifacts\//, '') ?? '';

// The brief of one change; it reloads when the repository updates.
export function useChangeBrief(artifact, change) {
  const {root, worktreePath, epoch} = useShell();
  const [state, setState] = useState({status: 'idle', brief: null, error: ''});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!root) return;
    const controller = new AbortController();
    setState(current => ({...current, status: 'loading', error: ''}));
    postJSON('/api/review/query', {path: root, worktree: worktreePath, artifact, change, operation: 'brief'}, controller.signal)
      .then(response => {if (!controller.signal.aborted) setState({status: 'loaded', brief: response.data, partial: response.diagnostics.some(d => ['partial-impact', 'unavailable-impact'].includes(d.code)), error: ''});})
      .catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [root, worktreePath, artifact, change, epoch, attempt]);
  return {...state, retry: () => setAttempt(n => n + 1)};
}

function Items({items}) {
  return <ul className="brief-items">{items.map((item, i) => <li key={i}>
    <span className="grow">{item.claim ? <a href={`#claim-${item.claim}`}>{item.text}</a> : item.text}{item.source && <span className="brief-source"> {short(item.source)}</span>}</span>
    <Step step={item.step}/>
  </li>)}</ul>;
}
function Attention({rows, more}) {
  return <>
    <ul className="brief-attention">{rows.map((row, i) => <li key={i}>
      <span className="brief-category">{row.category}</span>
      <span className="grow">{row.claim ? <a href={`#claim-${row.claim}`}>{row.text}</a> : row.text}</span>
      <Step step={row.step}/>
    </li>)}</ul>
    {more > 0 && <p className="small muted">{more} more below the first seven.</p>}
  </>;
}
function Decision({answer, counts}) {
  const [goal, ...rest] = answer.items;
  const steps = Object.entries(counts.byStep).map(([step, n]) => `${n} ${step}`).join(', ');
  return <div className="brief-decision">
    <p><b>Goal and scope.</b> {goal.text} Accept or amend the goal in the conversation with the coordinator.</p>
    <p><b>Correctness.</b> Claims by step: {steps || 'none'}. Checks by a person: {counts.checksByPerson}. Checks by an agent: {counts.checksByAgent}.</p>
    {rest.length > 0 && <Items items={rest}/>}
  </div>;
}

function CheckForm({claim, onDone}) {
  const edit = useEdit(), [ran, setRan] = useState(claim.check || ''), [observed, setObserved] = useState(''), [outcome, setOutcome] = useState('holds');
  const [busy, setBusy] = useState(false), [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault();if (!observed.trim() || busy) return;
    setBusy(true);setError(null);
    try {await edit.run('claim.verify', {path: claim.file, id: claim.id, ran, observed, outcome}, {label: `Check of ${claim.id} recorded.`});onDone();}
    catch (failure) {setError(failure);}
    finally {setBusy(false);}
  }
  return <form className="inline-form claim-form" aria-label={`Record my check of ${claim.id}`} onSubmit={submit}>
    <label>What you ran<input value={ran} onChange={e => setRan(e.target.value)}/></label>
    <label>What you observed<textarea value={observed} rows={3} placeholder="For example: on the old code the test timed out; on the fix it passed." onChange={e => setObserved(e.target.value)}/></label>
    <fieldset className="claim-outcome"><legend>Outcome</legend>
      <label><input type="radio" name={`outcome-${claim.id}`} checked={outcome === 'holds'} onChange={() => setOutcome('holds')}/> The claim holds</label>
      <label><input type="radio" name={`outcome-${claim.id}`} checked={outcome === 'fails'} onChange={() => setOutcome('fails')}/> The claim fails</label>
    </fieldset>
    <OperationError error={error}/>
    <div className="form-actions"><button className="primary" type="submit" disabled={!observed.trim() || busy} aria-busy={busy}>Record check</button><button type="button" onClick={onDone}>Cancel</button><span className="small muted">A check needs an observed result.</span></div>
  </form>;
}
function ChallengeForm({claim, onDone}) {
  const edit = useEdit(), [statement, setStatement] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault();if (!statement.trim() || busy) return;
    setBusy(true);setError(null);
    try {await edit.run('claim.record', {path: claim.file, kind: 'hypothesis', status: 'open', basis: 'inferred', statement: statement.trim()}, {label: 'Counter-hypothesis recorded.'});onDone();}
    catch (failure) {setError(failure);}
    finally {setBusy(false);}
  }
  return <form className="inline-form claim-form" aria-label={`Challenge ${claim.id}`} onSubmit={submit}>
    <label>Your counter-hypothesis<textarea value={statement} rows={2} placeholder="State what you think is true instead." onChange={e => setStatement(e.target.value)}/></label>
    <OperationError error={error}/>
    <div className="form-actions"><button className="primary" type="submit" disabled={!statement.trim() || busy} aria-busy={busy}>Add open hypothesis</button><button type="button" onClick={onDone}>Cancel</button><span className="small muted">Recorded in {short(claim.file)}.</span></div>
  </form>;
}
function ClaimCard({claim, writable}) {
  const [form, setForm] = useState(null);
  const active = !['refuted', 'superseded'].includes(claim.status);
  const errors = claim.diagnostics.filter(d => d.severity === 'error');
  return <article className="claim-card" id={`claim-${claim.id}`} aria-label={`Claim ${claim.id}`}>
    <div className="claim-tags"><Badge className={`kind-${claim.kind}`}>{KIND[claim.kind]}</Badge><span className={`claim-status s-${claim.status}`}>{statusText(claim)}</span><Step step={claim.step}/></div>
    <p className="claim-statement">{claim.statement}</p>
    <dl className="claim-fields">
      <dt>Basis</dt><dd>{claim.basis}</dd>
      <dt>Evidence</dt><dd className="mono">{claim.evidence.length ? claim.evidence.map(short).join(', ') : <span className="muted">None recorded</span>}</dd>
      {claim.about.length > 0 && <><dt>About</dt><dd>{claim.about.join(', ')}</dd></>}
      {claim.riskIfWrong && <><dt>Wrong if</dt><dd>{claim.riskIfWrong}</dd></>}
      <dt>Check</dt><dd>{claim.check || <span className="muted">No check offered.</span>}</dd>
      <dt>In</dt><dd className="mono">{short(claim.file)}</dd>
    </dl>
    {claim.rejected.length > 0 && <details className="claim-rejected"><summary>{claim.rejected.length} rejected {claim.rejected.length === 1 ? 'option' : 'options'}, one reason each</summary>
      <ul>{claim.rejected.map(r => <li key={r.option}><b>{r.option}</b>: {r.reason} <Step step="Explained"/></li>)}</ul></details>}
    {claim.stale && <p className="small claim-note">A file that this claim names changed in this change; the claim did not. <Step step="Inferred"/></p>}
    {errors.map(d => <p key={d.code + d.message} className="small claim-error" role="note">{d.message}</p>)}
    {writable && active && claim.check && !form && <div className="claim-actions">
      <button aria-expanded="false" onClick={() => setForm('check')}>Record my check</button>
      <button className="quiet" onClick={() => setForm('challenge')}>Challenge</button>
    </div>}
    {form === 'check' && <CheckForm claim={claim} onDone={() => setForm(null)}/>}
    {form === 'challenge' && <ChallengeForm claim={claim} onDone={() => setForm(null)}/>}
  </article>;
}
function Hypotheses({claims}) {
  const byFile = new Map();
  for (const c of claims.filter(c => ['hypothesis', 'root_cause'].includes(c.kind))) byFile.set(c.file, [...(byFile.get(c.file) || []), c]);
  return [...byFile].filter(([, list]) => list.length >= 2).map(([file, list]) => <div key={file} className="brief-table" role="region" aria-label={`Hypotheses in ${short(file)}`}>
    <h3>Hypotheses <span className="mono small muted">{short(file)}</span></h3>
    <div className="table-scroll"><table><thead><tr><th>Statement</th><th>Status</th><th>Deciding evidence</th><th>Step</th></tr></thead>
      <tbody>{list.map(c => <tr key={c.id}><td>{c.statement}</td><td><span className={`claim-status s-${c.status}`}>{statusText(c)}</span></td><td className="mono small">{c.evidence.map(short).join(', ') || '—'}</td><td><Step step={c.step}/></td></tr>)}</tbody></table></div>
  </div>);
}
function Flows({flows, unit}) {
  if (!flows.reached.length) return null;
  const unresolved = flows.undecided.filter(u => u.kind === 'unresolved');
  return <div className="brief-table" role="region" aria-label="Flows">
    <h3>Flows <span className="small muted">reached, declared and undecided</span></h3>
    <div className="table-scroll"><table><thead><tr><th>Flow</th><th>State</th><th>Steps reached</th><th>Decided by</th></tr></thead>
      <tbody>{flows.reached.map(f => <tr key={f.flow}><td className="mono">{f.flow}</td>
        <td><Badge tone={f.state === 'declared' ? 'ok' : f.state === 'undecided' ? 'incomplete' : ''}>{f.state === 'declared' ? 'Declared' : f.state === 'decided' ? 'Reached, decided' : 'Undecided'}</Badge></td>
        <td>{f.steps.join(', ') || '—'}</td>
        <td>{f.state === 'declared' ? 'Unit brief' : f.decidedBy ? <a href={`#claim-${f.decidedBy.id}`}>Claim {f.decidedBy.id}</a> : <span className="muted">Nothing; declare it in {unit ? 'the unit brief' : 'a unit'} or name it in a claim</span>}</td></tr>)}</tbody></table></div>
    {unresolved.length > 0 && <p className="small muted">{unresolved.length} unresolved {unresolved.length === 1 ? 'item' : 'items'}: impact unknown, not absent.</p>}
  </div>;
}

export default function ChangeBrief({artifact, change, writable}) {
  const brief = useChangeBrief(artifact, change), b = brief.brief;
  if (!b) return <Section title="Change brief" label="Change brief" id="change-brief">
    {brief.status === 'error' ? <p className="small" role="alert">{brief.error} <button className="link" onClick={brief.retry}>Retry</button></p> : <p className="muted small" role="status">Reading the change brief…</p>}
  </Section>;
  const origin = b.origin.kind === 'protected-diff' ? 'Difference with main.' : b.origin.kind === 'delivery-commit' ? `The commit that introduced the version, ${b.origin.commit.slice(0, 7)}.` : b.origin.reason;
  const open = c => c.status === 'open' ? 0 : 1;
  const claims = [...b.claims].sort((x, y) => (x.available ? 1 : 0) - (y.available ? 1 : 0) || open(x) - open(y) || KIND_ORDER[x.kind] - KIND_ORDER[y.kind]);
  const unit = b.flows.declared.length > 0;
  return <Section title="Change brief" label="Change brief" id="change-brief" summary={<span className="small muted">{origin}{brief.partial ? ' The impact answer is partial.' : ''}</span>}>
    <div className="brief-rows">{b.answers.filter(a => a.summary !== null).map(a => <details key={a.question} open={a.question === 'What should I care about?'}>
      <summary><span className="brief-question">{a.question}</span><span className="brief-answer">{a.summary}</span></summary>
      <div className="brief-more">{a.question === 'What should I care about?' ? <Attention rows={b.attention.rows} more={b.attention.more}/> : a.question === 'What needs my decision?' ? <Decision answer={a} counts={b.counts}/> : <Items items={a.items}/>}</div>
    </details>)}</div>
    {claims.length > 0 && <div className="brief-claims" role="region" aria-label="Claims">
      <h3>Claims <span className="small muted">{claims.length} · open first</span></h3>
      {claims.map(c => <ClaimCard key={`${c.file}#${c.id}`} claim={c} writable={writable}/>)}
    </div>}
    <Hypotheses claims={b.claims}/>
    <Flows flows={b.flows} unit={unit}/>
    {b.delivery?.wording.length > 0 && <div className="brief-table" role="region" aria-label="Wording notes">
      <h3>Wording notes <span className="small muted">records this change delivered that still say work is pending</span></h3>
      <Items items={b.delivery.wording.map(w => ({text: `“${w.sentence}” Matched by wording.`, source: w.path, step: w.step}))}/>
    </div>}
    <details className="claim-rejected ladder-legend"><summary>How to read the steps</summary><ul>{LADDER.map(step => <li key={step}><Step step={step}/> {LADDER_NOTES[step]}</li>)}</ul></details>
  </Section>;
}
