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
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/specifications/agent-orchestration.md#interface-sources
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    check: Start, prompt, cancel and resume one session of each agent in a disposable clone, and record the negotiated protocol version and the offered options.
    risk_if_wrong: A profile cannot select its model, or recovery falls back to a new attempt.
  - id: commandcode-acp-shape
    kind: unknown
    statement: The ACP protocol version, the resume method and the option IDs of `cmd acp` are not documented.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    check: Start `cmd acp` in a disposable clone and record its initialize response and its session options.
    risk_if_wrong: Command Code sessions cannot select a model or cannot resume.
  - id: claude-acp-plan-sign-in
    kind: unknown
    statement: It is not known whether the `--hide-claude-auth` option of the Claude ACP agent stops the use of an existing Claude plan credential.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    check: With only a Claude plan sign-in on the machine, start the Claude ACP agent with `--hide-claude-auth` and record whether `session/new` returns an authentication error.
    risk_if_wrong: A Claude ACP profile can use a plan sign-in, against requirement AO17.
  - id: per-model-effort-discovery
    kind: assumption
    statement: After a model change through session/set_config_option, each ACP agent returns the effort levels of the new model, so a check can list the levels of each model without a prompt.
    status: refuted
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    check: Check Codex, OpenCode and the Claude ACP agent, then compare the recorded levels of two models with the levels that a session with each model offers.
    risk_if_wrong: The effort list shows levels of another model, and a profile starts with a level that its model refuses.
  - id: terminal-model-flags
    kind: unknown
    statement: The model and effort flags of the terminal programs of Codex, OpenCode, Command Code and Gemini CLI in the provider catalog are not checked.
    status: refuted
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    check: Run each terminal program with its model flag and a short initial prompt in a disposable clone, and record the model that the program reports.
    risk_if_wrong: A terminal profile starts with another model than the profile names.
  - id: herdr-named-sessions
    kind: unknown
    statement: It is not checked that `herdr --session <name> tab create` starts the named session when it does not run, and that `herdr --session <name> server stop` stops only that session.
    status: refuted
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    check: In a disposable environment, create two named herdr sessions with tab create, stop one with server stop, and record which servers and panes remain.
    risk_if_wrong: Terminal sessions share one herdr client, or ending one session stops another.
  - id: provider-check-history
    kind: risk
    statement: A provider check opens a session without a prompt, and some harness tools keep that empty session in their history.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    check: Check each provider once, then list the sessions of each harness tool and record whether an empty session appears.
    risk_if_wrong: The history of a harness tool shows empty sessions from Plane checks.
  - id: gemini-terminal-model-flag
    kind: unknown
    statement: It is not checked that `gemini --model <model>` starts the Gemini CLI terminal program with that model, because the check had no Gemini sign-in.
    status: open
    basis: documented
    check: With a Gemini sign-in, start `gemini --model <model>` with a short prompt in a disposable clone and record the model that the program reports.
    risk_if_wrong: A Gemini terminal profile starts with another model than the profile names.
  - id: commandcode-acp-hook-trust
    kind: risk
    statement: During `session/new`, `cmd acp` marks the hooks of the session folder as trusted without asking the person.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-orchestration/tasks/01-verify-interfaces.md#evidence
    risk_if_wrong: A Command Code ACP session in a repository runs its hooks without a trust prompt.
---

# Agent orchestration contract

## Components

This contract implements requirements/agent-orchestration.md. The decisions are [ADR 018](../decisions/018-agent-session-adapters.md), [ADR 019](../decisions/019-session-runner-process.md) , [ADR 020](../decisions/020-profile-editing-catalog.md) and [ADR 021](../decisions/021-embedded-terminal-relay.md).

| Component | Process | Responsibility |
| --- | --- | --- |
| Session API | `artifact-plane serve` | Accepts session commands from the workbench and validates them. |
| Orchestrator | `artifact-plane serve` | Applies the start rules, binds implementer attempts and builds the initial prompts. |
| Runner | `artifact-plane runner` | Hosts the adapters, keeps the live state in memory and writes lifecycle events. |
| ACP adapter | runner | Talks JSON-RPC with one ACP agent child process for each session. |
| Terminal adapter | runner | Starts and follows one herdr pane for each session. |
| Runtime store | file | Keeps sessions, attempts and lifecycle events. It is the existing store of specifications/codex-execution.md. |
| Output reader | `artifact-plane serve` | Reads the output of a session from Git in its worktree. |
| Settings service | `artifact-plane serve` | Reads and writes the settings file and checks providers. |
| Terminal relay | runner and `artifact-plane serve` | Runs one ttyd process for each viewed terminal session and forwards it to the workbench. |
| Workbench | browser | Shows tasks, sessions, output, permission requests and launch controls. |

Plane routes no model traffic. Each harness tool signs in with its own stored sign-in. Plane never reads, stores, forwards or asks for a credential.

## Terms

