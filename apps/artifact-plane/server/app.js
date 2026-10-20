// Command line of the application: one entry for the server, the MCP server, the model
// installer, the hook and the runtime commands. Each command imports its module only when it runs.
// A bundle inlines package.json through the JSON import, so the version needs no file at run time.
import pkg from "../package.json" with { type: "json" };
import { isAbsolute } from "node:path";
const help = `Usage: artifact-plane [command]

Commands:
  serve           Start the server (the default command).
  mcp             Run the stdio MCP server. Options: --repository /absolute/root
                  (repeatable; default: the Git top level of the working directory),
                  --state-dir /absolute/private/state, --allow-writes.
  hook            Read one Claude Code or Codex hook input from standard input and
                  write one JSON object. Option: --state-dir /absolute/private/state.
                  It always exits with status 0.
  runtime <register|bind|report|query> --name value ...
                  Record and read task execution (integration/README.md).
                  bind accepts --binding inferred; the default is explicit.
  model-install   Download and verify the pinned semantic discovery model.
  --version       Print the version.
  --help          Print this help.

Environment:
  PORT                      Server port, 1 to 65535 (default 4310).
  ARTIFACT_PLANE_PORT       Port where the session start hook finds or starts
                            the server (default 4310). The hook does not read PORT.
  ARTIFACT_PLANE_AUTOSTART  0 stops the session start hook from starting the server.
  ARTIFACT_PLANE_STATE_DIR  Private state directory (default
                            $XDG_STATE_HOME/artifact-plane or ~/.local/state/artifact-plane).
`;
const [command = "serve", ...args] = process.argv.slice(2);
const runtimeCommands = ["register", "bind", "report", "query"];

// The hook writes one JSON object and at most one line to standard error, and exits with status 0.
async function hook() {
  let result = { output: {}, unavailable: true };
  try {
    if (!(args.length === 0 || (args.length === 2 && args[0] === "--state-dir" && isAbsolute(args[1])))) throw Error("Use hook [--state-dir /absolute/path]");
    const { hookOutput, readInput } = await import("./agent-hook.js");
    result = await hookOutput(await readInput(process.stdin), { stateDir: args[1] });
  } catch {/* the output stays {} */}
  if (result.unavailable) process.stderr.write("Artifact Plane hook unavailable; execution continues.\n");
  // A step that ran past its limit can still hold a handle; the exit does not wait for it.
  process.stdout.write(JSON.stringify(result.output) + "\n", () => setTimeout(() => process.exit(0), 0).unref());
}

const commands = {
  serve: async () => (await import("./http.js")).startServer(`Artifact Plane ${pkg.version}`),
  mcp: async () => (await import("./flow-mcp.js")).runFlowMcpStdio(args),
  hook,
  runtime: async () => console.log(JSON.stringify(await (await import("./runtime-cli.js")).run([...args], null))),
  "model-install": async () => (await import("./flow-model-install.js")).installFlowModel(),
  "--version": () => console.log(pkg.version),
  "--help": () => process.stdout.write(help),
};
// mcp and runtime take options and hook reads its own; any other argument is a usage error.
const usage = !Object.hasOwn(commands, command)
  || (command === "runtime" ? !runtimeCommands.includes(args[0]) : !["mcp", "hook"].includes(command) && args.length);
if (usage) {
  process.stderr.write(help);
  process.exitCode = 2;
} else
  try {
    await commands[command]();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
