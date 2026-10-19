import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/check-release-version.mjs", import.meta.url));
const check = (...args) => new Promise((resolve) => execFile(process.execPath, [script, ...args], (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr })));
async function repository(t, { packageVersion, currentVersion }) {
  const root = await mkdtemp(join(tmpdir(), "plane-release-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "apps/artifact-plane"), { recursive: true });
  await mkdir(join(root, "docs/artifacts/artifact-plane"), { recursive: true });
  await writeFile(join(root, "apps/artifact-plane/package.json"), JSON.stringify({ name: "artifact-plane", version: packageVersion }));
  await writeFile(join(root, "docs/artifacts/artifact-plane/README.md"), `---\ncurrent_version: ${currentVersion}\ndepends_on: [artifact-driven]\n---\n\n# Artifact Plane\n`);
  return root;
}

test("a plane-v tag that matches the package version and current_version passes", async (t) => {
  const root = await repository(t, { packageVersion: "1.22.0", currentVersion: "1.22.0" });
  const { code, stderr } = await check("plane-v1.22.0", root);
  assert.equal(code, 0, stderr);
});

test("a different package version fails", async (t) => {
  const root = await repository(t, { packageVersion: "1.21.1", currentVersion: "1.22.0" });
  const { code, stderr } = await check("plane-v1.22.0", root);
  assert.equal(code, 1);assert.match(stderr, /package version 1\.21\.1/);
});

test("a different current_version fails", async (t) => {
  const root = await repository(t, { packageVersion: "1.22.0", currentVersion: "1.21.1" });
  const { code, stderr } = await check("plane-v1.22.0", root);
  assert.equal(code, 1);assert.match(stderr, /current_version 1\.21\.1/);
});

test("a v tag fails", async (t) => {
  const root = await repository(t, { packageVersion: "1.22.0", currentVersion: "1.22.0" });
  const { code, stderr } = await check("v1.22.0", root);
  assert.equal(code, 1);assert.match(stderr, /plane-v/);
});