| Term | Meaning |
| --- | --- |
| Session | One agent conversation that Plane started for one role. It has a Plane session ID of 12 random lowercase hexadecimal characters, which keeps socket paths short, and, after start, a harness session ID. |
| Attempt | The existing runtime attempt that binds an implementer session to one task. Other roles have sessions without attempts. |
| Provider | A supported harness tool and its programs in the provider catalog. |
| Launch profile | A personal setting that names a provider, a connection kind, a sign-in kind, a model and optional extra arguments. |
| Role default | The profile that the launch dialog selects for an ADD role. |
| Effort level | The reasoning level of a model, stored in the profile field `reasoning`. |
| Connection kind | `acp` for an ACP agent, or `terminal` for a herdr pane that a person drives. |
| Live state | The pending permission requests and the last agent message of an ACP session. The runner keeps it in memory only. |
| Role session | A coordinator, product owner or technical lead session. It runs in a terminal, where the person chats with the harness tool. |
| Base revision | The `HEAD` commit of the session worktree when the session started. A respawn keeps the base revision of the earlier session. |
| Output | The commits after the base revision and the files that differ from it, committed or not. |

## Settings and launch profiles

The settings file is `profiles.json` in `ARTIFACT_PLANE_CONFIG_DIR` when it is set, otherwise in `$XDG_CONFIG_HOME/artifact-plane/` or `~/.config/artifact-plane/`. Plane refuses the file when it is inside an inspected repository or worktree, when it is a symbolic link, or when group or other users can write it. The person edits it in the workbench or by hand.

```json
{
  "version": 1,
  "terminal": { "open": ["ghostty", "-e"] },
  "roleDefaults": { "coordinator": "claude-opus-terminal", "product-owner": "claude-opus-terminal",
    "technical-lead": "claude-opus-terminal", "implementer": "codex-fast" },
  "profiles": [
    { "id": "claude-opus-terminal", "label": "Claude Opus (terminal)", "harness": "claude-code",
      "connection": "terminal", "signIn": "plan", "model": "opus" },
    { "id": "codex-fast", "label": "Codex fast", "harness": "codex",
      "connection": "acp", "signIn": "harness", "model": "gpt-5-codex", "reasoning": "low" }
  ]
}
```

| Field | Rule |
| --- | --- |
| `version` | Required. The value is `1`. |
| `terminal.open` | Optional argument list that runs a command in a new terminal app window, for example `["ghostty", "-e"]`. Plane appends the herdr attach command and runs it without a shell. |
| `roleDefaults` | Optional object from role (`coordinator`, `product-owner`, `technical-lead`, `implementer`) to profile `id`. |
| `id` | Required. Unique. Matches `[a-z0-9][a-z0-9-]*`. |
| `label` | Optional display text. |
| `harness` | Required. A provider of the catalog, or `other`. |
| `connection` | Required. `acp` or `terminal`. The provider must offer it. |
| `signIn` | Required. `plan`, `api-key` or `harness`. It declares how the harness tool signs in; Plane cannot check it. |
| `model` | Required. For `acp`, Plane selects this value through the model option, or through the model flag when the agent has no model option. For `terminal`, Plane passes it with the model flag of the catalog. |
| `reasoning` | Optional. Plane selects it through the reasoning option of an ACP agent. |
| `args` | Optional argument list that Plane adds after the catalog arguments. |
| `env` | Optional object of extra variables. A name that contains `KEY`, `TOKEN`, `SECRET`, `PASSWORD` or `CREDENTIAL` makes the profile invalid. |
| `command` | Only for `harness: other`: the full argument list. The workbench shows such a profile but does not edit it. |

### Provider catalog

| Provider | ACP program | ACP model | Terminal program | Model flag | Effort flag | Initial prompt | Terminal resume |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `claude-code` | `claude-agent-acp --hide-claude-auth` | option | `claude` | `--model` | `--effort` | last argument | `--resume <harness session ID>` |
| `codex` | `codex-acp` | option | `codex` | `--model` | `-c model_reasoning_effort=<level>` | last argument | none |
| `opencode` | `opencode acp` | option | `opencode mini` | `--model` | `#<level>` after the model | `--prompt` | none |
| `command-code` | `cmd acp` | option | `cmd` | `--model` | `--effort` | last argument | none |
| `gemini-cli` | `gemini --acp` | flag | `gemini` | `--model` | none | last argument | none |

The profile command is the program of the profile connection, then the model flag and the model when the connection is `terminal` or the ACP model column says "flag", then the effort flag and the level for a terminal profile with a level, then `args`. For `opencode`, the level is part of the model value, for example `openai/gpt-6#high`. For `harness: other`, the profile command is `command`.

The OpenCode program is the first of `opencode` and `opencode2` on `PATH` whose `--version` reports version 2 or later. The terminal programs of Codex and Gemini CLI ask whether to trust a new folder before the first prompt; the person answers in the terminal.

### Model and effort lists

The profile editor shows the model and the effort level only as lists (requirement AO25). The lists come from these sources:

| Provider | ACP profile | Terminal profile |
| --- | --- | --- |
| `claude-code` | The check of the ACP program, with an API key sign-in. | The documented list: the model aliases and the `--effort` levels of the Claude Code CLI reference. Plane does not check a plan sign-in. |
| `codex`, `opencode`, `command-code` | The check of the ACP program. | The check of the ACP program of the same provider. |
| `gemini-cli` | The check of the ACP program. It has no effort levels. | The check of the ACP program of the same provider. |

A save of a catalog profile needs a `model` from the list and a `reasoning` level from the levels of that model; a model without levels, or with levels "not checked", needs no `reasoning` and runs with its default level. Without a list, the save fails with "Check the provider first." When a later check no longer lists the model or the level, the profile shows the warning "Not in the last check" and can still start; the ACP adapter then records the model as declared.

The live check refuted the first catalog for OpenCode (claim `terminal-model-flags`); the claim `gemini-terminal-model-flag` records that the Gemini flag is not checked. Plane runs every program without a shell. The Claude ACP agent gets `--hide-claude-auth`, so that it does not offer the plan sign-in. With only a plan sign-in, the agent refuses `session/new` with "This integration does not support using claude.ai subscriptions" (claim `claude-acp-plan-sign-in`).

### Validity

An invalid profile or role default stays visible with its reason and cannot start a session. These rules make a profile or a role default invalid:

- `harness: claude-code` with `signIn: plan` and `connection: acp` (requirement AO17).
- A connection that the provider does not offer, a role default that names no valid profile, or a coordinator, product owner or technical lead default that names an ACP profile.
- An argument from the permission-bypass list: `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions`, `--dangerously-bypass-approvals-and-sandbox`, `--yolo`, `-y`, `bypassPermissions`, `--approval-mode=yolo`, the pair `--approval-mode yolo`, the pairs `--permission-mode bypass`, `--permission-mode yolo` and `--permission-mode dont-ask`, and the pairs `--ask-for-approval never` and `-a never`. The list is a guardrail, not a complete control.
- A profile variable named `ARTIFACT_PLANE_LAUNCH` or `ARTIFACT_PLANE_PROMPT`.
- An unknown field or a wrong type.

### Save

The workbench sends the whole settings object with the digest of the file that it read. When the file changed since then, the save returns 409 with the current settings. Plane validates the object, writes a temporary file in the same directory with mode 0600, and renames it over the settings file. It creates a missing directory with mode 0700. A saved profile of a catalog provider has no `command`. Plane writes no other file.

### Provider check

The settings service finds each catalog program on `PATH` and runs it with `--version` (5-second limit, no shell). A check of an ACP program on request does these steps in a new private directory under the runtime state directory:

1. Start the program and send `initialize`. Record the protocol version and the sign-in methods.
2. Send `session/new` without MCP servers. An authentication error (for example code -32000 with a sign-in message) gives the state "Sign-in required" with the sign-in instruction that the agent reports. For the Claude ACP agent, the plan refusal gives the state "Needs an API key sign-in".
3. Read the config option of category `model` and its values. For each value, up to 200 values and 120 seconds in total, send `session/set_config_option` with that value and read the option of category `thought_level` in the response, because the response holds the complete options after a change. When the model value in the response differs from the requested value, wait up to 2 seconds for a `config_option_update` with the requested value and read the levels from it. Record the values as the effort levels of that model, or none. A model without a matching response, or past the limits, has the levels "not checked". A model that the agent refuses is left out of the list. A version 1 agent without config options gives its legacy model list and no effort levels.
4. Close the session when the agent offers `session/close`, then stop the program and remove the directory.

A check that fails for another reason returns 502 and keeps the last result; a missing program returns 503. A check sends no prompt. The check directory holds no project hooks, but user-level hooks of the harness tool still run. The server writes each result to `providers.json` in the runtime state directory with mode 0600: program version, check time, and the models with their names and effort levels. A result holds no credential. A changed program version marks the result stale, and the workbench asks for a new check. A check can add a session record to the history of the harness tool; the claim `provider-check-history` records this effect.

## Roles and initial prompts

A session has one role. Plane sends one fixed initial prompt. For an ACP session, the prompt is the first `session/prompt`. For a terminal session, the prompt is the last argument of the command, passed through `ARTIFACT_PLANE_PROMPT` (see Terminal adapter). Plane fills the placeholders only with validated artifact, change, task and branch names.

| Role | Initial prompt |
| --- | --- |
| `coordinator` | You are the ADD coordinator for this repository. Load the add-coordinator skill and follow it. Selected change: `{artifact}/{change}`. |
| `product-owner` | You are the ADD product owner. Load the add-product-owner skill and follow it for change `{artifact}/{change}`. |
| `technical-lead` | You are the ADD technical lead. Load the add-technical-lead skill and follow it for change `{artifact}/{change}`. |
| `implementer` | You are an ADD implementer. Load the add-implementer skill and follow it. Your task is `{task}` of change `{artifact}/{change}` in this worktree on branch `{branch}`. Plane does not record plan approval; check the gates of the skill before you change code. |

