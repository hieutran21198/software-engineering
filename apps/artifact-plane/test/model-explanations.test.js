import test from 'node:test';
import assert from 'node:assert/strict';
import {stringify} from 'yaml';
import {buildFlowGraph, flowImpact} from '../server/flow-model.js';
import {buildSnapshot} from '../src/model.js';
import {canvasGraph} from '../src/canvas.js';
import {rootReadme, referring, inPlaceFixture} from './fixtures.js';

// Named models, participants and step interactions, plus dependency
// explanations derived only from recorded element references.
const models = list => '---\n' + stringify({models: list}) + '---\n# Models\n';
const model = (id, sources = ['specifications/identity.md']) => ({id, title: `Model ${id}`, description: `Purpose of ${id}.`, sources});
const flow = (id, extra = {}) => '---\n' + stringify({flow: {
  id, artifact: 'tenant', title: `Flow ${id}`, trigger: 'Begin.', outcome: 'Done.', entry_steps: ['check'],
  steps: [{id: 'check', title: 'Check', supports: ['identity'], interactions: [{from: 'member', to: 'member', action: 'Check itself', outcome: 'Checked.', supports: ['identity']}]}, {id: 'issue', title: 'Issue', supports: ['identity']}],
  transitions: [{from: 'check', to: 'issue'}, {from: 'issue', to: 'check', condition: 'retry'}],
  support: [{id: 'identity', kind: 'element', artifact: 'tenant', element: 'specifications/identity.md', requires: 'Identity rules.', basis: 'documented'}],
  participants: [{id: 'member', artifact: 'tenant', model: 'member', requires: 'The member who signs in.'}],
  ...extra}}) + '---\n# Flow\n';
