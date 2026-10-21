---
id: verify-v2-contract
depends_on: []
covers:
  - element: requirements/opencode-support.md
    ids: [OP3, OP4, OP6, OPA2, OPA4]
---

# Verify the target OpenCode V2 contracts

## Scope and ownership

Implementer researches the target V2 SDK and runtime in a disposable environment. The coordinator owns amendments to `specifications/opencode-support.md` and its claims. No bridge mapping is implemented until the required interfaces are verified.

## Definition of Done

- [x] Record the exact target V2 and plugin package versions and relevant public type definitions.
- [x] Verify tool-before/after fields and shell permission resources against a complete command and its effective working directory.
- [x] Verify session location resolution, moves, durable user-message IDs, parent/child identity and real completion/interruption events.
- [x] Define a field-level mapping for supported events; omit ambiguous turns and preserve primary-checkout task inference restrictions.
- [x] Confirm package loading and dependency resolution for the thin repository entry and reusable bridge.
- [x] Keep privacy-safe fixture metadata and SDK observations separate from live model-execution evidence.
- [x] Return any missing required interface to Specification; do not invent API fields or weaken OP3/OP4 without renewed approval.

## Evidence

### Published SDK verification

Installed `@opencode/plugin@2.1.2` with `--ignore-scripts --no-audit --no-fund --save-exact` in the disposable directory `/tmp/opencode/sdk-verification-HHIPy4`. Its plugin, client, schema and protocol packages all report 2.1.2. Node.js is v24.21.0. Inspected the published declarations and schema definitions, and executed a Node import confirming that `Plugin.define` preserves the supplied plugin object. No repository dependency or global user configuration changed.

The Promise plugin tool declaration provides `sessionID`, `messageID`, call `id`, profile `agent` and unknown `input` before execution. The after hook distinguishes completed and error results. Permission evaluation provides action, scanner-produced resources, optional arbitrary metadata and a tool source containing the message and call IDs. Neither its public source nor shell-create hook provides a complete typed, session-attributed command and directory pair. The shell-create hook has command and cwd but no session identity. Do not concatenate scanner resources or use global last-command state.

The published session schema provides optional `parentID`, session `location.directory` and optional `subpath`; the plugin instance directory is not a substitute. Public event payloads live in `event.data`, with durable ordering metadata on the envelope. `session.inbox.enqueued` identifies admitted user items; `session.inbox.delivered` identifies actual delivery. Execution succeeded/interrupted/failed events contain a session identity but no user-message or run ID. Missing or ambiguous correlation must remain unknown rather than manufacture a turn.

The plugin package's host resolves a server or root/index export and loads a default `{id, setup}` object. A type-only SDK reference avoids resolving a sibling runtime dependency beneath `.opencode`; actual repository-entry activation still needs a target-runtime check. Exact input, permission ordering, effective-directory and lifecycle correlation behavior must be checked against the target runtime before completing this task.

### Authoritative runtime source

Inspected the published `@opencode/core@2.1.2` tarball under `/tmp/opencode/sdk-verification-HHIPy4/core/package/dist/chunks`. Its source comments identify the original runtime modules. `src/tool.ts` awaits tool-before hooks before invoking the built-in tool with the final mutable event input. `src/tool/plugin/shell.ts` accepts command and optional workdir, constructs permission source `{type: "tool", messageID, id}`, resolves cwd and asserts shell permission. No command/cwd permission metadata is emitted. `src/shell.ts` uses workdir or location.directory; `src/file-access.ts` resolves relative paths against that location and expands `~`. Do not append session.subpath.

Correlate a shell permission evaluation with the retained tool-before event by sessionID, source.messageID and source.id. Read its final command/workdir at permission evaluation, not an earlier snapshot. This preserves later tool-before mutations. Delete correlation state on tool-after and bound abandoned entries. Unmatched permission calls retain their original effect. Scanner resources are never concatenated.

The source also confirms that a shell-create hook can rewrite the invocation after tool-before and lacks call identity. Such third-party command/cwd rewrites are an unverified representation outside this guardrail's supported built-in input mapping. This does not provide sandbox protection. No safe global last-command association exists; do not add one.

Session creation and moves store the actual location directory and derive subpath from it. Execution settlement emits succeeded, failed or interrupted events after the run coordinator settles. Several delivered inputs can share one execution; only a single unambiguous, continuously observed user delivery may identify a terminal turn. Late attachment, moves, delivery ambiguity or stream loss invalidates that correlation. Failed execution has no equivalent failure event in the current normalized hook protocol; do not mislabel it as success.

### Native runtime probe

Installed only `@opencode/cli-linux-x64@2.1.2` into `/tmp/opencode/opencode2-native`; its binary reports `opencode v2.1.2`. A first all-platform CLI installation timed out during extraction; attempts to execute those incomplete artifacts failed and are not a runtime defect finding. The complete platform-only artifact executed successfully.

Created a disposable clone with its own local protected branch, private HOME/XDG state and an instrumentation-only native `.opencode/plugins/runtime-probe/index.ts`. Ran the actual CLI with `run --standalone --format json --model fixture/probe` against a local deterministic OpenAI-compatible fixture. No real provider, credentials, shared service, auto-approval or relaxed permission was used. The fixture requested only `pwd` in the disposable worktree. The runtime loaded the default `{id, setup}` plugin, appended a context marker, executed the shell tool and exited 0.

The allowlisted probe observed tool-before, shell permission and tool-after with the same session/message/call IDs. Permission resources were `["pwd"]`, source carried the expected IDs, and metadata was empty. The shell output matched session.location.directory. Durable enqueued, execution-started, delivered and succeeded events used `event.data` and increasing session sequence values. The admitted inboxID was the delivered user-message identity; the execution terminal had no turn ID.

Probe metadata is at `/tmp/opencode/opencode2-probe-events.jsonl`; the disposable runner is `/tmp/opencode/run-opencode2-probe.mjs`. This is a live target-runtime check with deterministic provider fixtures, not live model inference or activation of the unfinished Plane bridge. Final bridge activation remains task 04's check. The verified mapping adds no API, no new requirement and no broader permission behavior.
