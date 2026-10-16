---
tasks:
  - 01-convert-history.md
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-legacy-conversion/tasks/README.md#plan-self-check
---

# Legacy record conversion plan

1. [Convert this repository's retained legacy records](01-convert-history.md)

## Approval and sequence

The user approved full conversion on 16 October 2026. The work was first requested inside PR #29; that PR merged before the conversion was committed, so this change delivers it in a new PR. Requirement, Specification and Plan were recorded together with the implementation instead of in separate phase commits; this is a recorded deviation. The Plane task history-conversion supplies the script used for the conversion; the same steps work by hand.

The user confirmed the suggested ADD 2.5.0 on 16 October 2026. The version establishes only after the PR lands on main.

## Plan self-check

One task covers N7, K5 and migration step 5; its DoD checks recoverability, unchanged historical results and links. No artifact edge changes. KISS reuses the migration script and the existing readers; STE keeps the deletion rule and its exceptions explicit.
