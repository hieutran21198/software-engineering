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

- [ ] Plus opens an empty tab; canonical duplicate opens select the existing project.
- [ ] Closing active/inactive/last tabs follows the contract without disrupting other projects.
- [ ] Keyboard and pointer controls expose correct selected state and readable path labels.
- [ ] Paths, order, and active project restore on a fresh page/browser context with the same persisted profile.
- [ ] Inactive restored projects load only on selection; unavailable paths remain recoverable.
- [ ] Invalid JSON/schema, unsupported versions, duplicates, blocked storage, and quota errors recover as specified.
- [ ] Storage contains preferences only; repository data and workflow evidence are excluded.

## Evidence

Implementation has not started. No validation success is asserted.
