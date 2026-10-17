// Derived work labels for the shell and pages. Labels state what the evidence
// shows; they never infer approval or a running agent.
import {matchesName} from './SearchField.jsx';
import {elementType} from './elements.js';

export const changeKey = (worktreePath, artifact, change) => JSON.stringify([worktreePath, artifact, change]);
export const unitKeyFor = (worktreePath, unit) => JSON.stringify([worktreePath, unit]);
export const selectedWorktree = snapshot => snapshot?.workflow?.worktrees.find(w => w.path === snapshot.repository.path) || snapshot?.workflow?.worktrees.find(w => w.selected) || null;
export const currentChanges = worktree => (worktree?.changes || []).filter(c => !c.history);
export const memberUnit = (worktree, artifact, change) => (worktree?.unitsOfWork || []).find(u => u.members.some(m => m.artifact === artifact && m.change === change)) || null;
export const currentUnits = worktree => (worktree?.unitsOfWork || []).filter(u => u.members.some(m => currentChanges(worktree).some(c => c.artifact === m.artifact && c.name === m.change)));
export const completionLabel = completion => !completion || completion.derivation === 'not-loaded' ? 'Completion not loaded' : completion.derivation === 'documented-complete' ? 'Complete' : completion.derivation === 'incomplete' ? 'Incomplete' : 'Unknown';
export const unitStatus = unit => unit.completion?.derivation && unit.completion.derivation !== 'not-loaded' ? completionLabel(unit.completion) : null;
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
// {state: 'loading'|'open'|'review'|'closed', current: index or null, steps, hint}
export function phaseModel(change) {
  if (!change) return {state: 'closed', current: null, steps: PHASES.map(name => ({name, state: 'todo'})), hint: ''};
  if (change.loadState === 'not-loaded') return {state: 'loading', current: null, steps: PHASES.map(name => ({name, state: 'todo'})), hint: 'Reading declared evidence…'};
  const sources = Object.fromEntries((change.steps || []).filter(s => s.state === 'documented-complete').map(s => [DISPLAY[s.name], s.evidence?.find(e => e.file)?.file || null]));
  if (change.history || change.version) return {state: 'closed', current: null, steps: PHASES.map((name, i) => ({name, state: 'done', source: sources[i] || null})), hint: ''};
  if (change.currentStep && DISPLAY[change.currentStep] !== undefined) {
    const current = DISPLAY[change.currentStep];
    return {state: 'open', current, steps: PHASES.map((name, i) => ({name, state: i < current ? 'done' : i === current ? 'current' : 'todo', source: sources[i] || null})), hint: HINTS[current]};
  }
  if (change.layout === 'in-place' && change.steps?.length && change.steps.every(s => s.state === 'documented-complete'))
    return {state: 'review', current: null, steps: PHASES.map((name, i) => ({name, state: 'done', source: sources[i] || null})), hint: 'open a pull request for team review and merge.'};
  return {state: 'open', current: null, steps: PHASES.map(name => ({name, state: 'todo'})), hint: change.inferenceReason || 'no current phase can be derived from the evidence.'};
}
// The short phase label the sidebar and cards show.
export function phaseLabel(change) {
  const model = phaseModel(change);
  if (model.state === 'loading') return 'Reading…';
  if (model.state === 'review') return 'Team review';
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
// Row: {key, level, label, detail, badge, count, expandable, open, page, kind, matched}
// matched marks rows that match the filter themselves, not only as parents.
export function sidebarRows({snapshot, worktree, filter = '', expanded, history = false}) {
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
    for (const [kind, label, documents] of kinds) {
      const kindKey = `${key}:${kind}`, matching = documents.filter(d => match(d.title, d.path));
      if (active && !matching.length) continue;
      children.push({key: kindKey, level: 1, label, count: documents.length, expandable: true, open: open(kindKey)});
      if (!open(kindKey)) continue;
      const shown = active ? matching : matching.slice(0, 5);
      for (const d of shown) children.push({key: `${kindKey}:${d.path}`, level: 2, matched: true, label: d.title || d.path, badge: badgeOf(d.state), page: kind === 'flows' ? {kind: 'flow', artifact: a.id, flow: d.flow} : d.removed ? null : {kind: 'document', artifact: a.id, source: d.file}});
      if (!active && documents.length > 5) children.push({key: `${kindKey}:all`, level: 2, kind: 'show-all', label: `Show all ${documents.length}`, page: {kind: 'artifact', artifact: a.id, section: kind}});
    }
    if (active && !children.length && !match(a.title, a.id)) continue;
    rows.push({key, level: 0, matched: match(a.title, a.id), label: a.title, expandable: true, open: open(key), page: {kind: 'artifact', artifact: a.id}});
    if (open(key)) rows.push(...children);
  }
  if (history) {
    rows.push({key: 'h:history', kind: 'heading', label: 'History'});
    const delivered = (worktree?.changes || []).filter(c => c.history).sort((a, b) => String(b.lastCommitAt || '').localeCompare(String(a.lastCommitAt || '')) || natural.compare(b.name, a.name));
    for (const c of delivered) if (match(changeTitle(c), c.name, c.artifact))
      rows.push({key: `hc:${c.artifact}/${c.name}`, level: 0, matched: true, label: changeTitle(c), detail: `${artifactTitle(snapshot, c.artifact)}${c.version ? ` · ${c.version}` : ''}`, page: {kind: 'change', artifact: c.artifact, change: c.name}});
    const openUnits = new Set(currentUnits(worktree).map(u => u.id));
    for (const u of worktree?.unitsOfWork || []) if (!openUnits.has(u.id) && match(u.title, u.id))
      rows.push({key: `hu:${u.id}`, level: 0, matched: true, label: u.title, detail: `Unit of work · ${u.members.length} ${u.members.length === 1 ? 'change' : 'changes'}`, page: {kind: 'unit', unit: u.id}});
  }
  return rows;
}

// Page identity used for the selected sidebar row and for leaving unsaved edits.
export function samePage(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  return ['artifact', 'change', 'unit', 'source', 'flow', 'context', 'sourceId'].every(k => (a[k] ?? null) === (b[k] ?? null)) && JSON.stringify(a.scope ?? null) === JSON.stringify(b.scope ?? null);
}
