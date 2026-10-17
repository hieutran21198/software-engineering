// In-place repositories on a non-protected branch for the editing tests.
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository, fingerprint, git, identity, versionRecord} from '../fixtures.js';

export const tenant = 'docs/artifacts/tenant/', billing = 'docs/artifacts/billing/';
export function editingFiles() {
  return new Map([
    [tenant + 'README.md', identity('Tenant', '1.0.0')],
    [tenant + 'requirements/need.md', '# Need\n\nStable need.\n'],
    [tenant + 'specifications/identity.md', '---\n# Kept comment\nowner_note: keep me\n---\n# Identity\n\nEstablished identity rules.\n\n## Details\n\nUnchanged details.\n'],
    [tenant + 'versions/1.0.0/README.md', versionRecord('change-initial')],
    [tenant + 'changes/change-initial/README.md', '# Initial\n'],
    [tenant + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan\n'],
    [billing + 'README.md', identity('Billing', '1.0.0', ['tenant'])],
    [billing + 'requirements/invoice.md', '# Invoice\n\nInvoices exist.\n'],
    [billing + 'versions/1.0.0/README.md', versionRecord('change-initial')],
    [billing + 'changes/change-initial/README.md', '# Initial\n'],
    [billing + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan\n'],
  ]);
}
// main holds the fixture; the worktree switches to a work branch.
export async function editingRepository(files = editingFiles(), branch = 'work') {
  const f = await fixtureRepository(files);
  git(f.root, 'switch', '-q', '-c', branch);
  return f;
}
export const read = (root, path) => readFile(join(root, path), 'utf8');
export const commits = root => git(root, 'log', '--format=%s').split('\n');
// Paths whose bytes differ between two fingerprints, ignoring Git metadata.
export function changedPaths(before, after) {
  return Object.keys({...before, ...after}).filter(p => !p.startsWith('.git/') && before[p] !== after[p]).sort();
}
export {fingerprint, git};
