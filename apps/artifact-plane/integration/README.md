# Connect agents to the Plane

The released executable `artifact-plane` connects to Claude Code, Codex, Antigravity and Command Code through a stdio MCP server and one hook command. OpenCode V2 uses the same MCP server and a native plugin bridge to that command. Put the executable on `PATH` as `artifact-plane` in the environment that starts the harness. The hooks and the MCP server read knowledge and Git. They never approve work, push, merge or establish versions.

## What the hooks do

This table describes the command-hook harnesses. OpenCode's supported mapping and completion limits are listed separately below.

| Event | Effect |
| --- | --- |
| SessionStart (startup, resume, clear, compact) | Adds the state of the changes in the worktree to the agent context: change, tier, unit, status, next step and unchecked DoD items. Starts the workbench when it does not run, and shows you its address at startup and resume (see Workbench). |
| PreToolUse | Refuses three actions that ADD reserves for people: a commit on `main` or `master`, a push to `main` or `master`, and `gh pr merge`. Binds the agent to a task when it reads a task file (see Observe execution). |
| Stop, SubagentStop | When a current change of the worktree has record errors, asks the agent once to fix or explain them. Warnings do not count. |
| All events | Records allowlisted observations for the implementation graph. |

The refusals and the stop request apply only in a repository with `docs/artifacts`. A failure of the Plane never stops the agent: the hook exits with status 0, and `|| true` in the configuration also covers a missing or older executable. The hooks store no prompt, tool input, command, tool output or transcript. A tool hook is a guardrail, not a complete control: an alias or a script that runs `git` is not seen.

## Claude Code

1. MCP: add the server to `.mcp.json` in the project root, or run `claude mcp add --scope project artifact-plane -- artifact-plane mcp`. Without `--repository`, the server reads the Git top level of its working directory.

   ```json
   {"mcpServers": {"artifact-plane": {"command": "artifact-plane", "args": ["mcp"]}}}
   ```

2. Hooks: merge the entries of [claude-settings.example.json](claude-settings.example.json) into `.claude/settings.json` (shared) or `.claude/settings.local.json` (personal). Keep unrelated entries.
3. Trust: accept the workspace trust dialog, and approve the project MCP server when Claude Code asks. `/hooks` lists the active hooks; `/mcp` lists the server and its tools.

## Codex

1. MCP: add the server to `.codex/config.toml` of the project, or run `codex mcp add artifact-plane -- artifact-plane mcp` for your user configuration.

   ```toml
   [mcp_servers.artifact-plane]
   command = "artifact-plane"
   args = ["mcp"]
   ```

2. Hooks: merge the entries of [codex-hooks.example.json](codex-hooks.example.json) into `.codex/hooks.json` of the project, or `~/.codex/hooks.json`.
3. Trust: Codex loads project configuration only for a trusted project (`[projects."<absolute path>"] trust_level = "trusted"` in `~/.codex/config.toml`, or the trust prompt). Then open `/hooks` and trust each hook. Codex skips a hook again after its command changes, until you trust it again.

## Antigravity

1. MCP: add the workspace plugin files `.agents/plugins/artifact-plane/plugin.json` (`{"name": "artifact-plane"}`) and `.agents/plugins/artifact-plane/mcp_config.json`, or merge the `mcpServers` entry into your global `~/.gemini/config/mcp_config.json`:

   ```json
   {"mcpServers": {"artifact-plane": {"command": "artifact-plane", "args": ["mcp"]}}}
   ```

2. Hooks: merge the `"artifact-plane"` entry of [antigravity-hooks.example.json](antigravity-hooks.example.json) into `.agents/hooks.json` of the workspace, or `~/.gemini/antigravity/hooks.json`. Each entry passes `--event <Event>` so `PreToolUse` and `PostToolUse` are distinct even when a tool call has no error.
3. Activation: Antigravity discovers workspace skills from `.agents/skills/`, workspace rules from `AGENTS.md`, workspace hooks from `.agents/hooks.json`, and workspace MCP servers from `.agents/plugins/<name>/mcp_config.json`.

The examples use a POSIX shell. On Windows, use `artifact-plane hook` (or `artifact-plane hook --event <Event>`) without `|| true`, with an executable of the same version as the configuration.

