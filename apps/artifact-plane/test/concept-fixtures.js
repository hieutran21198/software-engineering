// The Version fixture of the concept page tests: artifact add declares Version,
// Change, Release (no flow uses it) and Ledger (a missing source) in one
// document; flow gates of add and flow explore of plane use Version.
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {stringify} from 'yaml';
import {fixtureRepository, git, identity, versionRecord} from './fixtures.js';

const flowDoc = flow => '---\n' + stringify({flow}) + '---\n# ' + flow.title + '\n';
const models = (list, title) => '---\n' + stringify({models: list}) + `---\n# ${title}\n\nThe models of the dependency gates.\n`;
export const add = 'docs/artifacts/add/', plane = 'docs/artifacts/plane/';
export const declaring = add + 'specifications/domain-model.md';
export const version = {id: 'version', title: 'Version', description: 'Contains the complete resulting artifact knowledge of one change.',
  sources: ['specifications/knowledge.md', 'specifications/delivery.md']};
const change = {id: 'change', title: 'Change', description: 'One proposed change of an artifact.', sources: ['specifications/knowledge.md']};
const release = {id: 'release', title: 'Release', description: 'A published package of established versions.', sources: ['specifications/delivery.md']};
const ledger = {id: 'ledger', title: 'Ledger', description: 'The list of delivered changes.', sources: ['specifications/ledger.md']};
export const delivery = {id: 'delivery-record', title: 'Delivery record', description: 'Retains the task evidence of one change.', sources: ['specifications/delivery.md']};
export const declarations = list => models(list, 'ADD models used in dependency gates');

const gates = {id: 'gates', artifact: 'add', title: 'Resolve implementation dependency gates', trigger: 'A change depends on another artifact.', outcome: 'The gate is resolved.', entry_steps: ['resolve'],
  steps: [
    {id: 'resolve', title: 'Resolve contracts and selectors', supports: ['rules', 'code'], interactions: [{from: 'consumer', to: 'contract', action: 'Select the current established version', outcome: 'Selected.', supports: ['code']}]},
    {id: 'wait', title: 'Wait for upstream publication', supports: ['code'], interactions: [{from: 'contract', to: 'consumer', action: 'Gate dependent implementation on publication', outcome: 'Gated.', supports: ['code']}]}],
  transitions: [{from: 'resolve', to: 'wait'}],
  support: [
    {id: 'rules', kind: 'element', artifact: 'add', element: 'specifications/knowledge.md', requires: 'Read the contract rules.', basis: 'documented'},
    {id: 'code', kind: 'implementation', path: 'src/gates.js', requires: 'Resolve the gate.', basis: 'static'}],
  participants: [
    {id: 'contract', artifact: 'add', model: 'version', requires: 'Provide complete published knowledge used to resolve the supplying contract.'},
    {id: 'consumer', artifact: 'add', model: 'change', requires: 'Name the change that waits.'}]};
const explore = {id: 'explore', artifact: 'plane', title: 'Explore a local ADD repository', trigger: 'A person opens a repository.', outcome: 'The knowledge shows.', entry_steps: ['load'],
  steps: [{id: 'load', title: 'Load metadata first and scoped details on demand', supports: ['reader', 'reader-test'], interactions: [{from: 'snapshot', to: 'version', action: 'Select declared version knowledge', outcome: 'Selected.', supports: ['reader']}]}],
  transitions: [],
  support: [
    {id: 'reader', kind: 'implementation', path: 'src/reader.js', requires: 'Read the repository.', basis: 'static'},
    {id: 'reader-test', kind: 'test', path: 'test/reader.test.js', requires: 'Exercise the reader.', basis: 'static'}],
  participants: [
    {id: 'snapshot', artifact: 'plane', model: 'snapshot', requires: 'Supply the selected revision.'},
    {id: 'version', artifact: 'add', model: 'version', requires: 'Supply complete version knowledge and provenance.'}]};

export function conceptFiles() {
  return new Map([
    [add + 'README.md', identity('Artifact-Driven Development', '1.0.0')],
    [add + 'versions/1.0.0/README.md', versionRecord('change-first')], [add + 'changes/change-first/README.md', '# First change\n'], [add + 'changes/change-first/tasks/README.md', '---\ntasks: []\n---\n# Plan\n'],
    [declaring, declarations([version, change, release, ledger])],
    [add + 'specifications/knowledge.md', '# Knowledge and execution contract\n\nVersions hold knowledge.\n'],
    [add + 'specifications/delivery.md', '# Change-owned delivery contract\n\nChanges deliver versions.\n'],
    [add + 'specifications/flows/gates.md', flowDoc(gates)],
    [plane + 'README.md', identity('Artifact Plane', '1.0.0', ['add'])],
    [plane + 'versions/1.0.0/README.md', versionRecord('change-first')], [plane + 'changes/change-first/README.md', '# First plane change\n'], [plane + 'changes/change-first/tasks/README.md', '---\ntasks: []\n---\n# Plan\n'],
    [plane + 'specifications/explorer.md', models([{id: 'snapshot', title: 'Repository snapshot', description: 'A scoped view of one revision.', sources: ['specifications/explorer.md']}], 'Explorer contract')],
    [plane + 'specifications/flows/explore.md', flowDoc(explore)],
    ['src/gates.js', 'export const gate = () => true;\n'],
    ['src/reader.js', 'export const read = () => [];\n'],
    ['test/reader.test.js', "import {read} from '../src/reader.js';\nread();\n"],
  ]);
}
export const conceptRepository = () => fixtureRepository(conceptFiles());
// On branch feature: the describing document knowledge.md changes, Delivery record is
// a new declaration, and change-next is an open change of add.
export async function branchRepository() {
  const f = await conceptRepository();
  git(f.root, 'checkout', '-q', '-b', 'feature');
  const put = async (path, text) => {await mkdir(join(f.root, path, '..'), {recursive: true});await writeFile(join(f.root, path), text);};
  await put(add + 'specifications/knowledge.md', '# Knowledge and execution contract\n\nVersions hold knowledge and provenance.\n');
  await put(declaring, declarations([version, change, release, ledger, delivery]));
  await put(add + 'changes/change-next/README.md', '# Add the delivery record concept\n\nAdd the concept.\n');
  await put(add + 'changes/change-next/tasks/README.md', '---\ntasks: []\n---\n# Plan\n');
  git(f.root, 'add', '-A');git(f.root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Start change-next');
  return f;
}
