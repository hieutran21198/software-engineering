import {evidenceSource} from '../src/delivery-records.js';
import {marked} from 'marked';
import {scanRepository} from './reader.js';
import {buildTaskGraph} from './task-graph.js';
import {checklist} from './workflow.js';
import {unitBriefs, versionClaims, versionSnapshot, frontMatter, anchor} from './units-of-work.js';
import {readClaims, changeClaimPaths} from './claims.js';
import {protectedRefs, protectedTree, blobId} from './knowledge-baseline.js';
import {parseModels, parseFlow} from './flow-model.js';
import {documentTitle} from '../src/model.js';
// The change brief (specifications/review-brief.md): seven answers, claims, flows,
// attention, delivery facts and counts, derived from Git, the knowledge and the
// impact service. It stores nothing and grants no approval.
export const LADDER = ['Not analyzed', 'Inferred', 'Explained', 'Observed activity', 'Recorded experiment', 'Fact from Git', 'Re-checked by an agent, not independent', 'Checked by a person'];
const [NOT_ANALYZED, INFERRED, EXPLAINED, , EXPERIMENT, GIT, AGENT, PERSON] = LADDER;
export const QUESTIONS = ['What changed?', 'Why?', 'What is affected?', 'What should I care about?', 'What do I need to understand?', 'What can I verify?', 'What needs my decision?'];
const CATEGORIES = ['Delivered with unmet evidence', 'Claim with an error', 'Open decision', 'Open root cause', 'Undecided flow or unresolved item', 'Open assumption', 'Unknown or risk'];
const ATTENTION_CAP = 7;
const PENDING = /\b(remain pending|is pending|not started|proposed for team review)\b/i;
const APPROVAL = 'Approval not verified by this reader.';

