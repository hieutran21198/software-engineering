import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRepository, inPlaceFixture, git} from './fixtures.js';
import {parseClaims, readClaims, claimRecord} from '../server/claims.js';
import {createKnowledgeService} from '../server/knowledge-operations.js';
import {validateKnowledge} from '../scripts/validate-knowledge.mjs';

const SPEC = 'docs/artifacts/tenant/specifications/identity.md';
const TASK = 'docs/artifacts/tenant/changes/change-initial/tasks/01-deliver.md';
const front = (claims, extra = '') => `---\n${extra}claims:\n${claims}---\n\n# Identity\n\nStable identity rules.\n\n## Claim evidence\n\n### slow-reads\n\nOne read took 0.33 s.\n\n### connections\n\nThe test fails before the fix and passes after it.\n`;
const valid = `  - id: slow-reads
    kind: hypothesis
    statement: The server reads documents slowly.
    status: refuted
    basis: observed
    evidence: [${SPEC}#slow-reads]
  - id: connections
    kind: root_cause
    statement: Two streams per tab use all six connections.
    status: supported
    basis: observed
    evidence: [${SPEC}#connections]
    check: Run the tab test before and after the fix.
    about: [tenant:specifications/identity.md]
  - id: flows-unchanged
    kind: assumption
    statement: The other flows keep their steps.
    status: open
    basis: inferred
    check: Compare the diff with the flow supports.
    risk_if_wrong: A flow step changed without a declaration.
  - id: ledger
    kind: decision
    statement: Use a typed ledger.
    status: verified
    basis: documented
    evidence: [${SPEC}#connections]
    check: Run the benchmark.
    verified_by: person
    rejected:
      - option: Graph database
        reason: A second store.
  - id: old
    kind: assumption
    statement: Depth 3 is the default.
    status: superseded
    basis: inferred
    superseded_by: flows-unchanged
`;
const files = (spec, more = []) => new Map([...inPlaceFixture(), [SPEC, spec], ...more]);
const codes = result => result.diagnostics.map(d => d.code).sort();

test('claim records: a valid list parses with no diagnostic', () => {
  const f = files(front(valid));
  const {claims, diagnostics} = parseClaims(SPEC, f.get(SPEC), f);
  assert.deepEqual(diagnostics, []);
  assert.deepEqual(claims.map(c => [c.id, c.kind, c.status]), [['slow-reads', 'hypothesis', 'refuted'], ['connections', 'root_cause', 'supported'], ['flows-unchanged', 'assumption', 'open'], ['ledger', 'decision', 'verified'], ['old', 'assumption', 'superseded']]);
  assert.equal(claims[3].verifiedBy, 'person');
  assert.deepEqual(claims[3].rejected, [{option: 'Graph database', reason: 'A second store.'}]);
  assert.equal(claims[1].file, SPEC);
  const read = readClaims(f);
  assert.deepEqual(read.diagnostics, []);
  assert.ok(read.byPath.get(SPEC).every(c => c.available));
});

test('claim records: only allowed record types declare claims', () => {
  assert.equal(claimRecord('docs/artifacts/tenant/requirements/a.md'), 'knowledge');
  assert.equal(claimRecord('docs/artifacts/tenant/decisions/001-a.md'), 'knowledge');
  assert.equal(claimRecord('docs/artifacts/tenant/changes/change-x/tasks/README.md'), 'plan');
  assert.equal(claimRecord('docs/artifacts/tenant/changes/change-x/tasks/01-a.md'), 'task');
  assert.equal(claimRecord('docs/artifacts/units-of-work/outcome/README.md'), 'unit');
  for (const path of ['docs/artifacts/tenant/README.md', 'docs/artifacts/tenant/changes/change-x/README.md', 'docs/artifacts/tenant/versions/1.0.0/README.md', 'docs/artifacts/units-of-work/outcome/research.md']) assert.equal(claimRecord(path), null, path);
  assert.equal(claimRecord('docs/artifacts/tenant/specifications/flows/login.md', {flow: {id: 'login'}}), null);
  const path = 'docs/artifacts/tenant/versions/1.0.0/README.md', f = files(front(valid), [[path, `---\nsource_change: change-initial\nclaims: []\n---\n\n# 1.0.0\n`]]);
  const parsed = parseClaims(path, f.get(path), f);
  assert.deepEqual(parsed.claims, []);
  assert.deepEqual(codes(parsed), ['invalid-claim']);
});

