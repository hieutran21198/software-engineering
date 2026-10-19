// Build the single executable application of the running operating system and processor:
// release/artifact-plane-<os>-<arch>[.exe]. The payload (server.mjs, dist/, the external
// runtime packages and manifest.json) goes into payload/ and into the blob as assets.
// Usage: npm run build:app
import { build } from "vite";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import pkg from "../package.json" with { type: "json" };

const app = fileURLToPath(new URL("..", import.meta.url));
const payload = join(app, "payload"), release = join(app, "release");
const os = { linux: "linux", darwin: "darwin", win32: "windows" }[process.platform];
const arch = { x64: "amd64", arm64: "arm64" }[process.arch];
if (!os || !arch) throw Error(`Unsupported target ${process.platform}-${process.arch}`);
const output = join(release, `artifact-plane-${os}-${arch}${os === "windows" ? ".exe" : ""}`);

// 1. The browser application.
await build({ root: app, logLevel: "warn" });

// 2. One ES module of the server. Rolldown inlines the dynamic imports (codeSplitting: false).
rmSync(payload, { recursive: true, force: true });
await build({
  root: app, configFile: false, logLevel: "warn", publicDir: false,
  ssr: { noExternal: true, target: "node" },
  build: {
    ssr: "server/app.js", outDir: payload, emptyOutDir: false, target: "node24", minify: false, copyPublicDir: false,
    rollupOptions: { external: ["@huggingface/transformers"], output: { format: "es", entryFileNames: "server.mjs", codeSplitting: false } },
  },
});

// 3. dist/ and the runtime packages of @huggingface/transformers, with only the native files of this target.
cpSync(join(app, "dist"), join(payload, "dist"), { recursive: true });
const parts = {
  "@huggingface/transformers": ["package.json", "dist/transformers.node.mjs"],
  "onnxruntime-node": ["package.json", "dist", `bin/napi-v3/${process.platform}/${process.arch}`],
  // server/flow-embeddings.js only resolves this package to a path; the Node build ignores it.
  "onnxruntime-web": ["package.json", "dist/ort.node.min.mjs"],
};
// Source maps, type declarations, sources and documents; on Linux the versioned
// libonnxruntime.so.1.x.y duplicates libonnxruntime.so.1, which the binding loads.
const skip = /\.(map|[cm]?ts|md|cc|h|gyp)$|libonnxruntime\.so\.\d+\.\d+\.\d+$/;
const copied = new Set();
function copyPackage(name) {
  const source = join(app, "node_modules", name);
  // npm installs only the optional packages (sharp bindings) of this target.
  if (copied.has(name) || !existsSync(source)) return;
  copied.add(name);
  for (const part of parts[name] ?? [""])
    cpSync(join(source, part), join(payload, "node_modules", name, part), { recursive: true, filter: (path) => !skip.test(path) });
  // Packages copied whole bring their dependencies; the others list what they need.
  if (!parts[name]) {
    const json = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));
    for (const dependency of Object.keys({ ...json.dependencies, ...json.optionalDependencies })) copyPackage(dependency);
  }
}
for (const name of ["@huggingface/transformers", "onnxruntime-common", "onnxruntime-node", "onnxruntime-web", "sharp"]) copyPackage(name);

const files = {};
(function list(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) list(path);
    else files[relative(payload, path).split(sep).join("/")] = createHash("sha256").update(readFileSync(path)).digest("hex");
  }
})(payload);
writeFileSync(join(payload, "manifest.json"), JSON.stringify({ version: pkg.version, files }, null, 1) + "\n");

// 4 and 5. The blob with the launcher as main and one asset for each payload file, injected into a copy of node.
mkdirSync(release, { recursive: true });
const assets = Object.fromEntries([...Object.keys(files), "manifest.json"].map((file) => [file, join(payload, ...file.split("/"))]));
const config = join(release, "sea-config.json"), blob = join(release, "sea.blob");
writeFileSync(config, JSON.stringify({ main: join(app, "scripts", "app-launcher.cjs"), output: blob, disableExperimentalSEAWarning: true, useSnapshot: false, useCodeCache: false, assets }, null, 1));
execFileSync(process.execPath, ["--experimental-sea-config", config], { stdio: "inherit" });
rmSync(output, { force: true });
copyFileSync(process.execPath, output);
chmodSync(output, 0o755);
if (os === "darwin") execFileSync("codesign", ["--remove-signature", output], { stdio: "inherit" });
const { inject } = createRequire(import.meta.url)("postject");
await inject(output, "NODE_SEA_BLOB", readFileSync(blob), {
  sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
  ...(os === "darwin" ? { machoSegmentName: "NODE_SEA" } : {}),
});
if (os === "darwin") execFileSync("codesign", ["--sign", "-", output], { stdio: "inherit" });
console.log(`${relative(app, output)}: ${(statSync(output).size / 1e6).toFixed(1)} MB`);
