---
id: incremental-refresh
depends_on: [model-explanations]
evidence_records:
  - id: dod
    method: Observer tests and the 60-second benchmark recorded in Evidence; the byte target is not met.
    result: incomplete
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/05-incremental-refresh.md#evidence
---

# Reduce idle full reads with bounded recovery

## Scope and ownership

Own server/repository-events.js, observation integration, reload hooks where required, benchmark script and observer/refresh tests.

## Governing knowledge

P5, P7; specifications/incremental-observation.md; decisions/012-incremental-observation.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [x] Initial/full reconciliation and incremental invalidation agree on final fingerprints; repeated same-size preserved-timestamp edits, nested creation, rename/delete and registered source edits are detected.
- [x] Fake-clock/event tests prove dropped-event recovery within interval plus scan duration, bounded queues/handles, no overlapping scans, fallback visibility and final-subscriber cleanup.
- [x] Real filesystem tests cover ref/status/worktree changes, watcher failure/exhaustion, stale recovery and read-only behavior.
- [ ] Run the same 60-second large fixture before/after: at least 80 percent fewer knowledge bytes read, with CPU/duration/counts and limits reported. A failed target returns to Specification/Plan rather than weakening correctness silently.

## Evidence

Implemented on 16 October 2026 in a separate worktree by an implementer session (branch plane-incremental-refresh from d09963e) and integrated by cherry-pick as "feat(artifact-plane): reduce idle full reads with bounded recovery". Files: server/repository-events.js, server/http.js, scripts/observation-benchmark.js, test/repository-events.test.js.

- Design:
  - repositoryFingerprint and the incremental sampler share one per-node hash, so the full scan stays the oracle; it now also returns its bytes read.
  - The observer keeps an in-memory node map per worktree, with at most 4096 directory watches. A notification rereads the entry regardless of size or mtime. A rename, a missing filename or a replaced directory rescans that directory, and parent hashes are recomputed without file reads.
  - Git metadata (HEAD, branch, shallow state, main/master, worktree list) is polled every 2 seconds and rescans the affected worktree on change.
  - Full reconciliation runs 30 seconds after the previous one completes, or 10 seconds in degraded mode. Degraded mode means watch cap reached, watch creation failed or a watch error. The mode is reported as observation watching or degraded in SSE and stats.
  - Queues collapse at 64 names per directory and 256 directories. Notifications debounce for 250 ms. One scan runs at a time and concurrent callers share it. A new subscriber requests immediate reconciliation. The last subscriber closes every watch and timer.
- Tests, 6 new; they passed in 3 consecutive runs:
  - Real watches: same-size edits with preserved timestamps, nested creation, edit in a new directory, rename and delete all reach the full-scan fingerprint, rereading only the edited bytes.
  - Fake clock with dropped events: the missed edit appears at 30,000 ms and not at 29,999, and at 10,000 ms and not at 9,999 in degraded mode.
  - Degraded mode is visible for watch exhaustion, creation failure and watch error.
  - A burst of 5,000 events leaves one pending timer. Concurrent callers share one scan.
  - Close leaves 0 watches and 0 timers. The shared service wakes on notification and releases with the final subscriber.
  - Real Git: a new protected ref, added and removed worktrees, an edit in an added worktree and a new HEAD match the full scan. Moving docs/artifacts away is reported and recovered. Observation writes nothing.
- Integrated `npm test`: 301 tests, 299 pass, 1 skipped. The one failure is the pre-existing flaky test/flow-index.test.js "separate processes atomically publish complete SQLite records" (database is locked at startup). It failed 3 of 10 isolated runs; server/flow-index.js and its test are unchanged from origin/main.
- Benchmark: `node scripts/observation-benchmark.js --seconds 60`, same machine and fixture, 10 worktrees and 100,610 knowledge files per scan; before means a full reread every poll.

  | Metric | Before | After |
  | --- | --- | --- |
  | Knowledge bytes read in 60 s | 320,307,360 | 80,076,840 (75.0 percent fewer) |
  | Bytes after the shared startup scan | 280,268,940 | 40,038,420 (85.7 percent fewer) |
  | Process CPU | 81,849 ms | 25,478 ms |
  | Samples | 8 | 18 (2 full, 16 incremental) |
  | Median and longest sample | 4,872 and 7,212 ms | 796 and 6,824 ms |
  | Git commands | 526 | 1,123 |
  | Watches after the run; observers after disconnect | 0; 0 | 920 in watching mode; 0 |

- Target not met: the DoD requires at least 80 percent fewer knowledge bytes in the 60-second window. The specification also requires an initial full scan and a full reconciliation every 30 seconds. So any compliant run has 2 full scans in 60 seconds, against 8 before, and that caps the reduction at about 75 percent. After the startup scan the reduction is 85.7 percent. Correctness was not weakened. Per the plan, the target goes back to Specification and Plan for a user decision: measure after the startup scan, use a longer window, or change the reconciliation interval. The DoD item stays unchecked. Git commands increased because metadata is now polled every 2 seconds; CPU covers this process only; a missed content change that only alters git status is found at the next full reconciliation.
