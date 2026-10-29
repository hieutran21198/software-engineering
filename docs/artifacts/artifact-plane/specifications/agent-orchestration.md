---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/agent-orchestration.md#specification-self-check
references:
  - artifact: artifact-driven
    element: specifications/task-dag.md
    requires: Task membership, task paths and prerequisites that an implementer session names.
claims:
  - id: acp-agent-interfaces
    kind: assumption
    statement: The ACP agents of Claude Code, Codex, OpenCode V2 and Gemini CLI offer the session methods, resume methods and options that the interface sources section lists.
    status: supported
    basis: documented
    evidence:
      - docs/artifacts/artifact-plane/specifications/agent-orchestration.md#interface-sources
    check: Start, prompt, cancel and resume one session of each agent in a disposable clone, and record the negotiated protocol version and the offered options.
    risk_if_wrong: A profile cannot select its model, or recovery falls back to a new attempt.
  - id: commandcode-acp-shape
    kind: unknown
    statement: The ACP protocol version, the resume method and the option IDs of `cmd acp` are not documented.
    status: open
    basis: documented
    check: Start `cmd acp` in a disposable clone and record its initialize response and its session options.
    risk_if_wrong: Command Code sessions cannot select a model or cannot resume.
  - id: claude-acp-plan-sign-in
    kind: unknown
    statement: It is not known whether the `--hide-claude-auth` option of the Claude ACP agent stops the use of an existing Claude plan credential.
    status: open
    basis: documented
    check: With only a Claude plan sign-in on the machine, start the Claude ACP agent with `--hide-claude-auth` and record whether `session/new` returns an authentication error.
    risk_if_wrong: A Claude ACP profile can use a plan sign-in, against requirement AO17.
---

# Agent orchestration contract

## Components

This contract implements requirements/agent-orchestration.md. The decisions are [ADR 018](../decisions/018-agent-session-adapters.md) and [ADR 019](../decisions/019-session-runner-process.md).

| Component | Process | Responsibility |
| --- | --- | --- |
| Session API | `artifact-plane serve` | Accepts session commands from the workbench and validates them. |
| Orchestrator | `artifact-plane serve` | Applies the start rules, binds implementer attempts and builds the initial prompts. |
| Runner | `artifact-plane runner` | Hosts the adapters, keeps live message buffers in memory and writes lifecycle events. |
| ACP adapter | runner | Talks JSON-RPC with one ACP agent child process for each session. |
| Terminal adapter | runner | Starts and follows one herdr pane for each session. |
| Runtime store | file | Keeps sessions, attempts and lifecycle events. It is the existing store of specifications/codex-execution.md. |
| Workbench | browser | Shows sessions, messages, permission requests and launch controls. |

Plane routes no model traffic. Each harness tool signs in with its own stored sign-in. Plane never reads, stores, forwards or asks for a credential.

## Terms

| Term | Meaning |
| --- | --- |
| Session | One agent conversation that Plane started for one role. It has a Plane session ID and, after start, a harness session ID. |
| Attempt | The existing runtime attempt that binds an implementer session to one task. Other roles have sessions without attempts. |
| Launch profile | A personal setting that names a harness tool, a connection kind, a sign-in kind, a model and a command. |
| Connection kind | `acp` for an ACP agent, or `terminal` for a herdr pane that a person drives. |
| Live buffer | The recent session updates that the runner keeps in memory for the workbench. |

## Launch profiles

Plane reads `profiles.json` from `ARTIFACT_PLANE_CONFIG_DIR` when it is set. Otherwise it reads `$XDG_CONFIG_HOME/artifact-plane/profiles.json`, or `~/.config/artifact-plane/profiles.json`. Plane refuses the file when it is inside an inspected repository or worktree, when it is a symbolic link, or when group or other users can write it. Plane only reads the file; the person edits it.

```json
{
  "version": 1,
  "terminal": { "open": ["ghostty", "-e", "herdr"] },
  "profiles": [
    { "id": "claude-opus-terminal", "label": "Claude Opus (terminal)", "harness": "claude-code",
      "connection": "terminal", "signIn": "plan", "model": "opus",
      "command": ["claude", "--model", "opus"] },
    { "id": "codex-fast", "label": "Codex fast", "harness": "codex",
      "connection": "acp", "signIn": "harness", "model": "gpt-5-codex-mini", "reasoning": "low",
      "command": ["codex-acp"] },
    { "id": "gemini-flash", "label": "Gemini Flash", "harness": "gemini-cli",
      "connection": "acp", "signIn": "harness", "model": "gemini-flash",
      "command": ["gemini", "--acp", "--model", "gemini-flash"] }
  ]
}
```

