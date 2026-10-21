// The Change brief of the change page (specifications/review-brief.md, Change page):
// seven answers, the claims with their verification step, the hypothesis and flow
// tables, a person's check and a challenge. The brief is derived; it stores nothing.
import React, {useEffect, useState} from 'react';
import {useShell} from '../page-data.js';
import {Icon, KindTag, Section, StatusBadge} from '../ui.jsx';
import {OperationError, useEdit} from '../editing.jsx';
import {postJSON} from '../request.js';
import {memberUnit} from '../work-model.js';
import {statusFamily} from '../glossary.js';
import {termOnce} from './guidance.jsx';
import {conceptPage} from './ConceptLinks.jsx';

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
// Claim statuses are members of the Status family; a status outside it stays text.
const CLAIM_STATUS = new Set(['open', 'supported', 'verified', 'refuted', 'superseded']);
// Attention categories in server order and the stripe family of each.
const CATEGORIES = ['Delivered with unmet evidence', 'Claim with an error', 'Open decision', 'Open root cause', 'Undecided flow or unresolved item', 'Open assumption', 'Unknown or risk'];
const ATTENTION_FAMILY = ['problem', 'problem', 'active', 'active', 'waiting', 'active', 'neutral'];
const plainTerms = (term, children) => children ?? term;
// terms (termOnce of the section) explains the first glossary term of a step.
export const Step = ({step, terms = plainTerms}) => <span className={`ladder-step l${LADDER.indexOf(step)}`} title={LADDER_NOTES[step]}>
  {step === 'Fact from Git' ? terms('Fact from Git') : step === 'Re-checked by an agent, not independent' ? <>{terms('Re-checked')} by an agent, {terms('not independent')}</> : step}
</span>;
// "verified" never stands alone for an agent record.
function ClaimStatus({claim, terms = plainTerms}) {
  const agent = claim.status === 'verified' && claim.verifiedBy === 'agent';
  return <span className={`claim-status s-${claim.status}`}>
    {CLAIM_STATUS.has(claim.status) ? <StatusBadge status={claim.status}>{claim.status === 'open' ? terms('open claim', 'open') : claim.status}</StatusBadge> : <span className="claim-status-text">{claim.status}</span>}
    {agent && <> {terms('verified by an agent', 'by an agent')}, {terms('not independent')}</>}
  </span>;
}
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

