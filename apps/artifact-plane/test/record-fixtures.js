// A repository with one open change for the ADD record checks: a clean
// variant and a variant with one seeded defect for each check code.
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {git} from './fixtures.js';

const A = 'docs/artifacts/app/', C = `${A}changes/change-fix/`;
const identity = (version, deps) => `---\ncurrent_version: ${version ?? 'null'}\ndepends_on: ${JSON.stringify(deps)}\n---\n# App\n\nApp knowledge.\n`;
const commit = (root, message) => {git(root, 'add', '-A');git(root, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', message);};
async function put(root, files) {
  for (const [path, body] of Object.entries(files)) {
    if (body === null) {await rm(join(root, path), {force: true});continue;}
    await mkdir(join(root, path, '..'), {recursive: true});
    await writeFile(join(root, path), body);
  }
}
const main = {
  'docs/artifacts/core/README.md': '---\ncurrent_version: 1.0.0\ndepends_on: []\n---\n# Core\n\nCore knowledge.\n',
  'docs/artifacts/core/requirements/core.md': '# Core need\n\n- K1: Core rule.\n',
  'docs/artifacts/core/versions/1.0.0/README.md': '---\nsource_change: change-initial\n---\n# Core 1.0.0\n\nFirst version.\n',
  'docs/artifacts/core/changes/change-initial/README.md': '# Initial core\n\nReason and scope.\n',
  'docs/artifacts/lib/README.md': '---\ncurrent_version: null\ndepends_on: []\n---\n# Lib\n\nLib knowledge.\n',
  'docs/artifacts/lib/requirements/lib.md': '# Lib need\n\n- B1: Lib rule.\n',
  [`${A}README.md`]: identity('1.0.0', ['core']),
  [`${A}requirements/login.md`]: '# Login need\n\n- L1: A member signs in.\n- L2: A nonmember is denied.\n',
  [`${A}requirements/notes.md`]: '# Notes\n\nProse only.\n',
  [`${A}specifications/login.md`]: '# Login contract\n\nThe server checks membership.\n',
  [`${A}versions/1.0.0/README.md`]: '---\nsource_change: change-initial\n---\n# App 1.0.0\n\nFirst version.\n',
  [`${A}changes/change-initial/README.md`]: '# Initial app\n\nReason and scope.\n',
  'src/app.js': 'export const app = 1;\n',
};
// The open change: L1 changes, the task covers it, the plan is patch, 1.0.1.
const change = {
  [`${A}README.md`]: identity('1.0.1', ['core']),
  [`${A}requirements/login.md`]: '---\nself_check:\n  result: passed\n  source: docs/artifacts/app/requirements/login.md#self-check\n---\n# Login need\n\n- L1: A member with an active membership signs in.\n- L2: A nonmember is denied.\n\n## Self-check\n\nL1 is observable.\n',
  [`${A}specifications/login.md`]: '# Login contract\n\nThe server checks active membership. See the [requirement](../requirements/login.md).\n',
  [`${C}README.md`]: '---\ntier: small\n---\n\n# Fix login\n\n## Reason and scope\n\nInactive members signed in.\n\n- [Task](tasks/01-fix.md)\n',
  [`${C}tasks/README.md`]: '---\ntasks: [01-fix.md]\ncompatibility: patch\n---\n\n# Plan\n\n1. [Fix](01-fix.md)\n',
  [`${C}tasks/01-fix.md`]: '---\nid: fix\ndepends_on: []\ncovers:\n  - element: requirements/login.md\n    ids: [L1]\nevidence_records:\n  - {id: tests, method: npm test, result: passed}\n---\n\n# Fix\n\n## Definition of Done\n\n- [x] Inactive members are denied.\n\n## Evidence\n\nTests passed: 4 of 4.\n',
  [`${A}versions/1.0.1/README.md`]: '---\nsource_change: change-fix\n---\n# App 1.0.1\n\nPatch: inactive members are denied.\n',
  'src/app.js': 'export const app = 2;\nexport const active = true;\n',
};
// One seeded defect per code; each line names the code that it seeds.
export const SEEDED = {
  'source-unresolved': `${A}requirements/login.md`,
  'link-broken': `${C}README.md`,
  'placeholder-text': `${A}specifications/login.md`,
  'version-identity-mismatch': `${A}versions/0.9.0/README.md`,
  'version-number-invalid': `${A}versions/1.2.0/README.md`,
  'upstream-unestablished': `${A}README.md`,
  'requirement-id-duplicate': `${A}requirements/login.md`,
  'requirement-ids-missing': `${A}requirements/notes.md`,
  'covers-unknown-id': `${C}tasks/01-fix.md`,
  'requirement-uncovered': `${A}requirements/login.md`,
  'open-change-conflict': `${A}requirements/login.md`,
  'config-invalid': 'docs/artifacts/add.config.yaml',
};
const defects = {
  [`${A}README.md`]: identity('1.2.0', ['core', 'lib']),
  [`${A}versions/1.0.1/README.md`]: null,
  [`${A}versions/1.2.0/README.md`]: '---\nsource_change: change-fix\n---\n# App 1.2.0\n\nWrong number.\n',
  [`${A}versions/0.9.0/README.md`]: '---\nsource_change: change-gone\n---\n# App 0.9.0\n\nNo change directory.\n',
  [`${A}requirements/login.md`]: '---\nself_check:\n  result: passed\n  source: docs/artifacts/app/requirements/login.md#no-such-heading\n---\n# Login need\n\n- L1: A member with an active membership signs in.\n- L2: A nonmember is denied.\nL2. Duplicate label.\n- L3: A locked member is denied.\n\n## Self-check\n\nL1 is observable.\n',
  [`${A}requirements/notes.md`]: '# Notes\n\nProse only, edited.\n',
  [`${A}specifications/login.md`]: '# Login contract\n\nREPLACE with the contract.\n',
  [`${C}README.md`]: '---\ntier: small\n---\n\n# Fix login\n\n## Reason and scope\n\nInactive members signed in. See [the old note](../../missing.md).\n\n- [Task](tasks/01-fix.md)\n',
  [`${C}tasks/01-fix.md`]: '---\nid: fix\ndepends_on: []\ncovers:\n  - element: requirements/login.md\n    ids: [L1, L9]\nevidence_records:\n  - {id: tests, method: npm test, result: passed}\n---\n\n# Fix\n\n## Definition of Done\n\n- [x] Inactive members are denied.\n\n## Evidence\n\nTests passed: 4 of 4.\n',
  'docs/artifacts/add.config.yaml': 'tiers:\n  small:\n    max_code_lines: -1\n',
};
// A repository on branch change-fix. `seeded` adds the defects and a second
// branch that edits the same knowledge file.
export async function recordRepository({seeded = false} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'artifact-plane-records-'));
  await put(root, main);
  git(root, 'init', '-q', '-b', 'main');commit(root, 'main');
  if (seeded) {
    git(root, 'checkout', '-q', '-b', 'other');
    await put(root, {[`${A}requirements/login.md`]: '# Login need\n\n- L1: A member signs in.\n- L2: A nonmember is denied quickly.\n'});
    commit(root, 'other');
    git(root, 'checkout', '-q', 'main');
  }
  git(root, 'checkout', '-q', '-b', 'change-fix');
  await put(root, change);
  if (seeded) await put(root, defects);
  commit(root, 'change');
  return {root, cleanup: () => rm(root, {recursive: true, force: true})};
}
export const CHANGE = {artifact: 'app', change: 'change-fix'};
