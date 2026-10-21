import test from 'node:test';
import assert from 'node:assert/strict';
import {stringify} from 'yaml';
import {createFlowService} from '../server/flow-index.js';
import {createImpactService} from '../server/impact.js';
import {readFlowRepository} from '../server/flow-reader.js';
import {impactRepository, flowDoc} from './impact-fixtures.js';
import {git, rootReadme} from './fixtures.js';

// Concept fixture: the in-place artifact a declares three models in one
// document; login uses only identity. Audit has a missing source. The legacy
// artifact h has a historical declaration with a missing source.
const models = (list, title = 'Contract') => '---\n' + stringify({models: list}) + `---\n# ${title}\n`;
const identity = {id: 'identity', title: 'Identity', description: 'The identity of a member.', sources: ['specifications/identity.md']};
const session = {id: 'session', title: 'Session', description: 'A signed-in period.', sources: ['specifications/identity.md', 'specifications/session.md']};
const audit = {id: 'audit', title: 'Audit', description: 'A record of checks.', sources: ['specifications/audit.md']};
const contract = 'docs/artifacts/a/specifications/contract.md';
function conceptFiles() {
  const login = {id: 'login', artifact: 'a', title: 'Login', trigger: 'A member signs in.', outcome: 'A session exists.', entry_steps: ['check'],
    steps: [
      {id: 'check', title: 'Check identity', supports: ['contract', 'code', 'checks'], interactions: [{from: 'member', to: 'member', action: 'Check the identity', outcome: 'Checked.', supports: ['code']}]},
      {id: 'recheck', title: 'Check again', supports: ['code', 'checks'], interactions: [{from: 'member', to: 'member', action: 'Check the identity again', outcome: 'Checked twice.', supports: ['code']}]},
      {id: 'audit', title: 'Audit', supports: ['helper']}],
    transitions: [{from: 'check', to: 'recheck'}, {from: 'recheck', to: 'audit'}],
    support: [
      {id: 'contract', kind: 'element', artifact: 'a', element: 'specifications/contract.md', requires: 'Define the identity rules.', basis: 'documented'},
      {id: 'code', kind: 'implementation', path: 'src/check.js', requires: 'Check the identity.', basis: 'static'},
      {id: 'checks', kind: 'test', path: 'test/check.test.js', requires: 'Exercise the check.', basis: 'static'},
      {id: 'helper', kind: 'implementation', path: 'src/util.js', requires: 'Format the audit line.', basis: 'static'}],
    participants: [{id: 'member', artifact: 'a', model: 'identity', requires: 'Supply the identity.'}]};
  return new Map([
    ['docs/artifacts/a/README.md', rootReadme('A', '1.0.0')],
    ['docs/artifacts/a/versions/1.0.0/README.md', '---\nsource_change: change-first\n---\n# A 1.0.0\n'],
    ['docs/artifacts/a/changes/change-first/README.md', '# First change\n'],
    ['docs/artifacts/a/changes/change-next/README.md', '# Next change\n'],
    [contract, models([identity, session, audit])],
    ['docs/artifacts/a/specifications/identity.md', '# Identity\n\nThe identity rules.\n'],
    ['docs/artifacts/a/specifications/session.md', '# Session\n\nThe session rules.\n'],
    ['docs/artifacts/a/specifications/flows/login.md', flowDoc(login)],
    ['docs/artifacts/h/README.md', rootReadme('H', '2.0.0')],
    ['docs/artifacts/h/versions/1.0.0/specifications/model.md', models([{id: 'record', title: 'Record', description: 'A kept record.', sources: ['specifications/gone.md']}], 'Old model')],
    ['docs/artifacts/h/versions/2.0.0/specifications/model.md', models([{id: 'record', title: 'Record', description: 'A kept record.', sources: ['specifications/record.md']}], 'Model')],
    ['docs/artifacts/h/versions/2.0.0/specifications/record.md', '# Record\n'],
    ['src/util.js', 'export function helper(){return 1;}\n'],
    ['src/check.js', "import {helper} from './util.js';\nexport function check(){return helper();}\n"],
    ['test/check.test.js', "import {check} from '../src/check.js';\nexport const t=check;\n"],
  ]);
}
async function setup(t) {
  const f = await impactRepository(conceptFiles());
  const flows = createFlowService({stateDir: f.stateDir, roots: [f.root], embedder: {signature: 'test', embed: async texts => texts.map(() => [1, 0])}});
  const impact = createImpactService({stateDir: f.stateDir});
  t.after(async () => {await flows.close();await f.cleanup();});
  const query = body => flows.query({path: f.root, ...body});
  return {f, flows, impact, query};
}
const entities = r => [...r.data.direct, ...r.data.transitive];

