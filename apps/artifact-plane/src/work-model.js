// Derived work labels for the shell and pages. Labels state what the evidence
// shows; they never infer approval or a running agent.
import {matchesName, normalizeName} from './names.js';
import {elementType} from './elements.js';
import {differenceOf} from './glossary.js';

export const changeKey = (worktreePath, artifact, change) => JSON.stringify([worktreePath, artifact, change]);
export const unitKeyFor = (worktreePath, unit) => JSON.stringify([worktreePath, unit]);
export const selectedWorktree = snapshot => snapshot?.workflow?.worktrees.find(w => w.path === snapshot.repository.path) || snapshot?.workflow?.worktrees.find(w => w.selected) || null;
// Current work: every change that is not delivered, including a change whose
// version record waits on this branch. History holds delivered and retained changes.
export const isCurrent = change => !change.delivered && (!change.history || !!change.version);
export const currentChanges = worktree => (worktree?.changes || []).filter(isCurrent);
export const memberUnit = (worktree, artifact, change) => (worktree?.unitsOfWork || []).find(u => u.members.some(m => m.artifact === artifact && m.change === change)) || null;
export const currentUnits = worktree => (worktree?.unitsOfWork || []).filter(u => u.members.some(m => currentChanges(worktree).some(c => c.artifact === m.artifact && c.name === m.change)));
export const completionLabel = completion => !completion || completion.derivation === 'not-loaded' ? 'Completion not loaded' : completion.derivation === 'documented-complete' ? 'Complete' : completion.derivation === 'incomplete' ? 'Incomplete' : 'Unknown';
export const unitStatus = unit => unit.completion?.derivation && unit.completion.derivation !== 'not-loaded' ? completionLabel(unit.completion) : null;
// Read diagnostics carry no severity; as validate-knowledge does, every one is
// an error except declared info and warnings and flow evidence gaps.
export const isError = d => d.severity ? d.severity === 'error' : d.code !== 'flow-evidence-gap';
export const changeTitle = change => change?.title || change?.name || '';
export const artifactTitle = (snapshot, id) => snapshot?.artifacts.find(a => a.id === id)?.title || id;

