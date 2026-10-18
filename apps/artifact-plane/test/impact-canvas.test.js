import test from 'node:test';
import assert from 'node:assert/strict';
import {impactCanvas, MAX_NODES} from '../src/impact-canvas.js';
import {flowHighlight, groupOf, lastRelationship, pageFor, parseEntity, sectionItems} from '../src/impact-model.js';
import {flowDiagram, highlightDiagram} from '../src/flow-canvas.js';

const origin = 'apps/x/server/store.js';
const data = {
  changed: [{path: origin}],
  direct: [
    {entity: 'flow:a:observe', kind: 'flow', artifact: 'a', title: 'Observe', tier: 'direct', hops: 1, strength: 'declared+static', origins: [origin], steps: [{step: 'bind', tier: 'direct', hops: 1}],
      paths: [[{via: 'supports', from: origin, to: 'step:a:observe:bind', basis: 'static'}, {via: 'contains', from: 'step:a:observe:bind', to: 'flow:a:observe'}]]},
    {entity: 'apps/x/server/api.js', kind: 'module', tier: 'direct', hops: 1, strength: 'static+symbol', origins: [origin], paths: [[{via: 'imports', from: origin, to: 'apps/x/server/api.js', symbols: ['Store']}]]},
  ],
  transitive: [{entity: 'apps/x/server/http.js', kind: 'module', tier: 'transitive', hops: 2, strength: 'static', origins: [origin],
    paths: [[{via: 'imports', from: origin, to: 'apps/x/server/api.js'}, {via: 'imports', from: 'apps/x/server/api.js', to: 'apps/x/server/http.js'}]]}],
  steps: [{entity: 'step:a:observe:bind', kind: 'step', tier: 'direct', hops: 1, paths: [[{via: 'supports', from: origin, to: 'step:a:observe:bind'}]]}],
  verify: [{flow: 'flow:a:observe', step: 'bind', test: 'apps/x/test/store.test.js', hops: 1, basis: 'static', requires: 'Check the store.'}],
  investigate: [], potential: [{entity: 'apps/x/src/packet.js', kind: 'module', tier: 'potential', strength: 'historical', origins: [origin], evidence: {co_changed: '5 of 10 commits'}}],
  unresolved: [{entity: 'artifact:b', reason: 'depends on a but declares no reference.'}],
};

test('impact canvas draws origins, direct entities and the selected paths with steps folded into flows', () => {
  const plain = impactCanvas(data);
  assert.deepEqual(plain.nodes.map(n => n.id).sort(), [origin, 'apps/x/server/api.js', 'flow:a:observe'].sort());
  assert.ok(plain.edges.some(e => e.source === origin && e.target === 'flow:a:observe' && e.label === 'supports'));
  assert.equal(plain.grouped, false);
  const focused = impactCanvas(data, {selection: 'apps/x/server/http.js'});
  assert.ok(focused.nodes.some(n => n.id === 'apps/x/server/http.js' && n.data.tier === 'transitive'));
  assert.ok(focused.edges.some(e => e.target === 'apps/x/server/http.js' && e.style.strokeWidth === 2));
});

test('impact canvas groups by artifact or folder above the node limit', () => {
  const many = {...data, changed: Array.from({length: MAX_NODES + 5}, (_, i) => ({path: `apps/x/src/file${i}.js`})), direct: data.direct};
  const grouped = impactCanvas(many);
  assert.equal(grouped.grouped, true);
  assert.ok(grouped.nodes.length < 10);
  assert.ok(grouped.nodes.some(n => n.id === 'changed:apps/x/src' && /65 changed files/.test(n.data.kind)));
});

test('impact model parses identities, groups, links and section rows', () => {
  assert.deepEqual(parseEntity('step:a:observe:bind'), {type: 'step', artifact: 'a', flow: 'a:observe', step: 'bind'});
  assert.equal(groupOf({entity: 'apps/x/server/api.js'}), 'apps/x/server');
  assert.equal(groupOf({entity: 'docs/artifacts/b/specifications/c.md'}), 'b');
  assert.deepEqual(pageFor('docs/artifacts/b/specifications/c.md'), {kind: 'document', artifact: 'b', source: 'docs/artifacts/b/specifications/c.md'});
  assert.deepEqual(pageFor('docs/artifacts/b/specifications/flows/run.md'), {kind: 'flow', artifact: 'b', flow: 'b:run'});
  assert.equal(pageFor('apps/x/server/api.js'), null);
  assert.equal(lastRelationship(data.direct[1]), 'imports Store');
  assert.equal(lastRelationship(data.direct[0]), 'supports');
  assert.deepEqual(sectionItems(data, 'direct', {kind: 'code'}).map(i => i.entity), ['apps/x/server/api.js']);
  assert.equal(sectionItems(data, 'verify')[0].entity, 'apps/x/test/store.test.js');
  assert.equal(sectionItems(data, 'unresolved', {kind: 'flow'}).length, 1);
  assert.deepEqual(flowHighlight(data.direct[0], data.steps), {steps: ['bind'], supports: {bind: [origin]}});
});

test('a flow diagram highlights affected steps and dims the others', () => {
  const diagram = flowDiagram({steps: [{id: 'bind', title: 'Bind'}, {id: 'observe', title: 'Observe'}], transitions: [{from: 'bind', to: 'observe'}]});
  assert.equal(highlightDiagram(diagram, []), diagram);
  const lit = highlightDiagram(diagram, ['bind']);
  assert.deepEqual(lit.nodes.map(n => [n.id, n.className, n.data.affected]), [['bind', 'affected', true], ['observe', 'dimmed', false]]);
  assert.equal(lit.edges, diagram.edges);
});

test('verify rows merge the flows a test supports', () => {
  const rows = sectionItems({verify: [{flow: 'flow:a:x', step: 's', test: 't.test.js', hops: 2, basis: 'static'}, {flow: 'flow:a:y', step: 'u', test: 't.test.js', hops: 1, basis: 'static'}]}, 'verify');
  assert.equal(rows.length, 1);assert.equal(rows[0].hops, 1);assert.deepEqual(rows[0].uses.map(u => u.flow), ['flow:a:x', 'flow:a:y']);
});
