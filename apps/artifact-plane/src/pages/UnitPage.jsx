import React, {useId, useMemo, useRef, useState} from 'react';
import {useShell, useQuery, useDocument} from '../page-data.js';
import {PageHeader, Section, Badge} from '../ui.jsx';
import {ActionForm, OperationError, useEdit, sectionText, splitFront} from '../editing.jsx';
import {GraphPanel} from '../GraphPanel.jsx';
import {unitCanvas} from '../unit-canvas.js';
import {artifactDocuments, artifactTitle, changeTitle, completionLabel, currentChanges, phaseLabel} from '../work-model.js';
import {artifactNodeTypes, lightEdges} from './UnitPageGraph.jsx';
import './UnitPage.css';

const RESULTS = [{value: 'passed', label: 'Passed'}, {value: 'failed', label: 'Failed'}, {value: 'incomplete', label: 'Incomplete'}];
const EFFECTS = [{value: 'modify', label: 'Modify'}, {value: 'create', label: 'Create'}, {value: 'remove', label: 'Remove'}];
const COMPLETION_TONE = {Complete: 'passed', Incomplete: 'incomplete'};
const REVIEW = /publication_reviews|publication review/i;
const plainCriteria = acceptance => acceptance.map(c => ({id: c.id, criterion: c.criterion, ...(c.integration ? {integration: true} : {})}));

// The evidence of a criterion: the result of its last recorded entry.
function evidenceBadge(unit, id) {
  const last = unit.evidence.filter(e => e.criterion === id).at(-1);
  return last ? (RESULTS.find(r => r.value === last.result) || {value: '', label: last.result}) : {value: 'none', label: 'No evidence'};
}

// Completion: the label and the first reason. A missing publication review links to the change that records it.
function CompletionLine({unitId, members, go}) {
  const query = useQuery({section: 'completion', unit: unitId});
  const completion = query.data?.completion;
  if (!completion) return <p className="unit-completion muted" role="status">{query.status === 'error' ? <>Completion cannot be read. <button className="link" onClick={query.retry}>Retry</button></> : 'Checking completion…'}</p>;
  const label = completionLabel(completion), reason = completion.reasons?.[0];
  const review = (query.data.members || members).find(m => m.establishmentEvidence?.reasons?.some(r => REVIEW.test(r)));
  return <p className="unit-completion">
    <Badge tone={COMPLETION_TONE[label] || ''}>{label}</Badge>
    {reason && <span className="muted">{reason}</span>}
    {review && <button className="link" onClick={() => go({kind: 'change', artifact: review.artifact, change: review.change})}>Record publication review</button>}
  </p>;
}

