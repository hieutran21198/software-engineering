import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {scanRepository, git as readerGit} from '../server/reader.js';
import {tierCheck, CRITERIA} from '../server/tier-check.js';
import {git} from './fixtures.js';

const {cases} = JSON.parse(await readFile(new URL('./fixtures/tier-cases.json', import.meta.url), 'utf8'));
const commit = (root, message) => {git(root, 'add', '-A');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
async function write(root, path, body) {
  if (body === null) return rm(join(root, path), {force: true});
  await mkdir(join(root, path, '..'), {recursive: true});await writeFile(join(root, path), body);
}
// A repository on main with the case's base, and a branch with its head.
// Code files are synthetic with the recorded numbers of added and deleted lines.
async function caseRepository(name, extra = {}) {
  const c = cases.find(x => x.name === name), root = await mkdtemp(join(tmpdir(), 'artifact-plane-tier-'));
  for (const [path, body] of Object.entries(c.base)) await write(root, path, body);
  for (const [path, [, deleted]] of Object.entries(c.code)) await write(root, path, ['keep', ...Array.from({length: deleted}, (_, i) => `old ${i}`)].join('\n') + '\n');
  git(root, 'init', '-q', '-b', 'main');commit(root, 'base');git(root, 'checkout', '-q', '-b', c.change);
  for (const [path, body] of Object.entries({...c.head, ...extra})) await write(root, path, body);
  for (const [path, [added]] of Object.entries(c.code)) await write(root, path, ['keep', ...Array.from({length: added}, (_, i) => `new ${i}`)].join('\n') + '\n');
  commit(root, 'head');
  return {root, c, cleanup: () => rm(root, {recursive: true, force: true})};
}
async function check(name, options = {}, extra) {
  const f = await caseRepository(name, extra);
  try {return await tierCheck({root: f.root, scan: await scanRepository(f.root), git: readerGit, artifact: f.c.artifact, change: f.c.change, ...options});}
  finally {await f.cleanup();}
}
const results = tier => Object.fromEntries(tier.criteria.map(c => [c.id, c.result]));

for (const name of ['hidden-tab-streams', 'navigation-hierarchy']) test(`${name}: the small-tier replay is allowed small in the standalone validator`, async () => {
  const {tier, diagnostics} = await check(name, {standalone: true});
  assert.deepEqual(tier.criteria.map(c => c.id), CRITERIA);
  assert.deepEqual(results(tier), {'one-artifact': 'pass', 'one-repository': 'coordinator', 'patch-level': 'pass', 'no-contract': 'pass', 'upstream-established': 'pass', 'code-limit': 'pass', 'impact-contained': 'coordinator'});
  assert.equal(tier.declared, 'small');assert.equal(tier.allowed, 'small');assert.deepEqual(diagnostics, []);
  assert.match(tier.criteria.find(c => c.id === 'code-limit').detail, name === 'hidden-tab-streams' ? /^57 changed/ : /^45 changed/);
});

test('#36 as delivered is large, with the failing criteria named', async () => {
  const {tier, diagnostics} = await check('impact-intelligence', {standalone: true});
  assert.equal(tier.declared, 'medium');assert.equal(tier.allowed, 'large');assert.deepEqual(diagnostics, []);
  const r = results(tier), detail = id => tier.criteria.find(c => c.id === id).detail;
  assert.equal(r['one-artifact'], 'fail');assert.match(detail('one-artifact'), /docs\/artifacts\/artifact-driven\//);
  assert.equal(r['no-contract'], 'fail');assert.match(detail('no-contract'), /flow added: specifications\/flows\/change-impact\.md/);
  assert.match(detail('no-contract'), /decision added: decisions\/016-typed-impact-ledger\.md/);assert.match(detail('no-contract'), /requirement IDs added in requirements\/change-impact\.md/);
  assert.equal(r['code-limit'], 'fail');assert.equal(r['patch-level'], 'fail');
});

test('impact-contained: unresolved without an index in the services, coordinator in the validator, decided by the impact service', async () => {
  let calls = 0;
  const service = data => ({query: async () => {calls++;return {completeness: 'complete', data};}});
  const standalone = await check('hidden-tab-streams', {standalone: true, impactService: service({direct: []})});
  assert.equal(calls, 0, 'the standalone validator queries no impact index');assert.equal(results(standalone.tier)['impact-contained'], 'coordinator');
  const none = await check('hidden-tab-streams');
  assert.equal(results(none.tier)['impact-contained'], 'unresolved');assert.equal(none.tier.allowed, 'medium');
  assert.deepEqual(none.diagnostics.map(d => d.code), ['tier-mismatch']);
  const inside = await check('hidden-tab-streams', {impactService: service({direct: [{entity: 'flow:artifact-plane:repository-refresh'}, {entity: 'apps/artifact-plane/src/main.jsx'}], transitive: [], unresolved: []})});
  assert.equal(results(inside.tier)['impact-contained'], 'pass');assert.equal(inside.tier.allowed, 'small');assert.equal(calls, 1);
  const outside = await check('hidden-tab-streams', {impactService: service({direct: [{entity: 'flow:artifact-driven:change-delivery'}], transitive: [], unresolved: []})});
  assert.equal(results(outside.tier)['impact-contained'], 'fail');assert.match(outside.tier.criteria.at(-1).detail, /flow:artifact-driven:change-delivery/);
  const failing = await check('hidden-tab-streams', {impactService: {query: async () => {throw Error('index missing');}}});
  assert.equal(results(failing.tier)['impact-contained'], 'unresolved');
});

test('a configuration limit changes the code-limit result, and a declared small tier reports tier-mismatch', async () => {
  const {tier, diagnostics} = await check('hidden-tab-streams', {standalone: true}, {'docs/artifacts/add.config.yaml': 'version: 1\ntiers:\n  small:\n    max_code_lines: 50\n'});
  assert.equal(results(tier)['code-limit'], 'fail');assert.equal(tier.allowed, 'medium');
  assert.deepEqual(diagnostics.map(d => [d.code, d.severity, d.path]), [['tier-mismatch', 'error', 'docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/README.md']]);
  assert.match(diagnostics[0].message, /code-limit is fail/);
});

test('a change merged to main: the criteria that use the difference are unresolved, and no impact query runs', async () => {
  const f = await caseRepository('hidden-tab-streams');
  try {
    git(f.root, 'checkout', '-q', 'main');git(f.root, 'merge', '-q', '--ff-only', f.c.change);
    let calls = 0;
    const {tier} = await tierCheck({root: f.root, scan: await scanRepository(f.root), git: readerGit, artifact: f.c.artifact, change: f.c.change, impactService: {query: async () => {calls++;return {completeness: 'complete', data: {}};}}});
    const r = results(tier);
    for (const id of ['one-artifact', 'no-contract', 'code-limit', 'impact-contained']) {assert.equal(r[id], 'unresolved', id);assert.match(tier.criteria.find(c => c.id === id).detail, /already on the protected branch/);}
    assert.equal(calls, 0);assert.equal(tier.allowed, 'medium');
    const standalone = await tierCheck({root: f.root, scan: await scanRepository(f.root), git: readerGit, artifact: f.c.artifact, change: f.c.change, standalone: true});
    assert.equal(results(standalone.tier)['impact-contained'], 'coordinator');
  } finally {await f.cleanup();}
});

test('code-limit counts no Markdown file', async () => {
  const {tier} = await check('hidden-tab-streams', {standalone: true}, {'notes/review.md': Array.from({length: 300}, (_, i) => `line ${i}`).join('\n') + '\n'});
  assert.match(tier.criteria.find(c => c.id === 'code-limit').detail, /^57 changed/);assert.equal(tier.allowed, 'small');
});
