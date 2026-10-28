---
references:
  - artifact: artifact-driven
    element: specifications/commandcode-support.md
    requires: Canonical skill discovery, implementer profile and retained ADD gates.
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/commandcode-support.md#specification-self-check
claims:
  - id: commandcode-payload
    kind: decision
    statement: The hook accepts the observed Command Code read path field and
      the documented alternative, and joins separate shell arguments before
      policy checks.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-commandcode-support/tasks/01-hook-input.md#evidence
      - docs/artifacts/artifact-plane/changes/change-commandcode-support/tasks/03-integration-validation.md#live-headless-check
    check: Run recorded payload tests with file_path, absolute_path, a full
      command and a command with separate args, and confirm each expected result.
    risk_if_wrong: A task read would not bind or a reserved command would pass.
  - id: headless-sessionstart
    kind: unknown
    statement: Command Code 1.85.1 does not fire SessionStart in headless mode,
      so context injection needs an interactive session.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-commandcode-support/tasks/03-integration-validation.md#live-headless-check
    check: Record the hook files and payloads of a headless startup and resume
      on the recorded version.
    risk_if_wrong: Fixture context would be reported as live activation.
  - id: no-subagent-identity
    kind: assumption
    statement: Command Code hook inputs carry no agent_id, so an inferred
      binding in the primary checkout cannot be attributed to a subagent.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-commandcode-support/tasks/03-integration-validation.md#live-headless-check
    check: Inspect the recorded PreToolUse payloads of a headless run for
      agent_id and subagent fields.
    risk_if_wrong: A parent session could receive a subagent binding, or an
      implementer binding would be missed outside a linked worktree.
---

# Command Code integration contract

Governs CP1–CP9 and CPA1–CPA5 in
[Command Code requirements](../requirements/commandcode-support.md). Extends the
existing [agent integration](agent-integration.md) contract without changing its
other harness adapters. The ADD reference is supplied by
`artifact-driven/change-commandcode-support`.

## Hook mapping

Command Code sends `hook_event_name`, so the existing dispatcher handles the
input without a new adapter command. The supported events and outputs are:

| Event | Work | Output |
| --- | --- | --- |
| SessionStart | Session context | `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"<text>"}}`, or `{}` when the text is empty |
| PreToolUse | Reserved actions, then inferred binding | `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"<reason>"}}` for a reserved action, else `{}` |
| PostToolUse | Observation only | `{}` |
| Stop | Stop check | `{"decision":"block","reason":"<text>"}` when the check fails, else `{}` |

These output shapes are the Claude Code shapes. Command Code treats empty
standard output on exit 0 as no opinion, and it reads `permissionDecision` and
`decision: "block"` as documented.

Input normalization is limited to the tool arguments:

- A `read_file` path comes from `tool_input.file_path` or the documented
  `tool_input.absolute_path`. A task-file read infers a binding under the
  existing identity rules.
- When `tool_input.args` is a non-empty string array, the hook appends the
  shell-quoted arguments to `tool_input.command` before it checks reserved
  actions and task paths.
- Command Code sends no `turn_id` and no `agent_id`, so those fields stay empty.
  The observer records the attempt without a turn or subagent identity.

## Configuration

The hook file is `.commandcode/settings.json`. It has these entries:

| Event | Matcher | Timeout |
| --- | --- | --- |
| SessionStart | none | 10 |
| PreToolUse | none | 5 |
| PostToolUse | none | 5 |
| Stop | none | 30 |

Every handler runs `artifact-plane hook || true`. A missing or older executable
returns status 0 and does not block the agent. The file has no other key and
adds no global configuration.

The project MCP server stays in `.mcp.json`:

```json
{
  "mcpServers": {
    "artifact-plane": {
      "command": "artifact-plane",
      "args": ["mcp"]
    }
  }
}
```

Do not add a second Command Code MCP file. Do not edit user settings.

This repository commits `.commandcode/settings.json` and
`apps/artifact-plane/integration/commandcode-settings.example.json`. The Plane
README and `integration/README.md` describe the MCP and hook files, the trust
step, and the source path.

## Limits

Command Code 1.85.1 did not fire `SessionStart` on headless startup or resume.
The context output is checked with a recorded payload only; live context needs an
interactive session. Command Code skips hooks in plan mode. It has no
`UserPromptSubmit`, `PermissionRequest`, `SubagentStart` or `SubagentStop` event
and sends no `agent_id`. A subagent tool call in the primary checkout therefore
cannot bind, and independent implementers use linked worktrees. The Stop check
runs at most three retries per turn and receives `stop_hook_active` on a retry.

## Fail-open and privacy

Each step keeps its own error boundary and limit. A missing repository, invalid
JSON, broken store, missing executable or timeout returns `{}` and writes at most
one line to standard error. The hook stores no prompt, command, tool input,
result or transcript text. It reads the tool input in memory only.

## Validation

- A configuration test compares the committed hook file with the example and
  checks the unchanged `.mcp.json`.
- Recorded payload tests cover `SessionStart`, `PreToolUse` with `file_path` and
  `absolute_path`, the three refusals, a command with separate args, the binding
  and `Stop` with each `stop_hook_active` value.
- Failure and privacy tests cover an invalid input, a missing repository, a
  broken store and a deadline, and confirm that no payload text is stored.
- A live headless check on the recorded version proves a reserved-action denial
  and an inferred binding in a linked worktree. It names the SessionStart limit.
- Existing Node, browser, Go and executable suites run unchanged.

## Specification self-check

KISS reuses the hook command, policy and runtime store. STE states each limit
directly. The payload and limit claims come from the recorded 1.85.1 run. The
contract adds no workflow state, new store or browser behavior. No requirement
or approval boundary changed. No blocker prevents Plan.

Ran `node apps/artifact-plane/scripts/validate-knowledge.mjs --change
artifact-plane/change-commandcode-support`: `ok: true`.
