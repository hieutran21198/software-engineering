---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/agent-integration.md#specification-self-check
claims:
  - id: reserved-action-detection
    kind: decision
    statement: The hook finds the three reserved actions by splitting a shell
      command into simple commands and reading the words of each one, and it
      reads the branch of the effective directory from local Git.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/01-guidance-functions.md#evidence
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
    rejected:
      - option: Permission rules of each harness.
        reason: A Claude Code permission pattern cannot express "commit while
          the branch is main", and Codex uses another rule format, so two rule
          sets would cover less than one hook.
      - option: A Git pre-commit and pre-push hook.
        reason: Each clone must install it, and it also stops people, for whom
          ADD does not reserve these actions.
    risk_if_wrong: An unusual command form, for example an alias or a script
      that runs git, passes the hook. The hook is a guardrail; the skills and
      the team review stay the control.
    check: Run the AIA2 test table, including quoted text, `git -C`, chained
      commands and refspecs, and confirm each expected result.
  - id: detached-inferred-bind
    kind: decision
    statement: The hook starts an inferred binding as a detached process of the
      executable and returns at once.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/03-hook-command.md#evidence
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
    rejected:
      - option: Bind inside the hook process.
        reason: A binding reads the repository through exploreRepository, which
          took 8.6 seconds on this repository with 13 worktrees, and a tool call
          waits for its PreToolUse hook.
    risk_if_wrong: Tool calls of an implementer wait several seconds once.
    check: Measure the PreToolUse hook time with an inferred binding on this
      repository; it stays within the limit of Hook command.
  - id: status-latency
    kind: unknown
    statement: The change state of one worktree takes at most 2 seconds on this
      repository, so the session start hook stays within its limit.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/01-guidance-functions.md#evidence
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/03-hook-command.md#evidence
    risk_if_wrong: The session starts without the context because the hook times
      out.
    check: Time the SessionStart hook on this repository and on the fixture of
      the change status tests.
  - id: codex-subagent-identity
    kind: unknown
    statement: Codex sends agent_id only on SubagentStart and SubagentStop, so a
      tool call of a Codex subagent in the main worktree cannot be told from a
      tool call of its parent.
    status: refuted
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
    risk_if_wrong: An inferred binding of Codex is missed or binds the parent
      session.
    check: Record the PreToolUse input of a Codex subagent in the live check of
      AIA6 and compare its session_id and agent_id with the parent.
  - id: harness-launch
    kind: assumption
    statement: Claude Code and Codex start a stdio MCP server in the project
      directory and run a hook command through a POSIX shell on Linux and
      macOS.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-agent-integration/tasks/06-validation.md#evidence
    risk_if_wrong: The committed MCP server finds no repository, or the `|| true`
      guard of an older executable does not apply and its usage error exit 2
      refuses each tool call.
    check: Start a Claude Code session and a Codex session in this repository
      with the committed configuration, once with the new executable and once
      with Plane 1.22.0 on the path, and record the results in the live check.
  - id: antigravity-hook-adapter
    kind: decision
    statement: The hook command accepts optional --event <name> and normalizes
      Antigravity camelCase payloads (conversationId, workspacePaths, toolCall,
      invocationNum, executionNum, terminationReason) to the observer and
      guidance inputs while writing Antigravity output shapes (injectSteps,
      decision allow or deny, and decision continue).
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-antigravity-support/tasks/01-antigravity-hook-adapter.md#evidence
      - docs/artifacts/artifact-plane/changes/change-antigravity-support/tasks/03-validation.md#evidence
    rejected:
      - option: A separate antigravity-hook subcommand or wrapper script.
        reason: A second command or script splits the fail-open and observer
          code paths across harnesses.
      - option: Infer PostToolUse from the stdin payload alone without --event.
        reason: A successful Antigravity PostToolUse payload has no error field
          and has the same keys as PreToolUse.
    risk_if_wrong: An Antigravity hook invocation without --event treats a
      successful PostToolUse payload as PreToolUse when both use the same
      command string.
    check: Run the AIA8 test suite covering SessionStart, PreInvocation,
      PreToolUse, PostToolUse (with --event PostToolUse and with error) and
      Stop (executionNum 1 versus 2, NO_TOOL_CALL versus other reasons).
---

# Agent integration contract

## Governing requirements

AI1 to AI14 in requirements/agent-integration.md.