Without a selected change, the coordinator prompt says: "No change is selected. The person asks: `{request}`. Start with discovery, and create a dedicated branch before you write knowledge." The request is the text of the person, unchanged. A respawn adds: "An earlier attempt on this task stopped: `{reason}`. Read the task, the branch history, `git status` and the change brief before you continue." The reason is one value of the interruption reasons below.

## Commands

The server adds these routes to the existing local server. Every route keeps the loopback binding, the Host and Origin checks and the JSON content type of specifications/explorer.md. The body limit is 16 KiB, except 64 KiB for `prompt`.

| Route | Body | Effect |
| --- | --- | --- |
| `POST /api/settings/query` | `{}` | Returns the settings, their digest, the validity of each profile, the settings file path, the providers with their programs and last check, and the herdr and runner availability. |
| `POST /api/settings/check` | `{harness}` | Runs a provider check and returns its result. |
| `POST /api/settings/save` | `{settings, digest}` | Validates and saves the settings. Returns the new digest. |
| `POST /api/sessions/query` | `{path}` | Returns the sessions of the repository with their attempts, newest first. |
| `POST /api/sessions/start` | `{path, role, profile, artifact?, change?, task?, request?, respawnOf?}` | Validates and starts a session. Returns `{session, attempt?, existing}`. |
| `POST /api/sessions/prompt` | `{session, text}` | Sends the text of the person to an ACP session. |
| `POST /api/sessions/permission` | `{session, request, option}` | Sends the selected option of a pending permission request. |
| `POST /api/sessions/cancel` | `{session}` | Stops the current turn of an ACP session. |
| `POST /api/sessions/resume` | `{session}` | Reattaches the same harness session in a new adapter process or pane. |
| `POST /api/sessions/end` | `{session}` | Ends the session and its process or pane. |
| `POST /api/sessions/open-terminal` | `{session}` | Shows the pane of a terminal session in a herdr client. |
| `POST /api/sessions/output` | `{session}` | Returns the output of the session: base revision, commits and changed files. |
| `POST /api/sessions/diff` | `{session, path}` | Returns the diff of one changed file since the base revision. |
| `GET /api/sessions/stream?session=` | — | Server-sent events with the live state, state changes and output notices of one session. |
| `GET /api/sessions/terminal/<session>/…` | — | The embedded terminal of a terminal session: ttyd pages and its WebSocket, forwarded to the relay socket. |

`path` is a worktree of an inspected repository. Errors use the existing JSON error shape. The status is 400 for invalid input, 404 for an unknown session, 409 for a refused start, a wrong session state or a base revision that is no longer in the repository, 502 when a provider check fails, and 503 when the runner, herdr or a program is unavailable.

## Start rules

The orchestrator checks these rules in order and refuses the start with the first failed rule.

1. The profile exists and is valid.
2. `path` is a worktree of the inspected repository.
3. An `implementer` names `artifact`, `change` and `task`. The task is a listed task of a current change in that worktree (specifications/task-dag.md). The branch of the worktree is not `main`, `master` or a detached HEAD.
4. A `product-owner` or `technical-lead` names `artifact` and `change` of a current change. A `coordinator` can name them.
5. A role session needs a profile with `connection: terminal`. The refusal says "Role sessions run in a terminal, where you chat with the harness tool."
6. Only a `coordinator` takes `request`: nonempty text of at most 8 KiB. A coordinator without a change needs a request. Plane passes the request to the agent and stores no copy.
7. When the task has an open attempt, the server returns that attempt and its session with `existing: true` and starts nothing. The orchestrator serializes start requests for the same task.
8. `respawnOf` names an ended or interrupted session of the same task.

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
| `session:output-changed` | — (an ACP tool call of kind `edit`, `delete` or `move` completed) |
| `session:waiting` / `session:working` / `session:idle` | — (terminal sessions, from herdr status) |
| `session:interrupted` | `reason`: `process-exit`, `runner-lost`, `pane-missing`, `max-tokens`, `max-turn-requests` or `cancelled` |
| `session:resumed` | `method`: `resume`, `load` or `terminal` |
| `session:ended` | `reason`: `person` or `error` |

The store adds a `sessions` table with `CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, repository TEXT, attempt TEXT, harnessSession TEXT, json TEXT)`. The schema version stays 1, because earlier readers ignore an unknown table. The JSON holds the session fields of the query result.

| Session field | Meaning |
| --- | --- |
| `id`, `repository`, `worktree` | Plane identity and the worktree path. |
| `role`, `artifact`, `change`, `task`, `branch` | ADD context. |
| `profile` | `id`, `harness`, `connection`, `signIn`, `model`, `reasoning` of the profile at start. |
| `reportedModel` | The model that the agent or a hook reported, when known. |
| `harnessSession`, `pane`, `tab` | Harness and herdr identities, when known. |
| `baseRevision` | The base revision of the output. |
| `state` | `starting`, `working`, `waiting`, `idle`, `interrupted` or `ended`. |
| `reason`, `startedAt`, `updatedAt`, `endedAt` | Last reason and times. |
| `respawnOf` | The earlier session of the task, when present. |