// Five displayed phases. The declared Validation step counts as Implementation;
// Version preparation is Version.
export const PHASES = ['Requirement', 'Specification', 'Plan', 'Implementation', 'Version'];
const DISPLAY = {Requirement: 0, Specification: 1, Plan: 2, Implementation: 3, Validation: 3, 'Version preparation': 4};
const HINTS = [
  'write the requirement and record its self-check.',
  'write the specification and record its self-check.',
  'add tasks and record the plan self-check.',
  'complete the Definition of Done items and record evidence.',
  'prepare the version record.',
];
const uncheckedItems = change => (change?.tasks || []).reduce((n, t) => n + (t.unchecked || 0), 0);
// {state: 'loading'|'unread'|'open'|'review'|'prepared'|'closed', current: index or null, steps, hint}
// Step states: done, current, todo; with a version, Implementation is
// 'incomplete' while a DoD item is unchecked and Version is 'prepared' until established.
export function phaseModel(change) {
  if (!change) return {state: 'closed', current: null, steps: PHASES.map(name => ({name, state: 'todo'})), hint: ''};
  if (change.loadState === 'not-loaded' && !change.delivered) return change.layout === 'in-place'
    ? {state: 'loading', current: null, steps: PHASES.map(name => ({name, state: 'todo'})), hint: 'Reading declared evidence…'}
    : {state: 'unread', current: null, steps: PHASES.map(name => ({name, state: 'todo'})), hint: 'open the change to read its phase evidence.'};
  const sources = Object.fromEntries((change.steps || []).filter(s => s.state === 'documented-complete').map(s => [DISPLAY[s.name], s.evidence?.find(e => e.file)?.file || null]));
  if (change.version && !change.delivered) {
    const unchecked = uncheckedItems(change) > 0;
    return {state: 'prepared', current: null, steps: PHASES.map((name, i) => ({name, state: i === 4 ? 'prepared' : i === 3 && unchecked ? 'incomplete' : 'done', source: i === 3 && unchecked ? null : sources[i] || null})), hint: changeStatus(change).next};
  }
  if (change.history || change.version || change.delivered) return {state: 'closed', current: null, steps: PHASES.map((name, i) => ({name, state: 'done', source: sources[i] || null})), hint: ''};
  if (change.currentStep && DISPLAY[change.currentStep] !== undefined) {
    const current = DISPLAY[change.currentStep];
    return {state: 'open', current, steps: PHASES.map((name, i) => ({name, state: i < current ? 'done' : i === current ? 'current' : 'todo', source: sources[i] || null})), hint: HINTS[current]};
  }
  if (change.layout === 'in-place' && change.steps?.length && change.steps.every(s => s.state === 'documented-complete'))
    return {state: 'review', current: null, steps: PHASES.map((name, i) => ({name, state: 'done', source: sources[i] || null})), hint: 'open a pull request for team review and merge.'};
  return {state: 'open', current: null, steps: PHASES.map(name => ({name, state: 'todo'})), hint: change.inferenceReason || 'no current phase can be derived from the evidence.'};
}
const sentence = text => text ? text[0].toUpperCase() + text.slice(1) : '';
const status = (name, text, next, action, family) => ({name, text, next, action, family});
// One status of a change (human-guidance specification, Change status).
// context: the worktree or any object with the branch name.
// Returns {name, text, next, action, family}; family is done, waiting, active, problem or neutral.
export function changeStatus(change, context = {}) {
  if (!change) return status('Unknown', 'Unknown', '', null, 'neutral');
  if (change.delivered) return status('Delivered', `Delivered${change.version ? ` ${change.version}` : ''}`, '', null, 'done');
  const branch = context?.branch || null;
  if (change.version) {
    if (change.loadState === 'not-loaded') return status('Reading', 'Reading…', 'Reading declared evidence…', null, 'neutral');
    const n = uncheckedItems(change);
    if (n) return status('Unchecked items', 'Unchecked items', `Check or explain ${n} unchecked DoD ${n === 1 ? 'item' : 'items'} before team review.`, 'Open plan', 'waiting');
    if (change.upstream === 'same') return status('Waiting for merge', 'Waiting for merge', `Team review and the merge of ${branch || 'this branch'} establish version ${change.version}.`, null, 'waiting');
    return status('Ready for team review', 'Ready for team review', `Push ${branch ? `branch ${branch}` : 'this branch'} and open a pull request with the PR description. The Plane never pushes.`, 'Copy PR description', 'waiting');
  }
  if (change.history) return status('Retained', 'Retained change', '', null, 'neutral');
  const model = phaseModel(change);
  if (model.state === 'loading') return status('Reading', 'Reading…', model.hint, null, 'neutral');
  if (model.state === 'unread') return status('In progress', 'Phase not read', sentence(model.hint), 'Continue', 'active');
  if (model.current === 4) return status('Ready for version', 'Ready for version', 'Prepare the version record.', 'Prepare version', 'active');
  return status('In progress', model.current === null ? 'Phase unknown' : PHASES[model.current], sentence(model.hint), 'Continue', 'active');
}
// The short phase label the sidebar and cards show.
export function phaseLabel(change) {
  const model = phaseModel(change);
  if (model.state === 'loading') return 'Reading…';
  if (model.state === 'unread') return 'Phase not read';
  if (model.state === 'review') return 'Team review';
  if (model.state === 'prepared') return changeStatus(change).text;
  if (model.state === 'closed') return change.version ? `Version ${change.version}` : 'Retained';
  return model.current === null ? 'Phase unknown' : PHASES[model.current];
}
// Legacy name kept for pages that still read it.
export function phase(change) {
  const model = phaseModel(change);
  return {chip: phaseLabel(change), hint: model.hint ? model.hint[0].toUpperCase() + model.hint.slice(1) : '', loading: model.state === 'loading'};
}

// Document badges compared with main: New, Changed, Removed; none when equal.
export const BADGES = {added: ['new', 'New'], modified: ['changed', 'Changed'], removed: ['removed', 'Removed']};
export const badgeOf = state => BADGES[state] || null;

export const KINDS = [['requirements', 'Requirements', 'requirement'], ['specifications', 'Specifications', 'specification'], ['decisions', 'Decisions', 'decision']];
export const isFlow = element => /^specifications\/flows\/.+\.md$/.test(element.path);
const flowId = path => path.split('/').at(-1).replace(/\.md$/, '');
const natural = new Intl.Collator('en', {numeric: true});
const byTitle = (a, b) => natural.compare(a.title || a.path, b.title || b.path);
// Working documents of one artifact by kind, plus removed paths, sorted by title.
export function artifactDocuments(artifact) {
  const source = artifact.layout === 'in-place' ? 'working' : artifact.currentVersion ? `version:${artifact.currentVersion}` : artifact.activeChange ? `change:${artifact.activeChange}` : null;
  const current = artifact.elements.filter(e => e.source === source);
  const removed = (artifact.removedKnowledge || []).map(file => {const path = file.slice(`docs/artifacts/${artifact.id}/`.length);return {file, path, title: path.split('/').at(-1).replace(/\.md$/, ''), state: 'removed', removed: true};});
  const groups = KINDS.map(([kind, label, singular]) => ({kind, label, singular, documents: [...current, ...removed].filter(e => elementType(e) === kind && !isFlow(e)).sort((a, b) => Number(b.path === `${kind}/README.md`) - Number(a.path === `${kind}/README.md`) || byTitle(a, b))}));
  const flows = [...current, ...removed].filter(isFlow).map(e => ({...e, flow: `${artifact.id}:${flowId(e.path)}`})).sort(byTitle);
  return {source, groups, flows};
}

