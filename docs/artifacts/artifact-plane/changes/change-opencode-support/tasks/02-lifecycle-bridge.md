---
id: lifecycle-bridge
depends_on: [verify-v2-contract]
covers:
  - element: requirements/opencode-support.md
    ids: [OP2, OP3, OP4, OP5, OP8, OPA2, OPA3]
---

# Implement the V2 lifecycle bridge

## Scope and ownership

Implementer. Owns `apps/artifact-plane/integration/opencode/` and new `test/opencode-*.test.js` tests under the Plane app. Governing contract: `specifications/opencode-support.md` and the field mapping verified in the contract task. Do not rewrite other harness adapters or the runtime database schema.

## Definition of Done

- [x] Register native V2 context, permission and tool hooks with the verified target interfaces.
- [x] Call `artifact-plane hook` without a shell and enforce request, response and subprocess limits.
- [x] Append context without replacing existing system parts; key the five-second cache by actual session and worktree.
- [x] Preserve ask/deny decisions and valid reserved-action denials when observation storage is unavailable.
- [x] Normalize task reads and observations without persisting commands, prompts, results or error text.
- [x] Isolate concurrent sessions, child identities, moved worktrees and stale turns; do not manufacture missing turn IDs.
- [x] Deduplicate task attempts across tool and permission checks.
- [x] Abort event subscriptions and clean up subprocesses and in-memory state on unload.
- [x] Tests cover missing binaries, timeouts, malformed/oversized output, location changes, identity isolation, late completions and privacy markers.
- [x] Tests assert that the plugin never prompts, forces continuation, maps idle to Stop or marks a task validated.

## Evidence

### Implementation and checks

`integration/opencode/index.js` exports the native plugin object and a testable factory. `transport.js` invokes the existing hook executable through argv and JSON stdin with no shell. Context, permission and tool callbacks use the verified 2.1.2 interfaces. Durable event handling discards ambiguous terminal attribution. Stop observations set `stop_hook_active: true` and never control continuation or report validation.

The coordinator ran `node --test test/opencode-bridge.test.js test/opencode-transport.test.js test/opencode-config.test.js` on the integrated branch: all 40 tests passed. Coverage includes mock native hooks, real hook subprocesses, inferred child task binding, duplicate permission evaluation, private payload exclusion and a valid policy denial with an unavailable store. Transport cases cover stdin metacharacters, missing binaries, malformed/array/nonzero responses, excessive output, broken pipes, timeouts, stderr diagnostics and unload.

The implementer ran the full Node suite in its isolated worker branch: 551 passed, one existing pinned-model test skipped, no failures. The coordinator's final combined-suite results, including project setup, belong to task 04. `git diff --check` passed.

### Review corrections

Review found that the observer truncates identity labels at 160 characters, source snapshots could borrow newer turns, prompt changes could suppress policy checks, and public event streams can reach several location instances. Corrected these before accepting the task. Session labels now retain a complete worktree hash and hash long IDs; child IDs remain bounded. Canonical Git top-level identity stays stable across nested locations. Exact owner filtering prevents duplicate cross-location observations. Policy checks remain independent of turn certainty, while uncertain observations omit a turn.

New regressions cover long shared-prefix IDs across worktrees, nested locations, missing and stale turn snapshots, shared streams across two owners, moves out and back, source identity spoofing and bounded Git lookup/cleanup. An initial cleanup-race test failed during the correction; the implementer corrected its asynchronous setup/cleanup behavior and reran the full suite successfully. No failed check remains unresolved. The published core source confirms explicit location ownership is necessary because event subscription filtering is conditional.

This evidence combines static/mock-host and real hook-process checks. It does not replace final native activation of the assembled entry; task 04 owns that result. Third-party shell-create rewrites remain outside the supported mapping.