test('claim records: each diagnostic code has a trigger', () => {
  const shape = [
    ['  - id: Bad\n    kind: hypothesis\n    statement: x\n    status: open\n    basis: inferred\n', /id must match/],
    ['  - id: a\n    kind: guess\n    statement: x\n    status: open\n    basis: inferred\n', /kind must be/],
    ['  - id: a\n    kind: hypothesis\n    statement: x\n    status: approved\n    basis: inferred\n', /status must be/],
    ['  - id: a\n    kind: hypothesis\n    statement: x\n    status: supported\n    basis: inferred\n', /requires evidence/],
    [`  - id: a\n    kind: hypothesis\n    statement: x\n    status: verified\n    basis: observed\n    evidence: [${SPEC}#connections]\n`, /requires verified_by/],
    ['  - id: a\n    kind: hypothesis\n    statement: x\n    status: open\n    basis: inferred\n    verified_by: person\n', /forbids verified_by/],
    ['  - id: a\n    kind: hypothesis\n    statement: x\n    status: superseded\n    basis: inferred\n    superseded_by: missing\n', /superseded_by must name/],
    ['  - id: a\n    kind: hypothesis\n    statement: x\n    status: open\n    basis: observed\n', /observed requires evidence/],
    ['  - id: a\n    kind: hypothesis\n    statement: x\n    status: open\n    basis: inferred\n    owner: me\n', /unknown key owner/],
    ['  - id: a\n    kind: risk\n    statement: x\n    status: open\n    basis: inferred\n    rejected: [{option: a, reason: b}]\n', /decision claims only/],
    ['  - id: a\n    kind: risk\n    statement: x\n    status: open\n    basis: inferred\n  - id: a\n    kind: risk\n    statement: y\n    status: open\n    basis: inferred\n', /not unique/],
  ];
  for (const [claims, pattern] of shape) {
    const f = files(front(claims)), parsed = parseClaims(SPEC, f.get(SPEC), f);
    assert.ok(parsed.diagnostics.some(d => d.code === 'invalid-claim' && d.severity === 'error' && pattern.test(d.message)), String(pattern));
  }
  const notList = files('---\nclaims: one\n---\n\n# Identity\n');
  assert.deepEqual(codes(parseClaims(SPEC, notList.get(SPEC), notList)), ['invalid-claim']);

  const missing = files(front(`  - id: a\n    kind: hypothesis\n    statement: x\n    status: refuted\n    basis: observed\n    evidence: [${SPEC}#no-such-heading]\n`));
  const m = readClaims(missing);
  assert.deepEqual(codes(m), ['claim-evidence-missing']);
  assert.equal(m.byPath.get(SPEC)[0].available, false);
  const outside = files(front(`  - id: a\n    kind: hypothesis\n    statement: x\n    status: refuted\n    basis: observed\n    evidence: [../secret.md]\n`));
  assert.deepEqual(codes(readClaims(outside)), ['claim-evidence-missing']);

  const failedTask = `---\nid: deliver\ndepends_on: []\nevidence_records:\n  - id: run\n    method: Run the tests.\n    result: failed\n    source: ${TASK}#evidence\n---\n\n# Deliver\n\n## Evidence\n\nThe test failed.\n`;
  const conflict = files(front(`  - id: a\n    kind: hypothesis\n    statement: x\n    status: supported\n    basis: observed\n    evidence: [${TASK}#evidence]\n`), [[TASK, failedTask]]);
  const c = readClaims(conflict);
  assert.deepEqual(codes(c), ['claim-evidence-conflict']);
  assert.equal(c.diagnostics[0].severity, 'error');

  const unchecked = files(front('  - id: a\n    kind: decision\n    statement: x\n    status: open\n    basis: inferred\n'));
  const u = readClaims(unchecked);
  assert.deepEqual(codes(u), ['claim-check-missing']);
  assert.equal(u.diagnostics[0].severity, 'warning');
  assert.equal(u.byPath.get(SPEC)[0].available, true);

  const many = Array.from({length: 11}, (_, i) => `  - id: c${i}\n    kind: risk\n    statement: x\n    status: open\n    basis: inferred\n`).join('');
  const long = files(front(many));
  assert.deepEqual(codes(readClaims(long)), ['claim-list-long']);

  const prepared = {artifacts: [{id: 'tenant', activeChange: 'change-next', elements: [{file: SPEC, source: 'working', state: 'modified'}], changes: [{name: 'change-next', layout: 'in-place', version: '1.1.0'}, {name: 'change-initial', layout: 'in-place', version: '1.0.0'}]}]};
  const baselines = {tenant: {versionRecords: ['1.0.0']}};
  const atVersion = readClaims(files(front(valid)), {snapshot: prepared, baselines});
  assert.deepEqual(atVersion.diagnostics.map(d => [d.code, d.claim]), [['claim-unverified-at-version', 'connections'], ['claim-unverified-at-version', 'flows-unchanged']]);
  assert.ok(atVersion.diagnostics.every(d => d.severity === 'warning'));
  const established = readClaims(files(front(valid)), {snapshot: prepared, baselines: {tenant: {versionRecords: ['1.0.0', '1.1.0']}}});
  assert.deepEqual(established.diagnostics, []);
});

