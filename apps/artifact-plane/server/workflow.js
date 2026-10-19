import {evidenceSource} from '../src/delivery-records.js';
import {readUnitsOfWork, deliverySource, publication, frontMatter, safeKnowledgePath, evidenceDetail} from './units-of-work.js';
import { buildTaskGraph } from './task-graph.js';
import { parseArtifact } from "../src/model.js";
import { marked } from "marked";
// Runtime evidence only. No state is stored in the inspected repository.
const phases = ['Requirement', 'Specification', 'Plan', 'Implementation', 'Validation', 'Version preparation'];
const note = (kind, file, explanation) => ({ kind, file, explanation });
const diagnostic = (code, message) => ({ code, path: '', message });
export function parseWorktrees(raw) {
  const entries = []; let entry;
  for (const token of raw.split('\0')) {
    if (token.startsWith('worktree ')) {
      entry = { path: token.slice(9), branch: null, head: null, selected: false, detached: false, locked: false, prunable: false, availability: 'unavailable', changes: [], diagnostics: [] };
      entries.push(entry);
    } else if (entry && token.startsWith('HEAD ')) entry.head = token.slice(5);
    else if (entry && token.startsWith('branch ')) entry.branch = token.slice(7).replace(/^refs\/heads\//, '');
    else if (entry && token === 'detached') entry.detached = true;
    else if (entry && (token === 'locked' || token.startsWith('locked '))) entry.locked = true;
    else if (entry && (token === 'prunable' || token.startsWith('prunable '))) entry.prunable = true;
  }
  return entries;
}
export function checklist(markdown) {
  let checked = 0, unchecked = 0, malformed = false;
  const visit = tokens => { for (const token of tokens || []) {
    if (token.type === 'list') for (const item of token.items) {
      if (item.task) item.checked ? checked++ : unchecked++;
      else if (/^\[[^\]]*\]/.test(item.text)) malformed = true;
      visit(item.tokens);
    }
    else if (token.tokens && token.type !== 'code') visit(token.tokens);
  } };
  visit(marked.lexer(markdown));
  return { checked, unchecked, state: malformed || !checked && !unchecked ? 'unknown' : 'observed' };
}
const prose = text => marked.lexer(text).filter(t => t.type !== 'code').map(t => t.raw).join('\n');
export const explicitCompletion = text => {
  const clean = prose(text), counts = checklist(text);
  const declaration = /^(?:self-check|completion)\s*[:—-]?\s*(?:passed|complete|verified)\.?$/im.test(clean)
    || /^#{1,6}\s+(?:self-check|completion)\s*\n+\s*(?:Passed|Complete|Verified)\.?(?:\s|$)/im.test(clean);
  return declaration || counts.checked > 0 && counts.unchecked === 0 && counts.state !== 'unknown' && validation(clean) && taskEvidence(clean);
};
const validation = text => {
  const clean = prose(text);
  return /\b(?:tests?|checks?|build|suite|validation)\s+(?:passed|passing|verified)\b|\bpassed\s+(?:all|\d+)\s+(?:tests?|checks?)\b/i.test(clean);
};
const taskEvidence = text => { const clean = prose(text); const evidence = clean.split(/^##?\s+Evidence\b/im)[1] || ''; return /(?:implementation|commit|verified|passed|tests?|checks?)/i.test(evidence) && !/Implementation has not started\./i.test(evidence); };
const category = path => path.includes('/requirements/') ? 'Requirement' : /\/(specifications|decisions)\//.test(path) ? 'Specification' : path.includes('/tasks/') ? 'Plan' : null;
function associations(path, text, previous) {
  const result = new Set(); const type = category(path);
  const definition = value => value.split(/^##?\s+(?:Evidence|Validation|Completion)\b/im)[0].replace(/\[[ xX]\]/g, '[ ]');
  if (type && (type !== 'Plan' || definition(text) !== definition(previous))) result.add(type);
  if (path.includes('/tasks/') && text !== previous) {
    const before = checklist(previous), after = checklist(text);
    if (after.checked !== before.checked || taskEvidence(text) && !taskEvidence(previous)) result.add('Implementation');
    if (validation(text) && !validation(previous)) result.add('Validation');
  }
  if (path.includes('/versions/') || /docs\/artifacts\/[^/]+\/README\.md$/.test(path) && text.match(/(?:current_version|Current (?:established )?version)/i)?.[0] && text !== previous) result.add('Version preparation');
  return [...result];
}
function parseHistory(raw) {
  const records = []; let current;
  const parts = raw.split('\0');
  for (let i = 0; i < parts.length; i++) {
    const token = parts[i].replace(/^\n/, '');
    if (/^[a-f0-9]{40,64}$/.test(token)) {
      current = { id: token, subject: parts[++i] || '', time: /^\d+$/.test(parts[i+1] || '') ? Number(parts[++i]) : null, paths: [] }; records.push(current);
    } else if (current && token) current.paths.push(token);
  }
  return records;
}
// Declared evidence for in-place changes: self_check, evidence_records,
// checklists and version records. No history is replayed; approval is not a file fact.
const RESULTS = ['passed', 'failed', 'incomplete'];
function declaredRecord(value, path, files, diagnostics, label) {
  const report = message => diagnostics.push({code: 'invalid-evidence-record', path, message});
  const [source, fragment, extra] = typeof value?.source === 'string' ? value.source.split('#') : [];
  if (!value || typeof value !== 'object' || Array.isArray(value) || !RESULTS.includes(value.result) || !safeKnowledgePath(source) || extra !== undefined || fragment === '') {report(`${label} needs a result (passed, failed or incomplete) and a safe Markdown source.`);return null;}
  const body = files.get(source), detail = body === undefined ? null : evidenceDetail(body, fragment);
  if (!detail) {diagnostics.push({code: 'missing-evidence', path: value.source, message: `${label} source or nonempty details cannot be resolved.`});return null;}
  return {result: value.result, source: value.source};
}
export function declaredChange(artifact, name, files, data, diagnostics) {
  const prefix = `docs/artifacts/${artifact.id}/changes/${name}/`;
  const steps = phases.map(step => ({name: step, state: 'not-declared', evidence: [], commits: [], completionCommit: null}));
  const step = label => steps.find(s => s.name === label);
  const record = (label, value, path) => {
    const s = step(label), checked = declaredRecord(value, path, files, diagnostics, 'self_check');
    if (!checked) return;
    s.evidence.push(note('declared', path, `self_check ${checked.result}; source ${checked.source}.`));
    s.state = checked.result === 'passed' && s.state !== 'declared-incomplete' ? 'documented-complete' : 'declared-incomplete';
  };
  const meta = change => artifact.changes.find(c => c.name === change);
  const version = meta(name)?.version ?? null, open = artifact.activeChange === name;
  // Requirement and Specification evidence lives in the documents this change edits.
  if (open) for (const element of artifact.elements.filter(e => e.source === 'working' && ['added', 'modified'].includes(e.state))) {
    const value = frontMatter(element.markdown).value?.self_check;
    if (value !== undefined) record(element.path.startsWith('requirements/') ? 'Requirement' : 'Specification', value, element.file);
  }
  const plan = frontMatter(files.get(`${prefix}tasks/README.md`)).value?.self_check;
  if (plan !== undefined) record('Plan', plan, `${prefix}tasks/README.md`);
  const taskGraph = buildTaskGraph(files, prefix, checklist, data.unsafeTaskPaths);
  const tasks = taskGraph.tasks.map(task => ({path: task.path, ...checklist(task.body)}));
  if (taskGraph.state === 'available' && tasks.length) {
    const complete = tasks.every(t => t.state === 'observed' && t.checked > 0 && t.unchecked === 0);
    step('Implementation').state = complete ? 'documented-complete' : tasks.some(t => t.checked) ? 'declared-incomplete' : 'not-declared';
    for (const t of tasks) step('Implementation').evidence.push(note('declared', t.path, `${t.checked} of ${t.checked + t.unchecked} DoD items checked.`));
    const records = [];
    for (const t of tasks) {
      const list = frontMatter(files.get(t.path)).value?.evidence_records;
      if (list === undefined) continue;
      if (!Array.isArray(list)) {diagnostics.push({code: 'invalid-evidence-record', path: t.path, message: 'evidence_records must be a list.'});continue;}
      for (const value of list) {const checked = declaredRecord(value && typeof value === 'object' && !Array.isArray(value) ? {...value, source: evidenceSource(value, t.path)} : value, t.path, files, diagnostics, 'evidence_records entry');if (checked) {records.push(checked);step('Validation').evidence.push(note('declared', t.path, `Check ${checked.result}; source ${checked.source}.`));}}
    }
    if (records.length) step('Validation').state = records.every(r => r.result === 'passed') && complete ? 'documented-complete' : 'declared-incomplete';
  }
  if (version) {const s = step('Version preparation');s.state = 'documented-complete';s.evidence.push(note('declared', `docs/artifacts/${artifact.id}/versions/${version}/README.md`, 'Version record names this change.'));}
  const delivered = !!(version && artifact.baseline && data.baselines?.[artifact.id]?.versionRecords?.includes(version));
  const current = steps.find(s => s.state !== 'documented-complete');
  return {artifact: artifact.id, name, layout: 'in-place', version, delivered, declaredActive: open, currentStep: open ? current?.name ?? null : null,
    inferenceReason: open ? 'Derived from declared evidence; undeclared steps are not declared.' : 'Retained change record.',
    steps, tasks, taskGraph, history: !open, lastCommitAt: null,
    historyReason: delivered ? 'Its version record is on the protected ref.' : version ? 'Its version record is proposed on this branch.' : open ? '' : meta(name)?.layout === 'legacy' ? 'Retained legacy change record with copied knowledge.' : 'Another open change record exists.'};
}
// Upstream of the worktree branch from local refs: same, ahead, behind,
// diverged or none. It never fetches, so a stale remote ref stays stale.
export async function upstreamState(root, git) {
  let counts = '';
  try {counts = await git(root, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);} catch {}
  const match = String(counts).trim().match(/^(\d+)\s+(\d+)$/);
  if (!match) return 'none';
  const [ahead, behind] = [Number(match[1]), Number(match[2])];
  return ahead && behind ? 'diverged' : ahead ? 'ahead' : behind ? 'behind' : 'same';
}
export async function evidenceFor(root, data, git, head, diagnostics) {
  const changes = await changeEvidence(root, data, git, head, diagnostics);
  // One upstream read for each worktree, shared by its changes.
  const upstream = changes.length ? await upstreamState(root, git) : 'none';
  for (const change of changes) change.upstream = upstream;
  return changes;
}
async function changeEvidence(root, data, git, head, diagnostics) {
  const { files, snapshot } = data;
  let history = [], dirty = [];
  const changes = [];
  for (const artifact of snapshot.artifacts.filter(a => a.layout === 'in-place')) for (const {name} of artifact.changes) changes.push(declaredChange(artifact, name, files, data, diagnostics));
  // History is replayed only for legacy artifacts.
  if (changes.length && !snapshot.artifacts.some(a => a.layout !== 'in-place' && a.changes.length)) return changes;
  try {
    history = parseHistory(await git(root, ['log', '-201', '--format=%H%x00%s%x00%ct', '-z', '--name-only', '--', 'docs/artifacts'], true));
    if (history.length > 200) { history.length = 200; diagnostics.push(diagnostic('history-limited', 'Only the latest 200 commits touching docs/artifacts are inspected.')); }
    if (await git(root, ['rev-parse', '--is-shallow-repository']) === 'true') diagnostics.push(diagnostic('shallow-history', 'This worktree has shallow Git history. Exact completion evidence may be unavailable.'));
    dirty = (await git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], true)).split('\0').filter(Boolean).map(line => line.slice(3));
  } catch { diagnostics.push(diagnostic('workflow-history-unavailable', 'Git history or working changes could not be read.')); }
  const cache = new Map();
  async function content(revision, path) {
    const key = `${revision}:${path}`;
    if (!cache.has(key)) cache.set(key, git(root, ['show', key], true).catch(() => ''));
    return cache.get(key);
  }
  const completionCache = new Map();
  const complete = text => {if(!completionCache.has(text))completionCache.set(text,explicitCompletion(text));return completionCache.get(text);};
  for (const artifact of snapshot.artifacts.filter(a => a.layout !== 'in-place')) for (const { name } of artifact.changes) {
    const prefix = `docs/artifacts/${artifact.id}/changes/${name}/`;
    const versionPrefix = `docs/artifacts/${artifact.id}/versions/${artifact.currentVersion}/`;
    const owned = [...files].filter(([path]) => path.startsWith(prefix) && category(path));
    const delivery = deliverySource(files, artifact.id, name, prefix, artifact.layout);
    const claim = delivery.claims.length===1 ? delivery.claims[0] : null;
    const changeOwned = claim?.deliveryTasks === 'change' || artifact.layout === 'in-place' && !!claim;
    let delivered = false;
    if (changeOwned && !delivery.diagnostic) {
      const evidence = await publication(root, claim.prefix, files, git, '', null, prefix, artifact.layout);
      delivered = evidence.state === 'established' && buildTaskGraph(files,prefix,checklist,data.unsafeTaskPaths).state==='available';
      if (!delivered) diagnostics.push(diagnostic('delivery-publication-unverified', `${artifact.id}/${name}: ${evidence.reasons.join(' ')}`));
    }
    if (delivery.diagnostic) diagnostics.push(diagnostic(delivery.diagnostic, `${artifact.id}/${name}: retained delivery source cannot be resolved.`));
    const first = [...history].reverse().find(commit => commit.paths.some(path => path.startsWith(prefix)));
    const introduction = first && !await content(`${first.id}^`, `${prefix}README.md`) && first.paths.includes(`${prefix}README.md`) ? first : null;
    const introductionVersion = introduction ? parseArtifact(artifact.id, await content(`${introduction.id}^`, `docs/artifacts/${artifact.id}/README.md`)).currentVersion : null;
    const introductionBaseline = new Map();
    for (const [path] of owned) if (introductionVersion) introductionBaseline.set(path, await content(`${introduction.id}^`, `docs/artifacts/${artifact.id}/versions/${introductionVersion}/${path.slice(prefix.length)}`));
    const distinct = [];
    for (const [path, text] of owned) {
      const baseline = files.get(`${versionPrefix}${path.slice(prefix.length)}`);
      // Introduction copies are a baseline, not completed work in this change.
      const intro = introduction ? await content(introduction.id, path) : undefined;
      if (text !== baseline) distinct.push({ path, text, inherited: intro === text && intro === introductionBaseline.get(path) });
    }
    const completionIds = new Map();
    const steps = phases.map(name => ({ name, state: 'unknown', evidence: [], commits: [], completionCommit: null }));
    const step = name => steps.find(s => s.name === name);
    const tasks = owned.filter(([path]) => path.includes('/tasks/')).map(([path, text]) => ({ path, ...checklist(text), inherited: !distinct.some(file => file.path === path && !file.inherited) }));
    const change = { artifact: artifact.id, name, delivered, declaredActive: artifact.activeChange === name, currentStep: null, inferenceReason: 'No distinguishable ongoing change: current snapshot contains the same knowledge.', steps, tasks, taskGraph: buildTaskGraph(files, prefix, checklist, data.unsafeTaskPaths) };
    changes.push(change);
    const ongoing = !delivered && distinct.length > 0;
    change.history = !ongoing || !!artifact.activeChange && !change.declaredActive;
    change.historyReason = delivered ? 'Originating version and retained tasks match protected-ref delivery evidence.' : !ongoing ? 'Current snapshot contains the same category knowledge.' : change.history ? 'Retained change; the artifact declares another active change. This does not prove completion.' : '';
    const timestamps = history.filter(commit => commit.paths.some(path => path.startsWith(prefix))).map(commit => commit.time).filter(time => Number.isSafeInteger(time) && time >= 0 && time <= 8640000000000);
    change.lastCommitAt = timestamps.length ? Math.max(...timestamps) : null;
    if (ongoing) change.inferenceReason = 'No current phase can be inferred from distinguishable evidence.';
    const versionChecks = new Map();
    // Older copied tasks can remain different from the current snapshot. They are not new progress.
    for (const commit of history) {
      for (const path of commit.paths.filter(path => path.startsWith(prefix) || path.startsWith(versionPrefix) || claim && path.startsWith(claim.prefix) || path === `docs/artifacts/${artifact.id}/README.md`)) {
        const text = await content(commit.id, path);
        const previous = commit === introduction && path.startsWith(prefix) ? (introductionBaseline.get(path) || "") : await content(`${commit.id}^`, path);
        if (text === previous) continue;
        if (!path.startsWith(prefix)) {
          // Version evidence must include this change's knowledge, not an unrelated release.
          const match = path.match(/^(docs\/artifacts\/[^/]+\/versions\/[^/]+\/)/);
          const version = match?.[1] || versionPrefix;
          const checkKey=commit.id+':'+version;
          if(!versionChecks.has(checkKey))versionChecks.set(checkKey,(async()=>{
            const metadata=frontMatter(await content(commit.id,`${version}README.md`));
            const retained=metadata.value?.delivery_tasks==='change'&&metadata.value.source_change===name;
            if(metadata.value?.delivery_tasks!==undefined&&!retained)return false;
            const knowledge=retained?owned.filter(([file])=>category(file)!=='Plan'):owned;
            if(!knowledge.length||!(await Promise.all(knowledge.map(async([file,value])=>await content(commit.id,`${version}${file.slice(prefix.length)}`)===value))).every(Boolean))return false;
            return !retained||(await Promise.all(owned.filter(([file])=>category(file)==='Plan').map(async([file,value])=>await content(commit.id,file)===value))).every(Boolean);
          })());
          if(!await versionChecks.get(checkKey))continue;
        }
        for (const phase of associations(path, text, previous)) {
          const s = step(phase);
          if (!s.commits.some(c => c.id === commit.id)) s.commits.push({ id: commit.id, subject: commit.subject });
          s.evidence.push(note('commit', path, 'Git records a distinguishable change to this phase.'));
          if (complete(text) && !complete(previous) && phase !== 'Version preparation') {
            s.state = 'documented-complete';
            const candidates = completionIds.get(phase) || new Map();
            candidates.set(commit.id, { id: commit.id, subject: commit.subject });
            completionIds.set(phase, candidates);
            s.completionCommit = candidates.size === 1 ? [...candidates.values()][0] : null;
          } else if (s.state === 'unknown') s.state = 'inferred';
        }
      }
    }
    if (!ongoing) continue;
    const observed = [];
    for (const file of distinct) {
      if (file.inherited) continue;
      const phase = category(file.path);
      if (dirty.some(path => path === file.path || file.path.startsWith(`${path}/`))) {
        let current = phase;
        if (phase === 'Plan' && taskEvidence(file.text) && checklist(file.text).unchecked) current = 'Implementation';
        if (phase === 'Plan' && validation(file.text)) current = 'Validation';
        const s = step(current); s.state = 'observed'; s.evidence.push(note('working-tree', file.path, 'Uncommitted Markdown differs from the baseline.')); observed.push(current);
      }
    }
    const observedPhases = [...new Set(observed)];
    if (observedPhases.length === 1) { change.currentStep = observedPhases[0]; change.inferenceReason = 'Relevant uncommitted Markdown identifies this phase.'; }
    else if (observedPhases.length > 1) change.inferenceReason = 'Uncommitted evidence spans multiple phases; current step is unknown.';
    else {
      const newest = history.find(c => steps.some(s => s.commits.some(commit => commit.id === c.id)));
      const candidates = newest ? steps.filter(s => s.commits.some(c => c.id === newest.id)) : [];
      if (candidates.length === 1) { change.currentStep = candidates[0].name; change.inferenceReason = 'Latest distinguishable Git evidence identifies this phase.'; }
      else if (candidates.length > 1) change.inferenceReason = 'Latest commit spans several phases (possibly a squash); current step is unknown.';
    }

  }
  return changes;
}
export async function readWorkflow(selectedRoot, selectedData, scan, git) {
  const workflow = { worktrees: [], diagnostics: [], historyLimit: 200 };
  try { workflow.worktrees = parseWorktrees(await git(selectedRoot, ['worktree', 'list', '--porcelain', '-z'], true)); }
  catch { workflow.diagnostics.push(diagnostic('worktree-list-unavailable', 'Registered worktrees could not be enumerated.')); return workflow; }
  for (const entry of workflow.worktrees) {
    entry.selected = entry.path === selectedRoot;
    try {
      const data = entry.selected ? selectedData : await scan(entry.path);
      entry.availability = 'readable';
      entry.changes = await evidenceFor(entry.path, data, git, entry.head, entry.diagnostics);
      entry.unitsOfWork = await readUnitsOfWork(entry.path, data, entry.changes, git, checklist);
    } catch (error) {
      entry.availability = error.status === 404 && error.message.includes('docs/artifacts') ? 'non-add' : 'unavailable';
      entry.diagnostics.push(diagnostic('worktree-unavailable', entry.availability === 'non-add' ? 'This worktree has no readable ADD directory.' : 'This registered worktree cannot be read.'));
    }finally{git.release?.(entry.path);}
  }
  return workflow;
}