| Field | Rule |
| --- | --- |
| `version` | Required. The value is `1`. |
| `terminal.open` | Optional argument list that opens a terminal with a herdr client. Plane runs it without a shell. |
| `id` | Required. Unique. Matches `[a-z0-9][a-z0-9-]*`. |
| `label` | Optional display text. |
| `harness` | Required. One of `claude-code`, `codex`, `opencode`, `command-code`, `gemini-cli`, `other`. |
| `connection` | Required. `acp` or `terminal`. |
| `signIn` | Required. `plan`, `api-key` or `harness`. It declares how the harness tool signs in; Plane cannot check it. |
| `model` | Required. For `acp`, Plane selects this value through the model option. For `terminal`, it is a display value; the command selects the model. |
| `reasoning` | Optional. Plane selects it through the reasoning option of an ACP agent. |
| `command` | Required nonempty argument list. Plane runs it without a shell. |
| `env` | Optional object of extra variables. A name that contains `KEY`, `TOKEN`, `SECRET`, `PASSWORD` or `CREDENTIAL` makes the profile invalid. |

An invalid profile stays visible with its reason and cannot start a session. These rules make a profile invalid:

- `harness: claude-code` with `signIn: plan` and `connection: acp` (requirement AO17).
- A command argument from the permission-bypass list: `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions`, `--dangerously-bypass-approvals-and-sandbox`, `--yolo`, `-y`, `bypassPermissions`, `--approval-mode=yolo`, the pair `--approval-mode yolo`, the pair `--permission-mode bypass`, and the pairs `--ask-for-approval never` and `-a never`. The list is a guardrail, not a complete control.
- An unknown field or a wrong type.

Plane appends `--hide-claude-auth` to the command of a `claude-code` ACP profile, so that the Claude ACP agent does not offer the plan sign-in. The claim `claude-acp-plan-sign-in` records that this effect is not yet checked.

## Roles and initial prompts

A session has one role. Plane sends one fixed initial prompt. For an ACP session, the prompt is the first `session/prompt`. For a terminal session, the prompt is the last argument of the command. Plane fills the placeholders only with validated artifact, change, task and branch names.

| Role | Initial prompt |
| --- | --- |
| `coordinator` | You are the ADD coordinator for this repository. Load the add-coordinator skill and follow it. Selected change: `{artifact}/{change}`. |
| `product-owner` | You are the ADD product owner. Load the add-product-owner skill and follow it for change `{artifact}/{change}`. |
| `technical-lead` | You are the ADD technical lead. Load the add-technical-lead skill and follow it for change `{artifact}/{change}`. |
| `implementer` | You are an ADD implementer. Load the add-implementer skill and follow it. Your task is `{task}` of change `{artifact}/{change}` in this worktree on branch `{branch}`. Plane does not record plan approval; check the gates of the skill before you change code. |

Without a selected change, the coordinator prompt says "No change is selected; start with discovery." A respawn adds: "An earlier attempt on this task stopped: `{reason}`. Read the task, the branch history, `git status` and the change brief before you continue." The reason is one value of the interruption reasons below.

## Commands

The server adds these routes to the existing local server. Every route keeps the loopback binding, the Host and Origin checks and the JSON content type of specifications/explorer.md. The body limit is 16 KiB, except 64 KiB for `prompt`.

| Route | Body | Effect |
| --- | --- | --- |
| `POST /api/sessions/profiles` | `{}` | Returns the profiles with their validity and reasons, the profile file path and the herdr and runner availability. |
| `POST /api/sessions/query` | `{path}` | Returns the sessions of the repository with their attempts, newest first. |
| `POST /api/sessions/start` | `{path, role, profile, artifact?, change?, task?, respawnOf?}` | Validates and starts a session. Returns `{session, attempt?, existing}`. |
| `POST /api/sessions/prompt` | `{session, text}` | Sends the text of the person to an ACP session. |
| `POST /api/sessions/permission` | `{session, request, option}` | Sends the selected option of a pending permission request. |
| `POST /api/sessions/cancel` | `{session}` | Stops the current turn of an ACP session. |
| `POST /api/sessions/resume` | `{session}` | Reattaches the same harness session in a new adapter process or pane. |
| `POST /api/sessions/end` | `{session}` | Ends the session and its process or pane. |
| `POST /api/sessions/open-terminal` | `{session}` | Shows the pane of a terminal session in a herdr client. |
| `GET /api/sessions/stream?session=` | — | Server-sent events with the live buffer, then new live updates of one session. |

