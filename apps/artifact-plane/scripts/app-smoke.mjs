// Start check of a built executable with a new private state directory and a free port.
// Usage: node scripts/app-smoke.mjs release/artifact-plane-<os>-<arch>[.exe]
import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import pkg from "../package.json" with { type: "json" };

const file = resolve(process.argv[2] ?? "");
if (!process.argv[2]) {console.error("Usage: node scripts/app-smoke.mjs <executable>");process.exit(2);}
const repository = fileURLToPath(new URL("../../..", import.meta.url)).replace(/[\\/]$/, "");
const state = await mkdtemp(join(tmpdir(), "plane-smoke-"));
const env = { ...process.env, ARTIFACT_PLANE_STATE_DIR: state };
let failed = 0;
async function check(name, run) {
  try {await run();console.log(`ok   ${name}`);}
  catch (error) {failed++;console.log(`FAIL ${name}: ${error.message}`);}
}
const assert = (value, message) => {if (!value) throw Error(message);};
const timeout = (ms, message) => new Promise((_, reject) => setTimeout(() => reject(Error(message)), ms).unref());

await check("--version prints the package version", async () => {
  const stdout = await new Promise((done, reject) => execFile(file, ["--version"], { env }, (error, out) => error ? reject(error) : done(out)));
  assert(stdout.trim() === pkg.version, `printed ${JSON.stringify(stdout.trim())}, expected ${pkg.version}`);
});

const port = await new Promise((done) => {const s = createServer().listen(0, "127.0.0.1", () => {const { port } = s.address();s.close(() => done(port));});});
const base = `http://127.0.0.1:${port}`;
const server = spawn(file, ["serve"], { env: { ...env, PORT: String(port) }, stdio: ["ignore", "pipe", "inherit"] });
const exited = new Promise((done) => server.on("exit", (code, signal) => done({ code, signal })));
await check("serve prints its address", () => Promise.race([
  new Promise((done, reject) => {
    let out = "";
    server.stdout.setEncoding("utf8").on("data", (chunk) => {out += chunk;if (out.includes(base)) done();});
    exited.then(({ code }) => reject(Error(`serve exited with ${code}`)));
  }),
  timeout(60000, "no address line within 60 seconds"),
]));
await check("GET / returns the application page", async () => {
  const response = await fetch(`${base}/`);
  assert(response.status === 200, `status ${response.status}`);
  assert(/<html/i.test(await response.text()), "the reply is not an HTML page");
});
await check("the explore route opens this checkout and reports at least one artifact", async () => {
  const response = await fetch(`${base}/api/explore`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: repository }) });
  assert(response.status === 200, `status ${response.status}: ${await response.clone().text()}`);
  const { artifacts } = await response.json();
  assert(artifacts?.length >= 1, "no artifact");
  console.log(`     ${artifacts.length} artifacts`);
});
await check("the process stops on SIGTERM within 5 seconds", async () => {
  // Windows has no SIGTERM; kill() ends the process there.
  server.kill("SIGTERM");
  await Promise.race([exited, timeout(5000, "still running after 5 seconds")]);
});
server.kill("SIGKILL");

await check("mcp answers initialize and lists its tools", async () => {
  const client = new Client({ name: "app-smoke", version: pkg.version });
  const transport = new StdioClientTransport({ command: file, args: ["mcp", "--repository", repository, "--state-dir", state], env, stderr: "inherit" });
  try {
    await Promise.race([client.connect(transport), timeout(60000, "no initialize reply within 60 seconds")]);
    const { tools } = await client.listTools();
    assert(tools.length >= 1, "no tool");
    console.log(`     ${tools.length} tools`);
  } finally {await client.close();}
});

// The hook writes one JSON object and exits with status 0; runtime query prints the JSON of the store.
const runWith = (args, input) => new Promise((done, reject) => {
  const child = execFile(file, args, { env }, (error, stdout, stderr) => error ? reject(Object.assign(error, { stderr })) : done(JSON.parse(stdout)));
  child.stdin.end(input);
});
await check("hook answers a SessionStart input with one JSON object", async () => {
  const input = { session_id: "app-smoke", hook_event_name: "SessionStart", source: "startup", cwd: repository };
  const output = await Promise.race([runWith(["hook", "--state-dir", state], JSON.stringify(input)), timeout(60000, "no hook output within 60 seconds")]);
  assert(output && typeof output === "object" && !Array.isArray(output), `output ${JSON.stringify(output)}`);
  const context = output.hookSpecificOutput?.additionalContext;
  assert(context === undefined || typeof context === "string", "additionalContext is not text");
  console.log(`     ${context ? context.split("\n")[0] : "{}"}`);
});
await check("runtime query prints the JSON of the store", async () => {
  const result = await runWith(["runtime", "query", "--root", repository, "--state-dir", state], "").catch((error) => {
    // The store refuses its directory on Windows (agent-integration specification, Hook command): it requires POSIX modes
    // 0700 and 0600, which Windows does not report, and on some runners its repository check also refuses the temporary directory.
    if (process.platform === "win32" && error.code === 1 && /private runtime|outside repositories/.test(error.stderr)) return { windows: `${error.stderr.trim()} (state ${state})` };
    throw error;
  });
  if (result.windows) {console.log(`     runtime store unavailable on Windows: ${result.windows}`);return;}
  assert(Number.isInteger(result.sequence) && Array.isArray(result.attempts), `result ${JSON.stringify(result).slice(0, 200)}`);
  console.log(`     ${result.sequence} events`);
});

await rm(state, { recursive: true, force: true });
console.log(failed ? `${failed} checks failed` : "All checks passed");
process.exitCode = failed ? 1 : 0;
