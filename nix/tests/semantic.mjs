// Run outside the Nix build sandbox: this check downloads the pinned model.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const planePackage = resolve(process.argv[2]);
const state = await mkdtemp(join(tmpdir(), 'nix-plane-model-'));
try {
  execFileSync(join(planePackage, 'bin/artifact-plane'), ['model-install'], {
    cwd: tmpdir(), env: { ...process.env, ARTIFACT_PLANE_STATE_DIR: state },
    stdio: 'inherit', timeout: 300000,
  });
  const { createLocalEmbedder, MODEL_REVISION } = await import(pathToFileURL(join(planePackage, 'lib/artifact-plane/server/flow-embeddings.js')));
  const manifest = JSON.parse(await readFile(join(state, 'models/manifest.json'), 'utf8'));
  assert.equal(manifest.revision, MODEL_REVISION);
  const vectors = await createLocalEmbedder(state).embed(['Install the Nix package.', 'Explore the artifact graph.']);
  assert.equal(vectors.length, 2);
  for (const vector of vectors) {
    assert.equal(vector.length, 384);
    assert.ok(vector.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...vector) - 1) < 0.001);
  }
  console.log('PASS: pinned model installation and CPU inference with external writable state');
} finally {
  await rm(state, { recursive: true, force: true });
}