OpenCode 2 uses the separate [native V2 integration contract](opencode-support.md), governed by OP1–OP8 and OPA1–OPA4. It translates verified plugin interfaces to this command protocol; it does not consume Claude Code, Codex or Antigravity hook configuration. Command Code uses the separate [command-hook contract](commandcode-support.md), governed by CP1–CP9 and CPA1–CPA5. It consumes this hook command and the Claude Code output shapes, and it adds no adapter command.

## Command line

The executable adds two commands to `serve`, `mcp` and `model-install`:

| Command | Behavior |
| --- | --- |
| `hook` | Reads one hook input from standard input and writes one JSON object to standard output. It takes no option except `--state-dir /absolute/path` and `--event <name>`. |
| `runtime <register\|bind\|report\|query> --name value ...` | The commands and options of `node server/runtime-cli.js` (integration/README.md). `bind` adds `--binding inferred`; the default is `explicit`. |

server/app.js imports the module of a command only when that command runs. The `hook` command never writes to standard error more than one line, and it always exits with status 0, also for an unknown option. `node server/runtime-cli.js` keeps its commands and output.

## Hook command

The hook reads at most 1 MiB. It parses the JSON and dispatches on `hook_event_name`. When `hook_event_name` is absent and the object has `conversationId` or `workspacePaths`, the input is an Antigravity (`protojson` camelCase) hook payload. A field that the input does not have is treated as empty. The supported events are the events of the observer (specifications/codex-execution.md, Codex lifecycle adapter) and `SessionStart` with any source.

For an Antigravity payload, the adapter normalizes the input before running the observer and event steps:

| Target field | Antigravity source |
| --- | --- |
| `hook_event_name` | `--event` when it names a supported event (`PreInvocation` maps to `UserPromptSubmit`; `PostInvocation` returns `{}` without observing); else `PostToolUse` when `toolCall` is an object and `'error' in input`, `PreToolUse` when `toolCall` is an object, `Stop` when `terminationReason` is a string or `fullyIdle` is a boolean, `UserPromptSubmit` when `invocationNum` is a number, or `SessionStart` otherwise. |
| `session_id` | `conversationId`. |
| `cwd` | The first nonempty string in `workspacePaths`, or `process.cwd()` when `workspacePaths` has none. |
| `turn_id` | `conversationId`, so `UserPromptSubmit` (`PreInvocation`), `PreToolUse`, `PostToolUse` and `Stop` share one turn identifier across the conversation. |
| `model` | `modelName`. |
| `agent_id` | `agentId` or `subagentId` when present. |
| `tool_name` | `toolCall.name`. |
| `tool_input` | `{command: toolCall.args.CommandLine ?? toolCall.args.command, file_path: toolCall.args.Path ?? toolCall.args.AbsolutePath ?? toolCall.args.FilePath ?? toolCall.args.file_path, path: toolCall.args.Path ?? toolCall.args.DirectoryPath ?? toolCall.args.path}` when `toolCall.args` is an object. |
| `stop_hook_active` | `true` when `stop_hook_active` is `true`, when `terminationReason` is a nonempty string other than `NO_TOOL_CALL`, or when `executionNum` is a number greater than 1; else `false`. |

For each supported event, the hook first records the observation as the observer does now. Claude Code 2.1.301 sends `prompt_id` and no `turn_id`; the observer uses `prompt_id` as the turn when `turn_id` is absent, so Claude Code attempts reach Processing and Validating. Then it does the work of the event:

| Event | Work | Output (Claude Code and Codex) | Output (Antigravity) |
| --- | --- | --- | --- |
| SessionStart | Session context | `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<text>"}}`, or `{}` when the text is empty | `{"injectSteps":[{"systemMessage":{"systemMessage":"<text>"}}]}`, or `{}` when the text is empty |
| PreToolUse | Reserved actions, then inferred binding | `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"<reason>"}}` for a reserved action, else `{}` | `{"decision":"deny","reason":"<reason>"}` for a reserved action, else `{"decision":"allow"}` |
| Stop, SubagentStop | Stop check | `{"decision":"block","reason":"<text>"}` when the check fails, else `{}` | `{"decision":"continue","reason":"<text>"}` when the check fails, else `{}` |
| Other events | none | `{}` | `{}` |

All three harnesses accept their respective shapes. The hook writes no other field and no plain text, except the workbench parts of the SessionStart output (specifications/ui-discovery.md, Hook output).

