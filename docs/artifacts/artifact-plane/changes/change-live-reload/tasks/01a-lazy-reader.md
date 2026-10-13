---
id: lazy-reader
depends_on: [reload-performance]
---

# Load repository sections on demand

## Scope and ownership

Own apps/artifact-plane/server/reader.js scoped discovery, workflow/unit projections, query API routing in http.js, and scoped reader/API tests. Add the overview and section reads from specifications/lazy-loading.md. Preserve complete POST /api/explore compatibility and avoid full-reader derivation behind lightweight requests. Keep request-local source maps and responses short-lived.

Repository: software-engineering. Governing artifact-local elements: requirements/live-reload.md R8–R10, specifications/lazy-loading.md, specifications/live-reload.md, and decisions/007-repository-updates.md. Preserve existing graph, runtime, and publication rules.

## Prerequisites

Explicit user approval of the extended plan, the reload-performance DoD, and a recheck of established artifact-driven 2.0.0 contracts. No upstream proposed contract is required.

## Definition of Done

- [ ] Overview loads identities, dependency/reference metadata, unit summaries and worktree availability without historical blob/publication reads, deferred Markdown bodies, or unrelated worktree detail.
- [ ] Scoped artifacts/workflow/implementation/markdown/history/completion queries load only requested context and required dependency/evidence sources; compare requested projections against the complete API.
- [ ] Validate sections, selector combinations, registered-worktree membership, safe sources, UTF-8 and symlinks, origin/Host, error codes and request limits.
- [ ] Not loaded/partial/error data cannot establish a version or complete an outcome; complete targeted conclusions match existing full publication checks, including modified task bytes/path sets and protected-ref movement.
- [ ] In-flight deduplication uses normalized scope; changes during derivation yield stale data with trailing reconciliation, and failed requests recover.
- [ ] Retain full-response benchmark targets and add initial overview bytes/load counts on both fixed corpora; overview bytes are at most 25% of the corresponding full response.
- [ ] Release request-local maps/buffers; verify the process-wide 32 MiB historical-byte cap and 4,096-entry bound across multiple repositories.
- [ ] Run affected scoped-reader/API/history/publication fixtures and record commands/results.

## Evidence

Not executed. Record validation and resource measurements during approved implementation.
