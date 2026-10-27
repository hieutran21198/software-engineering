import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
import {parse} from 'yaml';
import {git} from './fixtures.js';
import {diagramScopesFiles, diagramScopesRepository} from './browser/diagram-scopes-fixture.js';
// The fixture repository of specifications/diagram-scopes.md, Fixture repository.
const run = promisify(execFile);
const validator = fileURLToPath(new URL('../scripts/validate-knowledge.mjs', import.meta.url));
const base = 'docs/artifacts/';
const front = text => parse(text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? '') ?? {};
const body = text => text.replace(/^---\n[\s\S]*?\n---\n/, '');
// The top-level Mermaid blocks of a document, each with its type and the two blocks after it.
function diagrams(text) {
  const tokens = marked.lexer(body(text)).filter(t => t.type !== 'space');
  return tokens.flatMap((t, i) => t.type === 'code' && t.lang?.split(/\s+/)[0] === 'mermaid'
    ? [{text: t.text, type: t.text.trim().split(/\s+/)[0], next: tokens.slice(i + 1, i + 3).map(n => n.type === 'paragraph' ? n.text : '')}] : []);
}
const links = text => {const hrefs = [];marked.walkTokens(marked.lexer(body(text)), t => {if (t.type === 'link') hrefs.push(t.href);});return hrefs;};

test('diagram scopes fixture: the repository has a local main branch and validate-knowledge reports no error', async t => {
  const f = await diagramScopesRepository();t.after(f.cleanup);
  assert.equal(git(f.root, 'branch', '--show-current'), 'main');
  assert.equal(git(f.root, 'status', '--porcelain', '--untracked-files=no'), '');
  let result;
  try {const {stdout} = await run(process.execPath, [validator, '--repository', f.root]);result = {code: 0, json: JSON.parse(stdout)};}
  catch (error) {result = {code: error.code, json: JSON.parse(error.stdout)};}
  assert.deepEqual(result.json.diagnostics.filter(d => d.severity === 'error'), []);
  assert.equal(result.code, 0);
  assert.deepEqual(result.json.artifacts.map(a => `${a.id} ${a.layout} ${a.currentVersion}`),
    ['ordering in-place 1.0.0', 'payments in-place 1.0.0', 'platform in-place 1.0.0', 'storefront in-place 1.0.0']);
  assert.equal(result.json.counts.flows, 1);
});

test('diagram scopes fixture: system views, ordering views and a payments artifact without a diagram', async () => {
  const files = await diagramScopesFiles();
  const of = artifact => [...files].filter(([path]) => path.startsWith(`${base}${artifact}/`) && path.endsWith('.md'));
  // platform: one system view document with three views, each with a source line and an owner table.
  const overview = files.get(`${base}platform/specifications/system-overview.md`);
  assert.equal(front(overview).system_view, true);
  assert.deepEqual([...files].filter(([path, text]) => path.endsWith('.md') && front(text).system_view !== undefined).map(([path]) => path), [`${base}platform/specifications/system-overview.md`]);
  assert.match(files.get(`${base}platform/README.md`), /Own the system views of the bookshop\./);
  const views = diagrams(overview);
  assert.deepEqual(views.map(v => v.text.match(/accTitle: (.+)/)[1]), ['Bookshop system context', 'Bookshop logical architecture', 'Bookshop production deployment']);
  assert.ok(views.every(v => v.next[0].startsWith('Source: ')));
  assert.equal(body(overview).match(/^\| Element \| /gm).length, 3);
  // The owner table links resolve to fixture files and reach storefront, ordering and payments.
  const targets = links(overview).filter(href => !href.startsWith('#')).map(href => posix.join(`${base}platform/specifications`, href));
  assert.ok(targets.every(path => files.has(path)), targets.join(', '));
  assert.deepEqual([...new Set(targets.map(path => path.split('/')[2]))].sort(), ['ordering', 'payments', 'storefront']);
  // ordering: sequence, state and data model views, one Stale line, one block without a
  // source line, one illustrative block with an icon outside the set and a long label.
  const ordering = of('ordering').flatMap(([path, text]) => diagrams(text).map(d => ({path, ...d})));
  assert.deepEqual(ordering.map(d => d.type).sort(), ['erDiagram', 'flowchart', 'flowchart', 'sequenceDiagram', 'stateDiagram-v2']);
  assert.deepEqual(ordering.filter(d => d.next.some(p => p.startsWith('Stale: '))).map(d => d.type), ['stateDiagram-v2']);
  assert.equal(of('ordering').reduce((n, [, text]) => n + (text.match(/^Stale: /gm) || []).length, 0), 1);
  const unsourced = ordering.filter(d => !/^(Source|Illustrative): /.test(d.next[0]));
  assert.deepEqual(unsourced.map(d => d.path), [`${base}ordering/specifications/orders-api.md`]);
  const illustrative = ordering.filter(d => d.next[0].startsWith('Illustrative: '));
  assert.deepEqual(illustrative.map(d => d.path), [`${base}ordering/specifications/order-data.md`]);
  assert.match(illustrative[0].text, /icon: "logos:aws-bedrock"/);
  assert.ok(illustrative[0].text.match(/label: "([^"]+)"/g).some(label => label.length - 'label: ""'.length > 60));
  for (const [path, text] of of('ordering').filter(([path]) => path.includes('/specifications/')))
    assert.equal(links(text).filter(href => href.endsWith('platform/specifications/system-overview.md')).length, 1, path);
  assert.match(of('ordering').find(([path]) => path.endsWith('flows/place-order.md'))[1], /^---\nflow:\n {2}id: place-order\n/);
  // payments has no diagram.
  assert.deepEqual(of('payments').filter(([, text]) => /^ {0,3}(`{3,}|~{3,}) *mermaid/m.test(text)).map(([path]) => path), []);
  assert.ok(of('payments').some(([path]) => path.endsWith('specifications/payment-worker.md')));
});
