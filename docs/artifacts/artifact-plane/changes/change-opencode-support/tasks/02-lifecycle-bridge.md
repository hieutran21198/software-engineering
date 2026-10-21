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

- [ ] Register native V2 context, permission and tool hooks with the verified target interfaces.
- [ ] Call `artifact-plane hook` without a shell and enforce request, response and subprocess limits.
- [ ] Append context without replacing existing system parts; key the five-second cache by actual session and worktree.
- [ ] Preserve ask/deny decisions and valid reserved-action denials when observation storage is unavailable.
- [ ] Normalize task reads and observations without persisting commands, prompts, results or error text.
- [ ] Isolate concurrent sessions, child identities, moved worktrees and stale turns; do not manufacture missing turn IDs.
- [ ] Deduplicate task attempts across tool and permission checks.
- [ ] Abort event subscriptions and clean up subprocesses and in-memory state on unload.
- [ ] Tests cover missing binaries, timeouts, malformed/oversized output, location changes, identity isolation, late completions and privacy markers.
- [ ] Tests assert that the plugin never prompts, forces continuation, maps idle to Stop or marks a task validated.

## Evidence

No implementation checks have run.