// One step per claim (Verification ladder). An open or superseded claim takes
// the step of its basis: observed with evidence is a recorded experiment.
export function claimStep(claim) {
  if (claim.kind === 'unknown') return NOT_ANALYZED;
  if (claim.status === 'verified') return claim.verifiedBy === 'person' ? PERSON : AGENT;
  if (['supported', 'refuted'].includes(claim.status) && claim.evidence.length) return EXPERIMENT;
  if (claim.basis === 'inferred') return INFERRED;
  if (claim.basis === 'observed' && claim.evidence.length) return EXPERIMENT;
  return EXPLAINED;
}
const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
const tokens = markdown => marked.lexer(markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, ''));
// Text of the first section whose heading matches, without its heading.
function section(markdown, test) {
  const list = tokens(markdown);let start = -1;
  for (let i = 0; i < list.length; i++) if (list[i].type === 'heading' && list[i].depth === 2 && test(list[i].text)) {start = i;break;}
  if (start < 0) return null;
  let end = list.length;
  for (let i = start + 1; i < list.length; i++) if (list[i].type === 'heading' && list[i].depth <= 2) {end = i;break;}
  return {anchor: anchor(list[start].text), text: list.slice(start + 1, end).map(t => t.raw).join('').trim()};
}
const firstSentence = text => text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
const firstParagraph = text => text?.split(/\n\s*\n/).find(p => p.trim() && !/^\s*[-*#|]/.test(p))?.trim().replace(/\s+/g, ' ') ?? null;
function reason(readme) {
  if (!readme) return null;
  const list = tokens(readme), h2 = list.findIndex(t => t.type === 'heading' && t.depth === 2);
  const from = h2 >= 0 ? h2 + 1 : 0;
  const end = list.findIndex((t, i) => i >= from && t.type === 'heading' && t.depth <= 2);
  return firstParagraph(list.slice(from, end < 0 ? list.length : end).filter(t => t.type !== 'heading').map(t => t.raw).join(''));
}
// Covered when a token of a task's Scope section names the file or a containing directory.
function scopeTokens(tasks) {
  const result = new Set();
  for (const task of tasks) {
    const scope = section(task.body, text => /^scope/i.test(text))?.text || '';
    for (const m of scope.matchAll(/[A-Za-z0-9_.@-]+(?:\/[A-Za-z0-9_.@*-]+)+\/?|[A-Za-z0-9_@-][A-Za-z0-9_.@-]*\.[a-z]{1,5}\b/g)) result.add(m[0].replace(/[.,;:)]+$/, '').replace(/\/$/, ''));
  }
  return result;
}
const inScope = (path, scope) => [...scope].some(t => path === t || path.endsWith('/' + t) || path.startsWith(t + '/') || path.includes('/' + t + '/'));
const aboutPaths = claim => [...claim.about.map(a => a.includes(':') ? (a.split(':')[1]?.endsWith('.md') ? `docs/artifacts/${a.split(':')[0]}/${a.split(':')[1]}` : null) : a), ...claim.evidence.map(e => e.split('#')[0])].filter(Boolean);
const flowKey = entity => entity.replace(/^flow:/, '');

// Origin of the impact answer for the change (Origins table). Only an
// established version uses the commit that introduced its record; an open
// change and a version prepared on the branch use the branch difference.
async function originOf(root, git, artifact, change, files, snapshotArtifact, baselines) {
  const claims = versionClaims(files, artifact, change);
  if (snapshotArtifact?.layout !== 'in-place') return {kind: 'none', reason: 'The artifact uses the legacy layout; impact is not computed for its changes.'};
  if (claims.length === 1) {
    const record = `${claims[0].prefix}README.md`;
    for (const ref of ['refs/heads/main', 'refs/heads/master']) {
      if (!await git(root, ['rev-parse', '--verify', '--quiet', ref]).catch(() => null)) continue;
      const snapshot = await versionSnapshot(root, git, ref, record);
      if (snapshot.state === 'available') return {kind: 'delivery-commit', commit: snapshot.commit, ref};
    }
  }
  const established = claims.length === 1 && !!baselines?.[artifact]?.versionRecords?.includes(claims[0].version);
  if (snapshotArtifact.activeChange === change || claims.length === 1 && !established) return {kind: 'protected-diff'};
  return {kind: 'none', reason: claims.length ? 'No introducing commit of the version record was found on the protected ref.' : 'The change is neither open nor delivered.'};
}
async function mergeBase(root, git) {
  const oid = (await protectedRefs(root, git).catch(() => []))[0]?.oid;
  const head = oid ? await git(root, ['rev-parse', '--verify', '-q', 'HEAD']).catch(() => null) : null;
  return head ? await git(root, ['merge-base', oid, head]).catch(() => null) || null : null;
}
// Concept rows (specifications/concept-pages.md, Change brief): the reasons in
// their order, the reason words of the PR line and the summary prefix parts.
export const CONCEPT_REASONS = ['declaration-new', 'declaration-changed', 'declaration-removed', 'participation-changed', 'describing-document-changed'];
const WORDS = {'declaration-new': 'new declaration', 'declaration-changed': 'declaration changed', 'declaration-removed': 'declaration removed'};
export const reasonWords = c => c.reason === 'participation-changed' ? `participation changed in ${c.flow.title}` : WORDS[c.reason] ?? null;
const rowText = c => c.reason === 'describing-document-changed' ? `${c.title} — describing document changed: ${c.document.title}` : `${c.title} — ${reasonWords(c)}${c.reason === 'participation-changed' ? '' : ` in ${c.document.title}`}`;
const PREFIX = [['declaration-new', 'New concept', 'New concepts'], ['declaration-changed', 'Changed declaration', 'Changed declarations'], ['declaration-removed', 'Removed concept', 'Removed concepts'], ['participation-changed', 'Participation changed', 'Participations changed']];
// The summary prefix: one part for each of the first four reasons, at most 3 titles each.
export function conceptPrefix(concepts = []) {
  return PREFIX.flatMap(([reason, one, many]) => {
    const titles = [...new Map(concepts.filter(c => c.reason === reason).map(c => [c.concept, c.title])).values()];
    if (!titles.length) return [];
    return [`${titles.length > 1 ? many : one}: ${titles.slice(0, 3).join(', ')}${titles.length > 3 ? ` and ${titles.length - 3} more` : ''}.`];
  }).join(' ');
}
const DECLARING = /^docs\/artifacts\/([^/]+)\/(specifications\/(?!flows\/).+\.md)$/;
const FLOW = /^docs\/artifacts\/([^/]+)\/(specifications\/flows\/.+\.md)$/;
const KNOWLEDGE = /^docs\/artifacts\/[^/]+\/(?:requirements|specifications|decisions)\/.+\.md$/;
const entry = m => JSON.stringify([m.title, m.description, m.sources]);
// Claim participation-diff: the participants of the concept in one flow and the
// interactions that name one of them (step, from, to, action, outcome).
function participation(flow, concept) {
  const list = (flow?.participants || []).filter(p => `${p.artifact}:${p.model}` === concept), ids = new Set(list.map(p => p.id));
  const interactions = (flow?.steps || []).flatMap(s => (s.interactions || []).filter(i => ids.has(i.from) || ids.has(i.to)).map(i => JSON.stringify([s.id, i.from, i.to, i.action, i.outcome])));
  return JSON.stringify([list.map(p => JSON.stringify([p.id, p.requires, p.status ?? null, p.change ?? null])).sort(), interactions.sort()]);
}
// The concepts that a change reaches. A delivered change compares its commit with
// its first parent; an open change compares the worktree bytes with the merge base,
// or with the protected tip when Git gives no merge base.
async function conceptsOf({worktree, git, origin, base, files}) {
  if (!['delivery-commit', 'protected-diff'].includes(origin.kind)) return [];
  const head = origin.kind === 'delivery-commit' ? origin.commit : null;
  const from = head ? await git(worktree, ['rev-parse', '--verify', '-q', `${head}^1`]).catch(() => null)
    : base ?? (await protectedRefs(worktree, git).catch(() => []))[0]?.oid ?? null;
  if (!head && !from) return [];
  const tree = rev => rev ? protectedTree(worktree, git, rev, ['docs/artifacts']).catch(() => new Map()) : new Map();
  const before = new Map([...await tree(from)].filter(([p]) => KNOWLEDGE.test(p)));
  const length = [...before.values()][0]?.length ?? 40;
  const after = head ? new Map([...await tree(head)].filter(([p]) => KNOWLEDGE.test(p)))
    : new Map([...files].filter(([p, text]) => KNOWLEDGE.test(p) && typeof text === 'string').map(([p, text]) => [p, blobId(Buffer.from(text, 'utf8'), length)]));
  const changed = path => (before.has(path) || after.has(path)) && before.get(path) !== after.get(path);
  const text = (rev, path, side) => !side.has(path) ? null : rev ? git(worktree, ['show', `${rev}:${path}`], true).catch(() => null) : files.get(path) ?? null;
  const titleOf = async path => {const relative = path.replace(/^docs\/artifacts\/[^/]+\//, '');return documentTitle(await text(head, path, after) ?? await text(from, path, before) ?? '', relative);};
  // Declarations of one side, by logical id.
  async function declarations(rev, side) {
    const listed = rev ? (await git(worktree, ['grep', '-l', '-E', '^models[[:space:]]*:', rev, '--', 'docs/artifacts'], true).catch(() => '')).split('\n').filter(Boolean).map(l => l.slice(rev.length + 1))
      : [...side.keys()].filter(p => /(?:^|\n)models\s*:/.test(files.get(p)));
    const found = new Map();
    for (const file of listed) {
      const match = file.match(DECLARING), markdown = match && await text(rev, file, side);
      if (!markdown) continue;
      for (const m of parseModels({id: file, artifact: match[1], source: 'working', path: match[2], file, markdown})?.models || []) if (!found.has(m.logicalId)) found.set(m.logicalId, m);
    }
    return found;
  }
  const old = from ? await declarations(from, before) : new Map(), now = await declarations(head, after);
  const titleOfConcept = id => (now.get(id) ?? old.get(id))?.title;
  const document = async (path, side) => ({path, title: await titleOf(path), ...(side.has(path) ? {} : {removed: true})});
  const items = [];
  for (const [id, m] of now) {
    const was = old.get(id);
    if (!was || entry(was) !== entry(m)) {items.push({concept: id, title: m.title, reason: was ? 'declaration-changed' : 'declaration-new', document: await document(m.file, after)});continue;}
    for (const source of m.sources) {
      const path = `docs/artifacts/${m.artifact}/${source}`;
      if (changed(path)) items.push({concept: id, title: m.title, reason: 'describing-document-changed', document: await document(path, after)});
    }
  }
  for (const [id, m] of old) if (!now.has(id)) items.push({concept: id, title: m.title, reason: 'declaration-removed', document: await document(m.file, after)});
  // Participations in the flow documents that differ.
  const flowsOf = async (rev, side, paths) => {
    const found = new Map();
    for (const file of paths) {
      const match = file.match(FLOW), markdown = await text(rev, file, side);
      if (markdown === null) continue;
      const flow = parseFlow({id: file, artifact: match[1], source: 'working', path: match[2], file, markdown});
      if (!found.has(flow.logicalId)) found.set(flow.logicalId, flow);
    }
    return found;
  };
  const flowPaths = [...new Set([...before.keys(), ...after.keys()])].filter(p => FLOW.test(p) && changed(p)).sort();
  const flowsBefore = await flowsOf(from, before, flowPaths), flowsAfter = await flowsOf(head, after, flowPaths);
  for (const key of [...new Set([...flowsBefore.keys(), ...flowsAfter.keys()])]) {
    const a = flowsBefore.get(key), b = flowsAfter.get(key), flow = b ?? a;
    const ids = [...new Set([a, b].flatMap(f => (f?.participants || []).map(p => `${p.artifact}:${p.model}`)))];
    for (const id of ids) if (titleOfConcept(id) && participation(a, id) !== participation(b, id))
      items.push({concept: id, title: titleOfConcept(id), reason: 'participation-changed', document: await document(flow.file, after), flow: {flow: key, title: flow.title}});
  }
  return items.sort((x, y) => CONCEPT_REASONS.indexOf(x.reason) - CONCEPT_REASONS.indexOf(y.reason) || x.title.localeCompare(y.title) || x.concept.localeCompare(y.concept) || x.document.path.localeCompare(y.document.path));
}
export async function buildBrief({root, worktree, artifact, change, git, impactService, records = []}) {
  const scan = await scanRepository(worktree, {git});
  const {files, snapshot, baselines} = scan;
  const owner = snapshot.artifacts.find(a => a.id === artifact);
  const units = unitBriefs(files), unit = units.filter(u => u.members.some(m => m.artifact === artifact && m.change === change));
  const owning = unit.length === 1 ? unit[0] : null;
  const prefix = `docs/artifacts/${artifact}/changes/${change}/`;
  const diagnostics = [];
  const origin = await originOf(root, git, artifact, change, files, owner, baselines);
  // The branch difference starts at the merge base with the protected branch.
  const base = origin.kind === 'protected-diff' ? await mergeBase(worktree, git) : null;
  let impact = null;
  if (origin.kind !== 'none') {
    try {
      impact = await impactService.query({path: root, ...(worktree !== root ? {worktree} : {}), ...(origin.kind === 'delivery-commit' ? {commit: origin.commit} : {diff: {base: base ?? 'protected'}}), depth: 2, limit: 100, ...(owning ? {unit: owning.id} : {})});
      if (impact.completeness === 'partial' || impact.freshness === 'stale') diagnostics.push({code: 'partial-impact', path: prefix, message: 'The impact answer is partial; the brief is partial.'});
    } catch (error) {diagnostics.push({code: 'unavailable-impact', path: prefix, message: error.status ? error.message : 'Change impact could not be computed.'});}
  }
  const d = impact?.data;
  const concepts = await conceptsOf({worktree, git, origin, base, files});
  const conceptItems = concepts.map(c => ({text: rowText(c), source: c.document.path, step: GIT, concept: c.concept, document: c.document, ...(c.flow ? {flow: c.flow} : {})}));
  const changedPaths = new Set((d?.changed || []).map(c => c.path));

  // Claims of the change: plan, tasks, unit brief and the knowledge it changes.
  const read = readClaims(files, {snapshot, baselines, units});
  const claimPaths = owner ? changeClaimPaths(owner, change, files, units) : new Set();
  for (const path of changedPaths) if (/^docs\/artifacts\/[^/]+\/(requirements|specifications|decisions)\//.test(path)) claimPaths.add(path);
  const claims = [...claimPaths].sort().flatMap(path => read.byPath.get(path) || []).map(c => ({...c, step: claimStep(c), stale: changedPaths.size > 0 && !changedPaths.has(c.file) && aboutPaths(c).some(p => changedPaths.has(p))}));
  const droppedClaimErrors = read.diagnostics.filter(x => claimPaths.has(x.path) && x.code === 'invalid-claim' && !claims.some(c => c.id === x.claim && c.file === x.path));
  const live = c => !['refuted', 'superseded'].includes(c.status);

  // Flows: reached, declared and undecided.
  const flowItems = [...(d?.direct || []), ...(d?.transitive || [])].filter(i => i.kind === 'flow');
  const declaredKeys = new Set((owning?.affectedFlows || []).map(f => `${f.artifact}:${f.flow}`));
  // A claim names a flow by its impact entity (flow:<artifact>:<flow>) or without the prefix.
  const decidedBy = key => claims.find(c => c.about.some(a => {const k = flowKey(a);return k === key || k.startsWith(key + ':');}));
  const reached = flowItems.map(i => {const key = flowKey(i.entity), claim = decidedBy(key);return {flow: key, title: i.title, tier: i.tier, strength: i.strength, steps: (i.steps || []).map(s => s.step ?? s), state: declaredKeys.has(key) ? 'declared' : claim ? 'decided' : 'undecided', decidedBy: declaredKeys.has(key) ? owning.path : claim ? {file: claim.file, id: claim.id} : null};});
  const undecided = [...reached.filter(f => f.state === 'undecided').map(f => ({kind: 'flow', flow: f.flow, tier: f.tier, strength: f.strength})), ...(d?.unresolved || []).map(u => ({kind: 'unresolved', entity: u.entity, for: u.for ?? null, reason: u.reason}))];
  const flows = {reached, declared: owning?.affectedFlows || [], undecided};

  // Delivery facts of a delivered change.
  const graph = buildTaskGraph(files, prefix, checklist, scan.unsafeTaskPaths);
  const tasks = graph.tasks || [];
  let delivery = null;
  if (origin.kind === 'delivery-commit') {
    const evidence = (owning?.evidence || []).filter(e => ['failed', 'incomplete'].includes(e.result)).map(e => ({criterion: e.criterion, result: e.result, method: e.method, source: e.source}));
    const unchecked = tasks.flatMap(t => [...t.body.matchAll(/^\s*[-*] \[ \] (.+)$/gm)].map(m => ({task: t.id ?? t.path, item: m[1].trim(), source: t.path})));
    const wording = [...changedPaths].filter(p => p.endsWith('.md') && files.has(p)).flatMap(p => {const m = String(files.get(p)).replace(/\r?\n[ \t]+(?![-*] )/g, ' ').match(new RegExp(`[^.\\n]*${PENDING.source}[^.\\n]*\\.?`, 'i'));return m ? [{path: p, sentence: m[0].replace(/^\s*(?:[-*]\s+|[\w-]+:\s+)+/, '').trim(), step: INFERRED, note: 'Matched by wording.'}] : [];});
    delivery = {version: versionClaims(files, artifact, change)[0]?.version ?? null, commit: origin.commit, evidence, unchecked, wording};
  }

  // Attention rows in the fixed category order, capped at seven.
  const rank = c => [c.file, c.id].join('\0');
  const rows = [
    ...(delivery ? [...delivery.evidence.map(e => ({category: CATEGORIES[0], text: `Unit criterion ${e.criterion} recorded ${e.result}.`, source: e.source, step: EXPERIMENT})), ...delivery.unchecked.map(u => ({category: CATEGORIES[0], text: `Unchecked DoD item: ${u.item}`, source: u.source, step: GIT}))] : []),
    ...[...claims.filter(c => !c.available).map(c => ({category: CATEGORIES[1], text: `Claim ${c.id}: ${c.diagnostics.find(x => x.severity === 'error')?.message}`, source: c.file, step: c.step, claim: c.id})), ...droppedClaimErrors.map(x => ({category: CATEGORIES[1], text: x.message, source: x.path, step: EXPLAINED}))],
    ...claims.filter(c => c.kind === 'decision' && c.status === 'open').sort((a, b) => rank(a).localeCompare(rank(b))).map(c => ({category: CATEGORIES[2], text: c.statement, source: c.file, step: c.step, claim: c.id})),
    ...claims.filter(c => c.kind === 'root_cause' && c.status === 'open').map(c => ({category: CATEGORIES[3], text: c.statement, source: c.file, step: c.step, claim: c.id})),
    ...undecided.map(u => u.kind === 'flow' ? {category: CATEGORIES[4], text: `${u.flow} is reached (${u.tier}), and neither the unit brief's affected_flows nor a claim's about list names it.`, source: owning?.path ?? null, step: GIT} : {category: CATEGORIES[4], text: `${u.entity}: ${u.reason}`, source: owning?.path ?? null, step: NOT_ANALYZED}),
    ...claims.filter(c => c.kind === 'assumption' && c.status === 'open' && c.riskIfWrong).map(c => ({category: CATEGORIES[5], text: c.statement, source: c.file, step: c.step, claim: c.id})),
    ...claims.filter(c => ['unknown', 'risk'].includes(c.kind) && live(c)).map(c => ({category: CATEGORIES[6], text: c.statement, source: c.file, step: c.step, claim: c.id})),
  ];
  const attention = {rows: rows.slice(0, ATTENTION_CAP), more: Math.max(0, rows.length - ATTENTION_CAP)};

  // The seven answers.
  const planPath = `${prefix}tasks/README.md`, plan = files.get(planPath);
  const approval = plan ? section(plan, text => /approval/i.test(text)) : null;
  const goal = {text: approval ? `The plan says: “${firstParagraph(approval.text)}” ${APPROVAL}` : `The plan has no approval section. ${APPROVAL}`, source: approval ? `${planPath}#${approval.anchor}` : planPath, step: EXPLAINED};
  // A unit's delivery commit holds every member change, so every member's task scope counts.
  const memberTasks = (owning?.members || [{artifact, change}]).flatMap(m => m.artifact === artifact && m.change === change ? tasks : buildTaskGraph(files, `docs/artifacts/${m.artifact}/changes/${m.change}/`, checklist, scan.unsafeTaskPaths).tasks || []);
  const scope = scopeTokens(memberTasks);
  const changedRecords = records.filter(r => r.status !== 'unchanged');
  // Named counts: governed documents, other knowledge files and code and test files.
  const recordPaths = new Set(changedRecords.map(r => `docs/artifacts/${artifact}/${r.path}`));
  const otherKnowledge = (d?.changed || []).filter(c => c.path.startsWith('docs/artifacts/') && !recordPaths.has(c.path));
  const codeFiles = (d?.changed || []).filter(c => !c.path.startsWith('docs/artifacts/'));
  const changedItems = [...changedRecords.map(r => ({text: `${r.status} ${r.path}`, source: `docs/artifacts/${artifact}/${r.path}`, step: GIT})),
    ...otherKnowledge.map(c => ({text: `${c.status ?? 'changed'} ${c.path}`, source: c.path, step: GIT})),
    ...codeFiles.map(c => ({text: `${c.status ?? 'changed'} ${c.path}${c.symbols?.length ? ` (${c.symbols.slice(0, 6).join(', ')})` : ''}${tasks.length && !inScope(c.path, scope) ? ' — not in any task scope' : ''}`, source: c.path, step: tasks.length && !inScope(c.path, scope) ? INFERRED : GIT}))];
  const why = reason(files.get(`${prefix}README.md`));
  const decisions = claims.filter(c => c.kind === 'decision');
  const steps = (d?.steps || []).map(s => ({text: `${s.entity.replace(/^step:/, '')}${s.title ? ` — ${s.title}` : ''}`, source: null, step: GIT}));
  const evidenceRecords = tasks.flatMap(t => {const list = frontMatter(t.body).value?.evidence_records;return Array.isArray(list) ? list.filter(r => r && typeof r === 'object').map(r => ({text: `${r.method} (${r.result})`, source: evidenceSource(r, t.path), step: EXPERIMENT})) : [];});
  const answers = [
    [`${plural(changedRecords.length, 'requirement, specification or decision document')}, ${plural(otherKnowledge.length, 'other knowledge file')} and ${plural(codeFiles.length, 'code and test file')}${changedItems.some(i => i.text.endsWith('not in any task scope')) ? `; ${changedItems.filter(i => i.text.endsWith('not in any task scope')).length} not in any task scope` : ''}.`, changedItems],
    [(why && firstSentence(why)) ?? (decisions.length ? `${plural(decisions.length, 'decision claim')}; the change README states no reason.` : null), [...(why ? [{text: why, source: `${prefix}README.md`, step: EXPLAINED}] : []), ...decisions.map(c => ({text: `Decision ${c.id}: ${c.statement}${c.rejected.length ? ` Rejected: ${c.rejected.map(r => `${r.option} (${r.reason})`).join('; ')}.` : ''}`, source: c.file, step: c.step, claim: c.id}))]],
    // The concept prefix, then the flow sentence; without Impact data the prefix alone.
    [[conceptPrefix(concepts), d ? `${plural(reached.length, 'flow')} reached: ${reached.filter(f => f.state === 'declared').length} declared, ${reached.filter(f => f.state === 'decided').length} decided by a claim, ${reached.filter(f => f.state === 'undecided').length} undecided. ${plural(d.unresolved.length, 'unresolved item')}.` : ''].filter(Boolean).join(' '),
      [...conceptItems, ...(d ? [...reached.map(f => ({text: `${f.flow} — ${f.state}${f.steps.length ? ` (steps ${f.steps.join(', ')})` : ''}`, source: f.decidedBy?.file ?? (typeof f.decidedBy === 'string' ? f.decidedBy : null), step: GIT})),
        ...d.unresolved.map(u => ({text: `${u.entity}: ${u.reason}`, source: null, step: NOT_ANALYZED})),
        {text: `Coverage: depth ${d.coverage.depth}, frontier ${d.coverage.frontier}. Not analyzed: ${d.coverage.not_analyzed.join('; ')}.`, source: null, step: NOT_ANALYZED}] : [])]],
    [rows.length ? `${plural(rows.length, 'item')}: ${[...new Set(rows.map(r => r.category.toLowerCase()))].join(', ')}.` : null, attention.rows],
    [claims.length || steps.length ? `${plural(claims.length, 'claim')} and ${plural(steps.length, 'affected step')}.` : null,
      [...claims.filter(live).map(c => ({text: c.statement, source: c.file, step: c.step, claim: c.id})), ...steps, ...changedRecords.map(r => ({text: `Governed document ${r.path}`, source: `docs/artifacts/${artifact}/${r.path}`, step: GIT}))]],
    [null, [...claims.filter(c => c.check && live(c)).map(c => ({text: c.check, source: c.file, step: c.step, claim: c.id})), ...(d?.verify || []).map(v => ({text: `Run ${v.test}${v.flow ? ` (${v.flow}${v.step ? `:${v.step}` : ''})` : ''}`, source: v.test, step: GIT})), ...evidenceRecords]],
    [null, [goal, ...claims.filter(c => c.kind === 'decision' && c.status === 'open').map(c => ({text: `Open decision ${c.id}: edit ${c.file}`, source: c.file, step: c.step, claim: c.id})),
      ...undecided.filter(u => u.kind === 'flow').map(u => ({text: `Undecided flow ${u.flow}: add it to affected_flows in ${owning?.path ?? 'the unit brief'} or to the about list of a claim`, source: owning?.path ?? null, step: GIT})),
      ...claims.filter(c => ['risk', 'unknown'].includes(c.kind) && live(c)).map(c => ({text: `Limit ${c.id}: ${c.statement}`, source: c.file, step: c.step, claim: c.id}))]],
  ].map(([summary, items], i) => ({question: QUESTIONS[i], summary: items.length ? summary : null, items}));
  answers[5].summary = answers[5].items.length ? `${plural(answers[5].items.length, 'check')}.` : null;
  answers[6].summary = `${plural(answers[6].items.length - 1, 'item')} and the goal.`;

  const count = key => claims.reduce((m, c) => ({...m, [c[key]]: (m[c[key]] || 0) + 1}), {});
  const counts = {claims: claims.length, byStep: count('step'), byKind: count('kind'), byStatus: count('status'), checksByPerson: claims.filter(c => c.verifiedBy === 'person').length, checksByAgent: claims.filter(c => c.verifiedBy === 'agent').length};
  return {brief: {schema: 'artifact-plane.change-brief.v1', origin, concepts, answers, claims, flows, attention, delivery, counts}, diagnostics, partial: !impact && origin.kind !== 'none' || diagnostics.length > 0, scan};
}
