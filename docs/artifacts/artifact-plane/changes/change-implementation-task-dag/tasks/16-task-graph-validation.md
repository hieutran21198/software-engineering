---
id: task-graph-validation
depends_on: [task-graph-interface]
---

# Integrated acceptance and publication

## Scope and governing references

Repository: software-engineering. Own integrated regression checks, browser fixtures/screenshots, and coordinator-managed task evidence and release preparation.

P1–P5; specifications/task-dag.md; all applicable retained read-only/explorer requirements.

## Prerequisites

Task task-graph-interface must pass; upstream ADD contract remains established. Explicit user approval of this plan is required.

## Definition of Done

- [ ] Run npm test, npm run build, and npm run test:browser in apps/artifact-plane. No required test is skipped or failing.
- [ ] Browser checks cover fork/join, task Markdown/evidence, legacy/invalid/empty states, distinct worktree/change identities, return context, refresh, and current dependency/workflow/history behaviors.
- [ ] Inspect desktop/narrow screenshots and verify fingerprints of repository files and Git metadata before/after exploration. Resolve acceptance failures and record actual evidence.
- [ ] Validate proposed artifact/task DAGs, full snapshot coverage, documentation hierarchy, and upstream contract compatibility. After user version confirmation, prepare the consistent proposed release and companion PR; stop for team merge.

## Evidence

Implementation has not started. Record actual commands, results, and source/test references after execution.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