const v = 'docs/artifacts/tenant/versions/1.0.0/';
function files(extra = []) {
  return new Map([
    ['docs/artifacts/tenant/README.md', rootReadme('Tenant', '1.0.0')],
    [v + 'README.md', '# Tenant 1.0.0'],
    [v + 'specifications/identity.md', '# Identity\n'],
    [v + 'specifications/domain-model.md', models([model('member')])],
    [v + 'specifications/flows/login.md', flow('login')],
    [v + 'specifications/flows/report.md', flow('report')],
    ...extra,
  ]);
}
const graphOf = input => buildFlowGraph(buildSnapshot(input), {context: '/repo', knowledge: 'planning'});
test('P4: one model node is shared by flows; self interactions keep flow, step, action, outcome and bases', () => {
  const g = graphOf(files());
  const nodes = g.nodes.filter(n => n.kind === 'model');
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].logicalId, 'tenant:member');
  assert.equal(g.edges.filter(e => e.kind === 'participates' && e.target === nodes[0].id).length, 2);
  const interaction = g.edges.find(e => e.kind === 'interaction');
  assert.equal(interaction.source, interaction.target);
  assert.deepEqual([interaction.step, interaction.action, interaction.outcome, interaction.bases, interaction.resolved], ['check', 'Check itself', 'Checked.', ['documented'], true]);
  assert.ok(g.edges.some(e => e.kind === 'describes' && e.source === nodes[0].id));
  assert.deepEqual(g.diagnostics.filter(d => d.code !== 'flow-evidence-gap'), []);
  // Impact from a model source reaches both participating flows.
  const impact = flowImpact(g, [v + 'specifications/identity.md']);
  assert.deepEqual(impact.flows.map(f => f.logicalId).sort(), ['tenant:login', 'tenant:report']);
  assert.deepEqual(flowImpact(g, ['tenant:member']).flows.map(f => f.logicalId).sort(), ['tenant:login', 'tenant:report']);
});
test('P4: duplicate, missing and unsafe models are diagnostics; missing targets stay named', () => {
  const duplicate = graphOf(files([[v + 'specifications/other.md', models([model('member')])]]));
  assert.ok(duplicate.diagnostics.some(d => d.code === 'duplicate-model'));
  assert.ok(duplicate.diagnostics.some(d => d.code === 'ambiguous-model'));
  assert.ok(!duplicate.nodes.some(n => n.kind === 'model'), 'no arbitrary duplicate is chosen');
  const missing = graphOf(files([[v + 'specifications/domain-model.md', models([model('other')])]]));
  const target = missing.nodes.find(n => n.kind === 'missing' && n.title === 'tenant:member');
  assert.deepEqual(target.selector, {status: 'established'});
  assert.ok(missing.diagnostics.some(d => d.code === 'unresolved-model'));
  assert.ok(missing.flows.every(f => f.state === 'valid'));
  assert.equal(missing.edges.find(e => e.kind === 'interaction').resolved, false);
  const unsafe = graphOf(files([[v + 'specifications/domain-model.md', models([model('member', ['../secret.md'])])]]));
  assert.ok(unsafe.diagnostics.some(d => d.code === 'unsafe-model-source'));
  const absent = graphOf(files([[v + 'specifications/domain-model.md', models([model('member', ['specifications/absent.md'])])]]));
  assert.ok(absent.diagnostics.some(d => d.code === 'missing-model-source'));
});
test('P4: invalid participants keep a valid legacy flow; flows without participants keep the step view', () => {
  const bad = graphOf(files([[v + 'specifications/flows/login.md', flow('login', {participants: [{id: 'member', artifact: 'tenant'}]})]]));
  const login = bad.flows.find(f => f.logicalId === 'tenant:login');
  assert.equal(login.state, 'valid');
  assert.deepEqual(login.participants, []);
  assert.ok(bad.diagnostics.some(d => d.code === 'invalid-flow-participants'));
  assert.ok(bad.diagnostics.some(d => d.code === 'invalid-flow-interaction'));
  assert.equal(login.steps.length, 2);
  const legacy = graphOf(files([[v + 'specifications/flows/login.md', flow('login', {participants: undefined, steps: [{id: 'check', title: 'Check', supports: ['identity']}, {id: 'issue', title: 'Issue', supports: ['identity']}]})]]));
  assert.deepEqual(legacy.flows.find(f => f.logicalId === 'tenant:login').participants, []);
});
test('P4: proposed participants select their change; in-place owners resolve in the working tree', () => {
  const change = 'docs/artifacts/tenant/changes/change-next/';
  const g = graphOf(files([
    [change + 'README.md', '# Next'], [change + 'specifications/identity.md', '# Identity\n'],
    [change + 'specifications/domain-model.md', models([model('member')])],
    [v + 'specifications/flows/login.md', flow('login', {participants: [{id: 'member', artifact: 'tenant', model: 'member', requires: 'Member.', status: 'proposed', change: 'change-next'}]})],
  ]));
  assert.ok(g.nodes.some(n => n.kind === 'model' && n.source === 'change:change-next'));
  const inPlace = inPlaceFixture();
  inPlace.set('docs/artifacts/tenant/specifications/domain-model.md', models([model('member')]));
  inPlace.set('docs/artifacts/tenant/specifications/flows/login.md', flow('login'));
  const w = graphOf(inPlace);
  assert.ok(w.nodes.some(n => n.kind === 'model' && n.source === 'working' && n.logicalId === 'tenant:member'));
});
test('P1: dependency edges carry explanations; parallel statuses and missing reasons stay distinct', () => {
  const c = 'docs/artifacts/auth/changes/change-login/';
  const input = new Map([
    ['docs/artifacts/tenant/README.md', rootReadme('Tenant', '1.0.0')], [v + 'specifications/identity.md', '# Identity'],
    ['docs/artifacts/other/README.md', rootReadme('Other', '1.0.0')], ['docs/artifacts/other/versions/1.0.0/specifications/a.md', '# A'],
    ['docs/artifacts/auth/README.md', rootReadme('Auth', '1.0.0', ['tenant'])],
    ['docs/artifacts/auth/versions/1.0.0/specifications/login.md', referring('tenant', 'specifications/identity.md')],
    ['docs/artifacts/auth/versions/1.0.0/specifications/gone.md', referring('tenant', 'specifications/missing.md')],
    [c + 'README.md', '# Login'], [c + 'dependencies.yaml', 'artifact: auth\nadd: [other]\nremove: [tenant]\n'],
    [c + 'specifications/login.md', '# Login without references'],
  ]);
  const view = buildSnapshot(input);
  const established = view.edges.find(e => e.source === 'tenant' && e.status === 'established');
  const removal = view.edges.find(e => e.source === 'tenant' && e.status === 'proposed-remove');
  const addition = view.edges.find(e => e.source === 'other' && e.status === 'proposed-add');
  const byPath = list => list.map(x => [x.consumerPath, x.reason, x.resolved]).sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(byPath(established.explanations), [['specifications/gone.md', 'identity format', false], ['specifications/login.md', 'identity format', true]]);
  assert.deepEqual(byPath(removal.explanations), byPath(established.explanations));
  assert.ok(established.explanations.find(x => !x.resolved).diagnostic);
  assert.equal(established.declaration, 'docs/artifacts/auth/README.md');
  assert.equal(removal.declaration, c + 'dependencies.yaml');
  assert.deepEqual(addition.explanations, []);
  // Canvas edges stay distinct when endpoints repeat with another status.
  const planning = canvasGraph({...view, edges: [established, {...established, status: 'proposed-add'}]}, new Set(), true, new Set());
  const ids = planning.edges.filter(e => e.id.startsWith('dependency:tenant:auth')).map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 2);
  const inPlace = buildSnapshot(inPlaceFixture());
  assert.equal(inPlace.edges[0].explanations[0].selector.source, 'working');
});
