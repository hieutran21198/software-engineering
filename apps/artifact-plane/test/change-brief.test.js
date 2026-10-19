import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {impactFiles, impactRepository, unitDoc} from './impact-fixtures.js';
import {git} from './fixtures.js';
import {createReviewService} from '../server/change-review.js';
import {createImpactService} from '../server/impact.js';
import {createFlowMcpServer} from '../server/flow-mcp.js';
import {QUESTIONS, LADDER, claimStep} from '../server/change-brief.js';
import {formatContextMarkdown} from '../src/context-packet.js';

const CATEGORIES = ['Delivered with unmet evidence', 'Claim with an error', 'Open decision', 'Open root cause', 'Undecided flow or unresolved item', 'Open assumption', 'Unknown or risk'];
const TASK = 'docs/artifacts/a/changes/change-x/tasks/01-check.md';
const UNIT = 'docs/artifacts/units-of-work/outcome/README.md';
const unit = (extra = {}) => unitDoc({unit_of_work: 'outcome', changes: [{artifact: 'a', change: 'change-x'}], affected_flows: [{artifact: 'a', flow: 'login', effect: 'modify'}], flow_assessment: 'Login changes.', acceptance: [{id: 'done', criterion: 'Works.'}], evidence: [], ...extra});
const plan = '---\ntasks: [01-check.md]\n---\n# Plan\n\n## Approval and prerequisites\n\nPresent this plan for explicit user approval before implementation.\n\nMore text.\n';
const task = claims => `---\nid: check\ndepends_on: []\n${claims}---\n# Check\n\n## Scope and ownership\n\nOwn src/check.js and test/check.test.js.\n\n## Definition of Done\n\n- [x] The check passes.\n- [ ] The audit line is formatted.\n\n## Evidence\n\n### slow\n\nOne read took 0.3 s.\n\n### control\n\nThe test fails before the fix.\n`;
const claims = `claims:
  - id: cookie
    kind: decision
    statement: Keep the session in a cookie.
    status: open
    basis: inferred
    check: Sign out in one tab and reload the other.
    rejected:
      - option: Local storage
        reason: Scripts can read it.
  - id: expiry
    kind: root_cause
    statement: Tokens expire before the check.
    status: open
    basis: observed
    evidence: [${TASK}#control]
    check: Run the check test before and after the fix.
  - id: slow
    kind: hypothesis
    statement: The check is slow.
    status: refuted
    basis: observed
    evidence: [${TASK}#slow]
  - id: windows
    kind: risk
    statement: Three windows still time out.
    status: supported
    basis: observed
    evidence: [${TASK}#control]
  - id: proxies
    kind: unknown
    statement: Proxies are not analyzed.
    status: open
    basis: documented
`;
const unitClaim = `  - id: helper-stable
    kind: assumption
    statement: The audit helper keeps its output.
    status: open
    basis: inferred
    check: Compare the audit lines.
    risk_if_wrong: Audit lines change format.
    about: [src/util.js]
`;
async function services(t, root, stateDir) {
  const impact = createImpactService({roots: [root], stateDir}), review = createReviewService({roots: [root], impactService: impact});
  t.after(() => impact.close());
  return {impact, review, brief: (change = 'change-x') => review.query({path: root, artifact: 'a', change, operation: 'brief'})};
}
const CONTRACT = 'docs/artifacts/a/specifications/contract.md';
async function openChange(t, {taskClaims = claims} = {}) {
  const files = impactFiles();
  files.set('docs/artifacts/a/versions/1.0.0/README.md', '---\nsource_change: change-initial\n---\n# A 1.0.0\n');
  files.set('docs/artifacts/a/changes/change-initial/README.md', '# Initial\n\n## Reason and scope\n\nStart A.\n');
  files.set(UNIT, unit().replace('evidence: []\n', `evidence: []\nclaims:\n${unitClaim}`));
  const repo = await impactRepository(files);t.after(repo.cleanup);
  git(repo.root, 'switch', '-q', '-c', 'work');
  await repo.write('docs/artifacts/a/changes/change-x/tasks/README.md', plan);
  await repo.write(TASK, task(taskClaims));
  // A changed contract with a claim whose evidence does not resolve.
  await repo.write(CONTRACT, `---\nclaims:\n  - id: format\n    kind: assumption\n    statement: The identity format is stable.\n    status: supported\n    basis: observed\n    evidence: [${CONTRACT}#missing]\n` + impactFiles().get(CONTRACT).slice(4));
  await repo.write('docs/artifacts/a/changes/change-x/README.md', '# Change x\n\n## Reason and scope\n\nMembers lose sessions after the check.\n');
  await repo.write('src/util.js', 'export function helper(){return 3;}\nexport function other(){return 2;}\n');
  await repo.write('src/check.js', "import {helper} from './util.js';\nexport function check(){return helper()+1;}\nexport const unrelated=1;\n");
  repo.commit('work');
  return repo;
}

