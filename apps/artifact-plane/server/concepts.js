// Concept facts: the declared models of the selected knowledge, read from the
// flow graph and the snapshot. The UI word is concept; the record word is model.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {git as runGit} from './reader.js';
import {parseModels} from './flow-model.js';
import {blobId} from './knowledge-baseline.js';
import {documentTitle} from '../src/model.js';

const PROTECTED = ['main', 'master'];
const DECLARING = /^docs\/artifacts\/([^/]+)\/(specifications\/.+\.md)$/;
const titleOf = element => element.title || documentTitle(element.markdown || '', element.path);
const entry = m => JSON.stringify([m.title, m.description, m.sources]);

// The declaration base: the merge base of the protected ref and HEAD of the
// selected worktree. Null on the protected branch and for established knowledge.
async function declarationBase(record, git) {
  if (record.knowledge === 'established' || PROTECTED.includes(record.snapshot.repository?.branch)) return null;
  const oid = Object.values(record.baselines || {}).find(b => b.state === 'available')?.oid;
  if (!oid) return null;
  return await git(record.worktree, ['merge-base', oid, 'HEAD']).catch(() => null) || null;
}
// Model declarations of the base blobs, by logical id, for artifacts with a baseline.
async function baseModels(record, base, artifacts, git) {
  const found = new Map();
  if (!base || !artifacts.length) return found;
  const listed = await git(record.worktree, ['grep', '-l', '-E', '^models[[:space:]]*:', base, '--', ...artifacts.map(id => `docs/artifacts/${id}/specifications`)]).catch(() => '');
  for (const line of listed.split('\n').filter(Boolean)) {
    const file = line.slice(base.length + 1), match = file.match(DECLARING);
    if (!match || match[2].startsWith('specifications/flows/')) continue;
    const markdown = await git(record.worktree, ['show', `${base}:${file}`], true).catch(() => null);
    if (markdown === null) continue;
    const parsed = parseModels({id: file, artifact: match[1], source: 'base', path: match[2], file, markdown});
    for (const m of parsed?.models || []) found.set(m.logicalId, {...m, declaringTitle: documentTitle(markdown, match[2])});
  }
  return found;
}
// Documents of a declaration: the declaring element and the describing sources.
function documents(record, m) {
  const elements = record.snapshot.artifacts.find(a => a.id === m.artifact)?.elements || [];
  const declaring = elements.find(e => e.file === m.file);
  // A removed declaration has no element; its artifact is in place.
  const prefix = declaring ? m.file.slice(0, m.file.length - declaring.path.length) : `docs/artifacts/${m.artifact}/`;
  const sources = m.sources.map(path => {
    const element = elements.find(e => e.source === (declaring?.source ?? 'working') && e.path === path);
    return {path: element?.file || prefix + path, title: element ? titleOf(element) : documentTitle('', path), missing: !element};
  });
  return {declaredIn: {path: m.file, title: declaring ? titleOf(declaring) : m.declaringTitle || documentTitle('', m.file)}, sources};
}
const itemOf = (record, m, declaration) => ({
  logicalId: m.logicalId, entity: `model:${m.logicalId}`, title: m.title, description: m.description, artifact: m.artifact,
  ...documents(record, m), declaration,
});
const ordered = list => list.sort((a, b) => a.artifact.localeCompare(b.artifact) || a.title.localeCompare(b.title, undefined, {sensitivity: 'base'}) || a.logicalId.localeCompare(b.logicalId));
const modelNodes = (record, artifact) => record.graph.nodes.filter(n => n.kind === 'model' && (!artifact || n.artifact === artifact));

// The concepts operation: one item for each model node, plus the declarations
// that the branch removed. `declaration` compares each entry with the base.
export async function conceptList(record, {artifact} = {}, git = runGit) {
  const nodes = modelNodes(record, artifact);
  const base = await declarationBase(record, git);
  const owners = [...new Set(record.snapshot.artifacts.filter(a => !artifact || a.id === artifact).map(a => a.id))];
  const compared = owners.filter(id => record.baselines?.[id]?.state === 'available');
  const before = await baseModels(record, base, compared, git);
  const declarationOf = n => {
    if (!base || !compared.includes(n.artifact)) return null;
    const old = before.get(n.logicalId);
    return !old ? 'new' : entry(old) !== entry(n) ? 'changed' : null;
  };
  const items = nodes.map(n => itemOf(record, n, declarationOf(n)));
  for (const [logicalId, m] of before) if (!nodes.some(n => n.logicalId === logicalId)) items.push(itemOf(record, m, 'removed'));
  return {concepts: ordered(items), base};
}

