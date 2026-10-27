import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../../../", import.meta.url);
const text = (path) => readFile(new URL(path, root), "utf8");

test("OpenCode V2 project configuration and example add only the local MCP server", async () => {
  const expected = {
    $schema: "https://opencode.ai/config.json",
    mcp: { servers: { "artifact-plane": { type: "local", command: ["artifact-plane", "mcp"] } } },
  };
  for (const path of ["opencode.json", "apps/artifact-plane/integration/opencode.example.json"]) {
    // Exact shape excludes model/default-agent overrides, permission changes,
    // global settings, V1 MCP syntax and a duplicate explicit plugin entry.
    assert.deepEqual(JSON.parse(await text(path)), expected, path);
  }
});

test("autoload entry only re-exports the single reusable native plugin", async () => {
  const path = ".opencode/plugins/artifact-plane/index.ts";
  const entry = await text(path);
  const match = entry.match(/^export \{ default \} from "([^"]+)";\s*$/);
  assert.ok(match, "entry adds no hooks, runtime SDK import or duplicated bridge");
  assert.equal(new URL(match[1], new URL(path, root)).href,
    new URL("apps/artifact-plane/integration/opencode/index.js", root).href);
  // Import/activation belongs to combined validation after the bridge joins.
});

test("setup documentation links resolve and never point to an ancestor page", async () => {
  for (const path of ["apps/artifact-plane/README.md", "apps/artifact-plane/integration/README.md"]) {
    const source = fileURLToPath(new URL(path, root));
    const markdown = (await text(path))
      .replace(/^\s*```[^\n]*\n[\s\S]*?^\s*```/gm, "")
      .replace(/`[^`\n]+`/g, "");
    for (const [, link] of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^[a-z]+:/i.test(link) || link.startsWith("#")) continue;
      const [target, fragment] = link.split("#");
      const destination = resolve(dirname(source), target);
      await access(destination);
      if (/README\.md$/i.test(destination)) {
        const relationship = relative(dirname(destination), dirname(source));
        assert.ok(!relationship || relationship.startsWith(".."), `${path}: ancestor link ${link}`);
      }
      if (fragment && destination.endsWith(".md")) {
        const headings = [...(await readFile(destination, "utf8")).matchAll(/^#+\s+(.+)$/gm)]
          .map(([, heading]) => heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s/g, "-"));
        assert.ok(headings.includes(fragment), `${path}: missing heading ${link}`);
      }
    }
  }
});

test("OpenCode guidance separates unsupported completion control and activation evidence", async () => {
  const guide = await text("apps/artifact-plane/integration/README.md");
  assert.match(guide, /no stop blocking/);
  assert.match(guide, /MCP `check_records`/);
  assert.match(guide, /never creates prompts, automatically continues work/);
  assert.match(guide, /MCP tools, including `check_records`, are unavailable/);
  assert.match(guide, /Keep mock-host fixtures, native-runtime fixtures, actual model execution, reported validation and establishment evidence distinct/);
  assert.match(guide, /shell-create.*outside verified protection/);
});
