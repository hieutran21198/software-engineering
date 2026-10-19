// Launcher of the single executable application (the CommonJS main of the SEA blob).
// It extracts the payload assets into <state>/app/<version>-<12 hex of the manifest hash>,
// imports server.mjs from there, and keeps only the two newest version directories.
// process.argv keeps the user arguments at index 2 and later, as server/app.js expects.
"use strict";
const sea = require("node:sea");
const fs = require("node:fs");
const { join, resolve } = require("node:path");
const { homedir } = require("node:os");
const { createHash, randomUUID } = require("node:crypto");
const { pathToFileURL } = require("node:url");

// The same default as defaultStateDir() in server/runtime-store.js.
const stateDir = resolve(process.env.ARTIFACT_PLANE_STATE_DIR || join(process.env.XDG_STATE_HOME || join(homedir(), ".local/state"), "artifact-plane"));
const manifestText = sea.getAsset("manifest.json", "utf8");
const manifest = JSON.parse(manifestText);
const hash = createHash("sha256").update(manifestText).digest("hex");
const cacheRoot = join(stateDir, "app");
const name = `${manifest.version}-${hash.slice(0, 12)}`;
const directory = join(cacheRoot, name);

function sameManifest(dir) {
  try {return createHash("sha256").update(fs.readFileSync(join(dir, "manifest.json"))).digest("hex") === hash;}
  catch {return false;}
}

function extract() {
  fs.mkdirSync(cacheRoot, { recursive: true, mode: 0o700 });
  const temporary = join(cacheRoot, `.${name}-${randomUUID()}`);
  try {
    for (const file of [...Object.keys(manifest.files), "manifest.json"]) {
      const target = join(temporary, ...file.split("/"));
      fs.mkdirSync(join(target, ".."), { recursive: true });
      fs.writeFileSync(target, new Uint8Array(sea.getRawAsset(file)));
    }
    // An incomplete directory of the same name has no matching manifest; replace it.
    if (fs.existsSync(directory) && !sameManifest(directory)) fs.rmSync(directory, { recursive: true, force: true });
    try {fs.renameSync(temporary, directory);}
    catch (error) {if (!sameManifest(directory)) throw error;} // Another process placed it first.
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

// Keep the current directory and the newest other version directory.
function prune() {
  const now = new Date();
  fs.utimesSync(directory, now, now);
  const versions = fs.readdirSync(cacheRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== name)
    .map((entry) => ({ path: join(cacheRoot, entry.name), time: fs.statSync(join(cacheRoot, entry.name)).mtimeMs }))
    .sort((a, b) => b.time - a.time);
  for (const old of versions.slice(1)) fs.rmSync(old.path, { recursive: true, force: true });
}

(async () => {
  if (!sameManifest(directory)) extract();
  await import(pathToFileURL(join(directory, "server.mjs")).href);
  if (!process.exitCode) {
    try {prune();}
    catch (error) {console.error(`Cannot remove old application versions: ${error.message}`);}
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
