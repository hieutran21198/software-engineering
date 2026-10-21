import test from 'node:test';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {impactFiles, impactRepository, unitDoc} from './impact-fixtures.js';
import {git} from './fixtures.js';
import {createReviewService} from '../server/change-review.js';
import {createImpactService} from '../server/impact.js';
import {createFlowMcpServer} from '../server/flow-mcp.js';
import {QUESTIONS, LADDER, claimStep, conceptPrefix, buildBrief} from '../server/change-brief.js';
import {formatContextMarkdown} from '../src/context-packet.js';
import {git as readerGit} from '../server/reader.js';
import {rm} from 'node:fs/promises';
import {join} from 'node:path';
import {conceptBrief, add, plane, declaring, declarations, version, delivery, models} from './concept-brief-fixtures.js';

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

// CP11/CPA8 (specifications/concept-pages.md, Change brief): the concepts that a change reaches.
const rows = b => b.concepts.map(c => [c.title, c.reason, c.flow?.title ?? c.document.title]);
const affectedOf = b => b.answers.find(a => a.question === 'What is affected?');
const GATES = 'Resolve implementation dependency gates';

test('CP11: fixture branches give each reason; concept rows lead the affected items and stay out of attention', async t => {
  const {brief} = await conceptBrief(t, async ({put, flow}) => {
    // New Delivery record, changed Change, removed Ledger; Release and Version keep their entries.
    await put(declaring, declarations([version, {...models.change, description: 'One proposed change of one artifact.'}, models.release, delivery]));
    await flow(add + 'specifications/flows/gates.md', f => {f.participants[0].requires = 'Provide the established contract.';});
    await put(add + 'specifications/delivery.md', '# Change-owned delivery contract\n\nChanges deliver versions and records.\n');
  });
  const b = await brief();
  assert.deepEqual(rows(b), [
    ['Delivery record', 'declaration-new', 'ADD models used in dependency gates'],
    ['Change', 'declaration-changed', 'ADD models used in dependency gates'],
    ['Ledger', 'declaration-removed', 'ADD models used in dependency gates'],
    ['Version', 'participation-changed', GATES],
    ['Release', 'describing-document-changed', 'Change-owned delivery contract'],
    ['Version', 'describing-document-changed', 'Change-owned delivery contract']]);
  assert.deepEqual(b.concepts[3], {concept: 'add:version', title: 'Version', reason: 'participation-changed', document: {path: add + 'specifications/flows/gates.md', title: GATES}, flow: {flow: 'add:gates', title: GATES}});
  assert.deepEqual(b.concepts[2].document, {path: declaring, title: 'ADD models used in dependency gates'});
  const affected = affectedOf(b);
  assert.deepEqual(affected.items.slice(0, 6).map(i => i.text), [
    'Delivery record — new declaration in ADD models used in dependency gates',
    'Change — declaration changed in ADD models used in dependency gates',
    'Ledger — declaration removed in ADD models used in dependency gates',
    `Version — participation changed in ${GATES}`,
    'Release — describing document changed: Change-owned delivery contract',
    'Version — describing document changed: Change-owned delivery contract']);
  for (const [i, item] of affected.items.slice(0, 6).entries()) {
    assert.equal(item.step, 'Fact from Git');
    assert.equal(item.concept, b.concepts[i].concept);
    assert.deepEqual(item.document, b.concepts[i].document);
    assert.deepEqual(item.flow, b.concepts[i].flow);
  }
  assert.ok(!affected.items.slice(6).some(i => i.concept));
  assert.match(affected.summary, /^New concept: Delivery record\. Changed declaration: Change\. Removed concept: Ledger\. Participation changed: Version\. \d+ flows? reached: /);
  assert.ok(!b.attention.rows.some(r => r.concept || /concept|declaration|participation|describing/i.test(r.text)));
});

test('CP11: a changed declaring document with equal entries gives no row', async t => {
  const {brief} = await conceptBrief(t, async ({put}) => {
    await put(declaring, declarations([version, models.change, models.release, models.ledger]).replace('The models of the dependency gates.', 'The models that the dependency gates name.'));
  });
  assert.deepEqual((await brief()).concepts, []);
});

test('CPA8: the fixture after 89ed23a (a support added to a step where a concept takes part) gives no concept row', async t => {
  const {brief, describe} = await conceptBrief(t, async ({put, flow}) => {
    // 89ed23a added impact-contract to the steps of change-delivery and dependency-gates
    // that have interactions, and the support entry; no participant or interaction changed.
    await put(add + 'specifications/impact.md', '# Change impact contract\n\nTiers and propagation.\n');
    await flow(add + 'specifications/flows/gates.md', f => {
      f.steps[0].supports.unshift('impact-contract');
      f.support.push({id: 'impact-contract', kind: 'element', artifact: 'add', element: 'specifications/impact.md', requires: 'Compare the contract through the tiered impact.', basis: 'documented'});
    });
  });
  const b = await brief();
  assert.deepEqual(b.concepts, []);
  assert.ok(!/^(New|Changed|Removed|Participation)/.test(affectedOf(b).summary));
  assert.ok(!(await describe()).includes('Concepts declared or changed'));
});

