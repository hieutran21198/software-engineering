import { mkdir, writeFile, rename, rm, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { defaultStateDir } from "../server/runtime-store.js";
import {
  MODEL,
  MODEL_REVISION,
  MODEL_FILES,
  MODEL_HASHES,
} from "../server/flow-embeddings.js";
const state = resolve(
  process.env.ARTIFACT_PLANE_STATE_DIR || defaultStateDir(),
);
// Use the same repository-aware private directory policy as the index.
const { guardFlowDirectory } = await import("../server/flow-index.js");
guardFlowDirectory(state, []);
const stage = join(state, "model-install-" + randomUUID());
await mkdir(join(stage, MODEL, "onnx"), { recursive: true, mode: 0o700 });
const manifest = { model: MODEL, revision: MODEL_REVISION, files: {} };
try {
  for (const file of MODEL_FILES) {
    const url = `https://huggingface.co/${MODEL}/resolve/${MODEL_REVISION}/${file}`;
    const response = await fetch(url);
    if (!response.ok)
      throw Error(`Download failed: ${file} (${response.status})`);
    const bytes = Buffer.from(await response.arrayBuffer());
    manifest.files[file] = createHash("sha256").update(bytes).digest("hex");
    if (manifest.files[file] !== MODEL_HASHES[file])
      throw Error("Downloaded asset differs from pinned hash: " + file);
    await writeFile(join(stage, MODEL, file), bytes, { mode: 0o600 });
  }
  await writeFile(
    join(stage, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { mode: 0o600 },
  );
  for (const file of MODEL_FILES) {
    const hash = createHash("sha256")
      .update(await readFile(join(stage, MODEL, file)))
      .digest("hex");
    if (hash !== MODEL_HASHES[file])
      throw Error("Installed asset hash mismatch: " + file);
  }
  await rm(join(state, "models"), { recursive: true, force: true });
  await rename(stage, join(state, "models"));
  console.error("Installed pinned flow model in " + join(state, "models"));
} catch (error) {
  await rm(stage, { recursive: true, force: true });
  throw error;
}