## States

The runner sets the session state. For an implementer, it also sets the attempt state with the existing state names.

| Signal | Session state | Attempt state |
| --- | --- | --- |
| Start accepted | `starting` | `unknown` until the first prompt |
| Prompt sent, or agent works | `working` | `processing` |
| Permission request | `waiting` | `blocked` |
| herdr `blocked` | `waiting` | unchanged |
| herdr `unknown` | unchanged | unchanged |
| Resume accepted | `starting` | `unknown` |
| Permission answered | `working` | `processing` |
| Turn ended with `end_turn` | `idle` | `validating` |
| herdr `done` or `idle` after work | `idle` | unchanged |
| Turn ended with `cancelled`, `max_tokens` or `max_turn_requests` | `idle` | `interrupted` |
| Turn ended with `refusal` or `error` | `idle` | `failed` |
| Agent process exits, runner lost, or pane missing | `interrupted` | `interrupted` |
| Person ends the session, or the start fails | `ended` | unchanged when `validating`, Done (reported) or superseded, otherwise `interrupted` |

For a terminal session, the existing hooks also update the attempt with the rules of specifications/codex-execution.md. herdr status sets only the session state. A report from `artifact-plane runtime report` still sets Done (reported).

## ACP adapter

The runner starts the profile command with the worktree as the working directory, without a shell. It adds `ARTIFACT_PLANE_LAUNCH=<session ID>` and the profile `env` to its own environment. Messages are JSON-RPC 2.0, one object for each line.

1. **Initialize.** Send `initialize` with `protocolVersion: 2` and client information. Accept a response with version 1 or 2. Declare no file system and no terminal client capability, so the agent uses its own tools. Answer a client method call from the agent with a method-not-found error.
2. **Sign-in.** Plane never calls the authentication method. When `session/new` returns an authentication error, the session ends with reason `error` and the message "Sign in with the harness tool in a terminal, then start again."
3. **Session.** Send `session/new` with the worktree as `cwd` and one stdio MCP server: the Plane executable with the argument `mcp`.
4. **Options.** When the response lists a config option with category `model`, set the profile `model` with `session/set_config_option`. Do the same for category `thought_level` and `reasoning`. Send the option ID as `configId`; in version 2, also send `type: "id"`. When an option does not exist or the agent refuses the value, keep the session and record the profile model as declared, not reported. Plane sets no other option, so it never selects a mode that skips permission prompts.
5. **Prompt.** Send `session/prompt` with the initial prompt, then with each message of the person. Plane sends only one prompt at a time and refuses a prompt while a turn runs.
6. **Updates.** Join the agent message chunks of the current turn. When the turn ends, keep the newest 64 KiB of the joined text as the last message. Use other updates only to set the state and to send output notices; discard their content. In version 1, the turn ends with the `session/prompt` response and its stop reason. In version 2, the turn ends with an idle `state_update`; a missing or unknown stop reason counts as `end_turn`.
7. **Permissions.** Keep each `session/request_permission` request pending until the person selects one of its options. Never answer it automatically. An unknown outcome is not approval.
8. **Cancel.** Send `session/cancel` and answer each pending permission request with the `cancelled` outcome.
9. **Resume.** Start a new agent process and initialize it. In version 2, send `session/resume` with `replayFrom: {type: "start"}` when the agent offers resume. In version 1, send `session/load` when `loadSession` is true. Otherwise resume is unavailable, and the person can respawn. The runner takes the last agent message from the replayed updates.
10. **End.** Close standard input, then stop the process after 5 seconds.

## Terminal adapter

The terminal adapter uses the herdr CLI and never sends input to a running harness program.

1. **Start.** Each terminal session has its own named herdr session `plane-<session ID>`, so its client shows only that session. Every herdr call names `--session plane-<session ID>`, because pane IDs repeat across named sessions. Start `herdr --session plane-<session ID> server` as a detached process, and wait up to 5 seconds until `pane list` no longer returns `server_not_running`. Then run `herdr --session plane-<session ID> workspace create --cwd <worktree> --label <label> --env ARTIFACT_PLANE_LAUNCH=<session ID> --no-focus`, with one more `--env` for each profile variable. Read `.result.root_pane.pane_id` and `.result.tab.tab_id` from the JSON output.
2. **Command.** The start also sets `ARTIFACT_PLANE_PROMPT` to the initial prompt with `--env`. Run `herdr --session plane-<session ID> pane run <pane> <command line>`. The command line is the profile command, each argument quoted for a POSIX shell, plus `"$ARTIFACT_PLANE_PROMPT"` in the form of the Initial prompt column. The command line holds no prompt text, so the shell history keeps only this literal line and no request. This text goes to the shell of the new pane before the harness program starts. After that, Plane sends no text and no keys to the pane.
3. **Harness session ID.** The SessionStart hook of Claude Code inherits `ARTIFACT_PLANE_LAUNCH`. The hook command records `session:harness-id` for that session with the hook `session_id` and `model`.
4. **Status.** Every 2 seconds, the runner reads `herdr --session plane-<session ID> pane list` and maps the `agent_status` values `working`, `blocked`, `done` and `idle` to the session states. `unknown` keeps the session state. herdr does not detect every harness tool; the live check saw `unknown` for Command Code and Gemini CLI. A missing pane interrupts the session.
5. **Open in terminal app.** Run the `terminal.open` arguments plus `herdr session attach plane-<session ID>` as a detached process.
6. **Resume.** Run `tab create` with the arguments of the start, without `ARTIFACT_PLANE_PROMPT`, in the same named herdr session. When the server does not run or has no workspace, start them as in step 1, again without `ARTIFACT_PLANE_PROMPT`. Then run the profile command plus `--resume <harness session ID>` for `claude-code`. Other harness tools in a terminal can only respawn.
7. **End.** Run `herdr --session plane-<session ID> server stop`, which stops that named session and its pane.