`path` is a worktree of an inspected repository. Errors use the existing JSON error shape. The status is 400 for invalid input, 404 for an unknown session, 409 for a refused start or a wrong session state, and 503 when the runner or herdr is unavailable.

## Start rules

The orchestrator checks these rules in order and refuses the start with the first failed rule.

1. The profile exists and is valid.
2. `path` is a worktree of the inspected repository.
3. An `implementer` names `artifact`, `change` and `task`. The task is a listed task of a current change in that worktree (specifications/task-dag.md). The branch of the worktree is not `main`, `master` or a detached HEAD.
4. A `product-owner` or `technical-lead` names `artifact` and `change` of a current change. A `coordinator` can name them.
5. When the task has an open attempt, the server returns that attempt and its session with `existing: true` and starts nothing. The orchestrator serializes start requests for the same task.
6. `respawnOf` names an ended or interrupted session of the same task.

The launch dialog shows these facts as warnings that the person confirms; they are not gates of Plane: unchecked DoD items of prerequisite tasks, upstream artifacts without an established version, and the sentence "Plane does not record plan approval."

For an implementer, the orchestrator creates an explicit binding with the existing `bind` operation. The binding session is the Plane session ID until the harness session ID is known; then the runner replaces it, so hook observations of the harness session match the attempt.

## Lifecycle events

The runner writes lifecycle events to the existing `events` table with these kinds. An event never contains message text, a permission title, a tool name, a tool argument, tool output or a credential.

| Kind | Fields besides identity |
| --- | --- |
| `session:started` | `role`, `profile`, `harness`, `connection`, `model`, `protocolVersion?` |
| `session:harness-id` | `harnessSession` |
| `session:prompted` | `source`: `initial` or `person` |
| `session:permission-requested` | `request` |
| `session:permission-answered` | `request`, `optionKind` |
| `session:turn-ended` | `stopReason` |
| `session:waiting` / `session:working` | — (terminal sessions, from herdr status) |
| `session:interrupted` | `reason`: `process-exit`, `runner-lost`, `pane-missing`, `max-tokens`, `max-turn-requests` or `cancelled` |
| `session:resumed` | `method`: `resume`, `load` or `terminal` |
| `session:ended` | `reason`: `person`, `failed`, `refusal` or `error` |

The store adds a `sessions` table with `CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, repository TEXT, attempt TEXT, harnessSession TEXT, json TEXT)`. The schema version stays 1, because earlier readers ignore an unknown table. The JSON holds the session fields of the query result.

| Session field | Meaning |
| --- | --- |
| `id`, `repository`, `worktree` | Plane identity and the worktree path. |
| `role`, `artifact`, `change`, `task`, `branch` | ADD context. |
| `profile` | `id`, `harness`, `connection`, `signIn`, `model`, `reasoning` of the profile at start. |
| `reportedModel` | The model that the agent or a hook reported, when known. |
| `harnessSession`, `pane`, `tab` | Harness and herdr identities, when known. |
| `state` | `starting`, `working`, `waiting`, `idle`, `interrupted` or `ended`. |
| `reason`, `startedAt`, `updatedAt`, `endedAt` | Last reason and times. |
| `respawnOf` | The earlier session of the task, when present. |

## States

The runner sets the session state. For an implementer, it also sets the attempt state with the existing state names.

| Signal | Session state | Attempt state |
| --- | --- | --- |
| Start accepted | `starting` | `unknown` until the first prompt |
| Prompt sent, or agent works | `working` | `processing` |
| Permission request, or herdr `blocked` | `waiting` | `blocked` |
| Permission answered | `working` | `processing` |
| Turn ended with `end_turn`, or herdr `done` or `idle` after work | `idle` | `validating` |
| Turn ended with `cancelled`, `max_tokens` or `max_turn_requests` | `idle` | `interrupted` |
| Turn ended with `refusal` or `error` | `idle` | `failed` |
| Agent process exits, runner lost, or pane missing | `interrupted` | `interrupted` |
| Person ends the session | `ended` | unchanged when `validating`, otherwise `interrupted` |

For a terminal session, the existing hooks also update the attempt with the rules of specifications/codex-execution.md. herdr status sets only the session state. A report from `artifact-plane runtime report` still sets Done (reported).

