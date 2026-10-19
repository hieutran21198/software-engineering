import test from 'node:test';
import assert from 'node:assert/strict';
import {changeTier, planCompatibility, taskCovers, requirementIds, duplicateIds, readConfig, evidenceSource, DEFAULT_CONFIG, CONFIG_PATH} from '../src/delivery-records.js';
import {scanRepository, git as readerGit} from '../server/reader.js';
import {evidenceFor} from '../server/workflow.js';
import {fixtureRepository, inPlaceFixture} from './fixtures.js';

const README = 'docs/artifacts/authentication/changes/change-login/README.md';
const PLAN = 'docs/artifacts/authentication/changes/change-login/tasks/README.md';
const TASK = 'docs/artifacts/authentication/changes/change-login/tasks/01-login.md';
const codes = ds => ds.map(d => d.code);

test('tier: valid values, an invalid value and absence (medium)', () => {
  for (const tier of ['small', 'medium', 'large']) assert.deepEqual(changeTier(`---\ntier: ${tier}\n---\n# C\n`, README), {tier, declared: true, diagnostics: []});
  assert.deepEqual(changeTier('# C\n', README), {tier: 'medium', declared: false, diagnostics: []});
  assert.deepEqual(changeTier('---\nother: 1\n---\n# C\n', README).tier, 'medium');
  const invalid = changeTier('---\ntier: tiny\n---\n# C\n', README);
  assert.equal(invalid.tier, 'medium');assert.deepEqual(codes(invalid.diagnostics), ['invalid-tier']);assert.equal(invalid.diagnostics[0].path, README);
});

test('compatibility: valid values, an invalid value and absence', () => {
  for (const level of ['patch', 'minor', 'major']) assert.equal(planCompatibility(`---\ntasks: []\ncompatibility: ${level}\n---\n`, PLAN).compatibility, level);
  assert.deepEqual(planCompatibility('---\ntasks: []\n---\n', PLAN), {compatibility: null, diagnostics: []});
  assert.deepEqual(codes(planCompatibility('---\ncompatibility: 2.0.0\n---\n', PLAN).diagnostics), ['invalid-compatibility']);
});

test('covers: valid entries with the default artifact, invalid shapes and absence', () => {
  const valid = taskCovers('---\nid: login\ndepends_on: []\ncovers:\n  - element: requirements/login.md\n    ids: [L1, L2]\n  - artifact: tenant\n    element: requirements/identity.md\n    ids: [T3]\n---\n# T\n', TASK);
  assert.deepEqual(valid, {covers: [{artifact: 'authentication', element: 'requirements/login.md', ids: ['L1', 'L2']}, {artifact: 'tenant', element: 'requirements/identity.md', ids: ['T3']}], diagnostics: []});
  assert.deepEqual(taskCovers('---\nid: login\ndepends_on: []\n---\n# T\n', TASK), {covers: [], diagnostics: []});
  for (const bad of ['covers: []', 'covers: [{element: specifications/x.md, ids: [A1]}]', 'covers: [{element: requirements/x.md, ids: []}]', 'covers: [{element: requirements/x.md, ids: [a1]}]', 'covers: [{element: requirements/../x.md, ids: [A1]}]', 'covers: [{element: requirements/x.md, ids: [A1], note: x}]'])
    assert.deepEqual(codes(taskCovers(`---\n${bad}\n---\n`, TASK).diagnostics), ['invalid-covers'], bad);
});

test('requirement IDs: list items and paragraph labels, outside front matter and fences; duplicates in either form', () => {
  const markdown = '---\nnote: "- X1: not an ID"\n---\n# Need\n\nR1. First rule.\n\n- R2: Second rule.\n- not an ID\n\n```text\n- R9: example\n```\n\nR10. Tenth rule.\n';
  assert.deepEqual(requirementIds(markdown).map(({id, line, form}) => [id, line, form]), [['R1', 6], ['R2', 8], ['R10', 15]].map(([id, line], i) => [id, line, i === 1 ? 'list' : 'paragraph']));
  assert.deepEqual(duplicateIds(requirementIds('- A1: one\nA1. again\n- A2: two\n'), 'r.md').map(d => [d.code, d.path]), [['requirement-id-duplicate', 'r.md']]);
  assert.deepEqual(duplicateIds(requirementIds('- A1: one\n- A2: two\n'), 'r.md'), []);
});

