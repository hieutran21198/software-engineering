import test from 'node:test';
import assert from 'node:assert/strict';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
import {impactFiles, impactRepository} from './impact-fixtures.js';
import {git} from './fixtures.js';
import {createReviewService} from '../server/change-review.js';
import {createImpactService} from '../server/impact.js';
import {createFlowMcpServer} from '../server/flow-mcp.js';
import {createAppServer} from '../server/http.js';
import {SECTIONS, APPROVAL_NOTE, DESCRIPTION_LIMIT, fitSections} from '../server/change-description.js';
import {formatContextMarkdown} from '../src/context-packet.js';
import {conceptBrief, add, declaring, declarations, version, delivery, models} from './concept-brief-fixtures.js';

const A = 'docs/artifacts/a/', X = A + 'changes/change-x/', Y = A + 'changes/change-y/';
const headings = markdown => [...markdown.matchAll(/^## (.+)$/gm)].map(m => m[1]);
const section = (markdown, title) => ('\n' + markdown).split(`\n## ${title}\n\n`)[1]?.split('\n\n## ')[0].replace(`\n\n${APPROVAL_NOTE}`, '');
const task = (id, covers, extra = '') => `---\nid: ${id}\ndepends_on: []\n${covers}${extra}---\n# Check ${id}\n\n## Scope and ownership\n\nOwn src/check.js.\n\n## Definition of Done\n\n- [x] The check passes.\n- [ ] The audit line is formatted.\n\n## Evidence\n\nThe check test passed.\n`;
const decision = 'claims:\n  - id: cookie\n    kind: decision\n    statement: Keep the session in a cookie.\n    status: open\n    basis: inferred\n';

async function repository(t, work) {
  const files = impactFiles();
  files.set(A + 'versions/1.0.0/README.md', '---\nsource_change: change-initial\n---\n# A 1.0.0\n');
  files.set(A + 'changes/change-initial/README.md', '# Initial\n\n## Reason and scope\n\nStart A.\n');
  files.set(A + 'requirements/need.md', '# Need\n\n- R1: Members sign in.\n- R2: Sessions last one day.\n');
  const repo = await impactRepository(files);t.after(repo.cleanup);
  git(repo.root, 'switch', '-q', '-c', 'work');
  await work(repo);
  repo.commit('work');
  const impact = createImpactService({roots: [repo.root], stateDir: repo.stateDir}), review = createReviewService({roots: [repo.root], impactService: impact});
  t.after(() => impact.close());
  return {repo, review, describe: change => review.query({path: repo.root, artifact: 'a', change, operation: 'description'})};
}
const openChange = async repo => {
  await repo.write(X + 'README.md', '# Change x\n\n## Reason and scope\n\nMembers lose sessions after the check.\n\nA second paragraph.\n');
  await repo.write(X + 'tasks/README.md', '---\ntasks: [01-check.md]\ncompatibility: minor\n---\n# Plan\n\n## Approval and prerequisites\n\nPresent this plan for explicit user approval.\n');
  await repo.write(X + 'tasks/01-check.md', task('check', 'covers:\n  - element: requirements/need.md\n    ids: [R3]\n', 'evidence_records:\n  - id: unit-tests\n    method: npm test\n    result: passed\n' + decision));
  await repo.write(A + 'requirements/need.md', '# Need\n\n- R1: Members sign in.\n- R2: Sessions last one week.\n- R3: Sessions end on sign-out.\n');
};

test('PA5: the description of an open change has every section in order and ends with the approval note', async t => {
  const {describe} = await repository(t, openChange);
  const result = await describe('change-x'), {markdown, tier, revision} = result.data;
  assert.deepEqual(headings(markdown), SECTIONS);
  assert.equal(markdown.split('\n').at(-1), APPROVAL_NOTE);
  assert.equal(revision, result.revision);
  assert.equal(section(markdown, 'Summary').split('\n\n')[0], 'Members lose sessions after the check.');
  assert.equal(tier.declared, 'medium');
  assert.deepEqual(tier.criteria.map(c => c.id), ['one-artifact', 'one-repository', 'patch-level', 'no-contract', 'upstream-established', 'code-limit', 'impact-contained']);
  for (const c of tier.criteria) assert.ok(section(markdown, 'Tier').includes(`- ${c.id}: ${c.result}.`), c.id);
  assert.notEqual(tier.criteria.find(c => c.id === 'impact-contained').result, 'coordinator');
  assert.equal(section(markdown, 'Plan'), '- Check check (`check`): covers requirements/need.md R3.');
  assert.equal(section(markdown, 'Changed knowledge'), '- Changed `requirements/need.md` (+2 −1)');
  assert.equal(section(markdown, 'Requirement coverage'), '- requirements/need.md R2 (changed): no task covers it.\n- requirements/need.md R3 (added): `check`.');
  assert.equal(section(markdown, 'DoD and evidence'), '- `check`: 1 of 2 DoD items checked; evidence: unit-tests passed.');
  const validator = section(markdown, 'Validator');
  assert.match(validator, /^ok: true\. Errors: 0\. Warnings: [1-9]\d*\./);
  assert.match(validator, /- warning `requirement-uncovered` docs\/artifacts\/a\/requirements\/need\.md: R2 is changed/);
  assert.match(section(markdown, 'Impact'), /^\d+ flows? reached: .*\n\nCoverage: depth 2/);
  assert.equal(section(markdown, 'Compatibility'), 'Plan level: minor. Computed version: 1.1.0, from 1.0.0 on the protected branch.');
  assert.equal(section(markdown, 'Open claims'), `- Decision \`cookie\`: Keep the session in a cookie. (${X}tasks/01-check.md)`);
});

test('PA5: a small change shows its README plan paragraph', async t => {
  const {describe} = await repository(t, async repo => {
    await repo.write(Y + 'README.md', '---\ntier: small\n---\n# Change y\n\n## Reason and scope\n\nFix a typo.\n\n## Plan\n\nOne task fixes the typo in the contract.\n');
    await repo.write(Y + 'tasks/README.md', '---\ntasks: [01-typo.md]\ncompatibility: patch\n---\n# Plan\n');
    await repo.write(Y + 'tasks/01-typo.md', task('typo', ''));
  });
  const {markdown, tier} = (await describe('change-y')).data;
  assert.deepEqual(headings(markdown), SECTIONS);
  assert.equal(tier.declared, 'small');
  assert.match(markdown, /\nDeclared: small\. Allowed: (small|medium|large)\.\n/);
  assert.equal(section(markdown, 'Plan'), 'One task fixes the typo in the contract.\n\n- Check typo (`typo`): no covers.');
  assert.equal(section(markdown, 'Compatibility'), 'Plan level: patch. Computed version: 1.0.1, from 1.0.0 on the protected branch.');
  assert.equal(section(markdown, 'Open claims'), 'No open claim.');
});

test('PA5: a description longer than 60,000 characters is cut with an omission line that names the section', async t => {
  const ids = Array.from({length: 2500}, (_, i) => `- R${i + 1}: Requirement number ${i + 1} holds for every member session.`).join('\n');
  const {describe} = await repository(t, async repo => {
    await openChange(repo);
    await repo.write(A + 'requirements/many.md', `# Many\n\n${ids}\n`);
  });
  const {markdown} = (await describe('change-x')).data;
  assert.ok(markdown.length <= DESCRIPTION_LIMIT, `${markdown.length} characters`);
  assert.deepEqual(headings(markdown), SECTIONS);
  assert.equal(markdown.split('\n').at(-1), APPROVAL_NOTE);
  const coverage = section(markdown, 'Requirement coverage');
  assert.match(coverage, /\n_The Requirement coverage section is cut: \d+ of 2502 lines are omitted to keep this description within 60,000 characters\._$/);
  assert.ok(coverage.startsWith('- requirements/many.md R1 (added): no task covers it.'));
  assert.equal(section(markdown, 'Changed knowledge'), '- New `requirements/many.md` (+2502 −0)\n- Changed `requirements/need.md` (+2 −1)');
});

test('fitSections cuts the longest section first and keeps the others', () => {
  const sections = [{title: 'Summary', lines: ['Short.']}, {title: 'Plan', lines: Array.from({length: 400}, (_, i) => `- task ${i} ${'x'.repeat(40)}`)}];
  const text = fitSections(sections, 4000);
  assert.ok(text.length <= 4000);
  assert.match(text, /^## Summary\n\nShort\.\n\n## Plan\n\n- task 0 /);
  assert.match(text, /_The Plan section is cut: \d+ of 400 lines are omitted to keep this description within 4,000 characters\._\n\nApproval is not recorded by this description\.$/);
});

test('PA5: HTTP, MCP and the packet return the same description for one revision', async t => {
  const {repo, review, describe} = await repository(t, openChange);
  const direct = await describe('change-x');
  const packet = await review.query({path: repo.root, artifact: 'a', change: 'change-x', operation: 'packet'});
  const server = createAppServer({reviewService: review, repositoryObservation: {intervalMs: 20, debounceMs: 5}});
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  t.after(() => new Promise(done => {server.closeAllConnections();server.close(done);}));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/review/query`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({path: repo.root, artifact: 'a', change: 'change-x', operation: 'description'})});
  assert.equal(response.status, 200);
  const http = await response.json();
  const app = createFlowMcpServer({roots: [repo.root], stateDir: repo.stateDir}), client = new Client({name: 'description-test', version: '1'});
  const [x, y] = InMemoryTransport.createLinkedPair();
  await app.server.connect(y);await client.connect(x);t.after(() => app.close());
  const tool = (await client.listTools()).tools.find(tool => tool.name === 'get_change_description');
  assert.deepEqual(tool.annotations, {readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false});
  const mcp = (await client.callTool({name: 'get_change_description', arguments: {artifact: 'a', change: 'change-x'}})).structuredContent;
  for (const other of [packet, http, mcp]) assert.equal(other.revision, direct.revision);
  assert.equal(packet.data.schema, 'artifact-plane.change-context.v1');
  for (const data of [packet.data.description, http.data, mcp.data]) {
    assert.equal(data.markdown, direct.data.markdown);
    assert.deepEqual(data.tier, direct.data.tier);
    assert.equal(data.revision, direct.revision);
  }
  const exported = formatContextMarkdown(packet);
  assert.ok(exported.indexOf('\n## PR description\n') > exported.indexOf('\n## Change brief\n'));
  assert.ok(exported.includes(direct.data.markdown));
  const refused = await client.callTool({name: 'get_change_description', arguments: {artifact: 'a', change: 'change-x', channel: 'person'}}).catch(error => ({isError: true, error}));
  assert.equal(refused.isError, true);
  const unknown = await review.query({path: repo.root, artifact: 'a', change: 'change-missing', operation: 'description'}).catch(error => error);
  assert.equal(unknown.status, 404);
});

test('PA5: the description of change-review-brief in this repository has every section in order', async () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  // No impact index: the impact criterion and section say that the answer is not available.
  const impactService = {query: async () => {throw Object.assign(Error('No impact index in this test.'), {status: 503});}, close() {}};
  const review = createReviewService({roots: [root], impactService});
  const {markdown, tier} = (await review.query({path: root, artifact: 'artifact-plane', change: 'change-review-brief', operation: 'description'})).data;
  assert.deepEqual(headings(markdown), SECTIONS);
  assert.equal(markdown.split('\n').at(-1), APPROVAL_NOTE);
  assert.ok(markdown.length <= DESCRIPTION_LIMIT);
  assert.match(section(markdown, 'Summary'), /^On 19 October 2026 the owner approved the recommendation of the human-cognitive-support investigation/);
  assert.equal(tier.criteria.find(c => c.id === 'impact-contained').result, 'unresolved');
  assert.match(section(markdown, 'Plan'), /^- Claims reader \(`claims-reader`\)/);
  assert.match(section(markdown, 'DoD and evidence'), /- `brief-service`: 6 of 6 DoD items checked/);
});

// CP12 (specifications/concept-pages.md, Change brief): the concept line of the Impact section.
const GATES = 'Resolve implementation dependency gates';
const conceptChange = async ({put, flow}) => {
  await put(declaring, declarations([version, models.change, models.release, delivery]));
  await flow(add + 'specifications/flows/gates.md', f => {f.participants[0].requires = 'Provide the established contract.';});
  await put(add + 'specifications/knowledge.md', '# Knowledge and execution contract\n\nVersions hold knowledge and provenance.\n');
};
test('CP12: the Impact section has the concept line, the flow sentence, a blank line and the Coverage line', async t => {
  const {brief, describe} = await conceptBrief(t, conceptChange);
  const b = await brief(), impact = section(await describe(), 'Impact').split('\n');
  assert.ok(b.concepts.some(c => c.reason === 'describing-document-changed'));
  assert.equal(impact[0], `Concepts declared or changed: Delivery record (new declaration); Ledger (declaration removed); Version (participation changed in ${GATES}).`);
  const summary = b.answers.find(a => a.question === 'What is affected?').summary;
  const prefix = 'New concept: Delivery record. Removed concept: Ledger. Participation changed: Version. ';
  assert.ok(summary.startsWith(prefix), summary);
  // The flow sentence without the prefix.
  assert.equal(impact[1], summary.slice(prefix.length));
  assert.match(impact[1], /^\d+ flows? reached: \d+ declared, \d+ decided by a claim, \d+ undecided\. \d+ unresolved items?\.$/);
  assert.equal(impact[2], '');
  assert.match(impact[3], /^Coverage: depth 2/);
  assert.equal(impact.length, 4);
});
test('CP12: without Impact data the concept line precedes the fallback text', async t => {
  const {f} = await conceptBrief(t, conceptChange);
  const unavailable = {query: async () => {throw Object.assign(new Error('Impact is off.'), {status: 503});}};
  const review = createReviewService({roots: [f.root], impactService: unavailable});
  const markdown = (await review.query({path: f.root, artifact: 'add', change: 'change-next', operation: 'description'})).data.markdown;
  assert.equal(section(markdown, 'Impact'), `Concepts declared or changed: Delivery record (new declaration); Ledger (declaration removed); Version (participation changed in ${GATES}).\nThe impact answer is not available.`);
});
