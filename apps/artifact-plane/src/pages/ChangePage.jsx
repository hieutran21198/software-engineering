// The change page: header with the change's parents, phase steps, the change brief, the plan,
// the changed knowledge, the version readiness and the PR description. A retained change is read
// only and shows its delivery instead of readiness.
import React, {useCallback, useEffect, useState} from 'react';
import {useQuery, useShell} from '../page-data.js';
import {Icon, PageHeader, PhaseSteps, StatusCard} from '../ui.jsx';
import {ActionForm, useEdit} from '../editing.jsx';
import {changeStatus, changeTitle, isError, memberUnit, phaseModel, PHASES} from '../work-model.js';
import {copyPrDescription, SectionLinks, StatusText, statusMember, termOnce, VersionLabel} from './guidance.jsx';
import PlanSection, {detailField, resultField} from './ChangePagePlan.jsx';
import {ChangedKnowledge, DeliverySection, ReadySection, useReviewPacket} from './ChangePageReview.jsx';
import {missingSelfChecks, planSelfCheckMissing, readiness} from './ChangePageModel.js';
import ChangeBrief from './ChangePageBrief.jsx';
import PrDescription from './ChangePageDescription.jsx';
import './ChangePage.css';

// Record self-check for the documents of the current Requirement or Specification phase.
function SelfCheckLine({change, artifact, phase}) {
  const edit = useEdit(), [open, setOpen] = useState(false);
  const docs = missingSelfChecks(change, artifact, phase);
  if (!docs.length) return null;
  const noun = phase === 'Requirement' ? 'requirement' : 'specification';
  return <div className="selfcheck-line" id="change-selfcheck">
    {open ? <ActionForm open submitLabel="Record self-check" title={`${phase} self-check`} onClose={() => setOpen(false)} fields={[
      {name: 'path', label: 'Document', type: 'select', options: docs.map(d => ({value: d.file, label: d.title})), value: docs[0].file},
      resultField, detailField('The content is complete and agrees with its governing knowledge.'),
    ]} onSubmit={v => edit.run('selfcheck.record', {path: v.path, result: v.result, detail: v.detail})}/> : <>
      <span className="small muted">{docs.length === 1 ? `“${docs[0].title}” has no self-check.` : `${docs.length} ${noun} documents of this change have no self-check.`}</span>
      <button className="quiet" onClick={() => setOpen(true)}>{Icon.check}Record self-check</button>
    </>}
  </div>;
}

const unitsToJoin = (worktree, change) => (worktree?.unitsOfWork || []).filter(u => !u.members.some(m => m.artifact === change.artifact));
function UnitEyebrow({change, writable, adding, onAdd}) {
  const {worktree, go} = useShell();
  const unit = memberUnit(worktree, change.artifact, change.name);
  if (unit) return <>unit <button className="link" onClick={() => go({kind: 'unit', unit: unit.id})}>{unit.title}</button></>;
  return writable && !adding && unitsToJoin(worktree, change).length ? <>No unit · <button className="link" onClick={onAdd}>Add to unit</button></> : <>No unit</>;
}

// The status card under the title (specifications/human-guidance.md, Status card):
// the status, the next step, the page's only primary button, the branch and the version.
function ChangeStatusCard({change, status, onPlan, onPrepare, canPrepare}) {
  const shell = useShell(), [feedback, setFeedback] = useState('');
  const terms = termOnce(), phase = phaseModel(change).current;
  const action = status.action === 'Copy PR description' ? <button className="primary" onClick={async () => setFeedback(await copyPrDescription(shell, change.artifact, change.name))}>{Icon.copy}Copy PR description</button>
    : status.action === 'Open plan' || status.action === 'Continue' && (phase === 2 || phase === 3) ? <button className="primary" onClick={onPlan}>Open plan</button>
    : status.action === 'Prepare version' && canPrepare ? <button className="primary" onClick={onPrepare}>Prepare version</button> : null;
  const branch = shell.worktree?.branch;
  return <StatusCard status={statusMember(status)} text={<StatusText text={status.text} term={terms}/>} next={status.next} action={action}>
    {branch && <span>Branch <span className="mono">{branch}</span></span>}
    {change.version && <VersionLabel version={change.version} established={Boolean(change.delivered)} term={terms}/>}
    {feedback && <span role="status">{feedback}</span>}
  </StatusCard>;
}

