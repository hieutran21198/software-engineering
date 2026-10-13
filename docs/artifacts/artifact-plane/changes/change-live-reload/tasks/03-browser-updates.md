---
id: browser-updates
depends_on: [repository-observation]
---

# Update browser views and reorder tabs

## Scope and ownership

Own apps/artifact-plane/src/main.jsx, UnitsOfWork.jsx, refresh/observation UI helpers and styles, and affected browser tests. Reorder unit tabs and default new unit selections to Artifacts. Load overview first, fetch selected view/Markdown/history/completion on demand, and consume repository SSE through a coalescing overview/active-section refresh queue while preserving user context. Keep recorded executions and runtime observations intact.

Repository: software-engineering. Governing artifact-local elements: requirements/live-reload.md, specifications/live-reload.md, specifications/lazy-loading.md, and decisions/007-repository-updates.md. Preserve established explorer, task DAG, units-of-work, runtime, and retained-delivery contracts. These element paths identify governing knowledge; they are not links to ancestor documentation.

## Prerequisites

Explicit user approval of this plan and recheck of established artifact-driven 2.0.0 contracts. Internal task prerequisites are declared above; each prerequisite must meet its DoD before this task begins.

## Definition of Done

- [ ] Verify visible tab order Artifacts, Workflow, Implementation; new unit selection starts with Artifacts; refresh keeps the active tab and recorded executions remain Implementation only.
- [ ] Opening does not fetch deferred evidence; section states show Not loaded/Loading/Loaded/Stale/Error. Completion details request full required evidence and report partial failures honestly.
- [ ] Lazy-load other worktrees, ungrouped changes and selected Markdown/history; recorded graph inspection preserves its recorded context.
- [ ] Twenty navigation cycles retain only active view plus selected Markdown/history; cancelled/late detail responses cannot repopulate released contexts.
- [ ] Save task and dependency changes in temporary repositories and observe updated views within five seconds without manual Refresh.
- [ ] Verify one active reload plus one trailing request, manual recovery, stale/updating/current labels, reconnect/focus reconciliation, and unavailable observer behavior.
- [ ] Delay an old repository response and prove it cannot overwrite the newly opened repository.
- [ ] Verify pan/zoom, valid selection, expansion, filter, inspector width, dependency mode, and active view survive refresh; deleted nodes clear selection without automatic fit.
- [ ] Run affected browser cases including runtime observation and recorded execution regression checks; record results.

## Evidence

Not executed. Record commands, observed results, and material limitations during approved implementation.