Each step has its own error boundary. An error, a timeout or a missing repository makes that step return `{}` (or `{"decision":"allow"}` for an Antigravity `PreToolUse` event, where `decision` is required), and the hook writes one line "Artifact Plane hook unavailable; execution continues." to standard error. In a Git repository without `docs/artifacts`, the steps return `{}` (or `{"decision":"allow"}` for Antigravity `PreToolUse`); only SessionStart also writes the line. A step also returns `{}` (or `{"decision":"allow"}` for Antigravity `PreToolUse`) when it runs longer than its limit: 2 seconds for PreToolUse, 5 seconds for SessionStart and 20 seconds for the stop check. The observer step keeps its existing bounds: Git reads stop after 5 seconds and SQLite waits at most 2 seconds for a lock. On Windows the runtime store refuses its directory because the file system reports no private POSIX modes, as it does from source; the observer step then fails on each call and the guidance steps still work. The hook stores no prompt, tool input, command, tool output, assistant message or transcript path. It reads `tool_input` only in memory, for the reserved actions and the task path.

An ADD repository is a Git work tree whose top level has `docs/artifacts`. The protected branches are `main` and `master`, as in the other readers of the Plane.

## Session context

The hook reads the worktree of `cwd` only: the Git top level, its branch, and the changes that `evidenceFor` derives for it. It does not read the other worktrees. For each current change (`isCurrent` of src/work-model.js) it takes the status of `changeStatus`, the tier, the member unit and the unchecked DoD items of each task. server code imports src/work-model.js; the change page and the hook use the same functions.

The text has at most 4,000 characters. When it is longer, the hook removes task lines from the end, then change lines from the end, and adds the line "More in get_change_status." after the last change line. The format:

```text
Artifact Plane <version>: ADD state of <worktree path> on branch <branch>.
- <artifact>/<change> (tier <tier>, unit <unit>): <status text>. Next: <next step>
  Unchecked DoD items: <task file> <n>; <task file> <n>
ADD reserves for people: the merge of a pull request, and commits and pushes to main or master.
MCP: get_change_status and check_records give this state and the record checks.
```

With no current change the second line is "No current change in this worktree." The unit part is left out for a change without a unit. A change with a version and no unchecked item has no DoD line.

## Reserved actions

The hook reads `tool_input.command` of every tool, as a string or an array of words. It splits the command at newlines, `;`, `&&`, `||`, `|` and `&` outside quotes, and splits each simple command into words with shell quoting. It skips leading `NAME=value` words. A simple command is reserved when:

| Action | Words | Condition |
| --- | --- | --- |
| Commit | `git [global options] commit ...` | The branch of the effective directory is `main` or `master`. |
| Push | `git [global options] push ...` | A refspec argument names `main` or `master` as its destination (`main`, `HEAD:main`, `+main`, `refs/heads/main`); or the branch is `main` or `master` and the push has no refspec or the refspec `HEAD`; or the push has `--all` or `--mirror`. |
| Merge | `gh pr merge ...` | Always. |

Global options are `-C <dir>`, `-c <name=value>`, `--git-dir=...`, `--work-tree=...`, `--no-pager` and other words that start with `-` before the subcommand. `-C` changes the effective directory, relative to `cwd`. A simple command `cd <dir>` changes the effective directory of the simple commands after it. The hook compares the last path part of the command word, so `/usr/bin/git` is `git`. When the words are `sh`, `bash` or `zsh` with an option that contains `c` (`-c`, `-lc`), the hook checks the script argument in the same way; Codex can send a command in this form. Words inside quotes are arguments and never start a simple command, so `echo "git commit"` is not reserved. Subshells, command substitution, aliases and scripts are not inspected. The check runs only in an ADD repository.

The reason names the action and the rule: "ADD reserves <action> for people (AGENTS.md). Work on a change branch and stop for team review." The hook does not refuse other actions.

## Stop check

On Stop and SubagentStop with `stop_hook_active` false, the hook runs `validateKnowledge` (scripts/validate-knowledge.mjs) on the Git top level of `cwd` once for each current change of that worktree. It fails when a result has a diagnostic of severity error. The reason lists at most ten diagnostics as "<artifact>/<change>: <code> <message>" and ends with "Fix the records, or say why they stay, before you stop." Warnings never fail the check. With `stop_hook_active` true, or with no current change, the hook returns `{}`. The scope of a change in `validateKnowledge` includes each unit brief whose metadata cannot be parsed, because such a brief has no readable member list; its errors therefore fail the check.

## Inferred binding