## ACP adapter

The runner starts the profile command with the worktree as the working directory, without a shell. It adds `ARTIFACT_PLANE_LAUNCH=<session ID>` and the profile `env` to its own environment. Messages are JSON-RPC 2.0, one object for each line.

1. **Initialize.** Send `initialize` with `protocolVersion: 2` and client information. Accept a response with version 1 or 2. Declare no file system and no terminal client capability, so the agent uses its own tools. Answer a client method call from the agent with a method-not-found error.
2. **Sign-in.** Plane never calls the authentication method. When `session/new` returns an authentication error, the session ends with reason `error` and the message "Sign in with the harness tool in a terminal, then start again."
3. **Session.** Send `session/new` with the worktree as `cwd` and one stdio MCP server: the Plane executable with the argument `mcp`.
4. **Options.** When the response lists a config option with category `model`, set the profile `model` with `session/set_config_option`. Do the same for category `thought_level` and `reasoning`. In version 2, send `type: "id"`. When an option does not exist or the agent refuses the value, keep the session and record the profile model as declared, not reported. Plane sets no other option, so it never selects a mode that skips permission prompts.
5. **Prompt.** Send `session/prompt` with the initial prompt, then with each message of the person. Plane sends only one prompt at a time and refuses a prompt while a turn runs.
6. **Updates.** Add each `session/update` to the live buffer. In version 1, the turn ends with the `session/prompt` response and its stop reason. In version 2, the turn ends with an idle `state_update`; a missing or unknown stop reason counts as `end_turn`.
7. **Permissions.** Keep each `session/request_permission` request pending until the person selects one of its options. Never answer it automatically. An unknown outcome is not approval.
8. **Cancel.** Send `session/cancel` and answer each pending permission request with the `cancelled` outcome.
9. **Resume.** Start a new agent process and initialize it. In version 2, send `session/resume` with `replayFrom: {type: "start"}` when the agent offers resume. In version 1, send `session/load` when `loadSession` is true. Otherwise resume is unavailable, and the person can respawn. The replayed updates fill a new live buffer.
10. **End.** Close standard input, then stop the process after 5 seconds.

## Terminal adapter

The terminal adapter uses the herdr CLI and never sends input to a running harness program.

1. **Start.** Run `herdr tab create --cwd <worktree> --label <label> --env ARTIFACT_PLANE_LAUNCH=<session ID> --no-focus`, with one more `--env` for each profile variable. Read `.result.root_pane.pane_id` and the tab ID from the JSON output.
2. **Command.** Run `herdr pane run <pane> <command line>`. The command line is the profile command plus the initial prompt, each argument quoted for a POSIX shell. This text goes to the shell of the new pane before the harness program starts. After that, Plane sends no text and no keys to the pane.
3. **Harness session ID.** The SessionStart hook of Claude Code inherits `ARTIFACT_PLANE_LAUNCH`. The hook command records `session:harness-id` for that session with the hook `session_id` and `model`.
4. **Status.** Every 2 seconds, the runner reads `herdr pane list` for its panes and maps `working`, `blocked`, `done`, `idle` and `unknown` to the session states. A missing pane interrupts the session.
5. **Open terminal.** Run `herdr tab focus <tab>`. When `herdr status client` reports no attached client, run the profile file `terminal.open` arguments as a detached process.
6. **Resume.** Create a new tab like the start, and run the profile command plus `--resume <harness session ID>` for `claude-code`. Other harness tools in a terminal can only respawn.
7. **End.** Run `herdr pane close <pane>`.

Plane does not install the herdr Claude integration. When the person installs it, its user hooks run beside the project hooks of Plane.

## Runner

The server finds the runner through the socket `runner.sock` in the runtime state directory. When no runner answers, the server starts `artifact-plane runner` as a detached process with the same state directory, and waits up to 3 seconds. The pattern is the one of the workbench start in specifications/ui-discovery.md. The socket file is private (0600) in the private state directory. A stale socket file without a listener is removed before a new runner listens.

Messages are JSON objects, one on each line: requests `{id, method, params}`, responses `{id, result}` or `{id, error}`, and pushed `{event, session, seq, update}` objects. The methods are `hello`, `start`, `prompt`, `answer`, `cancel`, `resume`, `end`, `openTerminal`, `snapshot`, `subscribe` and `unsubscribe`. `hello` returns the runner version; a different version makes the server refuse new starts and show "Restart the session runner".

