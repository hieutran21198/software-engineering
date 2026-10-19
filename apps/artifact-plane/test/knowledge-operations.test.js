import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, inPlaceFixture, sourceFixture, fingerprint, git} from './fixtures.js';
import {createKnowledgeService, slug, uniqueId} from '../server/knowledge-operations.js';
import {validateKnowledge} from '../scripts/validate-knowledge.mjs';
import {scanRepository} from '../server/reader.js';
import {evidenceFor} from '../server/workflow.js';

async function editable(files = inPlaceFixture(), branch = 'work') {
  const fixture = await fixtureRepository(files);
  git(fixture.root, 'switch', '-q', '-c', branch);
  return fixture;
}
// Preview, then apply with the previewed digests, as the user interface does.
// Every applied operation changes exactly the files that its response lists,
// with the bytes that its preview showed.
function operator(root, service = createKnowledgeService()) {
  const run = async (operation, input) => {
    const before = await fingerprint(root);
    const preview = await service.apply({path: root, operation, input, dryRun: true});
    assert.deepEqual(await fingerprint(root), before);
    const applied = await service.apply({path: root, operation, input, expected: preview.expected});
    const after = await fingerprint(root);
    assert.deepEqual(Object.keys(diff(before, after)).sort(), applied.files.map(x => x.path).sort(), operation);
    for (const file of applied.files) assert.equal(after[file.path] === undefined ? null : Buffer.from(after[file.path], 'base64').toString(), file.after, file.path);
    assert.deepEqual(applied.files.map(x => x.after), preview.files.map(x => x.after));
    return applied;
  };
  run.service = service;
  return run;
}
const read = (root, path) => readFile(join(root, path), 'utf8');
// Changed lines of every file between two fingerprints.
function diff(before, after) {
  const result = {};
  for (const path of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[path] === after[path]) continue;
    const a = before[path] ? Buffer.from(before[path], 'base64').toString().split('\n') : [], b = after[path] ? Buffer.from(after[path], 'base64').toString().split('\n') : [];
    result[path] = {removed: a.filter(line => !b.includes(line)), added: b.filter(line => !a.includes(line))};
  }
  return result;
}
const errors = async root => (await validateKnowledge(root)).diagnostics.filter(d => d.severity === 'error');

test('W3: identifiers follow NFKD, lowercase and hyphen rules with collision suffixes', () => {
  assert.equal(slug('Ünïcode  Title! (v2)'), 'unicode-title-v2');
  assert.equal(slug('--Tenant/Naming--'), 'tenant-naming');
  assert.equal(uniqueId('a', ['a', 'a-2']), 'a-3');
});