On PreToolUse, the hook looks for exactly one distinct path of the form `docs/artifacts/<artifact>/changes/<change>/tasks/<file>.md` in `tool_input.file_path`, `tool_input.path` or `tool_input.command`. `tasks/README.md` is not a task. Two or more distinct task paths start no binding. The worktree is the Git top level of `cwd`; the task must belong to a current change of that worktree. The hook starts a binding when all conditions hold:

- the session and agent of the input have no open attempt;
- the input has an `agent_id`; or the input has no `agent_id`, `cwd` is a linked worktree (not the first entry of `git worktree list`), and the store has no SubagentStart event of the session, so that a subagent input without `agent_id` cannot bind its parent session. Claude Code 2.1.301 and codex-cli 0.163.0 both send `agent_id` on the tool calls of a subagent;
- the change of the path is a current change of the worktree.

The hook starts `<executable> runtime bind --root <worktree> --artifact <a> --change <c> --task <file> --session <id> [--agent <id>] [--unit <unit>] --binding inferred` as a detached process with no standard streams, and does not wait. `<unit>` is the member unit of the change, when it has one. The bind command rejects the binding when an open attempt appeared in the meantime.

The attempt record gets the field `binding` with the value `explicit` or `inferred`. Attempts without the field are explicit. An explicit bind supersedes an open inferred attempt as it supersedes any open attempt. The attempt inspector of the recorded task shows "Inferred from a task file read" for an inferred binding and "Bound explicitly" for an explicit binding. The SQLite schema does not change; the field is in the attempt JSON.

Limits: an attempt is open until a Stop, SubagentStop, Interrupt or SessionEnd ends it, so a task file read between a Stop and the next prompt can bind. The SubagentStart rule reads the bounded buffer of unbound events (10,000 rows); in a longer session an old SubagentStart can be gone.

## MCP

The server name stays `artifact-plane-flows`; its version is the package version. Without `--repository`, the server uses the Git top level of its working directory, and fails with the current usage error when that is not a Git work tree.

New read-only tools, with the annotations of the existing read tools:

| Tool | Input | Result |
| --- | --- | --- |
| `get_change_status` | `path`, `worktree` (optional, as in the review tools) | `{repository, worktree, branch, changes: [{artifact, change, title, tier, unit, status: {name, text, next, family}, version, unchecked: [{task, count}]}], text}`; `repository` is the path of the main worktree, `changes` holds the current changes only, and `text` is the session context. |
| `check_records` | `path`, `worktree` (optional, as in the review tools), `change` as `<artifact>/<change>` (optional) | The `add-validate.result.v1` object of `validateKnowledge` for that worktree and change. |

The server sends these instructions on initialize:

```text
Artifact Plane reads ADD knowledge and Git. It never approves, pushes, merges or establishes versions.
Resume or start: get_change_status, then get_change_brief with view compact. Fetch selected registered sources; inspect omissions before conclusions. Compact entries marked json-fragment need text concatenated in offset order through totalCharacters, then JSON.parse; unfinished fragments are not complete facts. Use get_change_context_delta for changes after a compact capture. Capture expiry needs a fresh compact packet.
Discover flows and specifications: search_flows, get_flow, read_flow_source.
Specification and Plan: get_impact_context, get_change_impact. Review and context: get_change_review, get_change_context, read_change_context_source.
Before a self-check or the PR: check_records, get_change_brief, get_change_description.
Concepts: get_concept; search_flows with kinds.
```

The existing tools keep their inputs and results, except the additive `get_concept` tool, the `kinds` input of `search_flows` and the participant concepts of `get_flow` in [concept pages](concept-pages.md).

## Configuration

Hook entries for Claude Code and Codex use the command `artifact-plane hook || true` with these events and timeouts in seconds:

| Event | Matcher | Timeout |
| --- | --- | --- |
| SessionStart | none | 10 |
| UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, SubagentStart | none | 5 |
| Stop, SubagentStop | none | 30 |
| SessionEnd | none | 3 |
| Interrupt (Codex only) | none | 3 |

Hook entries for Antigravity use a top-level named hook `"artifact-plane"` in `.agents/hooks.json` with `artifact-plane hook --event <Event> || true` (and `artifact-plane hook --event PreToolUse | grep '"decision"' || echo '{"decision":"allow"}'` on `PreToolUse` so a missing or pre-1.25.0 executable still returns `{"decision":"allow"}`):

| Event | Structure | Matcher | Timeout |
| --- | --- | --- | --- |
| SessionStart | flat handler list | none | 10 |
| PreInvocation | flat handler list | none | 5 |
| PreToolUse, PostToolUse | grouped with `matcher` and `hooks` | `*` | 5 |
| Stop | flat handler list | none | 30 |

