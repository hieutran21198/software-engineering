---
id: repository-observation
depends_on: [reload-performance]
---

# Observe repository input changes

## Scope and ownership

Own the repository observation service, apps/artifact-plane/server/http.js lifecycle/API integration, and service/API tests. Reuse safe input scanning and fresh mutable Git reads. Add shared two-second polling and SSE invalidations with resource cleanup and local-origin validation. Do not change the runtime observation contract.

Repository: software-engineering. Governing artifact-local elements: requirements/live-reload.md, specifications/live-reload.md, and decisions/007-repository-updates.md. Preserve established explorer, task DAG, units-of-work, runtime, and retained-delivery contracts. These element paths identify governing knowledge; they are not links to ancestor documentation.

## Prerequisites

Explicit user approval of this plan and recheck of established artifact-driven 2.0.0 contracts. Internal task prerequisites are declared above; each prerequisite must meet its DoD before this task begins.

## Definition of Done

- [ ] Verify initial/changed/recovery events, sequence handling, two-second nonoverlapping sampling, 250 ms grouping, and 15-second heartbeat.
- [ ] Cover knowledge edits/create/delete/rename, protected refs, commits, source dirty context, registered worktree edits/add/remove/unavailability/recovery, and same-timestamp content changes.
- [ ] Prove unchanged samples do not trigger history/publication derivation and that changes during a reload receive a trailing invalidation.
- [ ] Verify malformed paths/origins, client limit, symlink containment, disconnected client cleanup, final-subscriber timer release, and server shutdown.
- [ ] Run affected HTTP/observation tests and record repository byte/Git-state fingerprints unchanged by exploration.

## Evidence

Not executed. Record commands, observed results, and material limitations during approved implementation.
