---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/commandcode-support.md#requirement-self-check
---

# Command Code integration

## Outcome and facts

A Command Code session receives the Plane change state, reserved-action
refusals, the stop check and task binding through the released executable. The
owner selected project integration, not changes to global user settings.

Facts observed on this repository and Command Code 1.85.1 on 28 October 2026:

- A project hook file at `.commandcode/settings.json` supports `SessionStart`,
  `PreToolUse`, `PostToolUse` and `Stop`. It has no `UserPromptSubmit`,
  `PermissionRequest`, `SubagentStart` or `SubagentStop` event.
- A hook input has `session_id`, `cwd`, `hook_event_name`, `tool_name`,
  `tool_display_name` and `tool_input`, and has no `agent_id`. A headless run
  sent `file_path` for `read_file` and a complete `command` for
  `shell_command`.
- The hook output shapes match the existing Claude Code shapes.
- Project MCP scope is `.mcp.json`, which this repository already contains.
- A headless run did not fire `SessionStart` on startup or resume. Command Code
  skips hooks in plan mode.

## Requirements

- CP1: The existing `artifact-plane hook` command serves the four Command Code
  events without a new subcommand or a wrapper script.
- CP2: A `SessionStart` input returns the existing session context output.
- CP3: A `PreToolUse` shell input refuses a commit or push to a protected
  branch and a pull request merge, including a command line with separate
  arguments.
- CP4: A task-file read infers a binding under the existing identity rules, for
  the documented `absolute_path` field and the observed `file_path` field.
- CP5: A `Stop` input runs the existing stop check and honors
  `stop_hook_active`.
- CP6: Project configuration uses `.mcp.json` for the server and
  `.commandcode/settings.json` for the four events, with no duplicate or global
  registration.
- CP7: A missing executable, broken store, malformed input or timeout leaves
  agent work running and stores no payload text.
- CP8: Existing harness adapters, MCP tools, observer behavior and browser
  presentation remain unchanged.
- CP9: Guidance states the observed limits: no `SessionStart` in headless mode,
  skipped hooks in plan mode, no subagent events and no `agent_id`.

## Acceptance criteria

- CPA1: A configuration test checks the committed hook file, its example and
  the unchanged project MCP registration.
- CPA2: Recorded payload tests cover context, all three refusals, shell
  arguments, task binding from both path fields and the stop check.
- CPA3: Failure and privacy tests cover an invalid input, a missing repository,
  a broken store and a deadline, and confirm that no prompt, command or result
  text is stored.
- CPA4: A live headless check records the Command Code version and proves a
  reserved-action refusal and an inferred binding, and names the SessionStart
  limit.
- CPA5: Existing Node, browser, Go and executable suites pass.

## Impact

The `agent-session-guidance` and `execution-observation` flows gain Command Code
entry support. The ADD supplier owns role and harness guidance. Browser
presentation, stored state models and unrelated flows do not change.

## Requirement self-check

Requirements preserve the selected full scope and state the observed limits
instead of promising unsupported events. KISS reuses the existing hook command,
policy and runtime store. STE separates observed facts from requirements. No
blocker prevents Specification.
