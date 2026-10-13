---
id: delivery-reader
depends_on: []
---

# Resolve change-owned historical delivery

## Scope and ownership

Repository: this repository. Locations: apps/artifact-plane/server/units-of-work.js, workflow.js, unit-graphs.js, reader.js if needed, matching Node fixtures/tests.

Read the established ADD delivery contract. Resolve new marker/provenance into separate knowledge and delivery paths; build exact retained task graphs and protected-ref evidence checks. Preserve legacy resolution, unit completion, worktree isolation, phase history, and safe access.

## Governing contracts and prerequisites

Requirements R1–R5 in requirements/task-retention.md; specifications/task-retention.md. Requires established ADD specifications/task-retention.md from change-task-retention and a recorded contract recheck before any implementation. Explicit plan approval is also required. Internal prerequisites: none. Required predecessor DoD must pass before starting.

## Definition of Done

- [ ] Targeted units-of-work, workflow/history, task-graph and unit-graph checks pass for the new layout and legacy fixtures.
- [ ] Missing/invalid marker, missing source, modified/deleted/added task records, conflicting/unavailable protected refs and branch-only evidence cannot support completion.
- [ ] Delivered history classification and version-preparation evidence remain correct when version snapshots lack task copies.
- [ ] Next-change plans do not replace historical graphs; task IDs and runtime source bindings remain correct; read-only fingerprints pass.

## Evidence

Not executed. Record check commands, observed results, and relevant implementation references here after approved implementation.
