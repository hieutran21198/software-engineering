---
id: reload-performance
depends_on: []
---

# Measure and reduce reload cost

## Scope and ownership

Own apps/artifact-plane/server/reader.js, workflow.js, units-of-work.js, reload reuse helpers, and benchmark/reader tests. Record the fixed-corpus baseline before changing code. Implement duplicate-command coalescing, immutable historical byte reuse with a bounded cache, and batched or bounded Git reads. Keep publication conclusions fresh. Do not weaken evidence or skip worktrees.

Repository: software-engineering. Governing artifact-local elements: requirements/live-reload.md, specifications/live-reload.md, specifications/lazy-loading.md, and decisions/007-repository-updates.md. Preserve established explorer, task DAG, units-of-work, runtime, and retained-delivery contracts. These element paths identify governing knowledge; they are not links to ancestor documentation.

## Prerequisites

Explicit user approval of this plan and recheck of established artifact-driven 2.0.0 contracts. Internal task prerequisites are declared above; each prerequisite must meet its DoD before this task begins.

## Definition of Done

- [x] Record five-run baseline and after-change medians for cold, warm unchanged, and warm task-edit reloads, with corpus identity, file/worktree counts, and actual Git subprocess counts.
- [x] Meet the contracted 70% warm time, 80% warm command, and 30% cold time reduction targets on the same corpus; explain measured costs.
- [x] Compare normalized snapshots and existing history/publication fixtures for equality; modified task bytes/path sets and protected-ref movement invalidate establishment support.
- [x] Verify duplicate concurrent reads share promises, rejected reads recover, memory stays within the 32 MiB history budget, and Git concurrency never exceeds eight processes.
- [x] Run affected reader, workflow, histories, and units-of-work tests; record commands and observed results.

## Evidence

The user explicitly approved the extended five-task plan. Before implementation, Git verified artifact-driven 2.0.0 and its task-retention contract on local main; no upstream contract change is required.

npm test passed 123 Node tests after the reader/history optimization. Targeted checks passed 47 history/publication tests and three cache/concurrency tests. A final targeted run after common-Git-directory cache identity and canonical-root coalescing passed ten tests. Fixtures verify modified/missing/conflicting publication evidence, failed-read recovery, byte equality, exact cache eviction at 32 MiB/4,096 entries, and a global maximum of eight Git child processes with reserved capacity for mutable reads. Existing read-only fingerprints pass.

node apps/artifact-plane/scripts/reload-benchmark.js built one fixed corpus with 560 knowledge records, two worktrees, and 100 knowledge-touching history commits. It ran five comparisons per condition, checking full snapshot equality for every result. Median cold reload fell from 11,237 ms to 1,611 ms; warm unchanged from 12,895 ms to 1,582 ms; warm task-edit from 13,017 ms to 1,593 ms. Git commands fell from 3,319 to 281 in each condition (91.5% fewer). Cold time improved 85.7%, warm 87.7%, and task-edit 87.8%, exceeding the contracted targets. Immutable history retained 617,940 bytes and 1,860 entries in that run. The initial unoptimized diagnostic baseline was captured before reader changes; the repeat comparison deliberately also includes request-local version-comparison memoization in its legacy path, making its time comparison conservative.

Historical reads use a request-owned git cat-file batch process, request-scoped promise reuse and a process-wide immutable-byte LRU. Fresh status/refs/path sets and current bytes continue to govern publication. Cache identity sharing and canonical-root coalescing were checked after the measured run; integrated validation will repeat measurements on the final revision. git diff --check passed. KISS keeps caching below the reader boundary; STE labels measured evidence and unchanged establishment limits.
