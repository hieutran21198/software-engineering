import {useEffect, useMemo, useState} from 'react';
import {useShell, useDocument} from '../page-data.js';
import {PageHeader, Section, Notice} from '../ui.jsx';
import {ActionForm, OperationError, useEdit, frontValue, splitFront, lines} from '../editing.jsx';
import {GraphPanel} from '../GraphPanel.jsx';
import {flowDiagram} from '../flow-canvas.js';
import {sha256} from '../knowledge-api.js';
import {artifactDocuments} from '../work-model.js';
import {useFlowDetail, useTrackedFiles, SUPPORT_GROUPS, supportGroup, supportTarget, supportFields, supportOperation, TextEditor, FrontMatterEditor, flowNodeTypes} from './FlowPageParts.jsx';
import './FlowPage.css';

const STOP = new Set(['a', 'an', 'the', 'or', 'and', 'with', 'to', 'in', 'of', 'for', 'on', 'by', 'from', 'that', 'as']);
// "Edit a document body…" → "Edit"; at most three words before the first small word.
function shortTitle(title = '') {
  const words = title.split(/\s+/).filter(Boolean), out = [];
  for (const word of words) {if (out.length && (STOP.has(word.toLowerCase()) || out.length === 3)) break;out.push(word.replace(/[,.;:]+$/, ''));}
  return out.join(' ') || title;
}
const sentence = text => {const t = String(text || '').trim().replace(/\.$/, '');return t && !/^[A-Z]{2}/.test(t) ? t[0].toLowerCase() + t.slice(1) : t;};
const plural = (n, word, many = word) => `${n} ${n === 1 ? word : many}`;
const list = value => Array.isArray(value) ? value : [];

// One expanded step: grouped supports and the six step actions, one form at a time.
function StepDetail({step, index, steps, support, resolved, editable, run, snapshot, owner, self, go, tracked, action, onAction, sources, flowId}) {
  const [error, setError] = useState(null), quick = (operation, input) => {setError(null);run(operation, input).catch(setError);};
  const supports = list(step.supports).map(id => support.find(s => s.id === id) || {id, missing: true});
  const close = () => onAction(null);
  // A support can name a symbol after its path; the source is the file.
  const readable = path => path && flowId ? list(sources).find(s => s.path === String(path).split(' · ')[0]) : null;
  // A support that only this step uses is removed from the flow; a shared one only leaves this step.
  const removeSupport = id => steps.some(s => s.id !== step.id && list(s.supports).includes(id))
    ? quick('flow.step.update', {step: step.id, supports: list(step.supports).filter(x => x !== id)})
    : quick('flow.support.remove', {support: id});
  const stepOptions = steps.filter(s => s.id !== step.id).map(s => ({value: s.id, label: `${steps.indexOf(s) + 1}. ${s.title}`}));
  const existing = support.filter(s => !list(step.supports).includes(s.id)).map(s => {const t = supportTarget(snapshot, s);return {value: s.id, label: t.title || t.path};});
  return <div className="step-detail">
    {SUPPORT_GROUPS.map(([group, label]) => {
      const items = supports.filter(s => !s.missing && supportGroup(s) === group);
      if (!items.length) return null;
      return <div key={group} className="support-group">
        <h3>{label}</h3>
        <ul>{items.map(s => {const t = supportTarget(snapshot, s), unresolved = resolved.get(s.id) === false;return <li key={s.id}>
          {t.page ? <button className="link" onClick={() => go(t.page)}>{t.title}</button> : readable(t.path) ? <button className="link mono" onClick={() => go({kind: 'source', artifact: owner, flow: self, flowId, sourceId: readable(t.path).id, path: t.path})}>{t.path}</button> : t.title ? <span>{t.title}</span> : <span className="mono">{t.path}</span>}
          <span className={`basis ${unresolved ? 'unresolved' : ''}`}>{s.basis || 'basis unknown'}{s.basis === 'observed' && list(s.evidence).length ? ` · ${plural(s.evidence.length, 'evidence file', 'evidence files')}` : ''}{unresolved ? ' · unresolved' : ''}</span>
          {editable && <button className="icon support-remove" aria-label={`Remove ${t.title || t.path || s.id} from this step`} title="Remove from this step" onClick={() => removeSupport(s.id)}>×</button>}
        </li>;})}</ul>
      </div>;
    })}
    {supports.some(s => s.missing) && <p className="tiny">Missing support: {supports.filter(s => s.missing).map(s => s.id).join(', ')}</p>}
    {!supports.length && <p className="muted small">This step has no support yet.</p>}
    {editable && !action && <div className="step-actions">
      <button className="quiet" onClick={() => onAction('support')}>+ Add support</button>
      <button className="quiet" onClick={() => onAction('rename')}>Rename step</button>
      <button className="quiet" onClick={() => onAction('next')}>Add a next step</button>
      <button className="quiet" disabled={index === 0} onClick={() => quick('flow.step.move', {step: step.id, to: index - 1})}>Move up</button>
      <button className="quiet" disabled={index === steps.length - 1} onClick={() => quick('flow.step.move', {step: step.id, to: index + 1})}>Move down</button>
      <button className="danger" disabled={steps.length === 1} onClick={() => quick('flow.step.remove', {step: step.id})}>Remove step</button>
    </div>}
    <OperationError error={error}/>
    {action === 'support' && <ActionForm open submitLabel="Add support" title={`Add support to “${step.title}”`} onClose={close}
      fields={supportFields({snapshot, owner, existing, tracked, self})} onSubmit={v => {const [operation, input] = supportOperation(v, step);return run(operation, input);}}/>}
    {action === 'rename' && <ActionForm open submitLabel="Rename step" onClose={close} fields={[{name: 'title', label: 'Step title', required: true, value: step.title}]}
      onSubmit={v => run('flow.step.update', {step: step.id, title: v.title})}/>}
    {action === 'next' && <ActionForm open submitLabel="Add the next step" onClose={close} fields={[
      {name: 'to', label: 'Next step', type: 'select', options: [{value: '', label: 'A new step'}, ...stepOptions], value: ''},
      {name: 'title', label: 'Title of the new step', required: true, hidden: v => Boolean(v.to)},
      {name: 'condition', label: 'When (optional)', placeholder: 'The condition for this path'},
    ]} onSubmit={async v => {
      const condition = v.condition.trim();
      if (v.to) return run('flow.transition.set', {from: step.id, to: v.to, ...(condition ? {condition} : {})});
      const response = await run('flow.step.add', {title: v.title, after: step.id, position: index + 1});
      if (condition && response.result?.step) await run('flow.transition.set', {from: step.id, to: response.result.step, condition});
    }}/>}
  </div>;
}

