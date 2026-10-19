import test from 'node:test';
import assert from 'node:assert/strict';
import {scanRepository, exploreRepository, git} from '../server/reader.js';
import {recordChecks, nextVersion} from '../server/record-checks.js';
import {recordRepository, SEEDED, CHANGE} from './record-fixtures.js';

const SEVERITY = {'upstream-unestablished': 'warning', 'requirement-ids-missing': 'info', 'requirement-uncovered': 'warning', 'open-change-conflict': 'warning'};
const RECORD_CODES = new Set([...Object.keys(SEEDED), 'tier-mismatch']);
async function checks(root, scope) {
  const scan = await scanRepository(root);
  const own = await recordChecks({root, scan, git, scope});
  // requirement-id-duplicate and config-invalid are reader diagnostics.
  const reader = scan.snapshot.diagnostics.filter(d => RECORD_CODES.has(d.code)).map(d => ({...d, severity: 'error'}));
  return [...own, ...reader];
}

test('the version number follows the level from the protected version', () => {
  assert.equal(nextVersion('1.2.3', 'patch'), '1.2.4');assert.equal(nextVersion('1.2.3', 'minor'), '1.3.0');
  assert.equal(nextVersion('1.2.3', 'major'), '2.0.0');assert.equal(nextVersion(null, 'minor'), '1.0.0');assert.equal(nextVersion('1.2.3', null), null);
});

test('placeholder text: the ADD and Plane scaffold placeholders, not a quoted mention or code', async t => {
  const f = await recordRepository(); t.after(f.cleanup);
  const scan = await scanRepository(f.root), spec = 'docs/artifacts/app/specifications/login.md';
  const run = async body => {scan.files.set(spec, body);return (await recordChecks({root: f.root, scan, git})).filter(d => d.code === 'placeholder-text').map(d => d.severity).join();};
  assert.equal(await run('# C\n\nDescribe the behavior. Replace this text.\n'), 'warning');
  assert.equal(await run('# C\n\n1. State one criterion. Replace this item.\n'), 'warning');
  assert.equal(await run('# C\n\nREPLACE with the contract.\n'), 'error');
  assert.equal(await run('# C\n\nPlaceholder text, such as "Replace this text.", is an error.\n'), '');
  assert.equal(await run('# C\n\nThe scaffold uses `REPLACE` and `Replace this text.`\n'), '');
});

test('a clean change has no record diagnostic', async t => {
  const f = await recordRepository(); t.after(f.cleanup);
  assert.deepEqual(await checks(f.root), []);
  assert.deepEqual(await checks(f.root, CHANGE), []);
});

test('each seeded defect gives its code, severity and path', async t => {
  const f = await recordRepository({seeded: true}); t.after(f.cleanup);
  const found = await checks(f.root);
  for (const [code, path] of Object.entries(SEEDED)) {
    const hit = found.find(d => d.code === code && d.path === path);
    assert.ok(hit, `${code} at ${path}; found ${JSON.stringify(found.map(d => [d.code, d.path]))}`);
    assert.equal(hit.severity, SEVERITY[code] ?? 'error', code);
  }
  // No other code appears, and each message names the defect.
  assert.deepEqual([...new Set(found.map(d => d.code))].sort(), Object.keys(SEEDED).sort());
  const message = code => found.filter(d => d.code === code).map(d => d.message).join(' ');
  assert.match(message('covers-unknown-id'), /L9/);assert.match(message('requirement-uncovered'), /L3 is added/);
  assert.match(message('version-number-invalid'), /not 1\.0\.1/);assert.match(message('link-broken'), /missing\.md/);
  assert.match(message('open-change-conflict'), /Branch other/);assert.match(message('upstream-unestablished'), /lib/);
  // The scope keeps the change, its identity and the records that it touches.
  const scoped = await checks(f.root, CHANGE);
  assert.ok(scoped.every(d => d.path.startsWith('docs/artifacts/app/') || d.path === 'docs/artifacts/add.config.yaml'));
});

test('record diagnostics appear in the knowledge views with the reader diagnostics', async t => {
  const f = await recordRepository({seeded: true}); t.after(f.cleanup);
  const snapshot = await exploreRepository(f.root);
  const codes = new Set(snapshot.diagnostics.map(d => d.code));
  for (const code of Object.keys(SEEDED)) assert.ok(codes.has(code), code);
});