## Command Code

1. MCP: the project `.mcp.json` in the project root is the project-scope registration. This repository already contains it. `cmd mcp add --scope project artifact-plane -- artifact-plane mcp` writes the same file, and `cmd mcp list` shows the server.
2. Hooks: merge [commandcode-settings.example.json](commandcode-settings.example.json) into `.commandcode/settings.json` of the project. Keep unrelated entries such as permission rules. Command Code supports `SessionStart`, `PreToolUse`, `PostToolUse` and `Stop` only.
3. Trust: accept the workspace trust prompt, or start with `--trust`. Hooks load at startup. `/mcp` shows the server. `cmd --debug` writes hook evaluation details to `~/.commandcode/logs/command.log`.

Command Code 1.85.1 did not fire `SessionStart` in headless mode on startup or resume, so the change context needs an interactive session. It skips hooks in plan mode. Hook inputs carry no `agent_id` and there are no subagent hook events; an inferred binding therefore follows the linked-worktree rule.

## OpenCode V2

The target runtime and published SDK are **2.1.2**. This integration does not use OpenCode V1 hooks.

1. MCP: merge [opencode.example.json](opencode.example.json) into project `opencode.json`. This repository already contains that configuration:

   ```json
   {
     "$schema": "https://opencode.ai/config.json",
     "mcp": {
       "servers": {
         "artifact-plane": {
           "type": "local",
           "command": ["artifact-plane", "mcp"]
         }
       }
     }
   }
   ```

2. Plugin: this repository's `.opencode/plugins/artifact-plane/index.ts` re-exports the default native `{id: "artifact-plane", setup}` object from `apps/artifact-plane/integration/opencode/index.js`. OpenCode discovers the project entry automatically. Do not add a duplicate `plugins` entry. For another repository, copy the reusable bridge directory and provide one local plugin entry that re-exports its default export at the correct relative path. The bridge uses Node builtins; it needs no runtime SDK dependency or plugin dependency manifest.
3. Activation: open the project in a trusted environment. The native plugin executes local code, and the MCP server starts a local executable. Accept applicable project trust and organization policy requirements; do not bypass permission prompts or change global settings. Keep existing model selection, default agent and permission rules. Run `opencode plugin list` to inspect activation, and `opencode mcp list` or `/mcps` to confirm the server is connected. Registration alone is not activation. After bridge source changes, restart OpenCode if the local dependency has not reloaded.

The plugin appends change context and the workbench address before model requests for the session's actual location, including after a move. Supported tool observations bind task reads without storing prompts, commands, tool results or transcripts. Session and worktree identify observations; a named profile such as `build` is not a unique child agent.

For the verified 2.1.2 built-in shell, the bridge correlates the final tool-before `command` and `workdir` with permission source IDs (session, message and call). It resolves the effective directory from the session location. It never joins scanned permission resources into a command. Explicit reserved-action denials remain denials; other allow, ask and deny decisions stay unchanged. Third-party `shell-create` command/cwd rewrites lack call identity and are outside verified protection. This is a guardrail, not a sandbox; aliases and nested programs can also escape recognition.

OpenCode has **no stop blocking**. Use MCP `check_records` during work and before reporting completion. The bridge never creates prompts, automatically continues work, approves plans or marks DoD validated. It records a real completion or interruption only when durable user-delivery and execution events identify one unambiguous turn. Missing or ambiguous terminal turns, late attachment, stream loss and moves do not produce a guessed success; failed execution is not reported as success.

Bridge requests fail open on missing executables, unavailable storage, malformed responses and timeouts: ordinary agent work continues without relaxing existing permissions. Context requests are bounded to 12 seconds and tool/permission requests to 8 seconds. An unavailable observer does not erase a valid policy denial. Fail-open bridge behavior does **not** mean MCP is connected: if `artifact-plane` is missing from `PATH`, its MCP tools, including `check_records`, are unavailable until the executable is installed and the server connects.