test('W3/W5: change, document, reference and self-check operations write only their derived records', async t => {
  const f = await editable();t.after(f.cleanup);
  const run = operator(f.root);
  // A dry run writes nothing.
  const before = await fingerprint(f.root);
  const preview = await run.service.apply({path: f.root, operation: 'change.start', input: {artifact: 'tenant', title: 'Tenant naming', reason: 'Tenants need names.', unit: {title: 'Tenant naming'}}, dryRun: true});
  assert.equal(preview.applied, false);
  assert.deepEqual(await fingerprint(f.root), before);
  const started = await run('change.start', {artifact: 'tenant', title: 'Tenant naming', reason: 'Tenants need names.', unit: {title: 'Tenant naming'}});
  assert.deepEqual(started.result, {artifact: 'tenant', change: 'change-tenant-naming', unit: 'tenant-naming'});
  assert.deepEqual(started.files.map(x => [x.action, x.path]), [['create', 'docs/artifacts/tenant/changes/change-tenant-naming/README.md'], ['create', 'docs/artifacts/tenant/changes/change-tenant-naming/tasks/README.md'], ['create', 'docs/artifacts/units-of-work/tenant-naming/README.md']]);
  assert.deepEqual(Object.keys(diff(before, await fingerprint(f.root))).sort(), started.files.map(x => x.path).sort());
  await assert.rejects(run('change.start', {artifact: 'tenant', title: 'Other', reason: 'Why.'}), e => e.status === 422 && e.code === 'open-change');
  // Templates contain no passed self-check and no checked item.
  for (const file of started.files) assert.ok(!/result: passed|- \[x\]/.test(file.after));

  const requirement = await run('document.add', {artifact: 'tenant', kind: 'requirement', title: 'Tenant naming'});
  assert.equal(requirement.result.path, 'docs/artifacts/tenant/requirements/tenant-naming.md');
  assert.equal((await run('document.add', {artifact: 'tenant', kind: 'requirement', title: 'Tenant naming'})).result.path, 'docs/artifacts/tenant/requirements/tenant-naming-2.md');
  assert.equal((await run('document.add', {artifact: 'tenant', kind: 'decision', title: 'Use slugs'})).result.path, 'docs/artifacts/tenant/decisions/001-use-slugs.md');
  assert.equal((await run('document.add', {artifact: 'tenant', kind: 'decision', title: 'Keep IDs'})).result.path, 'docs/artifacts/tenant/decisions/002-keep-ids.md');

  const path = requirement.result.path, b1 = await fingerprint(f.root);
  await run('selfcheck.record', {path, result: 'passed', detail: 'The need and criteria are complete.'});
  const d1 = diff(b1, await fingerprint(f.root))[path];
  assert.deepEqual(d1.removed, ['Not recorded.']);
  assert.ok(d1.added.includes(`  source: ${path}#self-check`) && d1.added.includes('The need and criteria are complete.'));

  const ref = await run('reference.add', {path, artifact: 'authentication', element: 'requirements/login.md', requires: 'Login names.'});
  assert.equal(ref.result.label, 'established');
  await assert.rejects(run('reference.add', {path, artifact: 'authentication', element: 'requirements/login.md', requires: 'Again.'}), e => e.status === 409);
  await assert.rejects(run('reference.add', {path, artifact: 'authentication', element: 'requirements/missing.md', requires: 'X.'}), e => e.status === 422 && e.field === 'target');
  await run('reference.remove', {path, artifact: 'authentication', element: 'requirements/login.md'});
  assert.match(await read(f.root, path), /references: \[\]/);

  // Saving a body keeps the front matter; a stale digest returns the current text.
  const text = await read(f.root, path), front = text.slice(0, text.indexOf('\n---\n') + 5);
  // Removing the recorded self-check section would break its source; the save is refused.
  await assert.rejects(run('document.save', {path, body: '\n# Tenant naming\n\nTenants need unique names.\n'}), e => e.status === 422 && e.diagnostics.some(d => d.code === 'missing-evidence' && d.state === 'new'));
  const saved = await run('document.save', {path, body: '\n# Tenant naming\n\nTenants need unique names.\n\n## Self-check\n\nThe need and criteria are complete.\n'});
  assert.ok(saved.files[0].after.startsWith(front));
  await assert.rejects(run.service.apply({path: f.root, operation: 'document.save', input: {path, body: '# Stale\n'}, expected: {[path]: 'f'.repeat(64)}}), e => e.status === 409 && e.code === 'digest-mismatch' && e.current[path].includes('Tenants need unique names.'));

  await assert.rejects(run('document.properties.set', {path, frontMatter: 'references: [\n'}), e => e.status === 422 && e.field === 'frontMatter');
  await assert.rejects(run('document.properties.set', {path, frontMatter: 'references: 3\n'}), e => e.status === 422 && e.code === 'validation-failed' && e.diagnostics.some(d => d.code === 'invalid-reference' && d.state === 'new'));
  const props = await run('document.properties.set', {path, frontMatter: 'note: kept\n'});
  assert.ok(props.files[0].after.endsWith('The need and criteria are complete.\n'));
  const removed = await run('document.delete', {path: 'docs/artifacts/tenant/specifications/identity.md'});
  assert.ok(removed.diagnostics.some(d => d.code === 'unresolved-reference' && d.severity === 'warning'));
  await assert.rejects(run('document.delete', {path: 'docs/artifacts/tenant/changes/change-tenant-naming/README.md'}), e => e.status === 422 && e.field === 'path');
});

