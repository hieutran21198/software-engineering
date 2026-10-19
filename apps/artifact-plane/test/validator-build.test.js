import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp, rm, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {recordRepository, SEEDED} from './record-fixtures.js';

const run = promisify(execFile);
const entry = fileURLToPath(new URL('../scripts/validate-knowledge.mjs', import.meta.url));
async function node(script, args, cwd) {
  try {const {stdout} = await run(process.execPath, [script, ...args], {cwd, maxBuffer: 32 << 20});return {code: 0, stdout};}
  catch (error) {return {code: error.code, stdout: error.stdout};}
}

test('the built single-file validator gives the same JSON as the entry point, without node_modules', async t => {
  const out = await mkdtemp(join(tmpdir(), 'add-validate-')); t.after(() => rm(out, {recursive: true, force: true}));
  await run(process.execPath, [fileURLToPath(new URL('../scripts/build-validator.mjs', import.meta.url)), out], {maxBuffer: 32 << 20});
  assert.deepEqual(await readdir(out), ['add-validate.mjs']);
  const built = join(out, 'add-validate.mjs');
  const clean = await recordRepository(), seeded = await recordRepository({seeded: true});
  t.after(clean.cleanup);t.after(seeded.cleanup);
  for (const args of [['--repository', clean.root], ['--repository', seeded.root], ['--repository', seeded.root, '--change', 'app/change-fix'], ['--change', 'app/change-fix'], ['--repository', seeded.root, '--change', 'app/change-none'], ['--bogus']]) {
    // The built file runs from a directory with no node_modules.
    const a = await node(entry, args, seeded.root), b = await node(built, args, seeded.root);
    assert.equal(b.code, a.code, args.join(' '));assert.equal(b.stdout, a.stdout, args.join(' '));
  }
  const ok = JSON.parse((await node(built, ['--repository', clean.root], out)).stdout);
  assert.equal(ok.schema, 'add-validate.result.v1');assert.equal(ok.ok, true);assert.equal(ok.scope, null);assert.equal(ok.tier, null);
  assert.deepEqual(ok.diagnostics.filter(d => d.severity !== 'info'), []);
  const bad = await node(built, ['--repository', seeded.root], out);
  assert.equal(bad.code, 1);
  const found = JSON.parse(bad.stdout);
  for (const [code, path] of Object.entries(SEEDED)) assert.ok(found.diagnostics.some(d => d.code === code && d.path === path), code);
  assert.ok(found.diagnostics.some(d => d.code === 'tier-mismatch' && d.path === 'docs/artifacts/app/changes/change-fix/README.md'));
  const sorted = found.diagnostics.map(d => `${d.path}\0${d.code}`);
  assert.deepEqual(sorted, [...sorted].sort((x, y) => x.split('\0')[0].localeCompare(y.split('\0')[0]) || x.split('\0')[1].localeCompare(y.split('\0')[1])));
  const scoped = JSON.parse((await node(built, ['--repository', seeded.root, '--change', 'app/change-fix'], out)).stdout);
  assert.equal(scoped.scope, 'app/change-fix');assert.equal(scoped.tier.declared, 'small');assert.equal(scoped.tier.allowed, 'medium');
  assert.equal(scoped.tier.criteria.find(c => c.id === 'impact-contained').result, 'coordinator');
  const usage = await node(built, ['--change', 'not-a-change'], out);
  assert.equal(usage.code, 2);assert.equal(JSON.parse(usage.stdout).ok, false);
});
