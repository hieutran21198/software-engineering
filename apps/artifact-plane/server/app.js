// Command line of the application: one entry for the server, the MCP server, the model
// installer, the hook, the runtime commands and the session runner. Each command imports its module only when it runs.
// A bundle inlines package.json through the JSON import, so the version needs no file at run time.
import pkg from "../package.json" with { type: "json" };
import { isAbsolute } from "node:path";
const help = `Usage: artifact-plane [command]

Commands:
  serve           Start the server (the default command).
  mcp             Run the stdio MCP server. Options: --repository /absolute/root
                  (repeatable; default: the Git top level of the working directory),
                  --state-dir /absolute/private/state, --allow-writes.
  hook            Read one Claude Code, Codex, Antigravity or Command Code hook
                  input from standard input and write one JSON object. Options:
                  --state-dir /absolute/private/state, --event <name>.
                  It always exits with status 0.
  runtime <register|bind|report|query> --name value ...
                  Record and read task execution (integration/README.md).
                  bind accepts --binding inferred; the default is explicit.
  runner          Run the session runner, which hosts the agent sessions that Plane
                  starts. The server starts it when needed. Options:
                  --state-dir /absolute/private/state. It listens on runner.sock
                  in the state directory and exits 10 minutes after its last
                  session ends while no server is connected. SIGTERM stops it;
                  terminal sessions continue in herdr.
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
  const preToolAllow = args.some((a, i) => a === "--event" && args[i + 1] === "PreToolUse");
  let result = { output: preToolAllow ? { decision: "allow" } : {}, unavailable: true };
  try {
    let stateDir, event;
    for (let i = 0; i < args.length; i += 2) {
      if (i + 1 >= args.length) throw Error("Use hook [--state-dir /absolute/path] [--event <name>]");
      if (args[i] === "--state-dir" && !stateDir && isAbsolute(args[i + 1])) stateDir = args[i + 1];
      else if (args[i] === "--event" && !event && args[i + 1]) event = args[i + 1];
      else throw Error("Use hook [--state-dir /absolute/path] [--event <name>]");
    }
    const { hookOutput, readInput } = await import("./agent-hook.js");
    result = await hookOutput(await readInput(process.stdin), { stateDir, event });
  } catch {/* the fallback output stays */}
  if (result.unavailable) process.stderr.write("Artifact Plane hook unavailable; execution continues.\n");
  // A step that ran past its limit can still hold a handle; the exit does not wait for it.
  process.stdout.write(JSON.stringify(result.output) + "\n", () => setTimeout(() => process.exit(0), 0).unref());
}

const commands = {
  serve: async () => (await import("./http.js")).startServer(`Artifact Plane ${pkg.version}`),
  mcp: async () => (await import("./flow-mcp.js")).runFlowMcpStdio(args),
  hook,
  runtime: async () => console.log(JSON.stringify(await (await import("./runtime-cli.js")).run([...args], null))),
  runner: async () => (await import("./session-runner.js")).runRunner(args),
  "model-install": async () => (await import("./flow-model-install.js")).installFlowModel(),
  "--version": () => console.log(pkg.version),
  "--help": () => process.stdout.write(help),
};
// mcp, runner and runtime take options and hook reads its own; any other argument is a usage error.
const usage = !Object.hasOwn(commands, command)
  || (command === "runtime" ? !runtimeCommands.includes(args[0]) : !["mcp", "hook", "runner"].includes(command) && args.length);
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
