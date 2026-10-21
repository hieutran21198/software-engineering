---
references:
  - artifact: artifact-driven
    element: specifications/opencode-support.md
    requires: Canonical skill discovery, native role profiles and retained ADD gates.
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/opencode-support.md#specification-self-check
claims:
  - id: v2-runtime-contract
    kind: unknown
    statement: The target V2 runtime exposes sufficient session location,
      shell permission and durable lifecycle metadata for the specified bridge.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/changes/change-opencode-support/tasks/01-verify-v2-contract.md#native-runtime-probe
    check: Inspect the installed target V2 SDK contracts and capture redacted
      live shapes before implementing the mapping; stop for amendment if a required interface is absent.
    risk_if_wrong: Reserved-action protection or observation identity would be
      incomplete or attributed to another session.
  - id: live-activation
    kind: unknown
    statement: The project plugin and stdio MCP server activate in the target OpenCode V2 release.
    status: open
    basis: inferred
    check: Load the project in a disposable target V2 session and record version,
      plugin registration, MCP tools, context and guardrail behavior.
    risk_if_wrong: Fixture success would be mistaken for working harness integration.
---

# OpenCode V2 integration contract

Governs OP1–OP8 and OPA1–OPA4 in [OpenCode requirements](../requirements/opencode-support.md). Extends the existing [agent integration](agent-integration.md) contract without changing its other harness adapters. The ADD reference was delivered by `artifact-driven/change-opencode-support` and is established in ADD 3.3.0.

## Project setup

Add root `opencode.json` with `$schema: https://opencode.ai/config.json` and `mcp.servers.artifact-plane` set to `{type: "local", command: ["artifact-plane", "mcp"]}`. Do not set a model, default agent, permissions or global configuration.

