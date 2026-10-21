import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createFlowService} from '../server/flow-index.js';
import {readFlowRepository} from '../server/flow-reader.js';
import {conceptRepository} from './concept-fixtures.js';

// CP18 parity (specifications/concept-pages.md, Validation): the Version concept
// page of the fixture renders only contract wording and `concept` answer fields.
const WORDING = new Set(['/', 'Concept', 'What does', 'affect?', 'Described in', '·', 'Flows', 'Role:', 'Open flow', '—', '→', ':', ',',
  'Code and tests in the steps of these flows', 'Code', 'Tests', 'No code file.', 'No test file.', 'static',
  'Inferred from the steps where', 'takes part. Not declared on the concept.', 'Declared as a model in', '.']);
// The visible texts of a static rendering: the text between tags, without the
// aria-hidden icons; React separates adjacent texts with comments.
const decode = text => text.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const texts = html => html.replace(/<svg[\s\S]*?<\/svg>/g, '').split(/<[^>]*>/).map(t => decode(t).trim()).filter(Boolean);
// The text content of a rendering, as a reader sees it.
const plain = html => decode(html.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]*>/g, ''));

async function setup(t) {
  const f = await conceptRepository(), stateDir = await mkdtemp(join(tmpdir(), 'plane-concept-state-'));
  const flows = createFlowService({stateDir, roots: [f.root], embedder: {signature: 'test', embed: async list => list.map(() => [1, 0])}});
  const server = await createServer({root: fileURLToPath(new URL('..', import.meta.url)), configFile: false, logLevel: 'silent', appType: 'custom',
    server: {middlewareMode: true, hmr: false, ws: false}, optimizeDeps: {noDiscovery: true, include: []}});
  t.after(async () => {await server.close();await flows.close();await f.cleanup();await rm(stateDir, {recursive: true, force: true});});
  const {ConceptView} = await server.ssrLoadModule('/src/pages/ConceptPage.jsx');
  const {snapshot} = await readFlowRepository(f.root, {knowledge: 'planning'});
  const answer = async concept => (await flows.query({path: f.root, knowledge: 'planning', operation: 'concept', concept})).data.concept;
  const render = (concept, focus) => renderToStaticMarkup(React.createElement(ConceptView, {page: {kind: 'concept', artifact: concept.artifact, model: concept.logicalId.split(':')[1], ...(focus ? {focus} : {})}, concept, snapshot, go: () => {}}));
  return {answer, render, snapshot};
}

// Each visible fact and the answer field that it shows.
function facts(concept, snapshot) {
  const title = id => snapshot.artifacts.find(a => a.id === id).title;
  const map = new Map();
  const put = (text, field) => map.has(text) ? map.get(text).push(field) : map.set(text, [field]);
  put(concept.title, 'title');put(concept.description, 'description');put(title(concept.artifact), 'artifact (title from the snapshot)');
  put(concept.declaredIn.title, 'declaredIn.title');
  concept.sources.forEach((s, i) => put(s.title, `sources[${i}].title`));
  concept.flows.forEach((f, i) => {
    put(f.title, `flows[${i}].title`);put(f.requires, `flows[${i}].requires`);put(f.participant, `flows[${i}].participant`);
    if (f.artifact !== concept.artifact) put(title(f.artifact), `flows[${i}].artifact`);
    f.interactions.forEach((x, j) => {for (const k of ['stepTitle', 'from', 'to', 'action']) put(x[k], `flows[${i}].interactions[${j}].${k}`);});
  });
  const groups = concept.implementation.groups;
  const unique = kind => new Set(groups.flatMap(g => g[kind].map(c => c.path))).size;
  put(String(concept.flows.length), 'flows.length');
  put(`${unique('code')} code file${unique('code') === 1 ? '' : 's'}`, 'implementation.groups[].code (distinct paths)');
  put(`${unique('tests')} test file${unique('tests') === 1 ? '' : 's'}`, 'implementation.groups[].tests (distinct paths)');
  groups.forEach((g, i) => {
    g.steps.forEach((s, j) => put(s.stepTitle, `implementation.groups[${i}].steps[${j}].stepTitle`));
    put(concept.flows.find(f => f.flow === g.flow).title, `implementation.groups[${i}].flow`);put(title(g.artifact), `implementation.groups[${i}].artifact`);
    for (const kind of ['code', 'tests']) g[kind].forEach((c, j) => put(c.path, `implementation.groups[${i}].${kind}[${j}].path`));
  });
  return map;
}