// One criterion row: the text edits in place; the evidence badge records evidence in place.
function CriterionRow({unit, criterion, index, mode, onMode, editable, sources}) {
  const edit = useEdit(), descId = useId(), fieldId = useId();
  const [text, setText] = useState(criterion.criterion), [integration, setIntegration] = useState(Boolean(criterion.integration));
  const [busy, setBusy] = useState(false), [error, setError] = useState(null);
  const badge = evidenceBadge(unit, criterion.id), all = plainCriteria(unit.acceptance);
  const open = next => {setText(criterion.criterion);setIntegration(Boolean(criterion.integration));setError(null);onMode(next);};
  async function save(next) {
    setBusy(true);setError(null);
    try {await edit.run('unit.acceptance.set', {unit: unit.id, criteria: next});onMode(null);}
    catch (failure) {setError(failure);}
    finally {setBusy(false);}
  }
  const editing = mode === 'text';
  return <div className={`criterion ${editing || mode === 'evidence' ? 'editing' : ''}`}>
    <span className="criterion-id">{criterion.id}</span>
    {editing ? <form className="criterion-edit" onKeyDown={e => {if (e.key === 'Escape') {e.stopPropagation();onMode(null);}}}
      onSubmit={e => {e.preventDefault();if (!busy) save(all.map((c, i) => i === index ? {id: c.id, criterion: text, ...(integration ? {integration: true} : {})} : c));}}>
      <label className="sr-only" htmlFor={fieldId}>Criterion {criterion.id}</label>
      <textarea id={fieldId} value={text} required rows={3} autoFocus onChange={e => setText(e.target.value)}/>
      <OperationError error={error}/>
      <div className="criterion-bar">
        <label className="check"><input type="checkbox" checked={integration} onChange={e => setIntegration(e.target.checked)}/>Integration criterion</label>
        {all.length > 1 && <button type="button" className="danger" disabled={busy} onClick={() => save(all.filter((_, i) => i !== index))}>Remove</button>}
        <button type="button" onClick={() => onMode(null)}>Cancel</button>
        <button className="primary" disabled={busy} aria-busy={busy}>Save</button>
      </div>
    </form> : editable ? <button className="unstyled criterion-text" aria-label={`Edit criterion ${criterion.id}`} aria-describedby={descId} onClick={() => open('text')}>
      <span id={descId}>{criterion.criterion}</span>{criterion.integration && <Badge tone="integration">Integration</Badge>}
    </button> : <span className="criterion-text">{criterion.criterion}{criterion.integration && <Badge tone="integration">Integration</Badge>}</span>}
    <span className="criterion-evidence">
      {editable ? <button className={`unstyled badge-button badge ${badge.value}`} aria-label={`Record evidence for ${criterion.id}`} title="Record evidence" aria-expanded={mode === 'evidence'} onClick={() => open(mode === 'evidence' ? null : 'evidence')}>{badge.label}</button>
        : <Badge tone={badge.value}>{badge.label}</Badge>}
    </span>
    {mode === 'evidence' && <div className="criterion-form">
      <ActionForm open submitLabel="Record evidence" title={`Evidence for ${criterion.id}`} onClose={() => onMode(null)} fields={[
        {name: 'method', label: 'Method', required: true, value: 'Run the combined checks.'},
        {name: 'result', label: 'Result', type: 'select', options: RESULTS, value: 'passed'},
        {name: 'source', label: 'Source', type: 'select', options: sources, value: ''},
        {name: 'detail', label: 'Detail for the combined checks', type: 'textarea', rows: 2, required: true, hidden: v => Boolean(v.source)},
      ]} onSubmit={v => edit.run('unit.evidence.record', {unit: unit.id, criterion: criterion.id, method: v.method, result: v.result, ...(v.source ? {source: v.source} : {detail: v.detail})})}/>
    </div>}
  </div>;
}