The official V2 [configuration](https://opencode.ai/v2/docs/config), [MCP](https://opencode.ai/v2/docs/mcp-servers), [plugin loading](https://opencode.ai/v2/docs/plugins) and [plugin API](https://opencode.ai/v2/docs/build/plugins) guides describe native setup.

## Workbench

When a session starts in a repository with `docs/artifacts`, the hook looks for the workbench at `http://127.0.0.1:4310`. When nothing answers, it starts `artifact-plane serve` in the background. At startup and resume you see one line:

| Line | Meaning |
| --- | --- |
| `Artifact Plane workbench: <address>` | The workbench runs. Open the address; it opens the repository of the session. |
| `Artifact Plane workbench is starting: <address>` | The hook started the workbench, and it did not answer yet. Open the address after a few seconds. |
| `Artifact Plane workbench: run artifact-plane serve, then open <address>` | The start is turned off. |
| `Artifact Plane workbench is not available at port <port>. ...` | Another program, or a Plane older than 1.24.0, uses the port, or the start failed. Run the command of the line to see the error. |

The agent gets the same line in its context. The hook never opens a browser. The workbench keeps running after the session ends; one workbench serves all repositories. To stop it, end the `artifact-plane serve` process, for example with `pkill -f "artifact-plane serve"`.

Two environment variables change the start:

- `ARTIFACT_PLANE_PORT=<port>` selects another port. The hook does not read `PORT`, because a project often sets it for its own server.
- `ARTIFACT_PLANE_AUTOSTART=0` turns off the start.

Set them in the environment that starts the harness, for example in your shell profile. In Claude Code you can also set them in the `env` object of `.claude/settings.local.json`.

## Agent sessions

From the workbench you can start agent sessions in several harness tools. Each tool runs with its own sign-in and its own models. Agent settings (More menu) holds the launch profiles and a default profile for each ADD role. Sessions (More menu, or the "sessions need you" badge) shows the tasks with a session, their DoD progress and output, and the sessions that wait for you.

- Coordinator, product owner and technical lead sessions run in a terminal. You chat in the harness tool: in the embedded terminal of the session page or in your terminal app. After the start, Plane sends no text and no keys to the terminal.
- Implementer sessions can use the Agent Client Protocol (ACP). You answer permission requests and send messages on the session page.
- Plane starts a session only when you click Start. It never answers a permission request for you. It stores no prompt, message, tool argument, tool output or credential.

### Programs

| Program | Checked version | Use | Without it |
| --- | --- | --- | --- |
| `herdr` | 0.9.5 | Hosts terminal sessions in named herdr sessions | No terminal session: no coordinator, product owner or technical lead session |
| `ttyd` | 1.7.7 | Embeds the terminal in the session page | Open in terminal app only |
| A terminal app, for example `ghostty` | — | Open in terminal app (`terminal.open` in the settings) | No Open in terminal app |
| `claude` | 2.1.312 | Claude Code terminal sessions | No Claude Code terminal profile |
| `claude-agent-acp` | 0.99.0 | Claude Code ACP sessions; needs an Anthropic Console API key sign-in | No Claude Code ACP profile |
| `codex`, `codex-acp` | 0.165.0, 2.3.0 | Codex terminal and ACP sessions; `codex-acp` uses its bundled Codex unless the profile sets `CODEX_PATH` | No Codex profile of that connection |
| `opencode` or `opencode2` (version 2) | 2.2.0 | OpenCode terminal (`opencode mini`) and ACP (`opencode acp`) sessions | No OpenCode profile |
| `cmd` | 1.88.0 | Command Code terminal and ACP sessions | No Command Code profile |
| `agy` | 1.4.9 | Antigravity CLI terminal sessions; it has no ACP agent | No Antigravity profile |
| `gemini` | 0.66.0 | Gemini CLI sessions for accounts with an API key or an enterprise plan | No Gemini CLI profile |

Install the programs that your profiles need. Sign in to each harness tool in its own way; Plane never signs in for you.

### Adoption check

An agent that sets up Plane for a person checks these programs before the first session:

1. Run each program of the table with `--version` only, for example `herdr --version`. Run no other command of the program.
2. Report to the person each program that is present, with its version, and each program that is missing, with the text of the column "Without it".
3. Install, update or sign in to nothing without the consent of the person.

Agent settings shows the same facts. Its Check action reads the sign-in state, the models and the levels of a provider without a prompt.

### Launch profiles

The settings file is `profiles.json` in `ARTIFACT_PLANE_CONFIG_DIR`, otherwise in `$XDG_CONFIG_HOME/artifact-plane/` or `~/.config/artifact-plane/`. It must be outside every repository, not a symbolic link, and not writable by other users. Edit it in Agent settings; a hand edit also works.

```json
{
  "version": 1,
  "terminal": { "open": ["ghostty", "-e"] },
  "roleDefaults": { "coordinator": "claude-opus-terminal", "implementer": "codex-fast" },
  "profiles": [
    { "id": "claude-opus-terminal", "label": "Claude Opus (terminal)", "harness": "claude-code",
      "connection": "terminal", "signIn": "plan", "model": "opus" },
    { "id": "codex-fast", "label": "Codex fast", "harness": "codex",
      "connection": "acp", "signIn": "harness", "model": "gpt-5-codex", "reasoning": "low" }
  ]
}
```

- Coordinator, product owner and technical lead defaults must be terminal profiles.
- Claude Code with a plan sign-in runs only in a terminal. Anthropic Consumer Terms forbid automated access with a plan sign-in, and the Claude ACP agent refuses a plan sign-in.
- Plane refuses a profile with an option that skips permission prompts, for example `--dangerously-skip-permissions`, `--yolo` or `--mode auto`, and an environment variable name that contains `KEY`, `TOKEN`, `SECRET`, `PASSWORD` or `CREDENTIAL`.

### Session runner

`artifact-plane runner` hosts the sessions. The server starts it when needed, and the sessions keep running when the server restarts. The runner listens on `runner.sock` in the state directory and exits 10 minutes after its last session ends while no server is connected.

When the workbench says "Restart the session runner", end the sessions, then stop the runner with `pkill -TERM -f "artifact-plane runner"`. Terminal sessions continue in herdr. A runner that is killed with SIGKILL can leave its ttyd processes running; stop them with `pkill -TERM -f "ttyd .*--base-path /api/sessions/terminal/"`.

### Limits

- herdr does not detect every harness tool. For Command Code, and for other tools that herdr shows as unknown, the session page says that Plane cannot see when the agent waits.
- Keys that you type in the first seconds after the terminal opens can be lost. Browser shortcuts such as Ctrl+W stay with the browser; use Full screen or the terminal app.
- `cmd acp` marks the hooks of the session folder as trusted without asking you.
- A provider check can leave an empty session in the history of OpenCode and Command Code.
- Codex and Antigravity can ask you to trust a new worktree folder before the first prompt; answer in the terminal.
- A UNIX socket path must be shorter than 104 bytes, so the state directory path must be short.

## MCP tools

The server sends instructions that map ADD activities to its tools. `get_change_status` returns the state that the session start hook adds; `check_records` returns the validator result for a repository or one change. `get_concept` returns one declared concept, and `search_flows` with `kinds: ["concept"]` finds concepts. `--repository /absolute/root` (repeatable) selects other roots, `--state-dir /absolute/path` a private cache directory, and `--allow-writes` adds the knowledge edit tools.

## Observe execution

Implementation graphs show the execution state of bound tasks: No recorded execution, Processing, Validating, Done (reported), Blocked, Failed, Interrupted or Unknown.

The hook binds an agent to a task when the agent reads a listed task file `docs/artifacts/<artifact>/changes/<change>/tasks/<file>.md` of a current change. A subagent is bound with its agent ID. A session without an agent ID is bound only in a linked worktree and only when it has started no subagent. Command Code sends no agent ID, so its inferred binding always follows this rule. The inspector shows "Inferred from a task file read" for such a binding. An explicit binding replaces it:

```sh
artifact-plane runtime bind --root /path/to/checkout --unit my-outcome --artifact my-artifact --change change-feature --task 21-task.md --session SESSION_ID
artifact-plane runtime bind --root /path/to/worker --unit my-outcome --artifact my-artifact --change change-feature --task 22-task.md --session PARENT_SESSION_ID --agent CHILD_AGENT_ID
artifact-plane runtime report --attempt ATTEMPT_ID --state execution-returned
artifact-plane runtime report --attempt ATTEMPT_ID --state validated --root /path/to/checkout --method 'Run behavior suite' --source docs/artifacts/my-artifact/changes/change-feature/tasks/21-task.md#evidence
artifact-plane runtime report --attempt ATTEMPT_ID --state failed --reason 'Behavior check failed'
artifact-plane runtime query --root /path/to/checkout
```

Omit `--unit` for an individual plan. The bind command prints repository, context and attempt IDs; keep the attempt ID for reports. Use blocked reports for known waits for intervention. Done (reported) requires a validation method and nonempty Markdown evidence. A reported result is not independent verification. Stop and SubagentStop mean that execution returned, with the DoD pending. Checklist counts and version establishment remain separate evidence.

From a source checkout, `node server/runtime-cli.js <command>` takes the same commands, and `node server/app.js hook` is the hook command.

## State location

The default is ~/.local/state/artifact-plane/runtime.sqlite, or XDG_STATE_HOME/artifact-plane/runtime.sqlite. Set ARTIFACT_PLANE_STATE_DIR to use another private directory outside every inspected repository and worktree. Set the same value in the environment of the agent and the Plane server, or add `--state-dir` to the hook command and the runtime commands. Runtime paths inside a Git checkout, including symlink aliases, are rejected. On Windows the store cannot confirm a private directory and refuses it, so the observer and the runtime commands do not work there; the context, the refusals and the stop check still work.

The runtime store also keeps the sessions that you start, with their states and lifecycle events, and no message text. The runner socket and the relay sockets of the embedded terminal are in the same directory. Hook processes write directly to SQLite, even when the web server is stopped. The agent harness keeps its own conversation history; the Plane keeps allowlisted observations, session and task bindings, attempts, and graph labels and edges.

## Read the graph and history

Open a remaining checkout in the Plane. Individual and unit implementation nodes display artifact and change ownership and matching execution attempts. Select Recorded executions to inspect captured graphs independently of current worktree availability. Captures show revision, digest and capture time; archived gates remain Unknown because runtime history does not verify merges. A modified task does not inherit an older attempt merely because its path matches.

Multiple blue nodes represent observed concurrent execution. Implementation canvases hide transitively redundant task edges by default; Show all prerequisites restores every declared edge. Establishment gates always remain visible, and inspector prerequisites retain the full declaration. No recorded execution means no matching observation, not permission or readiness. Completed documented checklists are labeled separately and do not imply observed runtime Done. Ten minutes without fresh activity changes active observations to Unknown while retaining the last observed state. Long tools can therefore appear Unknown until their next hook. A server restart also requires fresh activity before claiming Processing; no continuous harness heartbeat is implemented. SSE reconnect refetches durable observations and missed events. A disconnected browser shows Unknown for active attempts.

## Verification limits

Recorded-input fixture tests cover the command-hook-to-store-to-browser flow for Claude Code, Codex, Antigravity and Command Code without model inference. The Command Code tests use the observed 1.85.1 payloads, including `file_path`, `absolute_path` and separate shell arguments. A live headless Command Code run can prove a reserved-action refusal and an inferred binding in a linked worktree. It does not fire `SessionStart`, so it cannot prove context injection. OpenCode has separate mock-host bridge tests over real hook subprocesses. The native check `npm run test:opencode` starts the real OpenCode 2.1.2 runtime in a disposable clone with a private HOME, service port and Plane state directory, using a deterministic local provider. It observes plugin loading, the MCP connection and tool catalog, injected context and workbench line, an executed read-only command, and refusal of a reserved commit on a local protected branch before any process starts. The fixture provider chooses only which command to request; the runtime and the bridge make every safety decision. That check does not use a real model or a remote provider, so it does not prove model inference.

OpenCode has no stop blocking: use `get_change_status` and `check_records` from MCP. Live activation still requires the reader's own project trust and plugin policy. Configuration parsing and plugin lists alone do not prove that a live model ran a task. Keep mock-host fixtures, native-runtime fixtures, actual model execution, reported validation and establishment evidence distinct.