test('CP18: each visible fact of the Version concept page maps to a concept answer field', async t => {
  const {answer, render, snapshot} = await setup(t);
  const concept = await answer('add:version'), map = facts(concept, snapshot);
  // Two arrivals open each Flows row once; the Code and tests details is in the markup while closed.
  const shown = [render(concept, 'flow:add:gates'), render(concept, 'flow:plane:explore')].flatMap(texts);
  // A text node may join several facts; removing the facts, longest first, and then the wording leaves nothing.
  const strip = (text, list) => list.reduce((rest, part) => rest.split(part).join('\u0000'), text);
  const values = [...map.keys()].sort((a, b) => b.length - a.length), wording = [...WORDING].sort((a, b) => b.length - a.length);
  const unmapped = [...new Set(shown)].map(text => [text, strip(strip(text, values), wording).replace(/[\u0000\s]/g, '')]).filter(([, rest]) => rest).map(([text]) => text);
  assert.deepEqual(unmapped, [], 'every visible text is contract wording or an answer field');
  const missing = [...map.keys()].filter(text => !shown.some(s => s.includes(text)));
  assert.deepEqual(missing, [], 'every answer fact shows');
  t.diagnostic(JSON.stringify(Object.fromEntries(map)));
});

test('CP3, CP4, CPA2: the contract order, the focus arrival and a summary without interactive content', async t => {
  const {answer, render} = await setup(t);
  const concept = await answer('add:version');
  const html = render(concept, 'flow:add:gates'), text = plain(html);
  const order = ['Artifact-Driven Development / Concept', 'Version', 'What does Version affect?', concept.description,
    'Described in Knowledge and execution contract · Change-owned delivery contract', 'Flows 2', 'Code and tests in the steps of these flows · 2 code files, 1 test file static',
    'Inferred from the steps where Version takes part. Not declared on the concept.', 'Declared as a model in ADD models used in dependency gates.'];
  let at = -1;for (const part of order) {const next = text.indexOf(part, at + 1);assert.ok(next > at, `${part} follows in order`);at = next;}
  // focus opens its row and only that row; the open row shows the role, Open flow and the interactions.
  assert.deepEqual([...html.matchAll(/aria-expanded="(true|false)"/g)].map(m => m[1]), ['false', 'true']);
  assert.ok(text.includes('Role: contract · Open flow'));
  assert.ok(text.includes('Resolve contracts and selectors — Change → Version: Select the current established version'));
  assert.ok(!render(concept).includes('aria-expanded="true"'), 'no row opens without focus');
  // Code and tests is a closed details with the static tag; no summary or button holds interactive content.
  assert.match(html, /<details class="concept-code"><summary>/);
  const summary = html.match(/<summary>([\s\S]*?)<\/summary>/)[1];
  assert.match(summary, /<span class="kind-tag" data-kind="static">static<\/span>/);
  assert.doesNotMatch(summary, /<(button|a|input|select|textarea)\b/);
  for (const [, inner] of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) assert.doesNotMatch(inner, /<(button|a|input|select|textarea)\b/);
});

test('CPA3, CPA5: an unused model shows the sparse line; a missing source shows the error and no closing line', async t => {
  const {answer, render} = await setup(t);
  const unused = render(await answer('add:release')), text = plain(unused);
  assert.ok(text.includes('No flow uses Release yet.'));
  assert.ok(!unused.includes('<details') && !unused.includes('aria-label="Flows"'), 'no Flows section and no Code and tests');
  assert.ok(text.includes('Declared as a model in ADD models used in dependency gates.'));
  const missing = render(await answer('add:ledger')), shown = plain(missing);
  assert.match(missing, /<div class="notice error" role="alert">/);
  assert.ok(shown.includes('Model add:ledger sources do not exist: specifications/ledger.md.'));
  assert.ok(shown.includes('Fix in ADD models used in dependency gates'));
  assert.ok(!shown.includes('Declared as a model in'), 'the closing line is absent');
});

test('CP10: an Impact model item reads its title and opens its concept page', async () => {
  const {entityLabel, pageFor} = await import('../src/impact-model.js');
  assert.equal(entityLabel('model:add:version', null, 'Version'), 'Version');
  assert.deepEqual(pageFor('model:add:version'), {kind: 'concept', artifact: 'add', model: 'version'});
});
