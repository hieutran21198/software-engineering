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

- [x] Provide unit list/detail navigation, Markdown brief, criteria/evidence, member count, and completion reasons.
- [x] Render Workflow, Artifacts, and Implementation views with gate/external legends and exact-source inspector navigation.
- [x] Retain existing views, safe Markdown, keyboard access, inspector resizing, fit/pan/zoom, and desktop/narrow layouts.
- [x] Refresh retains existing selections and clears vanished sources; worktree/repository changes isolate context.
- [x] Browser checks exercise invalid inputs and unavailable evidence without invented approval or completion.

## Evidence

Implemented unit list/detail navigation and grouped Workflow, Artifacts, and Implementation canvases using existing React Flow, dagre, shared safe Markdown, inspector resizing, and explicit refresh. Worktree selection isolates source knowledge. Nodes display exact paths and evidence; vanished sources clear their selection.

The three new unit browser cases passed, then the full npm run test:browser suite passed all 13 Chromium cases. npm test passed all 91 Node cases; npm run build passed. Desktop and narrow screenshots were inspected: no page overflow, shared navigation and stacked inspector remain usable, and zoom/fit controls handle aggregate graph scale. Fixture repository bytes and Git fingerprints were unchanged after view switching and refresh. Hostile Markdown was sanitized. The default downloaded Chromium lacked system libraries; tests passed with installed system Chromium via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. The in-app browser control tool was unavailable, so the approved repository acceptance suite was used.

KISS reuses existing reader/graph/UI libraries and keeps selection in memory. STE labels task arrows, establishment gates, external prerequisites, and recorded completion evidence explicitly. Self-check passed.