export default function ChangePage({page}) {
  const {snapshot, worktree, go} = useShell(), edit = useEdit();
  const [preparing, setPreparing] = useState(false);
  // The work page opens a section of the change: plan or ready.
  useEffect(() => {
    if (!page.focus) return;
    const frame = requestAnimationFrame(() => {const node = document.getElementById(`change-${page.focus}`);node?.scrollIntoView({block: 'start'});node?.querySelector('button:not(:disabled)')?.focus({preventScroll: true});});
    return () => cancelAnimationFrame(frame);
  }, [page.focus, page.change]);
  const listed = worktree?.changes.find(c => c.artifact === page.artifact && c.name === page.change);
  const workflow = useQuery(listed ? {section: 'workflow', artifact: page.artifact, change: page.change} : null);
  const [reviewWanted, setReviewWanted] = useState(false), [addingUnit, setAddingUnit] = useState(false);
  const review = useReviewPacket(page.artifact, page.change, reviewWanted);
  const loadReview = useCallback(() => setReviewWanted(true), []);
  if (!listed) return <section className="page wide change-page" aria-label="Change page"><div className="column">
    <PageHeader title="Change not found"/><p className="muted">This change is not in the selected worktree.</p>
  </div></section>;
  // The scoped workflow read carries the steps, tasks and task graph.
  const change = workflow.data?.name === listed.name && workflow.data?.artifact === listed.artifact ? {...listed, ...workflow.data, title: listed.title} : listed;
  const artifact = snapshot.artifacts.find(a => a.id === change.artifact);
  const retained = Boolean(change.history);
  const writable = edit.editable && artifact?.layout === 'in-place' && !retained && !change.version;
  const scope = {artifact: change.artifact, change: change.name};
  const readme = `docs/artifacts/${change.artifact}/changes/${change.name}/README.md`;
  const model = phaseModel(change), current = model.current === null ? null : PHASES[model.current];
  const phase = current === 'Specification' || current === 'Requirement' ? current : null;
  const focus = id => {const node = document.getElementById(id);if (!node) return;node.scrollIntoView({behavior: 'smooth', block: 'start'});node.querySelector('button:not(:disabled)')?.focus({preventScroll: true});};
  const status = changeStatus(change, worktree);
  // Ready for version: the status card holds Prepare version, so the readiness section does not repeat it.
  const prefix = `docs/artifacts/${change.artifact}/`;
  const diagnostics = [...snapshot.diagnostics.filter(d => isError(d) && String(d.path).startsWith(prefix)), ...(change.taskGraph?.diagnostics || [])];
  const cardPrepares = status.action === 'Prepare version' && writable && !retained;
  const canPrepare = cardPrepares && readiness(change, diagnostics, edit.editable).every(i => i.met);
  const onFix = target => {
    if (target === 'plan') focus('change-plan');
    else focus(planSelfCheckMissing(change) && !missingSelfChecks(change, artifact, phase).length ? 'change-plan' : 'change-selfcheck');
  };
  return <section className="page wide change-page" aria-label="Change page"><div className="column">
    <PageHeader
      eyebrow={<><button className="link" onClick={() => go({kind: 'artifact', artifact: change.artifact})}>{artifact?.title || change.artifact}</button> · <span className="mono-id">{change.name}</span> · <UnitEyebrow change={change} writable={writable} adding={addingUnit} onAdd={() => setAddingUnit(true)}/></>}
      title={changeTitle(change)}
      action={<button className="link" onClick={() => go({kind: 'document', artifact: change.artifact, source: readme, scope})}>Read reason and scope</button>}/>
    {addingUnit && <ActionForm open className="unit-form" submitLabel="Add to unit" onClose={() => setAddingUnit(false)}
      fields={[{name: 'unit', label: 'Unit of work', type: 'select', options: unitsToJoin(worktree, change).map(u => ({value: u.id, label: u.title})), value: unitsToJoin(worktree, change)[0]?.id}]}
      onSubmit={v => edit.run('unit.member.add', {unit: v.unit, artifact: change.artifact, change: change.name})}/>}
    <PhaseSteps change={change} status={status.text} onOpen={source => go({kind: 'document', artifact: change.artifact, source, scope})}/>
    <ChangeStatusCard change={change} status={status} onPlan={() => focus('change-plan')} canPrepare={canPrepare}
      onPrepare={() => {setPreparing(true);requestAnimationFrame(() => document.getElementById('change-ready')?.scrollIntoView({behavior: 'smooth', block: 'start'}));}}/>
    <SectionLinks sections={[
      artifact?.layout === 'in-place' && ['change-brief', 'Change brief'], retained && ['change-delivery', 'Delivery'], ['change-plan', 'Plan'],
      !retained && ['change-knowledge', 'Changed knowledge'], !retained && ['change-ready', 'Ready for a version'], artifact?.layout === 'in-place' && ['change-description', 'PR description'],
    ]}/>
    {workflow.status === 'error' && !workflow.data && <p className="small" role="alert">{workflow.error} <button className="link" onClick={workflow.retry}>Retry</button></p>}
    {writable && phase && <SelfCheckLine change={change} artifact={artifact} phase={phase}/>}
    {artifact?.layout === 'in-place' && <ChangeBrief artifact={change.artifact} change={change.name} writable={edit.editable && !retained} page={page}/>}
    {retained && <DeliverySection change={change} review={review} onLoadReview={loadReview}/>}
    <PlanSection change={change} writable={writable}/>
    {!retained && <ChangedKnowledge change={change} artifact={artifact} review={review} onLoadReview={loadReview}/>}
    {!retained && <ReadySection change={change} artifact={artifact} writable={writable} onFix={onFix} preparing={preparing} onPreparing={setPreparing} cardPrepares={cardPrepares}/>}
    {artifact?.layout === 'in-place' && <PrDescription artifact={change.artifact} change={change.name}/>}
  </div></section>;
}
