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

- [x] Pending phase/task reads show loading without successful zero or unknown evidence claims; true loaded-empty, unknown, stale and failure remain distinct.
- [x] Only the selected active unit automatically loads complete completion evidence; it deduplicates, invalidates on refresh and exposes checking/error/Retry without scanning all units.
- [x] All user-visible section/completion/review/source requests abort on context loss and reach explicit timeout/Retry after the specified 30-second browser deadline; obsolete finally/error callbacks cannot change new state.
- [x] Delayed and failed reads, reconnect/focus, repeated invalidation, selection change and retry settle correctly; the real review-loading investigation records its cause or remaining uncertainty.
- [x] Complete publication/shared criteria semantics match existing reader results; fingerprints remain unchanged.

## Evidence

Production build passed. Node request check verifies timeout, parent cancellation and structured server errors with preserved status. Chromium selected-unit check passed: no completion reads at overview, automatic read only for tenant-login, immediate checking state, local injected failure, retry to complete documented evidence and unchanged fixture fingerprint. Existing real-HTTP review copy failure/retry/export fixture also passed on the clean current server, with packet/source reads settling. The audit used an older already-running server; the original indefinite Loading condition is not reproduced and its cause remains unproven. Shared postJSON enforces a 30-second visible-read deadline; context/epoch guards and AbortControllers prevent obsolete completion/section/source results from installing. Full delayed/reconnect regressions remain the integration task.