The live buffer keeps at most 1000 updates and 2 MiB for each session; older updates drop first. The runner exits 10 minutes after its last session ends while no server is connected. When the runner stops, its ACP sessions end with reason `runner-lost` at the next server check. Terminal sessions continue in herdr.

## Recovery

| Situation | Choices that the workbench offers |
| --- | --- |
| Session `idle` after a turn | Continue: the person sends a new prompt (ACP), or types in the terminal. |
| Session `interrupted`, resume available | Resume, Respawn, Respawn with another profile. |
| Session `interrupted`, resume unavailable | Respawn, Respawn with another profile. |
| Session `ended` | Respawn, Respawn with another profile. |

Resume keeps the session and its attempt. Respawn starts a new session with `respawnOf`, and its explicit binding supersedes the earlier attempt. The respawn prompt points the agent at the task, the branch and the change brief. The agent reads the change brief through the Plane MCP server. Uncommitted files stay in the worktree; Plane changes no file.

## Workbench

The final layout follows the UI/UX mockups that the owner approves before Plan.

- A Sessions page lists sessions in three groups: Needs you, Running and Ended. Each row shows role, task, harness tool, model, connection and state.
- A session page shows an ACP session as a thread of messages, tool calls and permission cards, with a message field, Stop turn and End session. It shows a terminal session with its state, Open terminal and End session, and the text "Type in the terminal."
- The top bar shows the number of sessions that wait for the person.
- A launch dialog opens from the task details of the change page (Start implementer), from the change page (Start session) and from the Sessions page (New session). It shows role, change, task, worktree, profile, the warnings of the start rules and Start.
- Task runtime details also show the harness tool and the model.
- A Profiles section lists the profiles, their validity and the profile file path. It edits nothing.

When no profile exists, the workbench shows no session control except a Profiles section that explains where to put the file (requirement AO18).

## Failures

| Failure | Behavior |
| --- | --- |
| The profile file is missing or invalid | Sessions are unavailable or the profile is invalid; observation continues. |
| A command or herdr is missing | The start returns 503 with the missing program name. |
| The agent sends malformed JSON or exits during start | The session ends with reason `error`. |
| The runner does not start in 3 seconds | The start returns 503; nothing else changes. |
| The runtime store is unavailable, for example on Windows | Session control is unavailable with the existing store reason. |

No failure writes a repository file or Git metadata.

## Interface sources

These documented facts support the claim `acp-agent-interfaces`. They were read on 2026-10-29 without running the programs.

- ACP: version negotiation, `session/load` and `session/resume` in version 1, `session/resume` with `replayFrom` in version 2, config option categories `model` and `thought_level`, stop reasons, permission requests and `session/cancel` (agentclientprotocol.com, protocol version 2 migration, initialization and prompt turn pages).
- Claude ACP agent 0.99.0: versions 1 and 2, `loadSession`, options `model` and `effort`, project settings loaded, the option `--hide-claude-auth` (github.com/agentclientprotocol/claude-agent-acp).
- Codex ACP agent 2.3.0: versions 1 and 2, `loadSession` in version 1 and `session/resume` in version 2, options `model` and `reasoning_effort`, ChatGPT and API key sign-in methods (github.com/agentclientprotocol/codex-acp).
- OpenCode 2.2.0 `opencode acp`: version 1, `loadSession`, options `model` and `effort`, sign-in with the stored OpenCode credentials (opencode.ai ACP documentation).
- Gemini CLI 0.66.0 `gemini --acp`: version 1, `loadSession`, no config options; the model comes from the command (geminicli.com ACP mode documentation).
- Claude Code: `claude --model <m> "<prompt>"`, `--resume <id>`, and hook processes inherit the environment of the session (code.claude.com CLI and hooks references).
- herdr 0.9.5: `tab create` with `--cwd`, `--env` and `--label`, `pane run`, `pane list` status values, `tab focus`, `pane close` and `status client` (herdr.dev CLI reference).

## Specification self-check

- The contract covers AO1 to AO19 with commands, events, states, adapters, the runner, recovery, the workbench and failures.
- KISS: one port with two adapters, one runner, the existing store and attempt model, no new MCP tool and no profile editor.
- Impact: execution observation gains Plane-started attempts; the new flows `agent-session-launch` and `agent-session-recovery` record the journeys. The artifact-driven method needs no change; the only reference is the task DAG contract.
- The two open claims name live checks. They do not block the Plan; the Plan adds the live check.
- STE: each rule is one sentence or one table row; terms are in the Terms table.