test('CP10, CP6: every declared model has one node, a declares edge and missingSources; only the selected declaration gives a diagnostic', async t => {
  const {f, impact} = await setup(t);
  const record = await readFlowRepository(f.root, {knowledge: 'planning'});
  const nodes = record.graph.nodes.filter(n => n.kind === 'model');
  assert.deepEqual(nodes.map(n => n.logicalId).sort(), ['a:audit', 'a:identity', 'a:session', 'h:record']);
  const node = nodes.find(n => n.logicalId === 'a:audit');
  assert.deepEqual(node.missingSources, ['specifications/audit.md']);
  assert.deepEqual(nodes.find(n => n.logicalId === 'a:identity').missingSources, []);
  const declares = record.graph.edges.filter(e => e.kind === 'declares' && e.source === node.id);
  assert.equal(declares.length, 1);
  const element = record.graph.nodes.find(n => n.id === declares[0].target);
  assert.deepEqual([element.kind, element.title, element.file], ['element', 'Contract', contract]);
  const missing = record.graph.diagnostics.filter(d => d.code === 'missing-model-source');
  assert.deepEqual(missing.map(({code, path, model, file, message}) => ({code, path, model, file, message})),
    [{code: 'missing-model-source', path: contract, model: 'a:audit', file: contract, message: 'Model a:audit sources do not exist: specifications/audit.md.'}]);
  assert.ok(record.snapshot.artifacts.find(a => a.id === 'h').elements.some(e => e.source === 'version:1.0.0'), 'the historical declaration is read');
  // Impact resolves an unused model in both forms and starts at the model entity.
  for (const model of ['a:audit', 'model:a:audit']) {
    const r = await impact.query({path: f.root, origins: [{model}]});
    assert.deepEqual(r.data.unresolved, []);
    assert.deepEqual(r.data.changed.map(c => [c.path, c.status]), [['model:a:audit', 'modified']]);
  }
  const unknown = await impact.query({path: f.root, origins: [{model: 'model:a:nothing'}]});
  assert.equal(unknown.data.unresolved[0].entity, 'model:a:nothing');
});

test('claim model-origin-is-entity and CPA7: a model origin makes only its model dependents direct; model items have titles', async t => {
  const {f, impact} = await setup(t);
  const byModel = await impact.query({path: f.root, origins: [{model: 'a:identity'}]});
  assert.deepEqual(byModel.data.direct.map(i => i.entity), ['flow:a:login']);
  assert.ok(!entities(byModel).some(i => i.kind === 'model'), 'no other model of the declaring document is affected');
  // The declaring document as origin still reaches every model it declares.
  const byDocument = await impact.query({path: f.root, origins: [{path: contract}]});
  const items = entities(byDocument).filter(i => i.kind === 'model');
  assert.deepEqual(items.map(i => [i.entity, i.title, i.tier]).sort(), [['model:a:audit', 'Audit', 'direct'], ['model:a:identity', 'Identity', 'direct'], ['model:a:session', 'Session', 'direct']]);
});