test('W3/W5: artifact creation, dependency cycles, legacy refusal and migration', async t => {
  const f = await editable();t.after(f.cleanup);
  const run = operator(f.root);
  const created = await run('artifact.create', {title: 'Billing Ledger', purpose: 'Track charges.', dependsOn: ['tenant']});
  assert.equal(created.result.artifact, 'billing-ledger');
  assert.match(created.files.find(x => x.path.endsWith('billing-ledger/README.md')).after, /^---\ncurrent_version: null\ndepends_on: \[tenant\]\n---\n\n# Billing Ledger\n\nTrack charges\.\n$/);
  assert.equal((await run('artifact.create', {title: 'Billing ledger'})).result.artifact, 'billing-ledger-2');
  await assert.rejects(run('artifact.create', {title: 'X', id: 'Bad_ID'}), e => e.status === 422 && e.field === 'id');
  await assert.rejects(run('artifact.dependencies.set', {artifact: 'tenant', dependsOn: ['billing-ledger']}), e => e.status === 422 && /cycle: .*tenant → billing-ledger → tenant|cycle: .*billing-ledger → tenant → billing-ledger/.test(e.message));
  await assert.rejects(run('artifact.dependencies.set', {artifact: 'tenant', dependsOn: ['nobody']}), e => e.status === 422 && e.field === 'dependsOn');
  const deps = await run('artifact.dependencies.set', {artifact: 'billing-ledger', dependsOn: ['tenant', 'authentication']});
  assert.deepEqual(diff({a: Buffer.from(deps.files[0].before).toString('base64')}, {a: Buffer.from(deps.files[0].after).toString('base64')}).a, {removed: ['depends_on: [tenant]'], added: ['depends_on: [authentication, tenant]']});
  assert.deepEqual((await errors(f.root)).map(d => d.code), []);

  const legacy = await editable(new Map([...sourceFixture(), ['docs/artifacts/tenant/versions/1.0.0/README.md', '# Snapshot\n'], ['docs/artifacts/authentication/versions/1.0.0/README.md', '# Snapshot\n']]));t.after(legacy.cleanup);
  const runLegacy = operator(legacy.root);
  await assert.rejects(runLegacy('document.add', {artifact: 'tenant', kind: 'requirement', title: 'X'}), e => e.status === 422 && e.code === 'protected-record');
  const plan = await runLegacy.service.apply({path: legacy.root, operation: 'artifact.migrate', input: {artifact: 'tenant'}, dryRun: true});
  assert.ok(plan.files.some(x => x.path === 'docs/artifacts/tenant/specifications/identity.md' && x.action === 'create'));
  await runLegacy('artifact.migrate', {artifact: 'tenant'});
  const after = await scanRepository(legacy.root);
  assert.equal(after.snapshot.artifacts.find(a => a.id === 'tenant').layout, 'in-place');
  assert.equal(after.snapshot.artifacts.find(a => a.id === 'authentication').layout, 'legacy');
});

test('W3/W5: plan, evidence, version and publication operations keep plans consistent and protect delivered tasks', async t => {
  const f = await editable();t.after(f.cleanup);
  const run = operator(f.root);
  await run('change.start', {artifact: 'tenant', title: 'Names', reason: 'Names.'});
  const change = {artifact: 'tenant', change: 'change-names'}, prefix = 'docs/artifacts/tenant/changes/change-names/tasks/';
  const one = await run('task.add', {...change, title: 'Rename tenants', dod: ['Names are unique.', 'Tests pass.'], scope: 'server/names.js'});
  assert.equal(one.result.path, `${prefix}01-rename-tenants.md`);
  assert.match(one.files.find(x => x.path.endsWith('README.md')).after, /tasks:\n  - 01-rename-tenants\.md\n/);
  await run('task.add', {...change, title: 'Document names', prerequisites: ['rename-tenants']});
  await assert.rejects(run('task.add', {...change, title: 'Bad', prerequisites: ['nobody']}), e => e.field === 'prerequisites');
  await assert.rejects(run('task.remove', {...change, id: 'rename-tenants'}), e => e.status === 422 && /depend on rename-tenants/.test(e.message));
  const b = await fingerprint(f.root);
  await run('task.checklist.set', {path: `${prefix}01-rename-tenants.md`, index: 1, checked: true});
  assert.deepEqual(diff(b, await fingerprint(f.root))[`${prefix}01-rename-tenants.md`], {removed: ['- [ ] Tests pass.'], added: ['- [x] Tests pass.']});
  await run('task.update', {...change, id: 'rename-tenants', dod: ['Names are unique.', 'Tests pass.', 'Docs link names.']});
  assert.match(await read(f.root, `${prefix}01-rename-tenants.md`), /- \[ \] Names are unique\.\n- \[x\] Tests pass\.\n- \[ \] Docs link names\./);
  await run('evidence.record', {path: `${prefix}01-rename-tenants.md`, method: 'node --test', result: 'passed', detail: 'All tests passed in test/names.test.js.'});
  await run('plan.selfcheck.record', {...change, result: 'passed', detail: 'Two tasks form an acyclic graph.'});
  const scan = await scanRepository(f.root), diagnostics = [];
  const [flow] = (await evidenceFor(f.root, scan, git, null, diagnostics)).filter(c => c.name === 'change-names');
  assert.equal(flow.steps.find(s => s.name === 'Plan').state, 'documented-complete');
  assert.ok(flow.steps.find(s => s.name === 'Validation').evidence.length);
  assert.deepEqual(diagnostics, []);

  await assert.rejects(run('version.prepare', {...change, level: 'minor', reason: 'Adds names.', summary: 'Names.'}), e => e.status === 422 && e.code === 'unchecked-dod' && e.unchecked.length === 3);
  const version = await run('version.prepare', {...change, level: 'minor', reason: 'Adds names.', summary: 'Tenants have names.', acknowledgeUnchecked: true});
  assert.equal(version.result.version, '1.1.0');
  assert.deepEqual(version.files.map(x => x.path).sort(), ['docs/artifacts/tenant/README.md', 'docs/artifacts/tenant/versions/1.1.0/README.md']);
  assert.match(version.files.find(x => x.path.endsWith('1.1.0/README.md')).after, /^---\nsource_change: change-names\n---\n\n# tenant 1\.1\.0 — Names\n\nCompatible minor version\. Adds names\./);
  await assert.rejects(run('task.add', {...change, title: 'Late'}), e => e.code === 'protected-record');
  await assert.rejects(run('task.checklist.set', {path: `${prefix}01-rename-tenants.md`, index: 0, checked: true}), e => e.code === 'protected-record');

  await assert.rejects(run('publication.record', {artifact: 'tenant', version: '1.1.0', repository: 'http://github.com/o/r', pullRequest: 'https://github.com/o/r/pull/1', scope: 'All.', detail: 'Merged.'}), e => e.field === 'repository');
  await assert.rejects(run('publication.record', {artifact: 'tenant', version: '1.1.0', repository: 'https://github.com/o/r', pullRequest: 'https://github.com/x/r/pull/1', scope: 'All.', detail: 'Merged.'}), e => e.field === 'pullRequest');
  const review = await run('publication.record', {artifact: 'tenant', version: '1.1.0', repository: 'https://github.com/o/r', pullRequest: 'https://github.com/o/r/pull/1', scope: 'Knowledge and code.', detail: 'All required knowledge and code changes landed on main through PR #1.'});
  assert.equal(review.result.source, 'docs/artifacts/tenant/versions/1.1.0/README.md#publication-review');
  await assert.rejects(run('publication.record', {artifact: 'tenant', version: '1.1.0', repository: 'https://github.com/o/r', pullRequest: 'https://github.com/o/r/pull/1', scope: 'Again.', detail: 'Again.'}), e => e.status === 409);
  git(f.root, 'remote', 'add', 'origin', 'git@github.com:o/r.git');
  const derived = await run.service.apply({path: f.root, operation: 'publication.record', input: {artifact: 'tenant', version: '1.1.0', pullRequest: 'https://github.com/o/r/pull/2', scope: 'Code.', detail: 'Code landed.'}, dryRun: true});
  assert.match(derived.files.find(x => x.path.endsWith('tenant/README.md')).after, /repository: https:\/\/github\.com\/o\/r\n/);
  assert.deepEqual((await errors(f.root)).map(d => d.code), []);
});

test('W3: undo restores an operation and refuses after an external edit', async t => {
  const f = await editable();t.after(f.cleanup);
  const run = operator(f.root), path = 'docs/artifacts/authentication/requirements/login.md';
  const saved = await run('document.save', {path, body: '# Login need\n\nChanged.\n'});
  await run('undo', {operationId: saved.operationId});
  assert.equal(await read(f.root, path), '# Login need\n');
  await assert.rejects(run('undo', {operationId: saved.operationId}), e => e.status === 404);
  const again = await run('document.save', {path, body: '# Login need\n\nAgain.\n'});
  await writeFile(join(f.root, path), '# Someone else\n');
  await assert.rejects(run('undo', {operationId: again.operationId}), e => e.status === 409 && e.code === 'undo-conflict');
});

test('W3/W5: unit operations enforce membership, criteria, evidence sources and flow assessment', async t => {
  const f = await editable();t.after(f.cleanup);
  const run = operator(f.root);
  await run('change.start', {artifact: 'tenant', title: 'Names', reason: 'Names.'});
  // authentication already has two open changes in the fixture; use change-login.
  const members = [{artifact: 'tenant', change: 'change-names'}, {artifact: 'authentication', change: 'change-login'}];
  await assert.rejects(run('unit.create', {title: 'Naming', changes: members, acceptance: [{criterion: 'Names work.'}], flowAssessment: 'None.'}), e => e.field === 'acceptance');
  await assert.rejects(run('unit.create', {title: 'Naming', changes: members, acceptance: [{criterion: 'Names work.', integration: true}]}), e => e.field === 'flowAssessment');
  const unit = await run('unit.create', {title: 'Naming', purpose: 'Names everywhere.', changes: members, acceptance: [{criterion: 'Names work end to end.', integration: true}], flowAssessment: 'No flow changes; names are data.'});
  assert.equal(unit.result.unit, 'naming');
  await assert.rejects(run('unit.create', {title: 'Other', changes: [members[0]], acceptance: [{criterion: 'X.'}], flowAssessment: 'None.'}), e => e.field === 'changes' && /belongs to naming/.test(e.message));
  await assert.rejects(run('unit.member.add', {unit: 'naming', artifact: 'authentication', change: 'change-initial'}), e => e.field === 'changes' || e.field === 'artifact');
  await run('unit.member.remove', {unit: 'naming', artifact: 'authentication', change: 'change-login'});
  await assert.rejects(run('unit.member.remove', {unit: 'naming', artifact: 'tenant', change: 'change-names'}), e => e.field === 'change');
  await run('unit.member.add', {unit: 'naming', artifact: 'authentication', change: 'change-login'});
  await assert.rejects(run('unit.evidence.record', {unit: 'naming', criterion: 'names-work-end', method: 'Suite', result: 'passed', source: 'docs/artifacts/tenant/requirements/missing.md'}), e => e.field === 'source');
  const evidence = await run('unit.evidence.record', {unit: 'naming', criterion: 'names-work-end', method: 'Combined suite', result: 'passed', detail: 'npm test and the browser suite passed.'});
  assert.equal(evidence.result.source, 'docs/artifacts/units-of-work/naming/README.md#combined-checks');
  await assert.rejects(run('unit.acceptance.set', {unit: 'naming', criteria: [{id: 'other', criterion: 'Other.', integration: true}]}), e => /names-work-end/.test(e.message));
  await run('unit.acceptance.set', {unit: 'naming', criteria: [{id: 'names-work-end', criterion: 'Names work end to end.', integration: true}, {criterion: 'Docs explain names.'}]});
  await run('unit.flows.set', {unit: 'naming', affectedFlows: [], flowAssessment: 'Names are data; no flow changes.'});
  assert.deepEqual((await errors(f.root)).map(d => d.code), []);
});

const modelSpec = '---\nmodels:\n  - id: user\n    title: User\n    description: A person.\n    sources: [specifications/identity.md]\n---\n# Domain\n';
const flowText = `---
# Comments survive flow edits.
flow:
  id: onboarding
  artifact: tenant
  title: Onboarding
  trigger: An admin adds a tenant.
  outcome: The tenant signs in.
  entry_steps:
    - enter
  participants:   # semantic layer
    - id: admin
      artifact: tenant
      model: user
      requires: The person who adds tenants.
  steps:
    - id: enter
      title: Enter the name
      supports:
        - identity
      interactions:
        - from: admin
          to: admin
          action: Types the name
          outcome: A name exists
          supports: [identity]
    - id: confirm
      title: Confirm
      supports: []
  transitions:
    - from: enter
      to: confirm
  support:
    - id: identity
      kind: element
      artifact: tenant
      element: specifications/identity.md
      requires: Identity rules.
      basis: documented
  x-owner-note: unknown keys stay
---

# Onboarding
`;
test('W3/W5: flow operations edit steps, transitions and support in place and keep the semantic layer byte for byte', async t => {
  const files = inPlaceFixture();
  files.set('docs/artifacts/tenant/specifications/domain.md', modelSpec);
  files.set('docs/artifacts/tenant/specifications/flows/onboarding.md', flowText);
  files.set('src/names.js', 'export const names = 1;\n');
  const f = await editable(files);t.after(f.cleanup);
  const run = operator(f.root), flow = {artifact: 'tenant', flow: 'onboarding'}, path = 'docs/artifacts/tenant/specifications/flows/onboarding.md';
  const preserved = ['# Comments survive flow edits.', '  participants:   # semantic layer', '      interactions:', '          action: Types the name', '          supports: [identity]', '  x-owner-note: unknown keys stay'];
  const check = async () => {const text = await read(f.root, path);for (const line of preserved) assert.ok(text.includes(line), line);};
  const created = await run('flow.create', {artifact: 'tenant', title: 'Tenant offboarding', trigger: 'An admin removes a tenant.', outcome: 'The tenant cannot sign in.', firstStep: 'Select the tenant'});
  assert.deepEqual(created.diagnostics.filter(d => d.state === 'new').map(d => d.code), ['flow-evidence-gap']);
  await run('flow.step.add', {...flow, title: 'Notify owner', after: 'confirm'});await check();
  await run('flow.step.update', {...flow, step: 'notify-owner', title: 'Notify the owner', supports: ['identity']});await check();
  await run('flow.transition.set', {...flow, from: 'enter', to: 'confirm', condition: 'The name is valid.'});await check();
  await run('flow.step.move', {...flow, step: 'notify-owner', to: 1});await check();
  await assert.rejects(run('flow.support.add', {...flow, kind: 'implementation', target: {path: 'src/untracked.js'}, requires: 'Code.'}), e => e.field === 'target');
  await assert.rejects(run('flow.support.add', {...flow, kind: 'test', target: {path: 'src/names.js'}, requires: 'Code.', basis: 'observed'}), e => e.field === 'evidence');
  const code = await run('flow.support.add', {...flow, kind: 'implementation', target: {path: 'src/names.js'}, requires: 'Name storage.', basis: 'static', steps: ['confirm']});
  assert.equal(code.result.support, 'names');await check();
  await run('flow.support.update', {...flow, support: 'names', requires: 'Stores names.'});await check();
  await run('flow.meta.set', {...flow, gaps: ['Owner notification is manual.'], title: 'Tenant onboarding'});await check();
  await assert.rejects(run('flow.support.remove', {...flow, support: 'identity'}), e => e.field === 'support');
  await run('flow.support.remove', {...flow, support: 'names'});await check();
  await run('flow.transition.remove', {...flow, from: 'enter', to: 'confirm'});await check();
  await run('flow.step.remove', {...flow, step: 'confirm'});await check();
  await assert.rejects(run('flow.step.add', {...flow, title: 'Bad', supports: ['nobody']}), e => e.field === 'supports');
  const text = await read(f.root, path);
  assert.match(text, /entry_steps:\n    - enter\n/);
  assert.ok(!text.includes('id: confirm') && text.includes('id: notify-owner'));
  assert.deepEqual((await errors(f.root)).map(d => d.code), []);
});

test('W4: every operation refuses protected branches and unregistered worktrees', async t => {
  const f = await fixtureRepository(inPlaceFixture());t.after(f.cleanup);
  const service = createKnowledgeService();
  await assert.rejects(service.apply({path: f.root, operation: 'document.add', input: {artifact: 'tenant', kind: 'requirement', title: 'X'}, dryRun: true}), e => e.status === 403);
  await assert.rejects(service.apply({path: f.root, worktree: '/tmp', operation: 'document.add', input: {}}), e => e.status === 404);
  await assert.rejects(service.apply({path: f.root, operation: 'nope'}), e => e.status === 400);
  await assert.rejects(service.apply({path: f.root, operation: 'undo', extra: 1}), e => e.status === 400);
});

test('B7: claim.record and claim.verify write only the claim list and its detail section', async t => {
  const f = await editable();t.after(f.cleanup);
  const run = operator(f.root), task = 'docs/artifacts/authentication/changes/change-login/tasks/01-login.md', spec = 'docs/artifacts/authentication/specifications/login.md';
  const before = await fingerprint(f.root);
  const hypothesis = await run('claim.record', {path: task, kind: 'hypothesis', statement: 'Login fails because tokens expire early.', status: 'refuted', basis: 'observed', detail: 'Tokens lived the full 30 minutes in the trace.'});
  assert.deepEqual(hypothesis.result, {path: task, id: 'login-fails-because-tokens'});
  const changed = diff(before, await fingerprint(f.root));
  assert.deepEqual(Object.keys(changed), [task]);
  assert.deepEqual(changed[task].removed, ['Implementation has not started.']);
  const text = await read(f.root, task);
  assert.match(text, /claims:\n  - id: login-fails-because-tokens\n    kind: hypothesis\n/);
  assert.match(text, /evidence:\n      - docs\/artifacts\/authentication\/changes\/change-login\/tasks\/01-login.md#login-fails-because-tokens\n/);
  assert.match(text, /## Evidence\n\n### login-fails-because-tokens\n\nTokens lived the full 30 minutes in the trace\.\n/);

  const decision = await run('claim.record', {path: spec, id: 'cookie-session', kind: 'decision', statement: 'Keep the session in a cookie.', basis: 'inferred', check: 'Open two tabs and sign out in one.', rejected: [{option: 'Local storage', reason: 'Scripts can read it.'}], riskIfWrong: 'Sessions leak across tabs.', about: ['authentication:specifications/login.md']});
  assert.equal(decision.result.id, 'cookie-session');
  const specText = await read(f.root, spec);
  assert.match(specText, /status: open\n    basis: inferred\n    check: Open two tabs and sign out in one\.\n    rejected:\n      - option: Local storage\n        reason: Scripts can read it\.\n    risk_if_wrong: Sessions leak across tabs\.\n/);
  assert.ok(!specText.includes('## Claim evidence'));

  for (const input of [{status: 'verified'}, {verifiedBy: 'person'}, {verified_by: 'agent'}]) await assert.rejects(run('claim.record', {path: spec, kind: 'assumption', statement: 'Tokens are signed.', basis: 'inferred', ...input}), e => e.status === 422);
  await assert.rejects(run('claim.record', {path: spec, kind: 'risk', statement: 'x y', basis: 'inferred', rejected: [{option: 'a', reason: 'b'}]}), e => e.status === 422 && e.field === 'rejected');
  await assert.rejects(run('claim.record', {path: spec, kind: 'guess', statement: 'x y', basis: 'inferred'}), e => e.status === 422 && e.field === 'kind');
  await assert.rejects(run('claim.record', {path: 'docs/artifacts/authentication/README.md', kind: 'risk', statement: 'x y', basis: 'inferred'}), e => e.status === 422 && e.field === 'path');
  // The post-image passes the claim diagnostics: an unresolved source is refused.
  await assert.rejects(run('claim.record', {path: spec, kind: 'assumption', statement: 'Tokens are signed.', status: 'supported', basis: 'observed', evidence: [`${spec}#no-such-heading`]}), e => e.status === 422 && e.diagnostics.some(d => d.code === 'claim-evidence-missing'));

  await assert.rejects(run('claim.verify', {path: spec, id: 'cookie-session', ran: 'Two tabs', observed: '   ', outcome: 'holds'}), e => e.status === 422 && e.field === 'observed');
  await assert.rejects(run('claim.verify', {path: spec, id: 'cookie-session', ran: 'Two tabs', observed: 'Signed out in both.', outcome: 'maybe'}), e => e.status === 422 && e.field === 'outcome');
  await assert.rejects(run('claim.verify', {path: spec, id: 'nope', ran: 'x', observed: 'y', outcome: 'holds'}), e => e.status === 404);
  const held = await run('claim.verify', {path: spec, id: 'cookie-session', ran: 'Open two tabs and sign out in one.', observed: 'The second tab showed the sign-in page after reload.', outcome: 'holds'});
  assert.deepEqual({status: held.result.status, verifiedBy: held.result.verifiedBy}, {status: 'verified', verifiedBy: 'agent'});
  const verified = await read(f.root, spec);
  assert.match(verified, /status: verified\n/);
  assert.match(verified, /evidence:\n      - docs\/artifacts\/authentication\/specifications\/login.md#cookie-session-check\n/);
  assert.match(verified, /verified_by: agent\n/);
  assert.match(verified, /## Claim evidence\n\n### cookie-session-check\n\nRan: Open two tabs and sign out in one\.\n\nObserved: The second tab showed the sign-in page after reload\.\n\nOutcome: the claim holds\. Recorded through the agent interface on \d{4}-\d{2}-\d{2}\.\n/);
  const failed = await run('claim.verify', {path: spec, id: 'cookie-session', ran: 'Open two tabs in two browsers.', observed: 'The second browser stayed signed in.', outcome: 'fails'});
  assert.equal(failed.result.status, 'refuted');
  const refuted = await read(f.root, spec);
  assert.ok(!refuted.includes('verified_by'));
  assert.match(refuted, /#cookie-session-check-2\n/);
  assert.deepEqual(await errors(f.root), []);

  // Undo and digest checks work as for evidence.record.
  await run('undo', {operationId: failed.operationId});
  assert.equal(await read(f.root, spec), verified);
  const preview = await run.service.apply({path: f.root, operation: 'claim.verify', input: {path: spec, id: 'cookie-session', ran: 'x', observed: 'y', outcome: 'fails'}, dryRun: true});
  assert.equal(preview.applied, false);
  assert.equal(await read(f.root, spec), verified);
  await assert.rejects(run.service.apply({path: f.root, operation: 'claim.verify', input: {path: spec, id: 'cookie-session', ran: 'x', observed: 'y', outcome: 'fails'}, expected: {[spec]: 'f'.repeat(64)}}), e => e.status === 409 && e.code === 'digest-mismatch');

  const person = operator(f.root, createKnowledgeService({channel: 'person'}));
  const byPerson = await person('claim.verify', {path: spec, id: 'cookie-session', ran: 'Two browsers', observed: 'Both signed out.', outcome: 'holds'});
  assert.equal(byPerson.result.verifiedBy, 'person');
  await assert.rejects(run.service.apply({path: f.root, operation: 'claim.verify', input: {path: spec, id: 'cookie-session', ran: 'x', observed: 'y', outcome: 'holds'}, channel: 'person'}), e => e.status === 400);
  assert.throws(() => createKnowledgeService({channel: 'admin'}), TypeError);
});
