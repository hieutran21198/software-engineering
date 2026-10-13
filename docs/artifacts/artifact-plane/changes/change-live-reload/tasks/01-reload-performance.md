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

- [ ] Record five-run baseline and after-change medians for cold, warm unchanged, and warm task-edit reloads, with corpus identity, file/worktree counts, and actual Git subprocess counts.
- [ ] Meet the contracted 70% warm time, 80% warm command, and 30% cold time reduction targets on the same corpus; explain measured costs.
- [ ] Compare normalized snapshots and existing history/publication fixtures for equality; modified task bytes/path sets and protected-ref movement invalidate establishment support.
- [ ] Verify duplicate concurrent reads share promises, rejected reads recover, memory stays within the 32 MiB history budget, and Git concurrency never exceeds eight processes.
- [ ] Run affected reader, workflow, histories, and units-of-work tests; record commands and observed results.

## Evidence

Not executed. Record commands, observed results, and material limitations during approved implementation.
