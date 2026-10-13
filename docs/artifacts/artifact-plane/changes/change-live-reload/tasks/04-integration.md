---
id: integration
depends_on: [browser-updates]
---

# Validate integrated outcome and prepare delivery

## Scope and ownership

Own integrated tests, user documentation for automatic updates/performance, and artifact-local delivery evidence under coordinator control. Run combined validation, record shared evidence in the unit brief, and prepare the proposed version/review handoff after user version confirmation.

Repository: software-engineering. Governing artifact-local elements: requirements/live-reload.md, specifications/live-reload.md and specifications/lazy-loading.md, and decisions/007-repository-updates.md. Preserve established explorer, task DAG, units-of-work, runtime, and retained-delivery contracts. These element paths identify governing knowledge; they are not links to ancestor documentation.

## Prerequisites

Explicit user approval of this plan and recheck of established artifact-driven 2.0.0 contracts. Internal task prerequisites are declared above; each prerequisite must meet its DoD before this task begins.

## Definition of Done

- [x] Run the complete Artifact Plane Node suite, Chromium browser suite, and production build with actual results recorded.
- [x] Measure both fixed corpora (including 5,000 files/ten worktrees): server RSS/heap/external and browser heap where supported, peak request memory, payload/loaded counts, navigation retention, and 60-second idle polling costs; report unavailable metrics explicitly.
- [x] Repeat the fixed-corpus benchmark against the integrated revision and record target compliance and output equivalence.
- [x] Exercise end-to-end save bursts, reconnection/server restart, worktree changes, protected-ref movement, manual recovery, and canvas preservation.
- [x] Verify read-only repository fingerprints, documentation link targets/hierarchy, valid task/unit metadata, and unchanged runtime/evidence contracts.
- [x] Record shared acceptance evidence in the unit brief with references to originating tasks; do not assert establishment before required merge.
- [ ] After version confirmation, prepare complete task-free knowledge with source_change/delivery_tasks provenance, consistent root/DAG updates, and a review PR; stop before merge.

## Evidence

The integrated npm test suite passed 132 Node checks; npm run test:browser passed all 22 Chromium cases using the system Chromium executable. npm run build passed. Initial integrated browser testing exposed a missing unavailable-worktree diagnostic; it was fixed and the full suite passed on the corrected revision. Existing read-only fingerprints, task/runtime/source semantics, unsafe path handling, and current/legacy evidence checks remain covered.

The final five-run equal-work benchmark used one fixed temporary corpus with 560 initial records plus one history file, two worktrees and 100 knowledge-touching commits. Each before/after full snapshot comparison passed. Cold median reload: 10,963 ms to 1,408 ms (87.2% faster). Warm unchanged: 11,306 ms to 1,353 ms (88.0% faster). Warm task edit: 11,241 ms to 1,361 ms (87.9% faster). Git subprocess count: 3,319 to 283 for each condition (91.5% fewer). All specified time/command targets passed. The final historical cache held 308,970 bytes in 930 entries. Measurements exclude fixture creation and compare the same corpus on the same machine.

Browser fixtures verify task/dependency edits within five seconds, offline/reconnect/manual recovery, context/viewport preservation, stale-response isolation, deferred worktree/history/Markdown loading, exact retained task evidence and complete requested publication checks. Twenty context switches retain only active detail. The large Chromium case measured overview plus selected implementation at 4,375 ms with heap samples of 11,898,901 and 13,886,252 bytes. Browser heap telemetry was available. These are measured samples rather than fixed cross-machine or peak-memory guarantees.

The 60-second large-corpus idle observation sample and its limitation remain recorded in 02-repository-observation.md. Complete content sampling is intentionally retained; this can cost significant idle CPU/I/O and exceed the small-fixture update budget at large scale. The current architecture does not claim zero-cost polling.

Preparation/integration parsers accepted the five-task/four-edge DAG and all unit briefs without diagnostics. Fourteen actual relative Markdown links resolved with no ancestor README links; code examples are excluded from documentation-link checks. git diff --check passed. Canonical ADD bundle files and established legacy snapshots remain unchanged. Final server memory/payload measurements and version/PR handoff follow below after confirmation.

KISS keeps one active detail context, bounded immutable reuse and existing transport/renderers. STE keeps unloaded, stale, documented and established evidence distinct. Implementation approval came from the user's explicit approval of the extended plan; version preparation still requires the requested version confirmation.

## Final memory and payload measurements

node --expose-gc scripts/lazy-benchmark.js ran on the integrated reader. Small corpus: 561 scanned files in one overview scan, 234 ms, ten Git commands, 149,172 response bytes versus 6,677,112 full-response bytes (2.2%). Large corpus: 10,061 scanned files in one overview scan, 2,298 ms, ten commands, 2,441,234 response bytes versus 416,696,362 bytes (0.59%). Overview scans load no unrelated worktree detail. Both payload targets passed.

Large server RSS: 160,690,176 bytes before open, 190,275,584 after overview, and 190,963,712 after selected detail. Heap used: 29,939,216 bytes after overview and 37,471,720 after selected detail; releasing detail and benchmark GC reduced heap to 9,904,640 bytes. RSS after release was 197,718,016 bytes. The historical cache retained 1,631,056 bytes and its 4,096-entry cap. These samples expose remaining process memory and distinguish cache accounting from total RSS.

The final integrated Chromium run recorded 20 navigation cycles with heap samples of 6,534,782 and 12,000,801 bytes and only one active task graph. Its large-case overview/selected time was 4,828 ms, with heap samples of 12,037,593 and 13,948,108 bytes. Telemetry was available; it is not GC-normalized or a universal memory cap. The earlier 4,375 ms sample is retained above as a prior passing measurement. Sampled peak request memory and 60-second idle costs were captured by the benchmark scripts; no zero-cost large-project polling claim is made.

## Sampled request peaks

node --expose-gc scripts/request-memory-benchmark.js sampled request memory every 20 ms without repeating full-response timing comparisons. Small corpus: 19 samples, peak sampled RSS 103,305,216 bytes and heap 16,287,816 bytes; released heap 10,322,624 bytes. Large corpus: 144 samples, peak sampled RSS 143,470,592 bytes and heap 34,364,544 bytes; released heap 11,067,400 bytes. This separate run excludes the full legacy-response serialization, which can allocate much more memory. Sampling can miss brief allocations between timer callbacks; the values are observed peaks, not a guaranteed upper bound.