Provide the reusable plugin under `apps/artifact-plane/integration/opencode/`. A thin `.opencode/plugins/artifact-plane/index.ts` entry loads that implementation. Use a default V2 plugin object with `id` and `setup(ctx)` as documented by the official [plugin guide](https://opencode.ai/v2/docs/build/plugins). Do not use V1 hook names or API types. Verify the installed target SDK and pin any required package dependency to the tested release; do not silently install a floating global dependency.

## Hook transport

The bridge calls the existing `artifact-plane hook` executable with explicit argv and JSON stdin. It never starts a shell to interpolate payloads. The bridge translates supported V2 events to the existing normalized command-hook schema; the CLI input and output contract stays unchanged.

Send only session identity, actual worktree, verified turn identity, event name and supported tool metadata. Read command and task-path inputs only in memory. Do not forward prompts, unrelated tool arguments, results, transcripts or error text. The existing observer allowlist remains the persistence boundary.

Bound request size to 1 MiB and response size to 64 KiB. Bound subprocess duration to 12 seconds for context and 8 seconds for tool or permission operations. Kill and reap timed-out subprocesses. Missing executables, broken pipes, nonzero exits, invalid JSON and excessive output leave the original request unchanged. Observer unavailability must not discard a valid reserved-action denial returned by the command.

## Context and location

Use `ctx.session.hook("context")` to append a text system part containing the existing SessionStart additional context, including the workbench line. Preserve every existing system part. Do not persist a synthetic user message.

Resolve location from the current session, not the plugin instance directory. The plugin guide explicitly distinguishes these locations. Derive context on each model request with an in-memory cache of at most five seconds, keyed by session and resolved worktree. A move invalidates that cache. Never attribute an event to an old repository after a move.

## Reserved actions

Use `ctx.permission.hook("evaluate")` for an actual deny decision. Inspect the installed SDK and live shell permission resources before defining how a complete command and its effective directory are obtained. Never join arbitrary permission resources into a shell command.

For a verified shell request, invoke the existing reserved-action policy through PreToolUse. Translate only an explicit returned denial into `effect: "deny"` and its reason. Preserve all other allow, ask and deny behavior. A fail-open response never changes ask to allow. Permission checks carry no task path; task inference belongs to tool observation. Do not treat an exception in a tool-before hook as a documented permission mechanism.

The policy remains a guardrail for recognized commands, not a sandbox. Aliases, nested programs and unverified command representations remain outside its coverage.

The target is OpenCode and published SDK 2.1.2. Its shell permission source supplies messageID and call id but no command/cwd metadata. Correlate source with the final mutable tool-before event, keyed by sessionID/messageID/id. Resolve `input.workdir` against session.location.directory, expanding `~`; default to location.directory. Do not append subpath. Other plugins' shell-create rewrites happen after tool-before without a public call identity and remain outside the verified input mapping. Never guess a matching invocation from command text or a global last-command slot.

## Observation and identity

Use `ctx.tool.hook("execute.before")` and `execute.after` to normalize verified shell commands and task-file reads for PreToolUse and PostToolUse. Do not copy tool results or error text. Duplicate tool and permission observations must not create duplicate attempts or duplicate task bindings.

Use a namespaced runtime session identity that includes the OpenCode session ID and canonical worktree, so a session moved across repositories does not reuse an old attempt. A named agent profile such as `build` is not an execution identity. Leave `agent_id` empty unless verified parent/child session metadata yields a stable unique child identity. Keep the existing restriction on inferred binding for an unqualified session in the primary checkout.

Map only verified durable public lifecycle events through `ctx.event.subscribe`. A turn identifier must come from an admitted user message and remain stable through tool continuations. Do not use the session ID or a tool-call ID as a turn. When a turn cannot be resolved, omit it so the observer reports uncertainty rather than guessing activity. A retryable prompt-admission hook is not proof of durable submission.

Abort the subscription on plugin cleanup. Catch stream failures. Isolate session state and suppress stale completions from earlier turns. Event names and payload fields are fixed by the target SDK verification task, not inferred from V1 examples.

In 2.1.2 public payloads use `event.data`. Observe durable user `session.inbox.enqueued` and `session.inbox.delivered` pairs; use the delivered inboxID as the user turn only when identity and ordering are unambiguous. `session.execution.started` begins a settlement window. Its succeeded/interrupted terminal can cover several deliveries; omit terminal attribution after multiple delivered users, missing admission, uncertain sequence continuity, late attachment, moves or stream loss. Do not treat `session.execution.failed` as success or manufacture a new normalized failure event. A verified child uses its unique session ID as agent_id when parentID exists; a named agent profile is never an execution identity.

## Completion limit

V2 documentation has no stop-blocking hook. Do not claim the bridge prevents stopping, map idle to Stop, or call `session.prompt` to force continuation. Use the existing MCP `check_records` tool for record validation. Document this explicit difference from command-hook harnesses.

If verified lifecycle metadata supplies a real completion or interruption, record that observation without marking DoD validated. Missing lifecycle metadata remains an explicit limitation and cannot be replaced by a guess. If this prevents OP4, return to Specification and obtain renewed approval rather than shipping a false success.

For an observed completion, send normalized Stop with `stop_hook_active: true` so the existing command records execution return without running a stop-blocking check. Ignore stop-control output. Mid-turn record validation remains MCP `check_records`.

## Impact and verification

The affected journeys are `agent-session-guidance` and `execution-observation`. Existing MCP tools, command-hook output formats, runtime database schema, browser rendering and other harness registrations stay unchanged. The reusable bridge and repository registration share one implementation.

Test a mock V2 host, actual hook subprocesses and the installed target package. Cover moves, concurrency, child identity, missing turns, late completions, fail-open behavior, privacy, existing asks and valid denial with unavailable storage. Run existing agent, runtime, MCP and bundle checks. Live activation is a separate delivery check and cannot be replaced by fixtures.

## Specification self-check

KISS keeps one policy, one hook command and the existing runtime store. STE states unsupported behavior directly. The runtime-shape claim is supported by published 2.1.2 package inspection and an isolated native runtime probe; final bridge activation remains open. The supported mapping uses keyed tool and permission correlation without guessing scanner syntax, shell rewrites or ambiguous terminal turns. No requirement, approval boundary or task scope changed when the verification task resolved these fields. The contract adds no workflow state or browser behavior.

Ran `validateKnowledge(process.cwd(), {change: "artifact-plane/change-opencode-support"})` from the unchanged validator in the original checkout: `ok: true`, no errors. Requirement coverage warnings remain until Plan. The working directory was `/tmp/opencode/software-engineering-opencode`. Flow support references resolve to this documented contract; new implementation and observed evidence are not claimed yet.