Plane does not install the herdr Claude integration. When the person installs it, its user hooks run beside the project hooks of Plane. At start, a herdr server downloads its agent detection rules from herdr.dev; Plane does not change this.

## Embedded terminal

The session page of a terminal session embeds its herdr client through ttyd when the `ttyd` program is on `PATH` ([ADR 021](../decisions/021-embedded-terminal-relay.md)).

1. **Relay start.** On the first view, the runner starts `ttyd --writable --check-origin --base-path /api/sessions/terminal/<session ID> --interface <state>/relay/<session ID>.sock herdr session attach plane-<session ID>` without a shell. ttyd creates the socket with mode 0660, so the `relay` directory has mode 0700, and only the user can reach the socket. When the socket path has 104 bytes or more, the relay is unavailable with the reason "The state directory path is too long for a socket."
2. **Forwarding.** The server forwards `GET /api/sessions/terminal/<session ID>/…` and the WebSocket upgrade on that path to the socket. It applies the loopback, Host and Origin checks first. A WebSocket upgrade needs an `Origin` equal to the workbench origin. The server forwards the `Host` and `Origin` headers and the bytes unchanged and stores nothing. ttyd closes a WebSocket without an `Origin`, or with an `Origin` whose host and port differ from `Host`.
3. **Frame.** The workbench shows the relay page in an iframe of the same origin. The workbench Content-Security-Policy adds `frame-src 'self'`, and relay responses carry `Content-Security-Policy: frame-ancestors 'self'`.
4. **Input.** Plane forwards only the bytes that the browser sends from the keys of the person. Plane writes nothing to the relay itself (requirement AO7).
5. **Relay stop.** The runner stops ttyd when the session ends, or 10 minutes after the last viewer disconnects. The server reports the viewer count of each session to the runner.
6. **Relay state.** The session view of a running terminal session has `relay: {available, reason}`; the store keeps no relay field. A failed start shows its reason, and the next view tries again. The relay route returns 409 for an ended or interrupted session.
7. **Without ttyd.** The session page shows Open in terminal app only. At a narrow width, the page shows "Open this session on a computer" instead of the terminal.

Browser shortcuts such as Ctrl+W, Ctrl+T and Ctrl+N stay with the browser. Full screen and Open in terminal app give the person the complete key set. ttyd starts one herdr client for each viewer, and all clients show the same named session. Keys that the person types before the herdr client draws its first screen are lost; the live check measured up to about 3 seconds.

## Runner

The server finds the runner through the socket `runner.sock` in the runtime state directory. When no runner answers, the server starts `artifact-plane runner` as a detached process with the same state directory, and waits up to 3 seconds. The pattern is the one of the workbench start in specifications/ui-discovery.md. The socket file is private (0600) in the private state directory. When its path has 104 bytes or more, the runner is unavailable with the reason "The state directory path is too long for a socket." A stale socket file without a listener is removed before a new runner listens.

Messages are JSON objects, one on each line: requests `{id, method, params}`, responses `{id, result}` or `{id, error}`, and pushed `{event, session, seq, update}` objects. The methods are `hello`, `start`, `prompt`, `answer`, `cancel`, `resume`, `end`, `openTerminal`, `snapshot`, `subscribe` and `unsubscribe`, and the relay methods `relay` and `relayViewers`. `snapshot` returns the live state of a session. `hello` returns the runner version; a different version makes the server refuse new starts and show "Restart the session runner".

The runner exits 10 minutes after its last session ends while no server is connected. When the runner stops, its ACP sessions become `interrupted` with reason `runner-lost` at the next server check, so the person can resume them. Terminal sessions continue in herdr.

## Output

The output reader runs Git read-only in the session worktree through the existing Git process limits. It never writes a file or Git metadata.