test('CPA8: the fixture after 3c47a48 (an edit of a describing document) gives describing rows only', async t => {
  const {brief, describe} = await conceptBrief(t, async ({put, flow}) => {
    // 3c47a48 added a section to knowledge.md, which describes Artifact, Change and
    // Version, and a support to the steps of change-delivery.
    await put(add + 'specifications/knowledge.md', '# Knowledge and execution contract\n\nVersions hold knowledge.\n\n## Visual knowledge extension\n\nRepresentations stay derived.\n');
    await put(add + 'specifications/visual.md', '# Visual knowledge\n\nTables and diagrams.\n');
    await flow(add + 'specifications/flows/gates.md', f => {
      for (const step of f.steps) step.supports.push('visual-contract');
      f.support.push({id: 'visual-contract', kind: 'element', artifact: 'add', element: 'specifications/visual.md', requires: 'Select and check representations.', basis: 'documented'});
    });
  });
  const b = await brief();
  assert.deepEqual(rows(b), [['Change', 'describing-document-changed', 'Knowledge and execution contract'], ['Version', 'describing-document-changed', 'Knowledge and execution contract']]);
  const affected = affectedOf(b);
  assert.match(affected.summary, /^\d+ flows? reached: /);
  assert.equal(affected.items[0].text, 'Change — describing document changed: Knowledge and execution contract');
  const impact = (await describe()).split('\n## Impact\n\n')[1].split('\n\n## ')[0];
  assert.ok(!impact.includes('Concepts declared or changed'));
  assert.equal(impact.split('\n')[0], affected.summary);
});

test('participation-diff: a renamed participant is a changed participation', async t => {
  const {brief} = await conceptBrief(t, async ({flow}) => {
    await flow(plane + 'specifications/flows/explore.md', f => {
      f.participants[1].id = 'knowledge';
      f.steps[0].interactions[0].to = 'knowledge';
    });
  });
  const b = await brief();
  // Recorded result: two rows in the plane flow, Repository snapshot and Version: the participant version is now knowledge, and the interaction from snapshot now names knowledge.
  assert.deepEqual(rows(b), [['Repository snapshot', 'participation-changed', 'Explore a local ADD repository'], ['Version', 'participation-changed', 'Explore a local ADD repository']]);
});

test('CP11: a delivered change compares its commit with the first parent', async t => {
  const {f, brief} = await conceptBrief(t, async ({put}) => {
    await put(declaring, declarations([version, models.change, models.release, models.ledger, delivery]));
  }, {deliver: true});
  // A later commit on main changes Release; it is not part of the delivered change.
  await f.put(declaring, declarations([version, models.change, {...models.release, description: 'A published package.'}, models.ledger, delivery]));
  f.commit('later');
  const b = await brief();
  assert.equal(b.origin.kind, 'delivery-commit');
  assert.deepEqual(rows(b), [['Delivery record', 'declaration-new', 'ADD models used in dependency gates']]);
});

test('CP11: an open change compares the worktree bytes with the merge base', async t => {
  const {f, brief} = await conceptBrief(t, async () => {});
  // main moves after the branch point: its Release change is not in the branch difference.
  git(f.root, 'switch', '-q', 'main');
  await f.put(declaring, declarations([version, models.change, {...models.release, description: 'A published package.'}, models.ledger]));
  f.commit('main moves');
  git(f.root, 'switch', '-q', 'work');
  // An uncommitted edit counts.
  await f.put(declaring, declarations([version, models.change, models.release, models.ledger, delivery]));
  const b = await brief();
  assert.equal(b.origin.kind, 'protected-diff');
  assert.deepEqual(rows(b), [['Delivery record', 'declaration-new', 'ADD models used in dependency gates']]);
});

