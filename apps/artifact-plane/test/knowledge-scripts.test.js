import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixtureRepository, fingerprint, sourceFixture as baseFixture, inPlaceFixture, mixedFixture, git} from './fixtures.js';
// Legacy snapshots keep their version README, which becomes the version record.
const sourceFixture = () => {const files = baseFixture();for (const a of ['tenant', 'authentication']) files.set(`docs/artifacts/${a}/versions/1.0.0/README.md`, '# Snapshot\n');return files;};
const run = promisify(execFile);
const script = name => fileURLToPath(new URL(`../scripts/${name}`, import.meta.url));
async function node(name, ...args) {
  try {const {stdout} = await run(process.execPath, [script(name), ...args]);return {code: 0, json: JSON.parse(stdout)};}
  catch (error) {return {code: error.code, json: JSON.parse(error.stdout)};}
}
test('L6: validate-knowledge passes in-place fixtures and fails on error diagnostics', async t => {
  const clean = await fixtureRepository(inPlaceFixture()), legacy = await fixtureRepository(sourceFixture());
  t.after(clean.cleanup);t.after(legacy.cleanup);
  const ok = await node('validate-knowledge.mjs', clean.root);
  assert.equal(ok.code, 0, JSON.stringify(ok.json.diagnostics));
  assert.ok(ok.json.artifacts.every(a => a.layout === 'in-place'));
  const bad = await node('validate-knowledge.mjs', legacy.root);
  const missing = await fixtureRepository(baseFixture());t.after(missing.cleanup);
  assert.equal((await node('migrate-layout.mjs', missing.root, '--write')).json.written, false);
  assert.equal(bad.code, 1);
  assert.ok(bad.json.diagnostics.some(d => d.code === 'unresolved-reference' && d.severity === 'error'));
});
test('L6: migrate-layout dry-run changes no bytes; --write applies the exact plan', async t => {
  const f = await fixtureRepository(sourceFixture());t.after(f.cleanup);
  const before = await fingerprint(f.root);
  const dry = await node('migrate-layout.mjs', f.root);
  assert.equal(dry.code, 0, JSON.stringify(dry.json));
  assert.deepEqual(await fingerprint(f.root), before);
  const plans = Object.fromEntries(dry.json.plans.map(p => [p.artifact, p]));
  assert.equal(plans.tenant.source, 'docs/artifacts/tenant/versions/1.0.0/');
  assert.equal(plans.authentication.source, 'docs/artifacts/authentication/changes/change-login/');
  assert.deepEqual(plans.authentication.dependsOn, ['initial']);
  assert.ok(dry.json.plans.every(p => p.layout === 'in-place' && p.equivalent));
  assert.equal(dry.json.index, 'docs/artifacts/dag.yaml');
  const written = await node('migrate-layout.mjs', f.root, '--write');
  assert.equal(written.json.written, true);
  const after = await fingerprint(f.root);
  const changed = Object.keys({...before, ...after}).filter(p => before[p] !== after[p]).sort();
  const expected = [...dry.json.plans.flatMap(p => [...p.create.map(c => c.path), ...p.change, ...p.delete]), dry.json.index].sort();
  assert.deepEqual(changed, expected);
  for (const plan of dry.json.plans) for (const {path, from} of plan.create) assert.equal(after[path], before[from]);
  assert.match(await readFile(join(f.root, 'docs/artifacts/authentication/README.md'), 'utf8'), /^---\ncurrent_version: 1\.0\.0\ndepends_on: \[initial\]\n---/);
  const valid = await node('validate-knowledge.mjs', f.root);
  assert.ok(valid.json.artifacts.every(a => a.layout === 'in-place'));
  assert.ok(!valid.json.diagnostics.some(d => ['index-disagreement', 'invalid-identity', 'missing-version'].includes(d.code)));
});
test('L6: migrate-layout migrates one artifact of a mixed repository and keeps the index while legacy remains', async t => {
  const files = mixedFixture();
  files.set('docs/artifacts/other/README.md', '# Other\n\n## Current version\n\n1.0.0\n\n## Established dependencies\n\nNone.\n');
  files.set('docs/artifacts/other/versions/1.0.0/specifications/a.md', '# A\n');
  files.set('docs/artifacts/other/versions/1.0.0/README.md', '# Other 1.0.0\n');
  files.set('docs/artifacts/dag.yaml', 'artifacts:\n  tenant: {path: tenant, depends_on: []}\n  other: {path: other, depends_on: []}\n');
  const f = await fixtureRepository(files);t.after(f.cleanup);
  const result = await node('migrate-layout.mjs', f.root, '--artifact', 'other', '--write');
  assert.equal(result.code, 0, JSON.stringify(result.json));
  assert.equal(result.json.index, null);
  assert.equal(await readFile(join(f.root, 'docs/artifacts/other/specifications/a.md'), 'utf8'), '# A\n');
  assert.match(await readFile(join(f.root, 'docs/artifacts/other/README.md'), 'utf8'), /^---\ncurrent_version: 1\.0\.0\ndepends_on: \[\]\n---\n\n# Other\n$/);
});
test('L6: migrate-layout refuses ambiguous or outdated declarations and in-place selections', async t => {
  const files = sourceFixture();
  files.set('docs/artifacts/tenant/versions/1.1.0/specifications/identity.md', '# Newer');
  files.set('docs/artifacts/tenant/versions/1.1.0/README.md', '# Newer');
  const f = await fixtureRepository(files);t.after(f.cleanup);
  const before = await fingerprint(f.root);
  const outdated = await node('migrate-layout.mjs', f.root, '--artifact', 'tenant', '--write');
  assert.equal(outdated.code, 3);assert.match(outdated.json.error, /older than 1\.1\.0/);
  const confirmed = await node('migrate-layout.mjs', f.root, '--artifact', 'tenant', '--version', '1.1.0');
  assert.equal(confirmed.code, 0);assert.equal(confirmed.json.plans[0].source, 'docs/artifacts/tenant/versions/1.1.0/');
  const inPlace = await fixtureRepository(inPlaceFixture());t.after(inPlace.cleanup);
  assert.equal((await node('migrate-layout.mjs', inPlace.root, '--artifact', 'tenant')).code, 3);
  assert.deepEqual(await fingerprint(f.root), before);
  git(f.root, 'status', '--porcelain');
});
