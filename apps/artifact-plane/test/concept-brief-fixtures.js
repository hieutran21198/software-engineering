// Fixture repositories of the concept brief tests (specifications/concept-pages.md,
// Validation): the concept fixture, a change-next of add and one edit on top.
// An open change is on branch work; a delivered change is one commit on main
// that adds its version record. CI is shallow, so no test reads this repository.
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {parse, stringify} from 'yaml';
import {fixtureRepository, git, identity, versionRecord} from './fixtures.js';
import {conceptFiles, add, plane, declaring, declarations, version, delivery} from './concept-fixtures.js';
import {createImpactService} from '../server/impact.js';
import {createReviewService} from '../server/change-review.js';

export {add, plane, declaring, declarations, version, delivery};
// The other declarations of the fixture, as concept-fixtures.js writes them.
export const models = {
  change: {id: 'change', title: 'Change', description: 'One proposed change of an artifact.', sources: ['specifications/knowledge.md']},
  release: {id: 'release', title: 'Release', description: 'A published package of established versions.', sources: ['specifications/delivery.md']},
  ledger: {id: 'ledger', title: 'Ledger', description: 'The list of delivered changes.', sources: ['specifications/ledger.md']},
};
const NEXT = add + 'changes/change-next/';

// edit({put, flow}) makes the change; flow(path, fn) edits the flow object of a flow document.
export async function conceptBrief(t, edit, {deliver = false} = {}) {
  const f = await fixtureRepository(conceptFiles()), stateDir = await mkdtemp(join(tmpdir(), 'plane-concept-brief-'));
  t.after(() => Promise.all([f.cleanup(), rm(stateDir, {recursive: true, force: true})]));
  const put = async (path, text) => {await mkdir(dirname(join(f.root, path)), {recursive: true});await writeFile(join(f.root, path), text);};
  const flow = async (path, change) => {
    const text = await readFile(join(f.root, path), 'utf8'), front = text.match(/^---\n([\s\S]*?)\n---\n/), data = parse(front[1]);
    change(data.flow);
    await put(path, '---\n' + stringify(data) + '---\n' + text.slice(front[0].length));
  };
  const commit = message => {git(f.root, 'add', '-A');git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
  if (!deliver) git(f.root, 'switch', '-q', '-c', 'work');
  await put(NEXT + 'README.md', '# Add the delivery record concept\n\n## Reason and scope\n\nReviewers need the delivery record as a concept.\n');
  await put(NEXT + 'tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  if (deliver) {
    await put(add + 'README.md', identity('Artifact-Driven Development', '1.1.0'));
    await put(add + 'versions/1.1.0/README.md', versionRecord('change-next'));
  }
  await edit({put, flow});
  commit(deliver ? 'Deliver change-next' : 'Start change-next');
  const impact = createImpactService({roots: [f.root], stateDir}), review = createReviewService({roots: [f.root], impactService: impact});
  t.after(() => impact.close());
  const query = operation => review.query({path: f.root, artifact: 'add', change: 'change-next', operation});
  return {f: {...f, put, flow, commit}, stateDir, review,
    brief: async () => (await query('brief')).data,
    describe: async () => (await query('description')).data.markdown};
}