test('the concepts operation returns the contract fields, sorted, and the declaration against the merge base', async t => {
  const {f, query} = await setup(t);
  let r = await query({operation: 'concepts'});
  assert.deepEqual(r.data.concepts.map(c => [c.artifact, c.title, c.declaration]), [['a', 'Audit', null], ['a', 'Identity', null], ['a', 'Session', null], ['h', 'Record', null]], 'null on the protected branch');
  assert.deepEqual(r.data.concepts[1], {
    logicalId: 'a:identity', entity: 'model:a:identity', title: 'Identity', description: 'The identity of a member.', artifact: 'a',
    declaredIn: {path: contract, title: 'Contract'},
    sources: [{path: 'docs/artifacts/a/specifications/identity.md', title: 'Identity', missing: false}],
    declaration: null,
  });
  assert.deepEqual(r.data.concepts[0].sources, [{path: 'docs/artifacts/a/specifications/audit.md', title: 'audit', missing: true}]);
  assert.deepEqual(r.data.concepts[3].declaredIn, {path: 'docs/artifacts/h/versions/2.0.0/specifications/model.md', title: 'Model'});
  // On a branch: a changed, a new and a removed entry; the legacy artifact has no baseline.
  git(f.root, 'checkout', '-q', '-b', 'feature');
  await f.write(contract, models([{...identity, description: 'The verified identity of a member.'}, audit, {id: 'record', title: 'Record', description: 'A new record.', sources: ['specifications/identity.md']}]));
  r = await query({operation: 'concepts'});
  assert.deepEqual(r.data.concepts.map(c => [c.logicalId, c.declaration]), [['a:audit', null], ['a:identity', 'changed'], ['a:record', 'new'], ['a:session', 'removed'], ['h:record', null]]);
  const removed = r.data.concepts.find(c => c.declaration === 'removed');
  assert.deepEqual([removed.title, removed.description, removed.declaredIn, removed.sources.map(s => [s.path, s.missing])],
    ['Session', 'A signed-in period.', {path: contract, title: 'Contract'}, [['docs/artifacts/a/specifications/identity.md', false], ['docs/artifacts/a/specifications/session.md', false]]]);
  r = await query({operation: 'concepts', artifact: 'h'});
  assert.deepEqual(r.data.concepts.map(c => c.logicalId), ['h:record']);
  // A committed branch keeps the merge base as the declaration base.
  f.commit('branch declarations');
  r = await query({operation: 'concepts', artifact: 'a'});
  assert.deepEqual(r.data.concepts.map(c => [c.logicalId, c.declaration]), [['a:audit', null], ['a:identity', 'changed'], ['a:record', 'new'], ['a:session', 'removed']]);
  await assert.rejects(query({operation: 'concepts', artifact: 'missing'}), {status: 422});
});

