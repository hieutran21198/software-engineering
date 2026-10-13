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

- [x] Verify visible tab order Artifacts, Workflow, Implementation; new unit selection starts with Artifacts; refresh keeps the active tab and recorded executions remain Implementation only.
- [x] Opening does not fetch deferred evidence; section states show Not loaded/Loading/Loaded/Stale/Error. Completion details request full required evidence and report partial failures honestly.
- [x] Lazy-load other worktrees, ungrouped changes and selected Markdown/history; recorded graph inspection preserves its recorded context.
- [x] Twenty navigation cycles retain only active view plus selected Markdown/history; cancelled/late detail responses cannot repopulate released contexts.
- [x] Save task and dependency changes in temporary repositories and observe updated views within five seconds without manual Refresh.
- [x] Verify one active reload plus one trailing request, manual recovery, stale/updating/current labels, reconnect/focus reconciliation, and unavailable observer behavior.
- [x] Delay an old repository response and prove it cannot overwrite the newly opened repository.
- [x] Verify pan/zoom, valid selection, expansion, filter, inspector width, dependency mode, and active view survive refresh; deleted nodes clear selection without automatic fit.
- [x] Run affected browser cases including runtime observation and recorded execution regression checks; record results.

## Evidence

The browser opens a lightweight overview, loads the selected unit/view and Markdown/history/completion evidence on demand, and observes repository invalidations. Root reloads use one active operation and one trailing request. Section/document requests are aborted or ignored on context changes. The browser retains one active section and one selected document; overview metadata remains separate. Full requested completion checks stay explicit and revalidate after invalidation. Tab order/default are Artifacts, Workflow, Implementation; recorded executions remain Implementation only.

Chromium task validation passed eleven cases across lazy-reload, units-of-work, runtime, and workflow-histories, followed by the artifact-proposal update case. Saved task and dependency edits update without Refresh within five seconds on the acceptance fixtures. Pan/zoom and valid task selection survive automatic updates, offline recovery and manual refresh. A delayed response for a previous repository cannot overwrite a newly opened root. Other-worktree detail, full Markdown, completion and history load when requested; history sorting waits for those reads. Existing runtime/recorded graph checks pass with server-computed task signatures and safe Markdown.

Twenty unit/view navigation cycles render only the active task graph. Reported Chromium heap was 6,540,702 bytes before navigation and 10,237,953 afterwards; this is a measured heap sample, not a peak or GC-normalized leak proof. The code releases inactive section/document references rather than keeping a visited-context cache. The large browser fixture (10,060 initial records plus one history file, ten worktrees) loaded overview and selected implementation in 4,375 ms; browser heap samples were 11,898,901 and 13,886,252 bytes. Both metrics were available and written to /tmp/artifact-plane-browser-memory.jsonl; the tests also attach them to their results.

Large-browser testing exposed repeated scanning in scoped reads. The reader now loads a small identity/membership/provenance index for detail requests, then only requested member/current/delivered evidence, and rechecks that scope. Requested Markdown is limited to declared knowledge directories or declared evidence sources with realpath/task containment. Eight targeted Node checks passed for scoped/full equivalence, invalid sources, YAML proposal/reference preservation, reload bursts/cancellation and runtime signatures. The production build passed. git diff --check passed. KISS retains existing renderers/graphs and a single active detail context; STE exposes Not loaded/Loading/Loaded/Stale/Error without treating unloaded evidence as completion.