// A concept row (specifications/concept-pages.md, Change brief): the concept links to
// its page, except a removed one, and the document or flow links to its page.
const LEAD = {'declaration-new': 'new declaration in ', 'declaration-changed': 'declaration changed in ', 'declaration-removed': 'declaration removed in ', 'participation-changed': 'participation changed in ', 'describing-document-changed': 'describing document changed: '};
function ConceptRow({concept: c, go}) {
  const lead = LEAD[c.reason], label = c.flow ? c.flow.title : c.document.title;
  // A flow document removed at the head opens its established document, not the flow page.
  const target = c.flow && !c.document.removed ? {kind: 'flow', artifact: c.flow.flow.split(':')[0], flow: c.flow.flow}
    : {kind: 'document', artifact: c.document.path.match(/^docs\/artifacts\/([^/]+)\//)?.[1], source: c.document.path, ...(c.document.removed ? {established: true} : {})};
  // Links, not buttons: a button is one box, so a long name would leave its line.
  // The href has no page, so a middle click does nothing, as on a button.link.
  const open = page => ({href: '#', onClick: event => {event.preventDefault();go(page);}, onAuxClick: event => event.preventDefault()});
  return <span className="concept-row">{c.reason === 'declaration-removed' ? c.title : <a aria-label={`Open concept ${c.title}, ${lead}${label}`} {...open(conceptPage({artifact: c.concept.split(':')[0], logicalId: c.concept}))}>{c.title}</a>}
    {' — '}{lead}<a aria-label={`Open ${label} for ${c.title}`} {...open(target)}>{label}</a></span>;
}
function Items({items, terms, concepts = [], go}) {
  const conceptOf = item => item.concept && concepts.find(c => c.concept === item.concept && c.document.path === item.document?.path);
  return <ul className="brief-items">{items.map((item, i) => {const concept = conceptOf(item);return <li key={i}>
    <span className="grow">{concept ? <ConceptRow concept={concept} go={go}/> : <>{item.claim ? <a href={`#claim-${item.claim}`}>{item.text}</a> : item.text}{item.source && <span className="brief-source"> {short(item.source)}</span>}</>}</span>
    <Step step={item.step} terms={terms}/>
  </li>;})}</ul>;
}
const UNDECIDED = /^(.+) is reached \(([^)]+)\)(, and neither .*)$/;
// An attention row: a stripe of its family; an undecided flow names the rule and,
// when the change has a unit, offers its brief.
function Attention({rows, more, terms, unit, go}) {
  return <>
    <ul className="brief-attention">{rows.map((row, i) => {
      const family = ATTENTION_FAMILY[CATEGORIES.indexOf(row.category)] || 'neutral', undecided = !row.claim && UNDECIDED.exec(row.text);
      return <li key={i} className={`stripe ${family}`}>
        <span className="brief-category">{row.category === CATEGORIES[4] ? <>{terms('undecided flow', 'Undecided flow')} or unresolved item</> : row.category}</span>
        <span className="grow">{row.claim ? <a href={`#claim-${row.claim}`}>{row.text}</a> : undecided ? <>{undecided[1]} is {terms('reached')} ({undecided[2]}){undecided[3]}</> : row.text}
          {undecided && unit && <> <button className="link" aria-label={`Declare ${undecided[1]} in unit brief`} onClick={() => go({kind: 'unit', unit: unit.id})}>Declare in unit brief</button></>}</span>
        <Step step={row.step} terms={terms}/>
      </li>;
    })}</ul>
    {more > 0 && <p className="small muted">{more} more below the first seven.</p>}
  </>;
}
function Decision({answer, counts, terms}) {
  const [goal, ...rest] = answer.items;
  const steps = Object.entries(counts.byStep).map(([step, n]) => `${n} ${step}`).join(', ');
  return <div className="brief-decision">
    <p><b>Goal and scope.</b> {goal.text} Accept or amend the goal in the conversation with the coordinator.</p>
    <p><b>Correctness.</b> Claims by step: {steps || 'none'}. Checks by a person: {counts.checksByPerson}. Checks by an agent: {counts.checksByAgent}.</p>
    {rest.length > 0 && <Items items={rest} terms={terms}/>}
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
function ClaimCard({claim, writable, terms}) {
  const [form, setForm] = useState(null);
  const active = !['refuted', 'superseded'].includes(claim.status);
  const errors = claim.diagnostics.filter(d => d.severity === 'error');
  const family = errors.length ? 'problem' : CLAIM_STATUS.has(claim.status) ? statusFamily(claim.status) : 'neutral';
  return <article className={`claim-card stripe ${family}`} id={`claim-${claim.id}`} aria-label={`Claim ${claim.id}`}>
    <div className="claim-tags">{KIND[claim.kind] ? <KindTag kind={KIND[claim.kind]}/> : <span className="claim-kind">{claim.kind}</span>}<ClaimStatus claim={claim} terms={terms}/><Step step={claim.step} terms={terms}/></div>
    <p className="claim-statement">{claim.statement}</p>
    <dl className="claim-fields">
      <dt>Basis</dt><dd>{['documented', 'observed'].includes(claim.basis) ? terms(claim.basis) : claim.basis}</dd>
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
      <button className="quiet" onClick={() => setForm('challenge')}>{Icon.plus}Challenge</button>
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
      <tbody>{list.map(c => <tr key={c.id}><td>{c.statement}</td><td><ClaimStatus claim={c}/></td><td className="mono small">{c.evidence.map(short).join(', ') || '—'}</td><td><Step step={c.step}/></td></tr>)}</tbody></table></div>
  </div>);
}
function Flows({flows, unit, terms}) {
  if (!flows.reached.length) return null;
  const unresolved = flows.undecided.filter(u => u.kind === 'unresolved');
  return <div className="brief-table" role="region" aria-label="Flows">
    <h3>Flows <span className="small muted">reached, declared and undecided</span></h3>
    <div className="table-scroll"><table><thead><tr><th>Flow</th><th>State</th><th>Steps reached</th><th>Decided by</th></tr></thead>
      <tbody>{flows.reached.map(f => <tr key={f.flow}><td className="mono">{f.flow}</td>
        <td>{f.state === 'undecided' ? <StatusBadge status="Incomplete">{terms('undecided flow', 'Undecided')}</StatusBadge> : <StatusBadge status="Complete">{f.state === 'declared' ? 'Declared' : 'Reached, decided'}</StatusBadge>}</td>
        <td>{f.steps.join(', ') || '—'}</td>
        <td>{f.state === 'declared' ? 'Unit brief' : f.decidedBy ? <a href={`#claim-${f.decidedBy.id}`}>Claim {f.decidedBy.id}</a> : <span className="muted">Nothing; declare it in {unit ? 'the unit brief' : 'a unit'} or name it in a claim</span>}</td></tr>)}</tbody></table></div>
    {unresolved.length > 0 && <p className="small muted">{unresolved.length} unresolved {unresolved.length === 1 ? 'item' : 'items'}: impact unknown, not absent.</p>}
  </div>;
}

// The page object keeps the open rows as brief, the list of their questions; without it the attention row is open.
const DEFAULT_OPEN = ['What should I care about?'];
export default function ChangeBrief({artifact, change, writable, page}) {
  const {worktree, go} = useShell(), brief = useChangeBrief(artifact, change), b = brief.brief, terms = termOnce();
  if (!b) return <Section title="Change brief" label="Change brief" id="change-brief">
    {brief.status === 'error' ? <p className="small" role="alert">{brief.error} <button className="link" onClick={brief.retry}>Retry</button></p> : <p className="muted small" role="status">Reading the change brief…</p>}
  </Section>;
  const origin = b.origin.kind === 'protected-diff' ? 'Difference with main.' : b.origin.kind === 'delivery-commit' ? `The commit that introduced the version, ${b.origin.commit.slice(0, 7)}.` : b.origin.reason;
  const open = c => c.status === 'open' ? 0 : 1;
  const claims = [...b.claims].sort((x, y) => (x.available ? 1 : 0) - (y.available ? 1 : 0) || open(x) - open(y) || KIND_ORDER[x.kind] - KIND_ORDER[y.kind]);
  const unit = b.flows.declared.length > 0;
  const rows = b.answers.filter(a => a.summary !== null), opened = Array.isArray(page?.brief) ? page.brief : DEFAULT_OPEN;
  // The open rows are read from the elements, so two toggles before a render keep both.
  const toggle = event => {
    const shown = [...event.currentTarget.parentElement.children], open = rows.filter((a, i) => shown[i]?.open).map(a => a.question);
    if (open.length !== opened.filter(q => rows.some(a => a.question === q)).length || open.some(q => !opened.includes(q))) go({...page, brief: open});
  };
  return <Section title="Change brief" label="Change brief" id="change-brief" summary={<span className="small muted">{origin}{brief.partial ? ' The impact answer is partial.' : ''}</span>}>
    <div className="brief-rows">{rows.map(a => <details key={a.question} open={opened.includes(a.question)} onToggle={toggle}>
      <summary><span className="brief-question">{a.question}</span><span className="brief-answer">{a.summary}</span></summary>
      <div className="brief-more">{a.question === 'What should I care about?' ? <Attention rows={b.attention.rows} more={b.attention.more} terms={terms} unit={memberUnit(worktree, artifact, change)} go={go}/> : a.question === 'What needs my decision?' ? <Decision answer={a} counts={b.counts} terms={terms}/> : <Items items={a.items} terms={terms} concepts={b.concepts} go={go}/>}</div>
    </details>)}</div>
    {claims.length > 0 && <div className="brief-claims" role="region" aria-label="Claims">
      <h3>Claims <span className="small muted">{claims.length} · open first</span></h3>
      {claims.map(c => <ClaimCard key={`${c.file}#${c.id}`} claim={c} writable={writable} terms={terms}/>)}
    </div>}
    <Hypotheses claims={b.claims}/>
    <Flows flows={b.flows} unit={unit} terms={terms}/>
    {b.delivery?.wording.length > 0 && <div className="brief-table" role="region" aria-label="Wording notes">
      <h3>Wording notes <span className="small muted">records this change delivered that still say work is pending</span></h3>
      <Items items={b.delivery.wording.map(w => ({text: `“${w.sentence}” Matched by wording.`, source: w.path, step: w.step}))}/>
    </div>}
    <details className="claim-rejected ladder-legend"><summary>How to read the steps</summary><ul>{LADDER.map(step => <li key={step}><Step step={step}/> {LADDER_NOTES[step]}</li>)}</ul></details>
  </Section>;
}
