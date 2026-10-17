// Derived work labels for the shell. Labels state what the evidence shows; they
// never infer approval or a running agent.
import {matchesName} from './SearchField.jsx';
import {elementType} from './elements.js';
import {sinceMain} from './Relationships.jsx';
import {completionLabel} from './UnitsOfWork.jsx';

const HINTS = {
  Requirement: 'Write the requirement and record its self-check.',
  Specification: 'Write the specification and record its self-check.',
  Plan: 'Add tasks and record the plan self-check.',
  Implementation: 'Complete the Definition of Done items.',
  Validation: 'Record validation evidence for the tasks.',
  'Version preparation': 'Prepare the version record.',
};
export const changeKey = (worktreePath, artifact, change) => JSON.stringify([worktreePath, artifact, change]);
export const unitKeyFor = (worktreePath, unit) => JSON.stringify([worktreePath, unit]);
export const selectedWorktree = snapshot => snapshot?.workflow?.worktrees.find(w => w.path === snapshot.repository.path) || snapshot?.workflow?.worktrees.find(w => w.selected) || null;
export const currentChanges = worktree => (worktree?.changes || []).filter(c => !c.history);
export function phase(change) {
  if (!change) return {chip: null, hint: ''};
  if (change.loadState === 'not-loaded') return change.layout === 'in-place' ? {chip: 'Loading', hint: 'Reading declared evidence…', loading: true} : {chip: null, hint: 'Open the change to read its phase evidence.', loading: true};
  if (change.currentStep) return {chip: change.currentStep, hint: HINTS[change.currentStep] || ''};
  if (change.layout === 'in-place' && change.steps?.every(s => s.state === 'documented-complete')) return {chip: 'Team review', hint: 'Open a pull request for team review and merge.'};
  return {chip: 'Unknown step', hint: change.inferenceReason || 'No current step can be derived from the evidence.'};
}
export const memberUnit = (worktree, artifact, change) => (worktree?.unitsOfWork || []).find(u => u.members.some(m => m.artifact === artifact && m.change === change)) || null;
export const currentUnits = worktree => (worktree?.unitsOfWork || []).filter(u => u.members.some(m => currentChanges(worktree).some(c => c.artifact === m.artifact && c.name === m.change)));
export const unitStatus = unit => unit.completion?.derivation && unit.completion.derivation !== 'not-loaded' ? completionLabel(unit.completion) : null;
const KINDS = [['requirements', 'Requirements'], ['specifications', 'Specifications'], ['decisions', 'Decisions']];
export const isFlow = element => /^specifications\/flows\/.+\.md$/.test(element.path);
const flowId = path => path.split('/').at(-1).replace(/\.md$/, '');
const natural = new Intl.Collator('en', {numeric: true});
// Working documents of one artifact by kind, plus removed paths with a pill.
export function artifactDocuments(artifact) {
  const source = artifact.layout === 'in-place' ? 'working' : artifact.currentVersion ? `version:${artifact.currentVersion}` : artifact.activeChange ? `change:${artifact.activeChange}` : null;
  const current = artifact.elements.filter(e => e.source === source);
  const removed = (artifact.removedKnowledge || []).map(file => ({file, path: file.slice(`docs/artifacts/${artifact.id}/`.length), state: 'removed', removed: true}));
  const groups = KINDS.map(([kind, label]) => ({kind, label, documents: [...current, ...removed].filter(e => elementType(e) === kind && !isFlow(e)).sort((a, b) => Number(b.path === `${kind}/README.md`) - Number(a.path === `${kind}/README.md`) || natural.compare(a.path, b.path))}));
  const flows = current.filter(isFlow).map(e => ({...e, flow: `${artifact.id}:${flowId(e.path)}`}));
  return {source, groups, flows};
}
const title = path => path.split('/').at(-1);
// Flat tree rows with levels; filtering keeps matches and their ancestors open.
export function treeRows({snapshot, worktree, filter = '', expanded, editable = false}) {
  if (!snapshot) return [];
  const rows = [], active = Boolean(filter.trim());
  const open = key => active || expanded.has(key);
  const group = (key, label, count, children) => {
    const kids = children();
    if (active && !kids.length) return;
    rows.push({key, level: 1, label, count, expandable: true, open: open(key)});
    if (open(key)) rows.push(...kids);
  };
  const leaf = (row, ...fields) => !active || matchesName(filter, row.label, ...fields) ? [row] : [];
  const changes = currentChanges(worktree), units = currentUnits(worktree);
  const actions = rows => active || !editable ? [] : rows;
  group('g:work', 'Current work', changes.length + units.length, () => [
    ...actions([{key: 'w:start', level: 2, label: 'Start a change', action: true, page: {kind: 'work', add: 'change'}}, {key: 'w:unit', level: 2, label: 'New unit', action: true, page: {kind: 'work', add: 'unit'}}]),
    ...changes.flatMap(c => {const p = phase(c);return leaf({key: `c:${c.artifact}/${c.name}`, level: 2, label: `${c.artifact} / ${c.name}`, chip: p.chip, hint: p.hint, page: {kind: 'change', artifact: c.artifact, change: c.name}}, c.artifact, c.name);}),
    ...units.flatMap(u => leaf({key: `w:${u.id}`, level: 2, label: u.title, detail: unitStatus(u) || `${u.members.length} ${u.members.length === 1 ? 'change' : 'changes'}`, page: {kind: 'unit', unit: u.id}}, u.id)),
  ]);
  group('g:artifacts', 'Artifacts', snapshot.artifacts.length, () => [...leaf({key: 'graph', level: 2, label: 'Dependency graph', action: true, page: {kind: 'graph'}}), ...leaf({key: 'flows', level: 2, label: 'System flows', action: true, page: {kind: 'flow'}}), ...snapshot.artifacts.flatMap(a => {
    const docs = artifactDocuments(a), key = `a:${a.id}`, children = [];
    const kind = (k, label, items) => {
      const ck = `${key}:${k}`, inner = items();
      if (active && !inner.length) return;
      children.push({key: ck, level: 3, label, count: inner.length, expandable: true, open: open(ck)});
      if (open(ck)) children.push(...inner);
    };
    children.push(...leaf({key: `${key}:overview`, level: 3, label: 'Overview', page: {kind: 'artifact', artifact: a.id}}, a.id, a.title));
    const add = (k, label) => a.layout === 'in-place' ? actions([{key: `${key}:add-${k}`, level: 4, label, action: true, page: {kind: 'artifact', artifact: a.id, add: k}}]) : [];
    for (const g of docs.groups) kind(g.kind, g.label, () => [...g.documents.flatMap(d => leaf({key: `d:${d.file}`, level: 4, label: title(d.path), pill: sinceMain(d.state), page: {kind: 'document', artifact: a.id, source: d.file, title: d.path, established: d.removed || undefined}}, d.path)), ...add(g.kind.slice(0, -1), `Add ${g.kind.slice(0, -1)}`)]);
    kind('flows', 'Flows', () => [...docs.flows.flatMap(f => leaf({key: `f:${f.flow}`, level: 4, label: title(f.path), pill: sinceMain(f.state), page: {kind: 'flow', artifact: a.id, flow: f.flow}}, f.flow, f.path)),
      ...(active ? [] : [{key: `${key}:discover`, level: 4, label: 'Discover behavior', action: true, page: {kind: 'flow', artifact: a.id, discover: true}}]), ...add('flow', 'Add flow')]);
    const history = (worktree?.changes || []).filter(c => c.artifact === a.id && c.history);
    if (history.length) kind('history', 'Delivery history', () => history.flatMap(c => leaf({key: `h:${a.id}/${c.name}`, level: 4, label: c.name, detail: c.version ? `Version ${c.version}` : null, page: {kind: 'change', artifact: a.id, change: c.name}}, c.name)));
    const self = !active || matchesName(filter, a.id, a.title);
    if (active && !self && !children.length) return [];
    // A matching artifact keeps its overview row; its kinds stay filtered.
    const visible = active && self && !children.length ? [{key: `${key}:overview`, level: 3, label: 'Overview', page: {kind: 'artifact', artifact: a.id}}] : children;
    return [{key, level: 2, label: a.title, detail: a.id, expandable: true, open: open(key), page: {kind: 'artifact', artifact: a.id}}, ...(open(key) ? visible : [])];
  })]);
  group('g:units', 'Units of work', worktree?.unitsOfWork?.length || 0, () => (worktree?.unitsOfWork || []).flatMap(u => leaf({key: `u:${u.id}`, level: 2, label: u.title, detail: unitStatus(u) || `${u.members.length} ${u.members.length === 1 ? 'change' : 'changes'}`, page: {kind: 'unit', unit: u.id}}, u.id)));
  return rows;
}
// Page identity used for the selected tree row.
export function samePage(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  return ['artifact', 'change', 'unit', 'source', 'flow'].every(k => (a[k] ?? null) === (b[k] ?? null)) && Boolean(a.discover) === Boolean(b.discover) && Boolean(a.established) === Boolean(b.established) && JSON.stringify(a.scope ?? null) === JSON.stringify(b.scope ?? null) && JSON.stringify(a.ids ?? null) === JSON.stringify(b.ids ?? null);
}
