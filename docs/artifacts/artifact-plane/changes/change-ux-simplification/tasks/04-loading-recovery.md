---
id: loading-recovery
depends_on: [contained-links]
---

# Separate loading from evidence and recover failed reads

## Scope and ownership

Own request presentation and cancellation in main.jsx, Delivery.jsx, UnitsOfWork.jsx, Flows.jsx, ChangeReview.jsx and a small shared request helper only where it removes actual duplication. Automatically request selected-unit completion, deduplicate by exact context/epoch, and add local busy/error/Retry states. Reproduce the audit Loading case with a clean server before selecting a fix. Keep evidence derivation and API payloads unchanged.

## Governing knowledge

UX4, UX8 loading diagnosis, UX11; specifications/ux-simplification.md Honest loading, completion and recovery; existing lazy-loading/live-reload contracts.

## Prerequisites

Applicable DoD for contained-links must pass first. Explicit approval of this concrete plan and recheck of established ADD 2.1.0 are required. Preserve the inherited presentation baseline; no task authorizes editing established snapshots.

## Definition of Done

- [ ] Pending phase/task reads show loading without successful zero or unknown evidence claims; true loaded-empty, unknown, stale and failure remain distinct.
- [ ] Only the selected active unit automatically loads complete completion evidence; it deduplicates, invalidates on refresh and exposes checking/error/Retry without scanning all units.
- [ ] All user-visible section/completion/review/source requests abort on context loss and reach explicit timeout/Retry after the specified 30-second browser deadline; obsolete finally/error callbacks cannot change new state.
- [ ] Delayed and failed reads, reconnect/focus, repeated invalidation, selection change and retry settle correctly; the real review-loading investigation records its cause or remaining uncertainty.
- [ ] Complete publication/shared criteria semantics match existing reader results; fingerprints remain unchanged.

## Evidence

No implementation checks have run for this task. Record actual commands, observed results, source references and limitations here after approved execution.
