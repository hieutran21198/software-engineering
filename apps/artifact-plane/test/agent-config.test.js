import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Agent configuration (agent-integration specification, Configuration).
const file = (path) => fileURLToPath(new URL(path, import.meta.url));
const json = async (path) => JSON.parse(await readFile(file(path), "utf8"));
const COMMAND = "artifact-plane hook || true";
const TIMEOUTS = { SessionStart: 10, UserPromptSubmit: 5, PreToolUse: 5, PostToolUse: 5, PermissionRequest: 5, SubagentStart: 5, Stop: 30, SubagentStop: 30, SessionEnd: 3 };

function assertHooks(config, expected) {
  assert.deepEqual(Object.keys(config.hooks).sort(), Object.keys(expected).sort());
  for (const [event, timeout] of Object.entries(expected)) {
    assert.deepEqual(config.hooks[event], [{ hooks: [{ type: "command", command: COMMAND, timeout }] }], event);
  }
}

test("Claude Code example and repository settings have the hook entries", async () => {
  const example = await json("../integration/claude-settings.example.json");
  assertHooks(example, TIMEOUTS);
  assertHooks(await json("../../../.claude/settings.json"), TIMEOUTS);
});

test("Codex example and repository hooks add Interrupt", async () => {
  const example = await json("../integration/codex-hooks.example.json");
  assertHooks(example, { ...TIMEOUTS, Interrupt: 3 });
  assert.deepEqual(await json("../../../.codex/hooks.json"), example);
});

test("Antigravity example and repository hooks have the named hook entries", async () => {
  const example = await json("../integration/antigravity-hooks.example.json");
  const handler = (event, timeout) => ({ type: "command", command: `artifact-plane hook --event ${event} || true`, timeout });
  assert.deepEqual(example, {
    "artifact-plane": {
      SessionStart: [handler("SessionStart", 10)],
      PreInvocation: [handler("PreInvocation", 5)],
      PreToolUse: [{ matcher: "*", hooks: [{ type: "command", command: "artifact-plane hook --event PreToolUse | grep '\"decision\"' || echo '{\"decision\":\"allow\"}'", timeout: 5 }] }],
      PostToolUse: [{ matcher: "*", hooks: [handler("PostToolUse", 5)] }],
      Stop: [handler("Stop", 30)],
    },
  });
  assert.deepEqual(await json("../../../.agents/hooks.json"), example);
});

test("repository MCP registrations start the executable without a root", async () => {
  const mcp = { mcpServers: { "artifact-plane": { command: "artifact-plane", args: ["mcp"] } } };
  assert.deepEqual(await json("../../../.mcp.json"), mcp);
  assert.deepEqual(await json("../../../.agents/plugins/artifact-plane/plugin.json"), { name: "artifact-plane" });
  assert.deepEqual(await json("../../../.agents/plugins/artifact-plane/mcp_config.json"), mcp);
  const toml = await readFile(file("../../../.codex/config.toml"), "utf8");
  assert.match(toml, /^\[agents\]\nenabled = true$/m);
  assert.match(toml, /^\[mcp_servers\.artifact-plane\]\ncommand = "artifact-plane"\nargs = \["mcp"\]$/m);
});