test('claim records: diagnose refuses an edit that breaks a claim, and validate-knowledge reports codes', async () => {
  const f = await fixtureRepository(files(front(valid)));
  git(f.root, 'switch', '-q', '-c', 'work');
  const service = createKnowledgeService();
  await assert.rejects(service.apply({path: f.root, operation: 'document.save', input: {path: SPEC, body: '\n# Identity\n\nStable identity rules.\n'}}),
    e => e.status === 422 && e.diagnostics.some(d => d.code === 'claim-evidence-missing' && d.state === 'new'));
  const request = {path: f.root, operation: 'document.save', input: {path: SPEC, body: '\n# Identity\n\nStable identity rules, reworded.\n\n## Claim evidence\n\n### slow-reads\n\nOne read took 0.33 s.\n\n### connections\n\nThe test fails before the fix and passes after it.\n'}};
  const preview = await service.apply({...request, dryRun: true});
  const kept = await service.apply({...request, expected: preview.expected});
  assert.equal(kept.applied, true);

  const clean = await validateKnowledge(f.root);
  assert.equal(clean.counts.errors, 0);
  assert.ok(!clean.diagnostics.some(d => d.source === 'claims'));

  const warned = await fixtureRepository(files(front('  - id: a\n    kind: decision\n    statement: x\n    status: open\n    basis: inferred\n')));
  const w = await validateKnowledge(warned.root);
  assert.deepEqual(w.diagnostics.filter(d => d.source === 'claims').map(d => [d.code, d.severity]), [['claim-check-missing', 'warning']]);
  assert.equal(w.counts.errors, 0);

  const broken = await fixtureRepository(files(front('  - id: a\n    kind: guess\n    statement: x\n    status: open\n    basis: inferred\n')));
  const b = await validateKnowledge(broken.root);
  assert.deepEqual(b.diagnostics.filter(d => d.source === 'claims').map(d => [d.code, d.severity]), [['invalid-claim', 'error']]);
  assert.equal(b.counts.errors, 1);
});
