# Connect agents to the Plane

The released executable `artifact-plane` connects to Claude Code and Codex in two ways: a stdio MCP server and one hook command. Put the executable on the path as `artifact-plane` (see the Install section of the Plane README). The hooks and the MCP server read knowledge and Git. They never approve work, push, merge or establish versions.

## What the hooks do

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

The examples use a POSIX shell. On Windows, use `artifact-plane hook` without `|| true`, with an executable of the same version as the configuration.

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

## MCP tools

The server sends instructions that map ADD activities to its tools. `get_change_status` returns the state that the session start hook adds; `check_records` returns the validator result for a repository or one change. `get_concept` returns one declared concept, and `search_flows` with `kinds: ["concept"]` finds concepts. `--repository /absolute/root` (repeatable) selects other roots, `--state-dir /absolute/path` a private cache directory, and `--allow-writes` adds the knowledge edit tools.

## Observe execution

Implementation graphs show the execution state of bound tasks: No recorded execution, Processing, Validating, Done (reported), Blocked, Failed, Interrupted or Unknown.

The hook binds an agent to a task when the agent reads a listed task file `docs/artifacts/<artifact>/changes/<change>/tasks/<file>.md` of a current change. A subagent is bound with its agent ID. A session without an agent ID is bound only in a linked worktree and only when it has started no subagent. The inspector shows "Inferred from a task file read" for such a binding. An explicit binding replaces it:

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

Hook processes write directly to SQLite, even when the web server is stopped. The agent harness keeps its own conversation history; the Plane keeps allowlisted observations, session and task bindings, attempts, and graph labels and edges.

## Read the graph and history

Open a remaining checkout in the Plane. Individual and unit implementation nodes display artifact and change ownership and matching execution attempts. Select Recorded executions to inspect captured graphs independently of current worktree availability. Captures show revision, digest and capture time; archived gates remain Unknown because runtime history does not verify merges. A modified task does not inherit an older attempt merely because its path matches.

Multiple blue nodes represent observed concurrent execution. Implementation canvases hide transitively redundant task edges by default; Show all prerequisites restores every declared edge. Establishment gates always remain visible, and inspector prerequisites retain the full declaration. No recorded execution means no matching observation, not permission or readiness. Completed documented checklists are labeled separately and do not imply observed runtime Done. Ten minutes without fresh activity changes active observations to Unknown while retaining the last observed state. Long tools can therefore appear Unknown until their next hook. A server restart also requires fresh activity before claiming Processing; no continuous harness heartbeat is implemented. SSE reconnect refetches durable observations and missed events. A disconnected browser shows Unknown for active attempts.

## Verification limits

Fixture tests cover the hook-to-store-to-browser flow with recorded inputs of both harnesses and without model inference. Live activation requires the trust steps of each harness. Configuration parsing and hook lists alone do not prove that a live model ran a task. Keep live, fixture, reported-validation and establishment evidence distinct.
