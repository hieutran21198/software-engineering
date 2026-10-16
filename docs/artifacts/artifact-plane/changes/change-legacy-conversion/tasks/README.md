---
tasks:
  - 01-history-conversion.md
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-legacy-conversion/tasks/README.md#plan-self-check
---

# Legacy record conversion script plan

1. [Convert retained legacy records with migrate-layout](01-history-conversion.md)

## Approval and sequence

The user approved full conversion on 16 October 2026. Requirement, Specification and Plan were recorded together with the implementation instead of in separate phase commits; this is a recorded deviation. The ADD contract amendment is proposed in the same PR; the script is optional tooling and changes no reader behavior.

The user confirmed the suggested Plane 1.15.0 on 16 October 2026. The version establishes only after the PR lands on main.

## Plan self-check

One task covers the scripts contract amendment and its tests. No artifact edge or reader contract changes. KISS extends the existing script; STE keeps refusals and retained exceptions explicit.
