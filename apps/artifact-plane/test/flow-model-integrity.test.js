import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  MODEL,
  MODEL_REVISION,
  MODEL_FILES,
  MODEL_HASHES,
  createLocalEmbedder,
} from "../server/flow-embeddings.js";
const execute = promisify(execFile);
async function state(t) {
  const path = await mkdtemp(join(tmpdir(), "flow-integrity-"));
  t.after(() => rm(path, { recursive: true, force: true }));
  await mkdir(join(path, "models", MODEL), { recursive: true });
  return path;
}
const manifest = (files) => ({ model: MODEL, revision: MODEL_REVISION, files });
test("every required pinned asset has an independent fixed SHA256", () => {
  assert.deepEqual(Object.keys(MODEL_HASHES).sort(), [...MODEL_FILES].sort());
  for (const hash of Object.values(MODEL_HASHES))
    assert.match(hash, /^[a-f0-9]{64}$/);
  assert.ok(Object.isFrozen(MODEL_HASHES));
});
test("self-consistent rewritten manifest and asset cannot replace the pinned model", async (t) => {
  const path = await state(t),
    bytes = '{"tampered":true}',
    hash = createHash("sha256").update(bytes).digest("hex");
  await writeFile(join(path, "models", MODEL, "config.json"), bytes);
  await writeFile(
    join(path, "models", "manifest.json"),
    JSON.stringify(manifest({ ...MODEL_HASHES, "config.json": hash })),
  );
  await assert.rejects(
    createLocalEmbedder(path).embed(["login"]),
    /Corrupt flow model asset manifest: config.json/,
  );
});
test("pinned manifest rejects altered asset bytes before inference", async (t) => {
  const path = await state(t);
  await writeFile(join(path, "models", MODEL, "config.json"), "{}");
  await writeFile(
    join(path, "models", "manifest.json"),
    JSON.stringify(manifest(MODEL_HASHES)),
  );
  await assert.rejects(
    createLocalEmbedder(path).embed(["login"]),
    /Corrupt flow model asset: config.json/,
  );
});
test("installer rejects unexpected download hash and preserves existing model", async (t) => {
  const path = await state(t);
  await writeFile(join(path, "models", "sentinel"), "previous installed model");
  const script = new URL("../scripts/install-flow-model.mjs", import.meta.url)
    .href;
  const code = `process.env.ARTIFACT_PLANE_STATE_DIR=${JSON.stringify(path)};globalThis.fetch=async()=>new Response('unexpected bytes',{status:200});await import(${JSON.stringify(script)});`;
  await assert.rejects(
    execute(process.execPath, ["--input-type=module", "-e", code]),
    /Downloaded asset differs from pinned hash/,
  );
  assert.equal(
    await readFile(join(path, "models", "sentinel"), "utf8"),
    "previous installed model",
  );
  assert.equal(
    (await readdir(path)).some((name) => name.startsWith("model-install-")),
    false,
  );
});