test('CP2, CP5: the concept operation answers by identity, entity and exact title, with flows, implementation, branch changes and diagnostics', async t => {
  const {f, query, flows} = await setup(t);
  for (const concept of ['a:identity', 'model:a:identity', 'IDENTITY', ' identity ']) {
    const r = await query({operation: 'concept', concept});
    assert.equal(r.data.concept.logicalId, 'a:identity', concept);
  }
  const {data: {concept}} = await query({operation: 'concept', concept: 'Identity'});
  assert.deepEqual(concept.flows, [{flow: 'a:login', title: 'Login', artifact: 'a', participant: 'member', requires: 'Supply the identity.', interactions: [
    {step: 'check', stepTitle: 'Check identity', from: 'Identity', to: 'Identity', action: 'Check the identity'},
    {step: 'recheck', stepTitle: 'Check again', from: 'Identity', to: 'Identity', action: 'Check the identity again'}]}]);
  assert.equal(concept.implementation.basis, 'static');
  assert.equal(concept.implementation.inferred, 'in the steps of these flows');
  assert.equal(concept.implementation.groups.length, 1, 'steps with the same files form one group; the audit step has no interaction');
  const group = concept.implementation.groups[0];
  assert.deepEqual([group.flow, group.artifact, group.steps, group.code.map(c => c.path), group.tests.map(c => c.path)],
    ['a:login', 'a', [{step: 'check', stepTitle: 'Check identity'}, {step: 'recheck', stepTitle: 'Check again'}], ['src/check.js'], ['test/check.test.js']]);
  // The source IDs open through the flow source operation.
  const source = await query({operation: 'source', flow: group.flowId, source: group.code[0].sourceId});
  assert.equal(source.data.path, 'src/check.js');
  assert.deepEqual(concept.branchChanged, []);
  assert.deepEqual(concept.changes, {open: [{artifact: 'a', change: 'change-next', title: 'Next change'}]});
  assert.deepEqual(concept.diagnostics, []);
  // An unused concept with a missing source shows its diagnostic.
  const unused = (await query({operation: 'concept', concept: 'a:audit'})).data.concept;
  assert.deepEqual([unused.flows, unused.implementation.groups], [[], []]);
  assert.deepEqual(unused.diagnostics.map(d => [d.code, d.model, d.file]), [['missing-model-source', 'a:audit', contract]]);
  // Unknown and ambiguous queries give info diagnostics outside the graph diagnostics.
  let r = await query({operation: 'concept', concept: 'Nothing'});
  assert.equal(r.data.concept, null);
  assert.deepEqual(r.diagnostics.filter(d => d.code.startsWith('concept-')), [{code: 'concept-unknown', severity: 'info', message: 'No concept Nothing is declared in the selected knowledge.'}]);
  git(f.root, 'checkout', '-q', '-b', 'feature');
  await f.write(contract, models([identity, audit, {id: 'record', title: 'Record', description: 'A new record.', sources: ['specifications/identity.md']}]));
  r = await query({operation: 'concept', concept: 'record'});
  assert.equal(r.data.concept, null);
  const ambiguous = r.diagnostics.find(d => d.code === 'concept-ambiguous');
  assert.equal(ambiguous.severity, 'info');
  assert.deepEqual(ambiguous.candidates.map(c => c.logicalId), ['a:record', 'h:record']);
  const record = await flows.load(f.root);
  assert.ok(!record.graph.diagnostics.some(d => d.code.startsWith('concept-')));
  // The removed session has no page; the branch line names the changed declaring document.
  assert.ok((await query({operation: 'concept', concept: 'a:session'})).diagnostics.some(d => d.code === 'concept-unknown'));
  const changed = (await query({operation: 'concept', concept: 'a:identity'})).data.concept;
  assert.deepEqual(changed.branchChanged, [{path: contract, title: 'Contract'}]);
  await f.write('docs/artifacts/a/specifications/identity.md', '# Identity\n\nChanged rules.\n');
  assert.deepEqual((await query({operation: 'concept', concept: 'a:identity'})).data.concept.branchChanged.map(d => d.path), [contract, 'docs/artifacts/a/specifications/identity.md']);
  // Validation: the concept selector belongs to the concept operation only.
  await assert.rejects(query({operation: 'concept'}), {status: 422});
  await assert.rejects(query({operation: 'concept', concept: '  '}), {status: 422});
  await assert.rejects(query({operation: 'search', concept: 'a:identity'}), {status: 422});
  await assert.rejects(query({operation: 'concept', concept: 'a:identity', artifact: 'a'}), {status: 422});
});

test('CPA13, CP19: Impact of a concept and its describing documents holds an entity that the concept facts do not list', async t => {
  const {f, impact, query} = await setup(t);
  const {data: {concept}} = await query({operation: 'concept', concept: 'a:identity'});
  const listed = new Set([concept.entity, concept.declaredIn.path, ...concept.sources.map(s => s.path), ...concept.flows.map(x => `flow:${x.flow}`),
    ...concept.implementation.groups.flatMap(g => [...g.code, ...g.tests].map(x => x.path))]);
  const r = await impact.query({path: f.root, origins: [{model: concept.logicalId}, ...concept.sources.map(s => ({path: s.path}))]});
  const extra = entities(r).map(i => i.entity).filter(e => !listed.has(e));
  assert.ok(extra.includes('model:a:session'), `Impact adds an entity: ${extra.join(', ')}`);
});