test('B3: the ladder assigns one step per claim', () => {
  const c = (kind, status, basis, extra = {}) => claimStep({kind, status, basis, evidence: [], verifiedBy: null, ...extra});
  assert.equal(c('unknown', 'open', 'documented'), 'Not analyzed');
  assert.equal(c('assumption', 'open', 'inferred'), 'Inferred');
  assert.equal(c('decision', 'open', 'documented'), 'Explained');
  assert.equal(c('assumption', 'open', 'observed', {evidence: ['x.md']}), 'Recorded experiment');
  assert.equal(c('hypothesis', 'refuted', 'observed', {evidence: ['x.md']}), 'Recorded experiment');
  assert.equal(c('decision', 'verified', 'observed', {evidence: ['x.md'], verifiedBy: 'agent'}), 'Re-checked by an agent, not independent');
  assert.equal(c('decision', 'verified', 'observed', {evidence: ['x.md'], verifiedBy: 'person'}), 'Checked by a person');
  assert.equal(LADDER.length, 8);
});

test('B2/B4/B5/B9: brief of an open change', async t => {
  const repo = await openChange(t), {brief} = await services(t, repo.root, repo.stateDir);
  const result = await brief(), b = result.data;
  assert.equal(b.schema, 'artifact-plane.change-brief.v1');
  assert.deepEqual(b.origin, {kind: 'protected-diff'});
  assert.deepEqual(b.answers.map(a => a.question), QUESTIONS);
  for (const a of b.answers) assert.equal(a.summary === null, a.items.length === 0, a.question);
  for (const a of b.answers) for (const item of a.items) assert.ok(LADDER.includes(item.step), `${a.question}: ${item.step}`);
  const [changed, why, affected, care, , verify, decide] = b.answers;
  assert.ok(changed.items.some(i => i.text === 'modified specifications/contract.md' && i.step === 'Fact from Git'));
  assert.ok(changed.items.some(i => i.text.startsWith('modified src/check.js') && !i.text.includes('not in any task scope')));
  assert.ok(changed.items.some(i => i.text.startsWith('modified src/util.js') && i.text.endsWith('not in any task scope') && i.step === 'Inferred'));
  assert.equal(why.summary, 'Members lose sessions after the check.');
  assert.ok(why.items.some(i => i.claim === 'cookie' && i.text.includes('Rejected: Local storage (Scripts can read it.)')));
  assert.deepEqual(b.flows.reached.map(f => [f.flow, f.state]), [['a:login', 'declared'], ['b:report', 'undecided']]);
  assert.deepEqual(b.flows.undecided.map(u => u.flow ?? u.entity), ['b:report', 'artifact:c']);
  assert.match(affected.summary, /^2 flows reached: 1 declared, 0 decided by a claim, 1 undecided\. 1 unresolved item\.$/);
  // Attention: category order, the cap of seven and the count of the rest.
  const all = ['Claim with an error', 'Open decision', 'Open root cause', 'Undecided flow or unresolved item', 'Undecided flow or unresolved item', 'Open assumption', 'Unknown or risk', 'Unknown or risk'];
  assert.deepEqual(b.attention.rows.map(r => r.category), all.slice(0, 7));
  assert.equal(b.attention.more, 1);
  assert.deepEqual(care.items, b.attention.rows);
  assert.equal(b.attention.rows[0].claim, 'format');
  assert.equal(b.attention.rows[3].step, 'Fact from Git');
  assert.equal(b.attention.rows[4].step, 'Not analyzed');
  // Claims, steps, stale facts and counts.
  const claim = id => b.claims.find(c => c.id === id);
  assert.deepEqual(b.claims.map(c => c.id).sort(), ['cookie', 'expiry', 'format', 'helper-stable', 'proxies', 'slow', 'windows']);
  assert.equal(claim('format').available, false);
  assert.ok(claim('format').diagnostics.some(d => d.code === 'claim-evidence-missing'));
  assert.equal(claim('helper-stable').stale, true);
  assert.equal(claim('expiry').stale, false);
  assert.equal(claim('slow').step, 'Recorded experiment');
  assert.deepEqual(b.counts.byStatus, {open: 4, refuted: 1, supported: 2});
  assert.equal(b.counts.checksByPerson + b.counts.checksByAgent, 0);
  assert.ok(verify.items.some(i => i.text === 'Run test/check.test.js (flow:a:login:check)'));
  assert.ok(!verify.items.some(i => i.claim === 'slow'));
  assert.equal(decide.items[0].text, 'The plan says: “Present this plan for explicit user approval before implementation.” Approval not verified by this reader.');
  assert.equal(decide.items[0].source, 'docs/artifacts/a/changes/change-x/tasks/README.md#approval-and-prerequisites');
  assert.ok(decide.items.some(i => i.text.startsWith('Undecided flow b:report')));
  assert.equal(b.delivery, null);
});

test('B5: a claim that names a reached flow decides it', async t => {
  const about = `  - id: report-unchanged
    kind: assumption
    statement: The report keeps its steps.
    status: open
    basis: inferred
    check: Run the report tests.
    about: [b:report]
`;
  const repo = await openChange(t, {taskClaims: 'claims:\n' + about}), {brief} = await services(t, repo.root, repo.stateDir);
  const b = (await brief()).data;
  assert.deepEqual(b.flows.reached.map(f => [f.flow, f.state]), [['a:login', 'declared'], ['b:report', 'decided']]);
  assert.deepEqual(b.flows.reached[1].decidedBy, {file: TASK, id: 'report-unchanged'});
  assert.deepEqual(b.flows.undecided.map(u => u.flow ?? u.entity), ['artifact:c']);
});