export default function UnitPage({page}) {
  const {snapshot, worktree, go} = useShell(), edit = useEdit();
  const unit = worktree?.unitsOfWork?.find(u => u.id === page.unit);
  const brief = useDocument(unit?.path, unit ? {unit: unit.id} : null);
  const [rowMode, setRowMode] = useState(null), [graph, setGraph] = useState(false), [flowsOpen, setFlowsOpen] = useState(false), [removeError, setRemoveError] = useState(null), [noJoin, setNoJoin] = useState(false);
  const flowsButton = useRef(null);
  const graphQuery = useQuery(graph && unit ? {section: 'artifacts', unit: unit.id} : null);
  // The exact retained tasks of the members: their Evidence sections are evidence sources.
  const tasksQuery = useQuery(unit && edit.editable && rowMode?.mode === 'evidence' ? {section: 'implementation', unit: unit.id} : null);
  const canvas = useMemo(() => {
    const data = graphQuery.data;
    if (!data?.artifactGraph?.planning || !worktree) return null;
    const result = unitCanvas({unit: data, worktree}, 'artifacts', true, null);
    const version = id => snapshot.artifacts.find(a => a.id === id)?.currentVersion || null;
    return {nodes: result.nodes.map(n => ({...n, data: {...n.data, version: version(n.data.artifact)}, style: {width: 250, height: 84}, position: {x: n.position.x, y: n.position.y + 18}})), edges: lightEdges(result.edges)};
  }, [graphQuery.data, worktree, snapshot]);

  if (!unit) return <section className="page" aria-label="Unit page"><div className="column">
    <PageHeader eyebrow={`Unit of work · ${page.unit}`} title="Unit of work not found"/>
    <p className="muted">This unit of work is not in the selected worktree.</p>
  </div></section>;

  const editable = edit.editable;
  const changes = worktree.changes || [];
  const changeOf = m => changes.find(c => c.artifact === m.artifact && c.name === m.change);
  const memberState = m => {const c = changeOf(m);return m.deliveredVersion ? `Delivered ${m.deliveredVersion}` : c?.version ? `Version ${c.version} prepared` : c ? phaseLabel(c) : 'Not found';};
  const claimed = new Set((worktree.unitsOfWork || []).filter(u => u.id !== unit.id).flatMap(u => u.members.map(m => `${m.artifact}/${m.change}`)));
  const joinable = currentChanges(worktree).filter(c => !unit.members.some(m => m.artifact === c.artifact) && !claimed.has(`${c.artifact}/${c.name}`))
    .map(c => ({value: `${c.artifact}/${c.name}`, label: `${changeTitle(c)} · ${artifactTitle(snapshot, c.artifact)}`}));
  // The Purpose section, or the paragraph under the title of an older brief.
  const purpose = sectionText(brief.markdown, 'purpose') || splitFront(brief.markdown).body.split(/^#{2,}\s/m)[0].replace(/^#\s.*$/m, '').trim().split(/\n\s*\n/)[0]?.trim();
  // Evidence sources: the Evidence sections of member tasks, or the combined checks of this brief.
  const several = unit.members.length > 1;
  const memberTasks = (tasksQuery.data?.implementationGraph?.nodes || []).filter(n => n.kind === 'task' && n.task?.path);
  const sources = [{value: '', label: 'Combined checks of this brief'}, ...memberTasks.map(n => ({value: `${n.task.path}#evidence`, label: `${several ? `${changeTitle(changeOf(n)) || n.change}: ` : ''}${n.task.title || n.task.id || n.title} · Evidence`}))];
  const withEvidence = unit.acceptance.filter(c => unit.evidence.some(e => e.criterion === c.id)).length;
  const flowTitle = f => artifactDocuments(snapshot.artifacts.find(a => a.id === f.artifact) || {elements: []}).flows.find(x => x.flow === `${f.artifact}:${f.flow}`)?.title || f.flow;
  const allFlows = snapshot.artifacts.flatMap(a => artifactDocuments(a).flows.map(f => ({value: f.flow, label: snapshot.artifacts.length > 1 ? `${f.title} · ${a.title}` : f.title})));
  const affected = unit.affectedFlows || [];
  const closeFlows = () => {setFlowsOpen(false);requestAnimationFrame(() => flowsButton.current?.focus());};

  return <section className="page unit-page" aria-label="Unit page"><div className="column">
    <PageHeader eyebrow={`Unit of work · ${unit.id}`} title={unit.title}
      action={<button className="quiet" onClick={() => go({kind: 'document', source: unit.path, scope: {unit: unit.id}})}>{editable ? 'Edit brief' : 'Read brief'}</button>}/>
    {purpose ? <p className="lead">{purpose}</p> : !brief.ready && <p className="lead muted">Reading the brief…</p>}
    <CompletionLine unitId={unit.id} members={unit.members} go={go}/>

    <Section title="Changes" summary={unit.members.length} actions={<button className="quiet" aria-expanded={graph} onClick={() => setGraph(v => !v)}>{graph ? 'Hide graph' : 'Show graph'}</button>}>
      <div className="rows">
        {unit.members.map(m => {const c = changeOf(m), title = changeTitle(c) || m.change;
          // Members of different artifacts can share a title; their controls still need distinct names.
          const name = unit.members.filter(x => (changeTitle(changeOf(x)) || x.change) === title).length > 1 ? `${title} · ${artifactTitle(snapshot, m.artifact)}` : title;
          return <div className="row" key={`${m.artifact}/${m.change}`}>
          <div className="grow"><button className="link" aria-label={name} onClick={() => go({kind: 'change', artifact: m.artifact, change: m.change})}>{title}</button> <span className="muted">· {artifactTitle(snapshot, m.artifact)} · {m.change}</span></div>
          <span className="muted">{memberState(m)}</span>
          {editable && several && <button className="danger" aria-label={`Remove ${name} from the unit`} onClick={() => {setRemoveError(null);edit.run('unit.member.remove', {unit: unit.id, artifact: m.artifact, change: m.change}).catch(setRemoveError);}}>Remove</button>}
        </div>;})}
        {editable && (joinable.length ? <ActionForm label="+ Add a change" opener="add-row" submitLabel="Add the change"
          fields={[{name: 'member', label: 'Open change', type: 'select', options: joinable, value: joinable[0].value}]}
          onSubmit={v => {const [artifact, change] = v.member.split('/');return edit.run('unit.member.add', {unit: unit.id, artifact, change});}}/>
          : noJoin ? <div className="row join-note"><span className="grow muted">Every other open change already belongs to a unit or shares an artifact with this unit.</span><button autoFocus onClick={() => setNoJoin(false)}>Close</button></div>
          : <button className="add-row" onClick={() => setNoJoin(true)}>+ Add a change</button>)}
      </div>
      <OperationError error={removeError}/>
      {graph && <GraphPanel label="Artifact graph of this unit" nodes={canvas?.nodes || []} edges={canvas?.edges || []} nodeTypes={artifactNodeTypes} flowKey={unit.id}
        message={graphQuery.status === 'error' ? graphQuery.error : !canvas ? 'Reading the artifact graph…' : canvas.nodes.length ? null : 'No artifact graph.'}
        onNodeClick={(_, node) => node.data.artifact && go({kind: 'artifact', artifact: node.data.artifact})}
        legend={<><span><i/>Dependency</span><span>Arrows point from prerequisite to dependent. Dashed nodes are prerequisites outside the unit.</span></>}/>}
    </Section>

    <Section title="Acceptance criteria" summary={`· ${withEvidence} of ${unit.acceptance.length} have evidence`}>
      <div className="rows criteria">
        {unit.acceptance.map((c, i) => <CriterionRow key={`${c.id}:${c.criterion}:${c.integration}`} unit={unit} criterion={c} index={i} editable={editable} sources={sources}
          mode={rowMode?.id === c.id ? rowMode.mode : null} onMode={mode => setRowMode(mode ? {id: c.id, mode} : null)}/>)}
        {editable && <ActionForm label="+ Add criterion" opener="add-row" submitLabel="Add criterion" fields={[
          {name: 'criterion', label: 'Criterion', type: 'textarea', rows: 2, required: true, placeholder: 'One observable criterion'},
          {name: 'integration', label: 'Integration criterion', type: 'checkbox', value: several && !unit.acceptance.some(c => c.integration)},
        ]} onSubmit={v => edit.run('unit.acceptance.set', {unit: unit.id, criteria: [...plainCriteria(unit.acceptance), {criterion: v.criterion, ...(v.integration ? {integration: true} : {})}]})}/>}
      </div>
      {editable && unit.acceptance.length > 0 && <p className="section-note">Select a criterion to edit it. Record evidence from its evidence badge.</p>}
    </Section>

    <Section title="Affected flows" summary={affected.length} actions={editable && !flowsOpen && <button ref={flowsButton} className="quiet" aria-label="Edit affected flows" onClick={() => setFlowsOpen(true)}>Edit</button>}>
      {flowsOpen ? <ActionForm open submitLabel="Save affected flows" onClose={closeFlows} fields={[
        {name: 'flows', label: 'Flows', type: 'checks', options: allFlows, value: affected.map(f => `${f.artifact}:${f.flow}`), empty: 'No flow records exist.'},
        {name: 'effect', label: 'Effect on the selected flows', type: 'select', options: EFFECTS, value: affected[0]?.effect || 'modify'},
        {name: 'assessment', label: 'Flow assessment', type: 'textarea', rows: 4, required: true, value: unit.flowAssessment || ''},
      ]} onSubmit={v => edit.run('unit.flows.set', {unit: unit.id, affectedFlows: v.flows.map(value => {const [artifact, flow] = value.split(':');return {artifact, flow, effect: v.effect};}), flowAssessment: v.assessment})}/>
        : affected.length ? <div className="chips">{affected.map(f => <button key={`${f.artifact}:${f.flow}`} className="chip" onClick={() => go({kind: 'flow', artifact: f.artifact, flow: `${f.artifact}:${f.flow}`})}>{flowTitle(f)} <small>{f.effect}</small></button>)}</div>
        : <p className="muted">{unit.flowAssessment || 'No flow is affected.'}</p>}
    </Section>
  </div></section>;
}