test('configuration: defaults, a changed limit and an unknown key', () => {
  assert.deepEqual(readConfig(undefined), {config: DEFAULT_CONFIG, present: false, diagnostics: []});
  const changed = readConfig('version: 1\ntiers:\n  small:\n    max_code_lines: 50\nunit_brief:\n  required_for: [large]\nreading:\n  coordinator: [docs/team.md]\n');
  assert.equal(changed.config.tiers.small.max_code_lines, 50);assert.deepEqual(changed.config.unit_brief.required_for, ['large']);
  assert.deepEqual(changed.config.reading.coordinator, ['docs/team.md']);assert.deepEqual(changed.config.reading.implementer, []);assert.deepEqual(changed.diagnostics, []);
  for (const bad of ['tiers:\n  small:\n    max_code_lines: -1\n', 'extra: true\n', 'version: 2\n', 'reading:\n  reviewer: []\n', 'unit_brief:\n  required_for: [tiny]\n', '- a list\n']) {
    const result = readConfig(bad);
    assert.deepEqual(codes(result.diagnostics), ['config-invalid'], bad);assert.equal(result.diagnostics[0].path, CONFIG_PATH);
    assert.deepEqual(result.config, DEFAULT_CONFIG, bad);
  }
});

test('the scanner reports field diagnostics and reads the configuration; existing records stay valid', async t => {
  const files = inPlaceFixture();
  files.set(README, '---\ntier: tiny\n---\n# Change\n');
  files.set(PLAN, '---\ntasks: [01-login.md]\ncompatibility: huge\n---\n# Plan\n');
  files.set(TASK, '---\nid: login\ndepends_on: []\ncovers: []\n---\n# Task\n');
  files.set('docs/artifacts/authentication/requirements/login.md', '# Login need\n\n- L1: one\n- L1: again\n');
  files.set(CONFIG_PATH, 'unknown: 1\n');
  const f = await fixtureRepository(files); t.after(f.cleanup);
  const {snapshot} = await scanRepository(f.root);
  const found = snapshot.diagnostics.filter(d => ['invalid-tier', 'invalid-compatibility', 'invalid-covers', 'requirement-id-duplicate', 'config-invalid'].includes(d.code)).map(d => d.code).sort();
  assert.deepEqual(found, ['config-invalid', 'invalid-compatibility', 'invalid-covers', 'invalid-tier', 'requirement-id-duplicate']);
  const change = snapshot.artifacts.find(a => a.id === 'authentication').changes.find(c => c.name === 'change-login');
  assert.equal(change.tier, 'medium');assert.equal(change.tierDeclared, false);assert.equal(change.compatibility, null);
  const clean = await fixtureRepository(inPlaceFixture()); t.after(clean.cleanup);
  const before = await scanRepository(clean.root);
  assert.deepEqual(before.snapshot.diagnostics.filter(d => ['invalid-tier', 'invalid-compatibility', 'invalid-covers', 'requirement-id-duplicate', 'config-invalid'].includes(d.code)), []);
  assert.equal(before.snapshot.artifacts.find(a => a.id === 'authentication').changes.find(c => c.name === 'change-login').tier, 'medium');
});

test('a task evidence record without source resolves to its Evidence section in the declared change evidence', async t => {
  assert.equal(evidenceSource({id: 'x'}, TASK), `${TASK}#evidence`);assert.equal(evidenceSource({source: 'a.md#b'}, TASK), 'a.md#b');
  const files = inPlaceFixture();
  files.set(PLAN, '---\ntasks: [01-login.md]\n---\n# Plan\n');
  files.set(TASK, '---\nid: login\ndepends_on: []\nevidence_records:\n  - {id: tests, method: npm test, result: passed}\n---\n# Task\n\n- [x] Done.\n\n## Evidence\n\nTests passed: 12 of 12.\n');
  const f = await fixtureRepository(files); t.after(f.cleanup);
  const data = await scanRepository(f.root), diagnostics = [];
  const login = (await evidenceFor(f.root, data, readerGit, null, diagnostics)).find(c => c.artifact === 'authentication' && c.name === 'change-login');
  assert.deepEqual(diagnostics, []);
  const validation = login.steps.find(s => s.name === 'Validation');
  assert.equal(validation.state, 'documented-complete');assert.match(validation.evidence[0].text ?? JSON.stringify(validation.evidence[0]), /#evidence/);
  // Without an Evidence section, the default source does not resolve.
  files.set(TASK, '---\nid: login\ndepends_on: []\nevidence_records:\n  - {id: tests, method: npm test, result: passed}\n---\n# Task\n\n- [x] Done.\n');
  const g = await fixtureRepository(files); t.after(g.cleanup);
  const missing = [];
  await evidenceFor(g.root, await scanRepository(g.root), readerGit, null, missing);
  assert.deepEqual(codes(missing), ['missing-evidence']);
});