| Item | Source | Limit |
| --- | --- | --- |
| Base revision | `git rev-parse HEAD` when the session starts. | — |
| Commits | `git log` from the base revision to `HEAD`: short ID and subject. | 100 newest |
| Changed files | `git diff --numstat -z` against the base revision, plus untracked files that Git does not ignore. Each file has its path, status (`A`, `M`, `D` or `R`; Git `T`, `U` and `C` show as `M`), added and removed lines, a binary flag and a committed flag. The committed flag is true when the file has no uncommitted change against `HEAD`; an untracked file is not committed. | 500 files |
| Diff | `git diff` against the base revision for one listed path. An untracked text file shows as all added lines. | 256 KiB, then a truncation notice |
| DoD progress | The checklist of the task file in the session worktree, with the existing checklist reader. | — |

The diff route accepts only a path of the current changed-file list. When the base revision is no longer in the repository, the output and diff routes return 409 "The base revision is not in the repository." A binary file shows its status and no diff. The workbench reads the output again when the session state changes, on `session:output-changed`, after a hook reports a finished tool use of a terminal session, and every 15 seconds while the session works.

## Recovery

| Situation | Choices that the workbench offers |
| --- | --- |
| Session `idle` after a turn | Continue: the person sends a new prompt (ACP), or types in the terminal. |
| Session `interrupted`, resume available | Resume, Respawn, Respawn with another profile. |
| Session `interrupted`, resume unavailable | Respawn, Respawn with another profile. |
| Session `ended` | Respawn, Respawn with another profile. |

Resume keeps the session and its attempt. It uses the current settings of the profile ID of the session, because the store keeps only the profile summary. Respawn starts a new session with `respawnOf`, and its explicit binding supersedes the earlier attempt. The respawn prompt points the agent at the task, the branch and the change brief. The agent reads the change brief through the Plane MCP server. Uncommitted files stay in the worktree; Plane changes no file.

## Workbench

