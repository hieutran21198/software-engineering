// Command line of the application: one entry for the server, the MCP server and the model installer.
// A bundle inlines package.json through the JSON import, so the version needs no file at run time.
import pkg from "../package.json" with { type: "json" };
import { startServer } from "./http.js";
import { runFlowMcpStdio } from "./flow-mcp.js";
import { installFlowModel } from "./flow-model-install.js";
const help = `Usage: artifact-plane [command]

Commands:
  serve           Start the server (the default command).
  mcp             Run the stdio MCP server. Options: --repository /absolute/root
                  (repeatable), --state-dir /absolute/private/state, --allow-writes.
  model-install   Download and verify the pinned semantic discovery model.
  --version       Print the version.
  --help          Print this help.

Environment:
  PORT                      Server port, 1 to 65535 (default 4310).
  ARTIFACT_PLANE_STATE_DIR  Private state directory (default
                            $XDG_STATE_HOME/artifact-plane or ~/.local/state/artifact-plane).
`;
const [command = "serve", ...args] = process.argv.slice(2);
const commands = {
  serve: () => startServer(`Artifact Plane ${pkg.version}`),
  mcp: () => runFlowMcpStdio(args),
  "model-install": installFlowModel,
  "--version": () => console.log(pkg.version),
  "--help": () => process.stdout.write(help),
};
// Only mcp takes options; any other argument is a usage error.
if (!Object.hasOwn(commands, command) || (command !== "mcp" && args.length)) {
  process.stderr.write(help);
  process.exitCode = 2;
} else
  try {
    await commands[command]();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
