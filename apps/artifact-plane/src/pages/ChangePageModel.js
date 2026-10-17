// Derived facts of the change page: task numbers and states, readiness,
// missing self-checks, changed knowledge and the task canvas layout.
import dagre from '@dagrejs/dagre';
import {prerequisiteView} from '../prerequisite-view.js';
import {artifactDocuments} from '../work-model.js';

// The short task number comes from the file name prefix (01-read-titles.md).
export const taskNumber = (task, index) => task.path.split('/').at(-1).match(/^(\d+)-/)?.[1] || String(index + 1).padStart(2, '0');
export const taskState = task => task.checked > 0 && task.unchecked === 0 ? 'done' : task.checked > 0 ? 'doing' : 'todo';
export const TASK_STATES = {done: 'Done', doing: 'In progress', todo: 'Not started'};

// Prerequisite numbers; three or more consecutive numbers become "03 to 07".
export function afterLabel(task, numbers) {
  const list = task.dependsOn.map(id => numbers.get(id) || id);
  const values = list.map(Number);
  if (list.length < 3 || values.some(Number.isNaN)) return list.join(', ');
  const sorted = list.map((label, i) => [values[i], label]).sort((a, b) => a[0] - b[0]), parts = [];
  for (let i = 0; i < sorted.length;) {
    let end = i;
    while (end + 1 < sorted.length && sorted[end + 1][0] === sorted[end][0] + 1) end++;
    if (end - i >= 2) parts.push(`${sorted[i][1]} to ${sorted[end][1]}`);
    else for (let k = i; k <= end; k++) parts.push(sorted[k][1]);
    i = end + 1;
  }
  return parts.join(', ');
}

const stepOf = (change, name) => change.steps?.find(s => s.name === name);
// Documents of the current Requirement or Specification phase that have no self-check.
export function missingSelfChecks(change, artifact, phase) {
  if (!artifact || !['Requirement', 'Specification'].includes(phase)) return [];
  const recorded = new Set((stepOf(change, phase)?.evidence || []).map(e => e.file));
  return artifact.elements.filter(e => e.source === 'working' && ['added', 'modified'].includes(e.state))
    .filter(e => (phase === 'Requirement') === e.path.startsWith('requirements/'))
    .filter(e => !recorded.has(e.file));
}
export const planSelfCheckMissing = change => (change.taskGraph?.tasks?.length || 0) > 0 && !(stepOf(change, 'Plan')?.evidence || []).length;

// The 1.16.0 readiness items. fix names the place that fixes an unmet item.
export function readiness(change, diagnostics, editable) {
  const graph = change.taskGraph, tasks = graph?.tasks || [], step = name => stepOf(change, name)?.state;
  const open = tasks.reduce((sum, t) => sum + t.unchecked, 0);
  return [
    {key: 'plan', label: 'The plan is valid and has tasks', met: graph?.state === 'available' && tasks.length > 0, fix: 'plan'},
    {key: 'selfchecks', label: 'Requirement, specification and plan self-checks are recorded', met: ['Requirement', 'Specification', 'Plan'].every(name => step(name) === 'documented-complete'), fix: 'phases'},
    {key: 'diagnostics', label: 'No error diagnostics', met: !diagnostics.length, fix: 'diagnostics', detail: diagnostics.length ? `${diagnostics.length} open` : ''},
    {key: 'dod', label: 'All Definition of Done items are checked', met: tasks.length > 0 && tasks.every(t => t.checked > 0 && t.unchecked === 0), fix: 'plan', detail: open ? `${open} open` : ''},
    {key: 'branch', label: 'The branch is not protected', met: editable, fix: 'branch'},
  ];
}

// Knowledge of the artifact that differs from main, by title.
const SINGULAR = {requirements: 'requirement', specifications: 'specification', decisions: 'decision'};
export function changedKnowledge(artifact) {
  if (!artifact) return [];
  const docs = artifactDocuments(artifact);
  return [...docs.groups.flatMap(g => g.documents.map(d => ({...d, kind: SINGULAR[g.kind]}))), ...docs.flows.map(d => ({...d, kind: 'flow'}))]
    .filter(d => ['added', 'modified', 'removed'].includes(d.state));
}

// The task canvas: light nodes laid out left to right by prerequisites.
const WIDTH = 200, HEIGHT = 64;
export function taskGraphLayout(change, numbers) {
  const graph = change.taskGraph, tasks = graph?.tasks || [];
  const nodes = tasks.map(task => ({id: task.path, type: 'task', data: {task, number: numbers.get(task.id) || ''}, position: {x: 0, y: 0}, style: {width: WIDTH, height: HEIGHT}, initialWidth: WIDTH, initialHeight: HEIGHT}));
  const byId = new Map(tasks.filter(t => t.id).map(t => [t.id, t.path]));
  const edges = graph?.state === 'available' ? prerequisiteView(graph.edges).filter(e => byId.has(e.source) && byId.has(e.target)).map(e => ({
    id: `${e.source}->${e.target}`, source: byId.get(e.source), target: byId.get(e.target), type: 'smoothstep',
    markerEnd: {type: 'arrowclosed', color: '#8a8f96'}, style: {stroke: '#8a8f96', strokeWidth: 1.5},
  })) : [];
  const layout = new dagre.graphlib.Graph().setGraph({rankdir: 'LR', ranksep: 48, nodesep: 20}).setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => layout.setNode(n.id, {width: WIDTH, height: HEIGHT}));
  edges.forEach(e => layout.setEdge(e.source, e.target));
  dagre.layout(layout);
  nodes.forEach(n => {const p = layout.node(n.id);n.position = {x: p.x - WIDTH / 2, y: p.y - HEIGHT / 2};});
  return {nodes, edges};
}