// Steps of one flow where the concept takes part, grouped by their code and test files.
function implementation(record, node) {
  const groups = [];
  for (const flow of record.graph.flows) {
    const ids = new Set((flow.participants || []).filter(p => p.nodeId === node.id).map(p => p.id));
    if (!ids.size) continue;
    const byKey = new Map();
    for (const step of flow.steps) {
      if (!(step.interactions || []).some(i => ids.has(i.from) || ids.has(i.to))) continue;
      const supports = flow.support.filter(s => step.supports.includes(s.id));
      const files = kind => [...new Map(supports.filter(s => s.kind === kind).map(s => [s.path, {path: s.path, sourceId: s.targetId}])).values()].sort((a, b) => a.path.localeCompare(b.path));
      const code = files('implementation'), tests = files('test');
      if (!code.length && !tests.length) continue;
      const key = JSON.stringify([code.map(c => c.path), tests.map(t => t.path)]);
      if (!byKey.has(key)) {byKey.set(key, {flow: flow.logicalId, flowId: flow.id, steps: [], artifact: flow.artifact, code, tests});groups.push(byKey.get(key));}
      byKey.get(key).steps.push({step: step.id, stepTitle: step.title});
    }
  }
  return {basis: 'static', inferred: 'in the steps of these flows', groups};
}
function flowsOf(record, node) {
  const nodes = new Map(record.graph.nodes.map(n => [n.id, n])), flows = [];
  for (const flow of record.graph.flows) for (const p of flow.participants || []) {
    if (p.nodeId !== node.id) continue;
    const byId = new Map(flow.participants.map(x => [x.id, x]));
    const name = id => {const x = byId.get(id);return (x?.resolved && nodes.get(x.nodeId)?.title) || id;};
    const interactions = flow.steps.flatMap(step => (step.interactions || []).filter(i => i.from === p.id || i.to === p.id)
      .map(i => ({step: step.id, stepTitle: step.title, from: name(i.from), to: name(i.to), action: i.action})));
    flows.push({flow: flow.logicalId, title: flow.title, artifact: flow.artifact, participant: p.id, requires: p.requires, interactions});
  }
  return flows.sort((a, b) => a.title.localeCompare(b.title) || a.flow.localeCompare(b.flow) || a.participant.localeCompare(b.participant));
}
// Declaring and describing documents whose worktree bytes differ from the base.
async function branchChanged(record, item, base, git) {
  if (!base || record.baselines?.[item.artifact]?.state !== 'available') return [];
  const documents = [item.declaredIn, ...item.sources];
  const listed = await git(record.worktree, ['ls-tree', '-z', '--format=%(objectname)%x09%(path)', base, '--', ...documents.map(d => d.path)], true).catch(() => '');
  const oids = new Map(listed.split('\0').filter(Boolean).map(row => {const i = row.indexOf('\t');return [row.slice(i + 1), row.slice(0, i)];}));
  const changed = [];
  for (const d of documents) {
    const bytes = await readFile(resolve(record.worktree, d.path)).catch(() => null), oid = oids.get(d.path);
    const differs = oid ? !bytes || blobId(bytes, oid.length) !== oid : !!bytes;
    if (differs && !changed.some(c => c.path === d.path)) changed.push({path: d.path, title: d.title});
  }
  return changed;
}
function openChanges(record, artifact) {
  const owner = record.snapshot.artifacts.find(a => a.id === artifact);
  return (owner?.changes || [])
    .filter(c => owner.layout === 'in-place' ? c.layout === 'in-place' && !c.version : c.name === owner.activeChange)
    .map(c => ({artifact, change: c.name, title: c.title || c.name}));
}

// The concept operation: an identity, an entity or an exact title, case-insensitive.
// Unknown and ambiguous queries give info diagnostics outside the graph diagnostics.
export async function conceptAnswer(record, query, git = runGit) {
  const wanted = query.trim().toLowerCase(), nodes = modelNodes(record);
  let matches = nodes.filter(n => n.logicalId.toLowerCase() === wanted || `model:${n.logicalId}`.toLowerCase() === wanted);
  if (!matches.length) matches = nodes.filter(n => n.title.toLowerCase() === wanted);
  if (!matches.length) return {concept: null, diagnostics: [{code: 'concept-unknown', severity: 'info', message: `No concept ${query} is declared in the selected knowledge.`}]};
  if (matches.length > 1) return {concept: null, diagnostics: [{code: 'concept-ambiguous', severity: 'info', message: `Several concepts are titled ${query}; select one by its identity.`,
    candidates: ordered(matches.map(n => ({logicalId: n.logicalId, entity: `model:${n.logicalId}`, title: n.title, artifact: n.artifact})))}]};
  const node = matches[0];
  const {concepts, base} = await conceptList(record, {artifact: node.artifact}, git);
  const item = concepts.find(c => c.logicalId === node.logicalId && c.declaration !== 'removed');
  return {concept: {
    ...item,
    flows: flowsOf(record, node),
    implementation: implementation(record, node),
    branchChanged: await branchChanged(record, item, base, git),
    changes: {open: openChanges(record, node.artifact)},
    diagnostics: record.graph.diagnostics.filter(d => d.model === node.logicalId && d.file === node.file),
  }, diagnostics: []};
}
