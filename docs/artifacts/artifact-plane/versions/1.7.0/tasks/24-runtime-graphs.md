---
id: runtime-graphs
depends_on: ["runtime-store","runtime-api"]
---

# Show artifact ownership and observed concurrent execution

## Scope and location

Own shared runtime UI helpers, TaskGraph.jsx, UnitsOfWork.jsx, task/unit canvas mapping, relevant main.jsx selection wiring, and style.css. Show recorded executions independently of current worktree availability. Keep existing DAG semantics.

## Governing contracts

Artifact Plane elements requirements/codex-execution.md, specifications/codex-execution.md, and decisions/006-codex-observer.md in change-codex-execution. Existing knowledge contracts remain applicable. Consume established artifact-driven 1.2.0 task and unit contracts; no proposed upstream contract is required.

## Prerequisites

Explicit user approval of this plan; upstream contracts rechecked; internal dependencies above satisfy their applicable DoD.

## Definition of Done

- [x] Canvas tests verify exact identity overlays, readable artifact/change labels, wrapped titles, preserved prerequisite/establishment edges, and separate checklist/report evidence.
- [x] Browser fixtures show concurrent Processing nodes on fork branches, agent/elapsed/freshness labels, all state labels/colors, multiple attempts, and inspector activity.
- [x] Browser tests verify live SSE refresh, reconnect/Unknown behavior, archived history after source removal, preserved viewport/selection, keyboard access, and narrow layouts.

## Evidence

Canvas/model checks passed: browser/server signatures agree, overlays isolate task revisions and identities, retries remain separate, mixed results stay honest, and prerequisites/gates remain unchanged. Full Chromium suite passed 15 cases; after the final offline fix, both focused runtime cases passed again. Tests cover concurrent branches, all specified state labels, artifact/change ownership, inspector attempts, reported validation, SSE updates, offline/online reconnection, stale observations, archived graphs after worktree removal and reload, selection/viewport preservation, narrow layout, and repository fingerprints. Wide/narrow/archived screenshots were inspected; a node-spacing defect was corrected and rechecked. KISS reuses existing graph components; STE distinguishes runtime and checklist evidence.
