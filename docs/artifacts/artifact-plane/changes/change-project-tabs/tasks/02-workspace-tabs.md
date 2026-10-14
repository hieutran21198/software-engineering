---
id: workspace-tabs
depends_on: [project-sessions]
---

# Workspace tabs and restoration

## Scope and location

Own the workspace shell, tab styling, browser preference module, and related tests in apps/artifact-plane/src and test. Wire plus/select/close, canonical duplicate handling, accessible tab controls, and restoration. Preserve the project-scoped ownership from task 1.

## Governing references

Artifact Plane requirements/project-tabs.md and specifications/project-tabs.md in this change. Existing live-reload and lazy-loading specifications remain applicable. Shared acceptance is owned by the project-tabs unit brief.

## Prerequisites

Explicit approval of this plan and the listed internal prerequisites with their DoD satisfied. No new upstream establishment gate.

## Definition of Done

- [x] Plus opens an empty tab; canonical duplicate opens select the existing project.
- [x] Closing active/inactive/last tabs follows the contract without disrupting other projects.
- [x] Keyboard and pointer controls expose correct selected state and readable path labels.
- [x] Paths, order, and active project restore on a fresh page/browser context with the same persisted profile.
- [x] Inactive restored projects load only on selection; unavailable paths remain recoverable.
- [x] Invalid JSON/schema, unsupported versions, duplicates, blocked storage, and quota errors recover as specified.
- [x] Storage contains preferences only; repository data and workflow evidence are excluded.

## Evidence

Workspace.jsx owns tab order, stable session IDs, active selection, plus/close actions, keyboard navigation, and canonical duplicate selection. project-tabs.js validates and writes versioned browser preferences without graph data. Node preference tests passed for round trips, invalid JSON/schema, unsupported versions, duplicates, blocked/quota storage, and close selection.

Browser cases passed for independent navigation, tab controls, duplicate opens, refresh restoration, fresh browser-context restoration, unavailable restored paths, delayed reads, keyboard navigation, and blocked storage. Review confirmed inactive restored projects issue no reads until selected. KISS and STE self-checks passed.
