---
tasks:
  - 01-diagram-index.md
  - 02-icons.md
  - 03-fixture.md
  - 04-system-entry.md
  - 05-diagram-list.md
  - 06-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-diagram-scopes/tasks/README.md#plan-self-check
---

# Diagram scopes Plane plan

Implement the [diagram scopes contract](../../../specifications/diagram-scopes.md) and the amended [diagram rendering contract](../../../specifications/diagram-rendering.md). The compatibility level is minor: the home and artifact pages gain sections, the document page gains a parameter, the renderer gains icons, and the overview response gains two optional fields. No existing behavior changes.

## Claims and boundaries

The specification's claim `lazy-icon-chunk` is open. Task `icons` checks it first; a refuted claim returns to Specification before other icon work. The claim `server-side-index` is supported by the design facts.

The ADD member must establish on the protected branch before any task of this plan starts. Then recheck this specification's reference to the ADD contract against the protected branch. Membership does not bypass the gate.

## Execution and publication

The task declarations define the graph. Wave 1 runs `diagram-index`, `icons` and `fixture` in parallel implementer worktrees. Wave 2 runs `system-entry` and `diagram-list` in parallel; both edit src/pages/ArtifactPage.jsx in different regions, and the coordinator merges them. `validation` joins all tasks. The coordinator owns knowledge files, flow supports, claims, the owner screenshot review, the version record, package.json and the Nix npm dependency hash. Publish this member on its own branch after the ADD member merges. Never merge automatically.

## Plan self-check

KISS: six tasks for one server module, one build plugin, two sections and one page parameter. STE: each DoD item is one observable check. Every DP and ADP ID is in the `covers` of a task. Six unique task IDs form an acyclic graph with one validation join. The changed user interface has an owner screenshot review in task `validation`, against the mockups that the plan approval covers.

The coordinator ran `scripts/validate-knowledge.mjs --repository <worktree> --change <artifact>/change-diagram-scopes` from the unchanged validator of the main checkout (b67824e) on both members. Both report `ok: true`. The only warnings are `open-change-conflict` for two stale local branches: `add/opencode-integration`, whose OpenCode change merged as Plane 1.27.0 (#58), and `claude/plane-human-guidance`, which delivered Plane 1.22.0 (#44). These checks validate planning records, not implementation.
