---
tasks:
  - 01-guide.md
  - 02-example.md
  - 03-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-diagram-scopes/tasks/README.md#plan-self-check
---

# Diagram scopes ADD plan

Implement the [diagram scopes contract](../../../specifications/diagram-scopes.md) in the bundle. The compatibility level is minor: the guide gains scopes, a selection matrix, one optional front matter key, an icon set and an example page, and every existing rule keeps its meaning.

## Claims and boundaries

The specification's claims `github-renders-notations` and `website-shows-unknown-icon` are supported by static evidence only. Task `validation` checks both on rendered pages. A refuted claim changes the reader support table and returns to Specification; it does not change the scopes, the matrix or the ownership rule.

## Execution and publication

The task declarations define the graph: the guide, then the example page, then validation. One implementer can do the three tasks in sequence on the change branch, because the example links to the anchors of the guide. The coordinator owns the knowledge files of this artifact, the unit brief, the claims and the version record.

Publish this member first, on its own branch with the unit brief, as the OpenCode unit did. The Plane member's knowledge and code stay on the Plane branch until this member establishes. Never merge automatically.

## Plan self-check

KISS: three tasks, no tool, no validator rule. STE: each DoD item is one observable check. Every DS and ADS ID is in the `covers` of a task. Three unique task IDs form an acyclic chain. The flow change-delivery already names the new support. No user interface changes, so no screenshot review applies to this member; the rendered example pages are evidence for ADS5. The coordinator ran `scripts/validate-knowledge.mjs --repository <worktree> --change artifact-driven/change-diagram-scopes` from the unchanged validator of the main checkout (b67824e): `ok: true` with no warning. `git diff --check` passed. These checks validate planning records, not implementation.