`|| true` (and the `PreToolUse` fallback) makes a missing or older executable return status 0 without blocking the agent.

This repository commits:

- `.mcp.json`: the server `artifact-plane` with command `artifact-plane` and args `["mcp"]`;
- `.claude/settings.json`: the Claude Code hook entries above;
- `.codex/config.toml`: `[mcp_servers.artifact-plane]` with the same command and args, added to the existing `[agents]` table;
- `.codex/hooks.json`: the Codex hook entries above;
- `.agents/hooks.json`: the Antigravity hook entries above;
- `.agents/plugins/artifact-plane/plugin.json` (`{"name":"artifact-plane"}`) and `.agents/plugins/artifact-plane/mcp_config.json`: the server `artifact-plane` with command `artifact-plane` and args `["mcp"]` so Antigravity discovers the workspace MCP server through its plugin loader;
- `.commandcode/settings.json`: the four Command Code hook entries of [commandcode-support.md](commandcode-support.md).

OpenCode 2 adds root `opencode.json` with native `mcp.servers` configuration and the automatically discovered `.opencode/plugins/artifact-plane/index.ts` entry. The reusable implementation, native permission translation, observation identity and unsupported stop blocking are owned by [opencode-support.md](opencode-support.md). Existing command-hook output shapes and registrations do not change.

Command Code adds `.commandcode/settings.json` with `SessionStart`, `PreToolUse`, `PostToolUse` and `Stop` entries that run `artifact-plane hook || true`. It reuses the project `.mcp.json` for the server and adds no global configuration. Its input fields, limits and files are owned by [commandcode-support.md](commandcode-support.md).

integration/hooks.example.json is replaced by integration/claude-settings.example.json, integration/codex-hooks.example.json and integration/antigravity-hooks.example.json with the same entries. integration/README.md and the Plane README describe for each harness: the MCP registration, the hook file, the trust or plugin steps (Claude Code: the workspace trust dialog and the approval of project MCP servers; Codex: a trusted project and the review of each hook in `/hooks`; Antigravity: `.agents/hooks.json` for workspace hooks and `.agents/plugins/artifact-plane/mcp_config.json` or `~/.gemini/config/mcp_config.json` for the MCP server), the bind commands of the executable, and the source path.

## Flows

execution-observation: the bind step adds the support of the inferred binding; the observe step adds the support of the hook command in server/app.js. A new flow record specifications/flows/agent-session-guidance.md has the steps start (session context or get_change_status), act (reserved actions), finish (stop check or check_records), with supports on the code and tests of this contract.

## Validation

- Node tests with recorded inputs of Claude Code, Codex, Antigravity and Command Code for each supported event, run against the hook function and once against the built executable.
- A test table for reserved actions with at least: commit on main, commit on a change branch, `git -C <main worktree> commit`, push of `HEAD:main`, push without refspec on main, push of a change branch, `gh pr merge 44`, `echo "git commit"`, `git log --grep commit`, and a chained `git add . && git commit` on main.
- Fail-open tests: missing repository, non-ADD repository, invalid JSON, a store directory that cannot be written, a step that exceeds its limit; each exits 0 and the store holds no forbidden field.
- Inferred binding tests: a subagent read, a linked worktree read (including an Antigravity `read_file` tool call with `toolCall.args.Path`), a read in the main worktree without agent_id (no binding), an explicit bind after an inferred one.
- MCP tests: tool list, instructions, version, default root, `get_change_status` equal to `changeStatus` on the change status fixture, `check_records` equal to `validateKnowledge`.
- The executable smoke check runs `hook` with a SessionStart input and `runtime query`.
- A live check in this repository with Claude Code and Codex for AIA6 and the open claims, with the harness versions in the evidence.

## Specification self-check

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-plane/change-antigravity-support` reports `ok: true`. Every ID of requirements/agent-integration.md maps to a section: AI1 to Command line; AI2, AI7 and AI13 to Hook command; AI3 to Session context; AI4 and AI14 to Stop check and Hook command; AI5 to Reserved actions; AI6 to Inferred binding; AI8 and AI9 to MCP; AI10 and AI11 to Configuration; AI12 to Command line, MCP and the observer rules that stay. The output shapes come from the hook references of Claude Code 2.1.301, codex-cli 0.163.0 and Antigravity (`hooks.json` specification). Claim `antigravity-hook-adapter` is open for plan approval. KISS: one command, existing readers and validator, no new table or store. STE: one rule in each sentence.