export default function FlowPage({page}) {
  const {snapshot, root, worktreePath, epoch, go} = useShell(), edit = useEdit();
  const artifact = snapshot.artifacts.find(a => a.id === page.artifact);
  const entry = artifact && artifactDocuments(artifact).flows.find(f => f.flow === page.flow);
  const doc = useDocument(entry && !entry.removed ? entry.file : null, artifact ? {artifact: artifact.id} : null);
  const detail = useFlowDetail({root, worktreePath, epoch, flow: page.flow});
  const [view, setView] = useState('steps'), [open, setOpen] = useState(null), [action, setAction] = useState(null), [editing, setEditing] = useState(null), [digest, setDigest] = useState(null);
  useEffect(() => {let live = true;if (doc.ready) sha256(doc.markdown).then(d => {if (live) setDigest(d);});return () => {live = false;};}, [doc.markdown, doc.ready]);

  const front = frontValue(doc.markdown).flow;
  const valid = front && typeof front === 'object' && !Array.isArray(front);
  const flow = valid ? front : detail.data?.flow || null;
  const writable = Boolean(edit.editable && artifact?.layout === 'in-place' && entry?.source === 'working'), editable = writable && Boolean(valid);
  const tracked = useTrackedFiles({root, worktreePath, enabled: editable && action === 'support'});
  const resolved = useMemo(() => new Map(list(detail.data?.flow?.support).map(s => [s.id, s.resolved])), [detail.data]);
  // The diagram comes from the document itself, so it draws before the detail reply arrives and
  // does not redraw when the reply lands; the detail adds resolution and sources for the step view.
  const diagram = useMemo(() => {
    const front = frontValue(doc.markdown).flow, source = front && typeof front === 'object' && !Array.isArray(front) ? front : detail.data?.flow;
    return source ? flowDiagram(source) : null;
  }, [doc.markdown, valid ? null : detail.data]);

  const title = flow?.title || entry?.title || page.flow;
  const eyebrow = <>{artifact ? <button className="link" onClick={() => go({kind: 'artifact', artifact: artifact.id, section: 'flows'})}>{artifact.title}</button> : page.artifact} / Flows</>;
  const header = <PageHeader eyebrow={eyebrow} title={title} action={flow && <div className="segmented" role="group" aria-label="Flow view">
    <button aria-pressed={view === 'steps'} onClick={() => setView('steps')}>Steps</button>
    <button aria-pressed={view === 'diagram'} onClick={() => setView('diagram')}>Diagram</button>
  </div>}/>;
  if (!entry) return <section className="page flow-page" aria-label="Flow page"><div className="column">{header}<p className="muted">This flow is not in the selected worktree.</p></div></section>;
  if (!flow) return <section className="page flow-page" aria-label="Flow page"><div className="column">{header}
    {doc.status === 'error' || detail.status === 'error' ? <Notice tone="error">{doc.error || detail.error}</Notice> : <p className="muted" role="status">Reading the flow…</p>}
  </div></section>;

  const base = {artifact: artifact.id, flow: flow.id};
  const run = (operation, input) => edit.run(operation, {...base, ...input});
  const steps = list(flow.steps), support = list(flow.support), transitions = list(flow.transitions), gaps = list(flow.gaps), exclusions = list(flow.exclusions);
  const position = id => steps.findIndex(s => s.id === id);
  const toggle = id => {setOpen(current => current === id ? null : id);setAction(null);};
  const counts = step => {
    const items = list(step.supports).map(id => support.find(s => s.id === id)).filter(Boolean);
    const n = group => items.filter(s => supportGroup(s) === group).length;
    return [n('knowledge') && `${n('knowledge')} knowledge`, n('code') && `${n('code')} code`, n('tests') && plural(n('tests'), 'test', 'tests')].filter(Boolean);
  };
  // Outgoing paths, except the plain path to the next step in the list.
  const paths = (step, i) => transitions.filter(t => t.from === step.id && !(position(t.to) === i + 1 && !t.condition)).map(t => {
    const to = position(t.to), target = steps[to];
    return {key: `${t.to}`, back: to >= 0 && to <= i, label: target ? `${to + 1} ${shortTitle(target.title)}` : t.to, condition: t.condition};
  });
  const box = (key, label, value) => editing === key
    ? <div className="flow-box editing"><TextEditor label={label} value={value || ''} onSave={text => run('flow.meta.set', {[key]: text})} onClose={() => setEditing(null)}/></div>
    // One editor at a time: a running save cannot close another editor and lose its text.
    : editable && !editing ? <button className="unstyled flow-box" aria-label={`Edit ${label}`} onClick={() => setEditing(key)}><span className="flow-box-label">{label}</span>{value}</button>
      : <div className="flow-box"><span className="flow-box-label">{label}</span>{value}</div>;
  const listEditor = (key, label, items) => <TextEditor label={`${label}, one per line`} value={items.join('\n')} rows={4} onSave={text => run('flow.meta.set', {[key]: lines(text)})} onClose={() => setEditing(null)}/>;
  const participants = list(flow.participants), interactions = steps.flatMap(s => list(s.interactions).map((x, i) => ({step: s, x, i}))), models = list(detail.data?.models);

  return <section className="page flow-page" aria-label="Flow page"><div className="column">
    {header}
    {!valid && doc.ready && <Notice tone="warning">The flow front matter cannot be read. Correct it in Model, below.</Notice>}
    <div className="flow-boxes">
      {box('trigger', 'Starts when', flow.trigger)}
      {box('outcome', 'Ends with', flow.outcome)}
    </div>

    {view === 'diagram' ? <div className="flow-diagram">
      {detail.status === 'error' && <Notice tone="warning">{detail.error}</Notice>}
      <GraphPanel label="Flow diagram" nodes={diagram?.nodes || []} edges={diagram?.edges || []} nodeTypes={flowNodeTypes} labelled flowKey={`${page.flow}:${epoch}`}
        message={!diagram ? 'Reading the diagram…' : diagram.nodes.length ? null : 'This flow has no steps.'}
        onNodeClick={(_, node) => {const step = steps.find(s => String(s.id) === node.id);if (step) {setView('steps');setOpen(step.id);setAction(null);}}}
        legend={<><span><i/>Transition</span><span>Select a step to open it.</span></>}/>
    </div> : <Section title="Steps" summary={steps.length} actions={editable && <span className="muted small">Select a step to edit it.</span>}>
      <ol className="flow-steps">
        {steps.map((step, i) => {const expanded = open === step.id, meta = counts(step), out = paths(step, i);return <li key={step.id} className={`flow-step ${expanded ? 'open' : ''}`}>
          <span className="step-number" aria-hidden="true">{i + 1}</span>
          <div className="step-card">
            <button className="unstyled step-head" aria-expanded={expanded} onClick={() => toggle(step.id)}>
              <span className="sr-only">Step {i + 1}: </span><span className="step-title">{step.title}</span>
              <span className="step-meta">{meta.length ? meta.map(m => <span key={m}>{m}</span>) : <span>No support</span>}</span>
              {out.length > 0 && <span className="step-paths">{out.map(p => <span key={p.key}>{p.back ? '↩' : '→'} <b>{p.label}</b>{p.condition ? ` when ${sentence(p.condition)}.` : ''}</span>)}</span>}
            </button>
            {expanded && <StepDetail step={step} index={i} steps={steps} support={support} resolved={resolved} editable={editable} run={run} snapshot={snapshot}
              owner={artifact.id} self={page.flow} go={go} tracked={tracked} action={action} onAction={setAction} sources={detail.data?.sources} flowId={detail.data?.flow?.id}/>}
          </div>
        </li>;})}
      </ol>
      {editable && <div className="add-step"><ActionForm label="+ Add step" opener="add-row" submitLabel="Add step" fields={[
        {name: 'title', label: 'Step title', required: true, placeholder: 'What happens in this step'},
        {name: 'after', label: 'Comes after', type: 'select', options: [...steps.map((s, i) => ({value: s.id, label: `${i + 1}. ${s.title}`})), {value: '', label: 'No previous step'}], value: steps.at(-1)?.id || ''},
      ]} onSubmit={v => run('flow.step.add', {title: v.title, ...(v.after ? {after: v.after, position: position(v.after) + 1} : {})})}/></div>}
    </Section>}

    <Section title="Gaps" summary={gaps.length} actions={editable && !editing && <button className="quiet" aria-label="Edit gaps" onClick={() => setEditing('gaps')}>Edit</button>}>
      {editing === 'gaps' ? listEditor('gaps', 'Gaps', gaps) : gaps.length ? gaps.map((g, i) => <p key={i} className="flow-gap">{g}</p>) : <p className="muted">No gaps are recorded.</p>}
    </Section>
    <Section title="Exclusions" summary={exclusions.length} actions={editable && !editing && <button className="quiet" aria-label="Edit exclusions" onClick={() => setEditing('exclusions')}>Edit</button>}>
      {editing === 'exclusions' ? listEditor('exclusions', 'Exclusions', exclusions) : exclusions.length ? <ul className="flow-exclusions">{exclusions.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="muted">No exclusions are recorded.</p>}
    </Section>

    <details className="flow-model section">
      <summary>Model</summary>
      {participants.length || interactions.length || models.length ? <>
        {participants.length > 0 && <><h3>Participants</h3><ul>{participants.map(p => <li key={p.id}><b>{p.id}</b> · {models.find(m => m.participants?.some(x => x.id === p.id))?.title || `${p.artifact}:${p.model}`}{p.requires ? ` — ${p.requires}` : ''}</li>)}</ul></>}
        {interactions.length > 0 && <><h3>Interactions</h3><ul>{interactions.map(({step, x, i}) => <li key={`${step.id}:${i}`}><b>{step.title}:</b> {x.from} → {x.to}: {x.action}{x.outcome ? ` — ${x.outcome}` : ''}</li>)}</ul></>}
      </> : <p className="muted">No models, participants or interactions are documented for this flow.</p>}
      {writable && digest && <FrontMatterEditor key={digest} text={splitFront(doc.markdown).front ?? ''}
        onSave={text => edit.run('document.properties.set', {path: entry.file, frontMatter: text}, {expected: {[entry.file]: digest}})}/>}
    </details>
  </div></section>;
}
