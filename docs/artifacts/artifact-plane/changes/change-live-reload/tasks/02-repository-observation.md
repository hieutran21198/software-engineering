---
id: repository-observation
depends_on: [lazy-reader]
---

# Observe repository input changes

## Scope and ownership

Own the repository observation service, apps/artifact-plane/server/http.js lifecycle/API integration, and service/API tests. Use incremental safe byte hashing without retained complete Markdown maps. Reuse safe input scanning and fresh mutable Git reads. Add shared two-second polling and SSE invalidations with resource cleanup and local-origin validation. Do not change the runtime observation contract.

Repository: software-engineering. Governing artifact-local elements: requirements/live-reload.md, specifications/live-reload.md, specifications/lazy-loading.md, and decisions/007-repository-updates.md. Preserve established explorer, task DAG, units-of-work, runtime, and retained-delivery contracts. These element paths identify governing knowledge; they are not links to ancestor documentation.

## Prerequisites

Explicit user approval of this plan and recheck of established artifact-driven 2.0.0 contracts. Internal task prerequisites are declared above; each prerequisite must meet its DoD before this task begins.

## Definition of Done

- [x] Verify initial/changed/recovery events, sequence handling, two-second nonoverlapping sampling, 250 ms grouping, and 15-second heartbeat.
- [x] Cover knowledge edits/create/delete/rename, protected refs, commits, source dirty context, registered worktree edits/add/remove/unavailability/recovery, and same-timestamp content changes.
- [x] Verify polling retains no complete source map and derives no deferred graph/history; record idle scan duration, CPU and memory on the large corpus.
- [x] Prove unchanged samples do not trigger history/publication derivation and that changes during a reload receive a trailing invalidation.
- [x] Verify malformed paths/origins, client limit, symlink containment, disconnected client cleanup, final-subscriber timer release, and server shutdown.
- [x] Run affected HTTP/observation tests and record repository byte/Git-state fingerprints unchanged by exploration.

## Evidence

Repository SSE uses one shared observer per canonical opened root, two-second nonoverlapping sampling, 250 ms grouped invalidations, initial/recovery availability events and 15-second heartbeats. Safe content hashing retains digests and bounded transient file buffers rather than complete Markdown maps. It includes registered worktree metadata, current content, main/master refs and shallow state. Hash traversal is deterministic with at most eight filesystem operations in flight. An abort signal stops traversal after the final subscriber leaves; shutdown closes streams before HTTP close waits for clients.

node --test test/repository-events.test.js passed three observer/fingerprint/HTTP cases. Combined HTTP/runtime observation checks passed five cases before the final shutdown adjustment; the final runtime regression pair passed again. Tests cover same-mtime content changes, rename/delete, commits, registered worktree edits/add/remove, availability failure/recovery, burst grouping, unchanged samples, heartbeats, no overlapping sampling, client limit, invalid/missing paths and foreign origin, last-client cleanup and active-stream server shutdown. Read-only fixture fingerprints remain unchanged by sampling. Hashing calls no history/publication derivation and has no source-map cache. git diff --check passed.

node apps/artifact-plane/scripts/observation-benchmark.js sampled 60 seconds on 10,060 records per worktree across ten registered worktrees (100,610 sampled files). Nine completed scans took 4,373–4,448 ms each, with the two-second gap after each scan; 587 Git commands were issued. Node CPU time was 43.5 user plus 39.5 system seconds over 60 wall seconds. Baseline RSS was 102,039,552 bytes and ending RSS 213,606,400 bytes; ending heap used was 59,604,104 bytes. Observers after disconnect: zero.

This deliberately large case exposes a limitation: full-content polling has material idle I/O/CPU cost and its update cycle can exceed five seconds on very large multi-worktree repositories. The contracted five-second browser acceptance budget is evaluated on the browser fixtures, not guaranteed for arbitrary project sizes. The implementation keeps the approved polling architecture and reports this measurement rather than claiming large-project polling is free. Native watching or a different reconciliation interval would require a material plan amendment. KISS reuses the existing local SSE boundary; STE records both outcomes and costs.
