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
async function evidenceFor(root, data, git, head, diagnostics) {
  const { files, snapshot } = data;
  let history = [], dirty = [];
  try {
    history = parseHistory(await git(root, ['log', '-201', '--format=%H%x00%s%x00%ct', '-z', '--name-only', '--', 'docs/artifacts'], true));
    if (history.length > 200) { history.length = 200; diagnostics.push(diagnostic('history-limited', 'Only the latest 200 commits touching docs/artifacts are inspected.')); }
    if (await git(root, ['rev-parse', '--is-shallow-repository']) === 'true') diagnostics.push(diagnostic('shallow-history', 'This worktree has shallow Git history. Exact completion evidence may be unavailable.'));
    dirty = (await git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], true)).split('\0').filter(Boolean).map(line => line.slice(3));
  } catch { diagnostics.push(diagnostic('workflow-history-unavailable', 'Git history or working changes could not be read.')); }
  const cache = new Map();
  async function content(revision, path) {
    const key = `${revision}:${path}`;
    if (!cache.has(key)) cache.set(key, await git(root, ['show', key], true).catch(() => ''));
    return cache.get(key);
  }
  const changes = [];
  for (const artifact of snapshot.artifacts) for (const { name } of artifact.changes) {
    const prefix = `docs/artifacts/${artifact.id}/changes/${name}/`;
    const versionPrefix = `docs/artifacts/${artifact.id}/versions/${artifact.currentVersion}/`;
    const owned = [...files].filter(([path]) => path.startsWith(prefix) && category(path));
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
    const change = { artifact: artifact.id, name, declaredActive: artifact.activeChange === name, currentStep: null, inferenceReason: 'No distinguishable ongoing change: current snapshot contains the same knowledge.', steps, tasks };
    changes.push(change);
    const ongoing = distinct.length > 0;
    change.history = !ongoing || !!artifact.activeChange && !change.declaredActive;
    change.historyReason = !ongoing ? 'Current snapshot contains the same category knowledge.' : change.history ? 'Retained change; the artifact declares another active change. This does not prove completion.' : '';
    const timestamps = history.filter(commit => commit.paths.some(path => path.startsWith(prefix))).map(commit => commit.time).filter(time => Number.isSafeInteger(time) && time >= 0 && time <= 8640000000000);
    change.lastCommitAt = timestamps.length ? Math.max(...timestamps) : null;
    if (ongoing) change.inferenceReason = 'No current phase can be inferred from distinguishable evidence.';
    // Older copied tasks can remain different from the current snapshot. They are not new progress.
    for (const commit of history) {
      for (const path of commit.paths.filter(path => path.startsWith(prefix) || path.startsWith(versionPrefix) || path === `docs/artifacts/${artifact.id}/README.md`)) {
        const text = await content(commit.id, path);
        const previous = commit === introduction && path.startsWith(prefix) ? (introductionBaseline.get(path) || "") : await content(`${commit.id}^`, path);
        if (text === previous) continue;
        if (!path.startsWith(prefix)) {
          // Version evidence must include this change's knowledge, not an unrelated release.
          const match = path.match(/^(docs\/artifacts\/[^/]+\/versions\/[^/]+\/)/);
          const version = match?.[1] || versionPrefix;
          if (!owned.length || !(await Promise.all(owned.map(async ([file, value]) => await content(commit.id, `${version}${file.slice(prefix.length)}`) === value))).every(Boolean)) continue;
        }
        for (const phase of associations(path, text, previous)) {
          const s = step(phase);
          if (!s.commits.some(c => c.id === commit.id)) s.commits.push({ id: commit.id, subject: commit.subject });
          s.evidence.push(note('commit', path, 'Git records a distinguishable change to this phase.'));
          if (explicitCompletion(text) && !explicitCompletion(previous) && phase !== 'Version preparation') {
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
    } catch (error) {
      entry.availability = error.status === 404 && error.message.includes('docs/artifacts') ? 'non-add' : 'unavailable';
      entry.diagnostics.push(diagnostic('worktree-unavailable', entry.availability === 'non-add' ? 'This worktree has no readable ADD directory.' : 'This registered worktree cannot be read.'));
    }
  }
  return workflow;
}