test('B5: a claim names a reached flow by its impact entity identity', async t => {
  const about = `  - id: report-unchanged
    kind: assumption
    statement: The report keeps its steps.
    status: open
    basis: inferred
    check: Run the report tests.
    about: [flow:b:report]
`;
  const repo = await openChange(t, {taskClaims: 'claims:\n' + about}), {brief} = await services(t, repo.root, repo.stateDir);
  const b = (await brief()).data;
  assert.deepEqual(b.flows.reached.map(f => [f.flow, f.state]), [['a:login', 'declared'], ['b:report', 'decided']]);
});

test('B8: brief of a delivered change lists unmet evidence, unchecked DoD and wording notes', async t => {
  const files = impactFiles();
  files.set(UNIT, unit());
  const repo = await impactRepository(files);t.after(repo.cleanup);
  await repo.write('docs/artifacts/a/README.md', '---\ncurrent_version: 1.1.0\ndepends_on: []\n---\n# A\n\nA knowledge.\n');
  await repo.write('docs/artifacts/a/versions/1.1.0/README.md', '---\nsource_change: change-x\n---\n# A 1.1.0\n');
  await repo.write('docs/artifacts/a/changes/change-x/README.md', '# Change x\n\n## Reason and scope\n\nFaster checks.\n');
  await repo.write('docs/artifacts/a/changes/change-x/tasks/README.md', plan);
  await repo.write(TASK, task(''));
  await repo.write('docs/artifacts/a/specifications/identity.md', '# Identity\n\nThe identity model. Measurements remain pending.\n');
  await repo.write(UNIT, unit({evidence: [{criterion: 'done', method: 'Timing run', result: 'failed', source: `${TASK}#control`}]}));
  await repo.write('src/check.js', "import {helper} from './util.js';\nexport function check(){return helper()*2;}\nexport const unrelated=1;\n");
  repo.commit('deliver 1.1.0');
  const head = git(repo.root, 'rev-parse', 'HEAD');
  const {brief} = await services(t, repo.root, repo.stateDir);
  const b = (await brief()).data;
  assert.deepEqual(b.origin, {kind: 'delivery-commit', commit: head, ref: 'refs/heads/main'});
  assert.deepEqual(b.delivery.evidence, [{criterion: 'done', result: 'failed', method: 'Timing run', source: `${TASK}#control`}]);
  assert.deepEqual(b.delivery.unchecked, [{task: 'check', item: 'The audit line is formatted.', source: TASK}]);
  assert.deepEqual(b.delivery.wording.map(w => [w.path, w.step]), [['docs/artifacts/a/specifications/identity.md', 'Inferred']]);
  assert.deepEqual(b.attention.rows.slice(0, 2).map(r => [r.category, r.step]), [['Delivered with unmet evidence', 'Recorded experiment'], ['Delivered with unmet evidence', 'Fact from Git']]);
  assert.equal(b.answers[4].summary === null, b.answers[4].items.length === 0);
});

test('B9/P4: the brief operation, the packet field and get_change_brief agree', async t => {
  const repo = await openChange(t), {review, brief} = await services(t, repo.root, repo.stateDir);
  const direct = await brief();
  const packet = await review.query({path: repo.root, artifact: 'a', change: 'change-x', operation: 'packet'});
  const app = createFlowMcpServer({roots: [repo.root], stateDir: repo.stateDir}), client = new Client({name: 'brief-test', version: '1'});
  const [x, y] = InMemoryTransport.createLinkedPair();
  await app.server.connect(y);await client.connect(x);t.after(() => app.close());
  const tool = (await client.listTools()).tools.find(tool => tool.name === 'get_change_brief');
  assert.deepEqual(tool.annotations, {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false});
  const viaMcp = (await client.callTool({name: 'get_change_brief', arguments: {artifact: 'a', change: 'change-x'}})).structuredContent;
  const facts = b => ({answers: b.answers, claims: b.claims, counts: b.counts, flows: b.flows, attention: b.attention});
  assert.equal(packet.revision, direct.revision);
  assert.equal(viaMcp.revision, direct.revision);
  assert.deepEqual(facts(packet.data.brief), facts(direct.data));
  assert.deepEqual(facts(viaMcp.data), facts(direct.data));
  assert.equal(packet.data.schema, 'artifact-plane.change-context.v1');
  const markdown = formatContextMarkdown(packet);
  assert.match(markdown, /\n## Change brief\n/);
  assert.ok(markdown.indexOf('## Change brief') > markdown.indexOf('## Change impact'));
  const refused = await client.callTool({name: 'get_change_brief', arguments: {artifact: 'a', change: 'change-x', channel: 'person'}}).catch(error => ({isError: true, error}));
  assert.equal(refused.isError, true);
});
