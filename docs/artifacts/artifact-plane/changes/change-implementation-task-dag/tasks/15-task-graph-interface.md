---
id: task-graph-interface
depends_on: [task-graph-reader]
---

# Display task graphs and details

## Scope and governing references

Repository: software-engineering. Own apps/artifact-plane/src task graph canvas, Workflow/main integration, styles, graph layout tests, and focused browser cases. Reuse React Flow/dagre and sanitized Markdown rendering.

P1–P5; specifications/task-dag.md; existing explorer and workflow contracts.

## Prerequisites

Task task-graph-reader must pass; established ADD gate remains required. Explicit user approval of this plan is required.

## Definition of Done

- [ ] Change selection offers View task graph; Back preserves selected change and history expansion. Graph layout shows correct direction, disconnected/single nodes, and prerequisite legend.
- [ ] Task inspector shows ID, source, prerequisites, scope, DoD, evidence, and counts using safe Markdown rendering without claims of approval or independently verified completion.
- [ ] Invalid/unavailable/empty plans show clear states and safely readable task records without execution edges.
- [ ] Desktop and narrow layouts support fit/pan/zoom, inspector resize, refresh invalidation, and explicit worktree opening. Focused layout/browser checks pass.

## Evidence

Implementation has not started. Record actual commands, results, and source/test references after execution.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
