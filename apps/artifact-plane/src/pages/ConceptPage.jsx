// The concept page (specifications/concept-pages.md, Concept page): one declared
// model, its documents, the flows that use it and the code and tests inferred
// from their steps. The page reads the `concept` operation and changes nothing.
import {useEffect, useRef, useState} from 'react';
import {useShell} from '../page-data.js';
import {postJSON} from '../request.js';
import {DiffBadge, Icon, KindTag, Notice, PageHeader, Section} from '../ui.jsx';
import {impactPage} from '../impact-model.js';
import './ConceptPage.css';

const ARTIFACT = /^docs\/artifacts\/([^/]+)\//;
// The answer diagnostics of an unknown or ambiguous query; graph diagnostics of other models stay out.
const QUERY_CODES = ['concept-unknown', 'concept-ambiguous'];
const count = (n, word) => n ? `${n} ${word}${n === 1 ? '' : 's'}` : `no ${word}`;
const rowKey = f => `${f.flow}|${f.participant}`;
const documentPage = d => ({kind: 'document', artifact: d.path.match(ARTIFACT)?.[1], source: d.path});
const flowPage = (artifact, flow) => ({kind: 'flow', artifact, flow});

// The concept answer of the selected worktree; a reload keeps the last answer.
function useConcept({root, worktreePath, epoch, concept}) {
  const [state, setState] = useState({status: 'loading', concept: null, diagnostics: [], error: null}), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!root || !concept) return;
    const controller = new AbortController();
    setState(current => ({...current, status: 'loading', error: null}));
    postJSON('/api/flows/query', {path: root, ...(worktreePath ? {worktree: worktreePath} : {}), knowledge: 'planning', operation: 'concept', concept}, controller.signal)
      .then(result => {if (!controller.signal.aborted) setState({status: 'loaded', concept: result.data?.concept || null, diagnostics: result.diagnostics || [], error: null});})
      .catch(error => {if (!controller.signal.aborted && error.name !== 'AbortError') setState(current => ({...current, status: 'error', error: error.message}));});
    return () => controller.abort();
  }, [root, worktreePath, epoch, concept, attempt]);
  return {...state, retry: () => setAttempt(n => n + 1)};
}

// A document link; a missing source is plain text, because it has no page.
function DocumentLink({document: d, go, label}) {
  return d.missing ? <span>{d.title}</span> : <button className="link" aria-label={label} onClick={() => go(documentPage(d))}>{d.title}</button>;
}
const joined = (items, separator) => items.flatMap((item, i) => i ? [separator, item] : [item]);

// One Flows row: a toggle with the flow, its artifact when it is another one,
// and what the concept supplies; the open row shows the role and the interactions.
function FlowRow({flow: f, owner, artifactTitle, open, onToggle, go, buttonRef}) {
  const page = flowPage(f.artifact, f.flow);
  return <li className={open ? 'open' : ''}>
    <button ref={buttonRef} className="unstyled concept-flow" aria-expanded={open} onClick={onToggle}>
      <span className="concept-chevron" aria-hidden="true">{Icon.chevron}</span>
      <span className="concept-flow-text">
        <span><span className="concept-flow-title">{f.title}</span>{f.artifact !== owner && <span className="muted small"> · {artifactTitle(f.artifact)}</span>}</span>
        {f.requires && <span className="concept-flow-requires">{f.requires}</span>}
      </span>
    </button>
    {open && <div className="concept-flow-body">
      <p className="muted small concept-role">Role: <span className="mono">{f.participant}</span> · <button className="link" onClick={() => go(page)}>Open flow</button></p>
      <ul className="concept-interactions">{f.interactions.map((i, n) => <li key={n}>
        <button className="link" aria-label={`${i.stepTitle}, ${i.action}`} onClick={() => go(page)}>{i.stepTitle}</button> <span className="muted">— {i.from} → {i.to}:</span> {i.action}
      </li>)}</ul>
    </div>}
  </li>;
}

// Code and tests: closed by default, one group for each set of steps with the same files.
function CodeAndTests({concept, artifactTitle, go}) {
  const groups = concept.implementation?.groups || [];
  const unique = kind => new Set(groups.flatMap(g => g[kind].map(c => c.path))).size;
  const seen = new Map();for (const g of groups) for (const c of [...g.code, ...g.tests]) seen.set(c.path, (seen.get(c.path) || 0) + 1);
  const flowTitle = g => concept.flows.find(f => f.flow === g.flow)?.title || g.flow;
  const files = (g, list, label, none) => list.length ? <><h4 className="concept-label">{label}</h4><ul className="concept-files">{list.map(c => <li key={c.path}>
    <button className="link mono" aria-label={seen.get(c.path) > 1 ? `${c.path}, ${g.steps.map(s => s.stepTitle).join(', ')}` : undefined}
      onClick={() => go({kind: 'source', artifact: g.artifact, flow: g.flow, flowId: g.flowId, sourceId: c.sourceId, path: c.path})}>{c.path}</button>
  </li>)}</ul></> : <p className="muted small concept-none">{none}</p>;
  return <details className="concept-code">
    <summary><span className="concept-code-title">Code and tests in the steps of these flows</span> <span className="muted">· {count(unique('code'), 'code file')}, {count(unique('tests'), 'test file')}</span> <KindTag kind="static"/></summary>
    {groups.map(g => <div key={`${g.flow}|${g.steps.map(s => s.step).join(',')}`} className="concept-group">
      <h3 className="concept-group-head">{/* A button wraps as a box, so the comma sits inside it and never starts a line. */}
        {joined(g.steps.map((s, n) => <button key={s.step} className="link" aria-label={`${s.stepTitle}, code and tests`} onClick={() => go(flowPage(g.artifact, g.flow))}>{s.stepTitle}{n < g.steps.length - 1 && ','}</button>), ' ')}</h3>
      <p className="muted small">{flowTitle(g)} · {artifactTitle(g.artifact)}</p>
      {files(g, g.code, 'Code', 'No code file.')}
      {files(g, g.tests, 'Tests', 'No test file.')}
    </div>)}
    <p className="muted small concept-footnote">Inferred from the steps where {concept.title} takes part. Not declared on the concept.</p>
  </details>;
}