The owner approved the [mockup canvas](https://claude.ai/artifact/M8Gq8XJm9S1h2ZZnxHneDQ) on 2026-10-29. It shows the Sessions page, an implementer session with a permission request and its output, a role session with the embedded terminal, a role session that waits for a permission in the terminal, the launch dialog, recovery, Agent settings, the profile editor, Start ADD work and the phone width. It is an illustration for plan approval; this contract is the authority. The workbench shows task progress and output, not the agent process.

- The Work page has Start ADD work. Its dialog takes the request, the worktree (default: the repository root checkout) and the coordinator profile (default: the role default). It lists only terminal profiles and says that the person chats in the harness tool.
- A terminal session page shows the change phases of a role session, the state, the embedded terminal with Full screen and Open in terminal app, End session, and the output as a tree with diffs. It says that the person chats and approves the plan in the terminal, and that Plane records no approval. Plane builds no chat.
- When a terminal session is `waiting`, its session page shows a notice above the terminal and marks the terminal border. The notice names the tool of the newest `PermissionRequest` hook observation of the harness session after the session became `waiting`; without one, it says that the agent waits for the person in the terminal. The notice has Focus terminal and no answer control: the person answers in the dialog of the harness tool. When herdr reports `unknown` for the agent of a terminal session, the page says that Plane cannot see when this agent waits.

- The Sessions page lists the implementation tasks with a session, grouped by change. Each row shows the task, its DoD progress, an output summary (files, added and removed lines, commits), the harness tool and model, and the state. A second group lists the coordinator, product owner and technical lead sessions with their output summary.
- A session page shows a header with the role, task, harness tool, model, connection, branch and start time, and the actions Stop turn and End session. Below it come a pending permission request, the DoD checklist, the commits, the last agent message, and the output: the changed files as a tree and the diff of the selected file. An ACP session also has a message field.
- The workbench shows no tool call log and no message stream.
- The top bar shows the number of sessions that wait for the person.
- A launch dialog opens from the task details of the change page (Start implementer), from the change page (Start session) and from the Sessions page (New session). It shows role, change, task, worktree, profile with the role default selected, the warnings of the start rules and Start.
- Task runtime details also show the harness tool and the model of each attempt.
- An Agent settings page shows three sections. Providers lists each catalog provider with its programs and versions, connections, sign-in state and models, and a Check action, plus herdr and ttyd. Role defaults has one profile selector for each role. Profiles lists the profiles with their state and the actions New profile, Edit, Duplicate and Delete.
- A profile editor sets name, provider, connection, sign-in kind, model and effort level from their lists, the roles that use the profile as default, and, under Advanced, extra arguments and environment variables. A change of provider changes the model list, and a change of model changes the effort list. The editor shows the source of the lists (checked or documented) with Check again, the program that Plane will run and the validity errors.

When no profile exists, the workbench shows no session control except the Agent settings page (requirement AO18).

## Failures

| Failure | Behavior |
| --- | --- |
| The profile file is missing or invalid | Sessions are unavailable or the profile is invalid; observation continues. |
| A command or herdr is missing | The start returns 503 with the missing program name. |
| The agent sends malformed JSON or exits during start | The session ends with reason `error`. |
| The runner does not start in 3 seconds | The start returns 503; nothing else changes. |
| ttyd is missing or does not start | The session page shows Open in terminal app and the reason; the session continues in herdr. |
| The runtime store is unavailable, for example on Windows | Session control is unavailable with the existing store reason. |

No failure writes a repository file or Git metadata.

## Interface sources

These documented facts support the claim `acp-agent-interfaces`. They were read on 2026-10-29 without running the programs.

- ACP: `session/set_config_option` returns the complete config options after a change, because one change can affect other options (agentclientprotocol.com session config options page).
- ACP: version negotiation, `session/load` and `session/resume` in version 1, `session/resume` with `replayFrom` in version 2, config option categories `model` and `thought_level`, stop reasons, permission requests and `session/cancel` (agentclientprotocol.com, protocol version 2 migration, initialization and prompt turn pages).
- Claude ACP agent 0.99.0: versions 1 and 2, `loadSession`, options `model` and `effort`, project settings loaded, the option `--hide-claude-auth` (github.com/agentclientprotocol/claude-agent-acp).
- Codex ACP agent 2.3.0: versions 1 and 2, `loadSession` in version 1 and `session/resume` in version 2, options `model` and `reasoning_effort`, ChatGPT and API key sign-in methods (github.com/agentclientprotocol/codex-acp).
- OpenCode 2.2.0 `opencode acp`: version 1, `loadSession`, options `model` and `effort`, sign-in with the stored OpenCode credentials (opencode.ai ACP documentation).
- Gemini CLI 0.66.0 `gemini --acp`: version 1, `loadSession`, no config options; the model comes from the command (geminicli.com ACP mode documentation).
- Claude Code: `claude --model <m> "<prompt>"`, `--resume <id>`, and hook processes inherit the environment of the session (code.claude.com CLI and hooks references).
- herdr 0.9.5: `tab create` with `--cwd`, `--env` and `--label`, `pane run`, `pane list` status values, named sessions with `--session` and `session attach`, and `server stop` (herdr.dev CLI and socket references).
- Live evidence of task `verify-interfaces` on 2026-10-29 (claude-agent-acp 0.99.0, codex-acp 2.3.0, OpenCode 2.2.0, Command Code 1.88.0, Gemini CLI 0.66.0, herdr 0.9.5, ttyd 1.7.7): the negotiated protocol versions and options, the `cmd acp` shape, the Claude plan refusal, stale OpenCode replies after a model change, the OpenCode, Codex and Command Code terminal commands, the herdr start with a detached server and `workspace create`, `server stop` of one named session, and the ttyd Origin check and input path. codex-acp runs its bundled Codex unless the profile sets `CODEX_PATH`. Version 2 names the option field `configId` and the sign-in method field `methodId`.
- ttyd 1.7.7 (MIT, in nixpkgs): `--interface` takes a UNIX socket path, `--writable` allows input (read-only by default), `--check-origin` refuses a WebSocket from another origin, and `--base-path` serves under a path prefix (github.com/tsl0922/ttyd).

## Specification self-check

- The contract covers AO1 to AO28 with commands, events, states, adapters, the runner, output, recovery, the workbench and failures. After the UI/UX review, the runner keeps only the last message and pending permission requests, and the output reader shows the work from Git.
- KISS: one port with two adapters, one runner, the existing store and attempt model, one settings file, no new MCP tool and no chat; role sessions reuse the conversation of the harness tool in a terminal, and ttyd embeds that terminal without a native module. The profile editor edits only catalog providers, so the HTTP server cannot define an arbitrary program.
- Impact: execution observation gains Plane-started attempts; the new flows `agent-session-launch` and `agent-session-recovery` record the journeys. The artifact-driven method needs no change; the only reference is the task DAG contract.
- The open claims name live checks. They do not block the Plan; the Plan adds the live check.
- The task `runner` found contradictions between the States table and its paragraph, and gaps for resume, runner loss and the runner socket path. A third amendment adds the relay methods and the relay state from task `terminal-relay`, makes herdr status set only the session state, adds the attempt state after a resume, makes a runner loss interrupt ACP sessions, applies the socket path limit to the runner socket, and drops the `session:ended` reasons that no signal produces.
- The tasks `acp-client` and `terminal-adapter` found gaps: resume after the herdr server or its workspace stopped, an event for an idle terminal session, reserved profile variable names, the sign-in instruction and the failure statuses of a provider check, and the part of a long last message that the runner keeps. A second amendment closes them.
- After plan approval, the live check of task `verify-interfaces` refuted `herdr-named-sessions`, `terminal-model-flags` and `per-model-effort-discovery`. This amendment corrects the herdr start, the catalog, the provider check, the relay socket protection and the herdr `unknown` state, adds the output details of task `output-reader`, and adds the claims `gemini-terminal-model-flag` and `commandcode-acp-hook-trust`.
- After the owner approved the mockups, the Workbench section records the canvas and the waiting notice of a terminal session. The notice reads the tool name from the existing hook observations, so the lifecycle events stay without tool names, and Plane still sends no key to the terminal.
- STE: each rule is one sentence or one table row; terms are in the Terms table.