// Sidebar rows: a flat list with levels. Filtering keeps matches and their parents.
// Row: {key, level, label, detail, badge (a difference name), count, expandable, open, page, kind, matched}
// matched marks rows that match the filter themselves, not only as parents.
// concepts: the items of the concepts operation. While the filter has text, a
// matching concept is a level-1 row under its artifact, before its kind rows.
export function sidebarRows({snapshot, worktree, filter = '', expanded, history = false, concepts = []}) {
  if (!snapshot) return [];
  const rows = [], active = Boolean(filter.trim()), open = key => active || expanded.has(key);
  const match = (...fields) => !active || matchesName(filter, ...fields);
  const changes = currentChanges(worktree);
  rows.push({key: 'work', level: 0, kind: 'home', label: 'Current work', page: {kind: 'work'}});
  for (const c of changes) if (match(changeTitle(c), c.name, c.artifact))
    rows.push({key: `c:${c.artifact}/${c.name}`, level: 1, matched: true, label: changeTitle(c), detail: `${artifactTitle(snapshot, c.artifact)} · ${phaseLabel(c)}`, page: {kind: 'change', artifact: c.artifact, change: c.name}});
  rows.push({key: 'h:artifacts', kind: 'heading', label: 'Artifacts'});
  for (const a of snapshot.artifacts) {
    const key = `a:${a.id}`, docs = artifactDocuments(a), children = [];
    const kinds = [...docs.groups.map(g => [g.kind, g.label, g.documents]), ['flows', 'Flows', docs.flows]];
    // A removed declaration has no concept page, so it has no row.
    if (active) for (const c of concepts) {
      const model = c.logicalId.slice(a.id.length + 1);
      if (c.artifact === a.id && c.declaration !== 'removed' && match(c.title, model, c.logicalId))
        children.push({key: `${key}:concept:${c.logicalId}`, level: 1, kind: 'concept', matched: true, label: c.title, detail: 'Concept', page: {kind: 'concept', artifact: a.id, model}});
    }
    for (const [kind, label, documents] of kinds) {
      const kindKey = `${key}:${kind}`, matching = documents.filter(d => match(d.title, d.path));
      if (active && !matching.length) continue;
      children.push({key: kindKey, level: 1, label, count: documents.length, expandable: true, open: open(kindKey)});
      if (!open(kindKey)) continue;
      const shown = active ? matching : matching.slice(0, 5);
      for (const d of shown) children.push({key: `${kindKey}:${d.path}`, level: 2, matched: true, label: d.title || d.path, badge: differenceOf(d.state), page: kind === 'flows' ? {kind: 'flow', artifact: a.id, flow: d.flow} : d.removed ? null : {kind: 'document', artifact: a.id, source: d.file}});
      if (!active && documents.length > 5) children.push({key: `${kindKey}:all`, level: 2, kind: 'show-all', label: `Show all ${documents.length}`, page: {kind: 'artifact', artifact: a.id, section: kind}});
    }
    if (active && !children.length && !match(a.title, a.id)) continue;
    rows.push({key, level: 0, matched: match(a.title, a.id), label: a.title, expandable: true, open: open(key), page: {kind: 'artifact', artifact: a.id}});
    if (open(key)) rows.push(...children);
  }
  if (history) {
    rows.push({key: 'h:history', kind: 'heading', label: 'History'});
    const delivered = (worktree?.changes || []).filter(c => !isCurrent(c)).sort((a, b) => String(b.lastCommitAt || '').localeCompare(String(a.lastCommitAt || '')) || natural.compare(b.name, a.name));
    for (const c of delivered) if (match(changeTitle(c), c.name, c.artifact))
      rows.push({key: `hc:${c.artifact}/${c.name}`, level: 0, matched: true, label: changeTitle(c), detail: `${artifactTitle(snapshot, c.artifact)}${c.version ? ` · ${c.version}${c.delivered ? ' established' : ''}` : ''}`, page: {kind: 'change', artifact: c.artifact, change: c.name}});
    const openUnits = new Set(currentUnits(worktree).map(u => u.id));
    for (const u of worktree?.unitsOfWork || []) if (!openUnits.has(u.id) && match(u.title, u.id))
      rows.push({key: `hu:${u.id}`, level: 0, matched: true, label: u.title, detail: `Unit of work · ${u.members.length} ${u.members.length === 1 ? 'change' : 'changes'}`, page: {kind: 'unit', unit: u.id}});
  }
  return rows;
}

// The row that Enter in the search box opens: the concept whose title equals
// the filter, ignoring case and outer spaces (claim sidebar-enter-exact-concept);
// otherwise the 1.24.0 rule, the first row with a page that matches itself in tree order.
export function enterRow(rows, filter) {
  const query = normalizeName(filter);
  return rows.find(r => r.kind === 'concept' && r.page && normalizeName(r.label) === query) || rows.find(r => r.page && r.matched);
}

// Page identity used for the selected sidebar row and for leaving unsaved edits.
export function samePage(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  return ['artifact', 'change', 'unit', 'source', 'flow', 'context', 'sourceId', 'model'].every(k => (a[k] ?? null) === (b[k] ?? null)) && JSON.stringify(a.scope ?? null) === JSON.stringify(b.scope ?? null);
}
