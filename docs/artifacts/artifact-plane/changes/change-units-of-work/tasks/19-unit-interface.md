---
id: unit-interface
depends_on: [unit-graphs]
---

# Explore units and their three aggregate views

## Scope and location

apps/artifact-plane/src/main.jsx, Workflow.jsx, TaskGraph.jsx, shared React Flow views/styles; browser tests. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- [Requirements](../requirements/units-of-work.md)
- [Specification](../specifications/units-of-work.md)

## Prerequisites

All Plane implementation waits for artifact-driven/change-units-of-work to establish. Recheck specifications/units-of-work.md against the owning artifact current established version before execution. Renew approval for material differences. The existing artifact-plane dependency on artifact-driven remains unchanged.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [ ] Provide unit list/detail navigation, Markdown brief, criteria/evidence, member count, and completion reasons.
- [ ] Render Workflow, Artifacts, and Implementation views with gate/external legends and exact-source inspector navigation.
- [ ] Retain existing views, safe Markdown, keyboard access, inspector resizing, fit/pan/zoom, and desktop/narrow layouts.
- [ ] Refresh retains existing selections and clears vanished sources; worktree/repository changes isolate context.
- [ ] Browser checks exercise invalid inputs and unavailable evidence without invented approval or completion.

## Evidence

Implementation has not started. Record commands/review methods, results, and source references here during approved execution. KISS and STE checks are part of the task self-check.