test('CP12: the summary prefix keeps the order, the number form and the 3-title limit', () => {
  const c = (title, reason) => ({concept: `add:${title.toLowerCase()}`, title, reason});
  assert.equal(conceptPrefix([]), '');
  assert.equal(conceptPrefix([c('B', 'participation-changed'), c('A', 'declaration-new'), c('D', 'describing-document-changed')]), 'New concept: A. Participation changed: B.');
  assert.equal(conceptPrefix(['A', 'B', 'C', 'D', 'E'].map(t => c(t, 'declaration-new'))), 'New concepts: A, B, C and 2 more.');
  assert.equal(conceptPrefix([c('A', 'declaration-changed'), c('B', 'declaration-changed'), c('C', 'declaration-removed'), c('D', 'declaration-removed')]), 'Changed declarations: A, B. Removed concepts: C, D.');
  // One concept with participation changed in two flows is one title.
  assert.equal(conceptPrefix([c('A', 'participation-changed'), c('A', 'participation-changed')]), 'Participation changed: A.');
  // Participation changed keeps one form for any count.
  assert.equal(conceptPrefix([c('A', 'participation-changed'), c('B', 'participation-changed')]), 'Participation changed: A, B.');
  assert.equal(conceptPrefix(['A', 'B', 'C', 'D'].map(t => c(t, 'participation-changed'))), 'Participation changed: A, B, C and 1 more.');
  assert.equal(conceptPrefix([c('A', 'declaration-new'), c('B', 'declaration-new'), c('C', 'participation-changed'), c('D', 'participation-changed')]), 'New concepts: A, B. Participation changed: C, D.');
});

test('CP12: without Impact data the summary is the prefix alone', async t => {
  const {f} = await conceptBrief(t, async ({put}) => {
    await put(declaring, declarations([version, models.change, models.release, models.ledger, delivery]));
    await put(add + 'specifications/delivery.md', '# Change-owned delivery contract\n\nChanges deliver records.\n');
  });
  const unavailable = {query: async () => {throw Object.assign(new Error('Impact is off.'), {status: 503});}};
  const {brief, diagnostics} = await buildBrief({root: f.root, worktree: f.root, artifact: 'add', change: 'change-next', git: readerGit, impactService: unavailable});
  assert.ok(diagnostics.some(d => d.code === 'unavailable-impact'));
  const affected = affectedOf(brief);
  assert.equal(affected.summary, 'New concept: Delivery record.');
  assert.deepEqual(affected.items.map(i => i.text), ['Delivery record — new declaration in ADD models used in dependency gates', 'Release — describing document changed: Change-owned delivery contract', 'Version — describing document changed: Change-owned delivery contract']);
});

test('CP12: without Impact data and without a prefix, the summary is the 1.24.0 fallback text', async t => {
  const {f} = await conceptBrief(t, async ({put}) => {
    await put(add + 'specifications/knowledge.md', '# Knowledge and execution contract\n\nVersions hold knowledge.\n\n## More\n\nText.\n');
  });
  const unavailable = {query: async () => {throw Object.assign(new Error('Impact is off.'), {status: 503});}};
  const {brief} = await buildBrief({root: f.root, worktree: f.root, artifact: 'add', change: 'change-next', git: readerGit, impactService: unavailable});
  // Only describing rows: the prefix is empty, so the row keeps a summary and is not blank.
  const affected = affectedOf(brief);
  assert.equal(affected.summary, 'The impact answer is not available.');
  assert.deepEqual(affected.items.map(i => i.text), ['Change — describing document changed: Knowledge and execution contract', 'Version — describing document changed: Knowledge and execution contract']);
});

test('CP11: a removed flow document gives participation rows whose document is removed', async t => {
  const {f, brief} = await conceptBrief(t, async () => {});
  await rm(join(f.root, add + 'specifications/flows/gates.md'));
  f.commit('Remove the gates flow');
  const b = await brief();
  const removed = b.concepts.filter(c => c.reason === 'participation-changed');
  assert.ok(removed.length > 0);
  for (const c of removed) {
    assert.deepEqual(c.document, {path: add + 'specifications/flows/gates.md', title: GATES, removed: true});
    assert.deepEqual(c.flow, {flow: 'add:gates', title: GATES});
  }
});

test('CP11: the brief operation, the packet brief and get_change_brief give the same concepts', async t => {
  const {f, stateDir, review, brief} = await conceptBrief(t, async ({put, flow}) => {
    await put(declaring, declarations([version, models.change, models.release, delivery]));
    await flow(add + 'specifications/flows/gates.md', f => {f.participants[1].requires = 'Name the change that waits for the gate.';});
  });
  const direct = await brief();
  assert.ok(direct.concepts.length >= 3);
  const packet = await review.query({path: f.root, artifact: 'add', change: 'change-next', operation: 'packet'});
  const app = createFlowMcpServer({roots: [f.root], stateDir}), client = new Client({name: 'concept-brief-test', version: '1'});
  const [x, y] = InMemoryTransport.createLinkedPair();
  await app.server.connect(y);await client.connect(x);t.after(() => app.close());
  const viaMcp = (await client.callTool({name: 'get_change_brief', arguments: {artifact: 'add', change: 'change-next'}})).structuredContent;
  assert.deepEqual(packet.data.brief.concepts, direct.concepts);
  assert.deepEqual(viaMcp.data.concepts, direct.concepts);
  assert.match(formatContextMarkdown(packet), /Delivery record/);
});
