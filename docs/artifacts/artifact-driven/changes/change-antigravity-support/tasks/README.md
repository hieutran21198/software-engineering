---
tasks:
  - 01-bundle-and-repo-guidance.md
  - 02-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-antigravity-support/tasks/README.md#plan-self-check
---

# Antigravity support plan (ADD)

Two tasks deliver the [Antigravity harness contract](../../../specifications/antigravity-support.md):

1. [Bundle and repository guidance](01-bundle-and-repo-guidance.md): update `06-guidelines/working-with-ai.md`, `05-adoption/README.md`, `06-guidelines/adopting-from-git.md` and repository `AGENTS.md`.
2. [Validation](02-validation.md): verify bundle parity, relative links, Go tests, website build and validator checks.

## Sequence and compatibility

Task 02 depends on Task 01 because the validation checks inspect the updated bundle pages and repository instructions.

Compatibility: minor. The change adds Antigravity harness guidance and preserves existing ADD phases, record schemas and `se-adopt` behavior.

## Plan self-check

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-driven/change-antigravity-support` reports `ok: true` with no `requirement-uncovered` warnings. Every requirement and acceptance ID in `requirements/antigravity-support.md` is covered. The task graph is acyclic (`bundle-and-repo-guidance` -> `validation`). KISS: two focused tasks, no new tooling. STE: imperative DoD checks with one verification per item. No blocker prevents implementation after plan approval.