// The page body for one answer. page.focus (flow:<logicalId>) opens that Flows row on arrival.
export function ConceptView({page, concept, diagnostics = [], snapshot, go}) {
  const artifactTitle = id => snapshot?.artifacts?.find(a => a.id === id)?.title || id;
  const owner = concept?.artifact || page.artifact;
  const eyebrow = <><button className="link" onClick={() => go({kind: 'artifact', artifact: owner})}>{artifactTitle(owner)}</button> / Concept</>;
  const flows = concept?.flows || [];
  const arrival = flows.find(f => page.focus === `flow:${f.flow}`);
  const [chosen, setChosen] = useState(undefined), open = chosen === undefined ? arrival && rowKey(arrival) : chosen;
  const arrivalRef = useRef(null);
  useEffect(() => {if (arrival && chosen === undefined) {arrivalRef.current?.focus();arrivalRef.current?.scrollIntoView?.({block: 'center'});}}, [arrival && rowKey(arrival)]);
  if (!concept) return <><div className="eyebrow">{eyebrow}</div>
    {diagnostics.filter(d => QUERY_CODES.includes(d.code)).map((d, i) => <p key={i} role="status">{d.message}</p>)}</>;
  const problems = concept.diagnostics || [], changed = concept.branchChanged || [], openChanges = concept.changes?.open || [];
  const affect = () => go(impactPage({origins: [{model: concept.logicalId}, ...concept.sources.filter(s => !s.missing).map(s => ({path: s.path}))], title: concept.title}));
  return <>
    <PageHeader eyebrow={eyebrow} title={<>{concept.title}{concept.declaration === 'new' && <> <DiffBadge name="New"/></>}</>}
      action={<button className="quiet" onClick={affect}>{Icon.graph}What does {concept.title} affect?</button>}/>
    {concept.description && <p className="lead concept-lead">{concept.description}</p>}
    {concept.sources.length > 0 && <p className="muted concept-meta">Described in {joined(concept.sources.map(s => <DocumentLink key={s.path} document={s} go={go}/>), ' · ')}</p>}
    {problems.map((d, i) => <Notice key={i} tone="error" action={<button className="link" onClick={() => go(documentPage(concept.declaredIn))}>Fix in {concept.declaredIn.title}</button>}>{d.message}</Notice>)}
    {changed.length > 0 && <p className="muted concept-meta">Changed on this branch: {joined(changed.map(d => <DocumentLink key={d.path} document={d} go={go} label={`${d.title}, changed on this branch`}/>), ', ')}.
      {openChanges.map(c => <span key={c.change}> Open change in {artifactTitle(c.artifact)}: <button className="link" onClick={() => go({kind: 'change', artifact: c.artifact, change: c.change})}>{c.title}</button></span>)}</p>}
    {flows.length ? <>
      <Section title="Flows" summary={flows.length}>
        <ul className="concept-flows">{flows.map(f => <FlowRow key={rowKey(f)} flow={f} owner={owner} artifactTitle={artifactTitle} go={go}
          open={open === rowKey(f)} onToggle={() => setChosen(open === rowKey(f) ? null : rowKey(f))} buttonRef={arrival === f ? arrivalRef : null}/>)}</ul>
      </Section>
      <CodeAndTests concept={concept} artifactTitle={artifactTitle} go={go}/>
    </> : <p className="muted concept-none-flow">No flow uses {concept.title} yet.</p>}
    {!problems.length && <p className="muted concept-meta concept-closing">Declared as a model in <DocumentLink document={concept.declaredIn} go={go}/>.</p>}
  </>;
}

export default function ConceptPage({page}) {
  const {root, worktreePath, epoch, snapshot, go} = useShell();
  const answer = useConcept({root, worktreePath, epoch, concept: `${page.artifact}:${page.model}`});
  return <section className="page concept-page" aria-label="Concept page"><div className="column">
    {answer.status === 'error' && <Notice tone="error" action={<button onClick={answer.retry}>Retry</button>}>{answer.error}</Notice>}
    {answer.status === 'loading' && !answer.concept && !answer.diagnostics.length ? <p className="muted" role="status">Loading concept…</p>
      : answer.status !== 'error' || answer.concept ? <ConceptView key={answer.concept?.logicalId || 'unknown'} page={page} concept={answer.concept} diagnostics={answer.diagnostics} snapshot={snapshot} go={go}/> : null}
  </div></section>;
}
