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

- [ ] Record the exact target V2 and plugin package versions and relevant public type definitions.
- [ ] Verify tool-before/after fields and shell permission resources against a complete command and its effective working directory.
- [ ] Verify session location resolution, moves, durable user-message IDs, parent/child identity and real completion/interruption events.
- [ ] Define a field-level mapping for supported events; omit ambiguous turns and preserve primary-checkout task inference restrictions.
- [ ] Confirm package loading and dependency resolution for the thin repository entry and reusable bridge.
- [ ] Keep privacy-safe fixture metadata and SDK observations separate from live model-execution evidence.
- [ ] Return any missing required interface to Specification; do not invent API fields or weaken OP3/OP4 without renewed approval.

## Evidence

Discovery found official V2 hook documentation but no `opencode` command in this shell. This is not target-runtime validation.
