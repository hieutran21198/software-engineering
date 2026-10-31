import test from "node:test";
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { distDirectory } from "../server/http.js";
import { fixtureRepository } from "./fixtures.js";
import pkg from "../package.json" with { type: "json" };

const app = fileURLToPath(new URL("../server/app.js", import.meta.url));
const run = (...args) => new Promise((resolve) => execFile(process.execPath, [app, ...args], (error, stdout, stderr) => resolve({ code: error ? error.code : 0, stdout, stderr })));
const temp = async (t) => {const dir = await mkdtemp(join(tmpdir(), "plane-app-"));t.after(() => rm(dir, { recursive: true, force: true }));return dir;};

test("--version prints the package version", async () => {
  assert.deepEqual(await run("--version"), { code: 0, stdout: pkg.version + "\n", stderr: "" });
});

test("--help prints the commands and environment variables", async () => {
  const { code, stdout, stderr } = await run("--help");
  assert.equal(code, 0);assert.equal(stderr, "");
  for (const word of ["serve", "mcp", "hook", "runtime <register|bind|report|query>", "--binding inferred", "default: the Git top level", "model-install", "--version", "--help", "PORT", "ARTIFACT_PLANE_STATE_DIR"]) assert.ok(stdout.includes(word), word);
});

test("an unknown argument prints the help to standard error with exit status 2", async () => {
  const help = (await run("--help")).stdout;
  for (const args of [["unknown"], ["serve", "extra"], ["--version", "extra"], ["runtime"], ["runtime", "hook"], ["runtime", "--root", "/"]]) assert.deepEqual(await run(...args), { code: 2, stdout: "", stderr: help });
});

test("the server finds dist/ beside a bundled server.mjs and beside server/ in a source checkout", async (t) => {
  const dir = await temp(t);
  await mkdir(join(dir, "payload", "dist"), { recursive: true });await mkdir(join(dir, "server"));
  assert.equal(distDirectory(join(dir, "payload")), join(dir, "payload", "dist"));
  assert.equal(distDirectory(join(dir, "server")), join(dir, "dist"));
  assert.equal(distDirectory(fileURLToPath(new URL("../server/", import.meta.url))), fileURLToPath(new URL("../dist", import.meta.url)));
});

test("serve listens on a free port and answers GET /", async (t) => {
  const port = await new Promise((resolve) => {const s = createServer().listen(0, "127.0.0.1", () => {const { port } = s.address();s.close(() => resolve(port));});});
  const child = spawn(process.execPath, [app, "serve"], { env: { ...process.env, PORT: String(port), ARTIFACT_PLANE_STATE_DIR: await temp(t) }, stdio: ["ignore", "pipe", "pipe"] });
  t.after(() => child.kill());
  const line = await new Promise((resolve, reject) => {let out = "";child.stdout.setEncoding("utf8").on("data", (chunk) => {out += chunk;if (out.includes("\n")) resolve(out.split("\n")[0]);});child.on("exit", (code) => reject(Error("serve exited with " + code)));});
  assert.equal(line, `Artifact Plane ${pkg.version}: http://127.0.0.1:${port}`);
  const response = await fetch(`http://127.0.0.1:${port}/`);
  assert.ok(response.headers.get("content-security-policy"));
  // npm test runs before npm run build in CI; then the reply names the build step.
  if (existsSync(fileURLToPath(new URL("../dist/index.html", import.meta.url)))) {assert.equal(response.status, 200);assert.match(await response.text(), /<html/i);}
  else {assert.equal(response.status, 404);assert.match((await response.json()).error, /npm run build/);}
});

test("mcp runs the stdio MCP server and lists its tools", async (t) => {
  const fixture = await fixtureRepository(), stateDir = await temp(t), client = new Client({ name: "app-test", version: "1" });
  const transport = new StdioClientTransport({ command: process.execPath, args: [app, "mcp", "--repository", fixture.root, "--state-dir", stateDir], stderr: "pipe" });
  t.after(async () => {await client.close();await fixture.cleanup();});
  await client.connect(transport);
  const names = (await client.listTools()).tools.map((tool) => tool.name);
  assert.equal(names.length, 14);assert.ok(names.includes("search_flows") && names.includes("get_concept"));
});
