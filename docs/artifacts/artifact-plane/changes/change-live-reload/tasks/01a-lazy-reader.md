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

- [x] Overview loads identities, dependency/reference metadata, unit summaries and worktree availability without historical blob/publication reads, deferred Markdown bodies, or unrelated worktree detail.
- [x] Scoped artifacts/workflow/implementation/markdown/history/completion queries load only requested context and required dependency/evidence sources; compare requested projections against the complete API.
- [x] Validate sections, selector combinations, registered-worktree membership, safe sources, UTF-8 and symlinks, origin/Host, error codes and request limits.
- [x] Not loaded/partial/error data cannot establish a version or complete an outcome; complete targeted conclusions match existing full publication checks, including modified task bytes/path sets and protected-ref movement.
- [x] In-flight deduplication uses normalized scope; changes during derivation yield stale data with trailing reconciliation, and failed requests recover.
- [x] Retain full-response benchmark targets and add initial overview bytes/load counts on both fixed corpora; overview bytes are at most 25% of the corresponding full response.
- [x] Release request-local maps/buffers; verify the process-wide 32 MiB historical-byte cap and 4,096-entry bound across multiple repositories.
- [x] Run affected scoped-reader/API/history/publication fixtures and record commands/results.

## Evidence

Scoped POST /api/repository/query serves overview, artifact, workflow, implementation, Markdown, history and completion sections. Complete POST /api/explore compatibility remains. Overview strips source bodies, defers unit graphs/history/publication, and checks other worktree availability without loading their knowledge. Task signatures are calculated before stripping bodies so runtime matching remains exact. Selected member evidence includes its current baseline and delivered source; full publication checks are retained.

Scoped fixtures compare artifact edges, workflow phase evidence, task edges and complete conclusions against the full response. They cover modified task evidence, changing content revisions, invalid selectors/sources, unsafe task aliases, unavailable/unregistered worktrees, on-demand worktree selection, and established artifact root inspection without an active change. The latter clarifies the existing requirement to support ungrouped artifacts, without expanding domain scope. Legacy HTTP and reader checks passed; the final targeted reader/publication run passed 44 checks. git diff --check passed.

node --expose-gc apps/artifact-plane/scripts/lazy-benchmark.js measured both fixed corpora. The 560-record/two-worktree overview took 308 ms, used ten Git commands and one metadata scan, and returned 149,172 bytes versus 6,677,112 full-response bytes (2.2%). The 10,060-record/ten-worktree overview took 3,637 ms, used ten commands and one metadata scan, and returned 2,441,234 bytes versus 416,696,362 bytes (0.59%). Both exceed the <=25% payload target. Detailed history/publication is not run on overview. Unrelated roots remain Not loaded.

Large-corpus server RSS was 164,790,272 bytes at baseline, 243,548,160 after overview, and 284,585,984 after selected detail. Heap used was 67,708,936 after overview and 87,225,728 after selected detail; releasing response references and explicit benchmark GC reduced heap to 9,849,728 bytes. RSS remained 290,660,352 bytes, demonstrating why the historical cache limit is not a total RSS limit. The historical cache held 1,631,056 bytes and reached its 4,096-entry cap. Memory objects and publication buffers are request-local; active browser retention and idle polling are validated by later tasks. A final scanner change avoids loading the same file twice in one scan; integrated measurements will repeat on the final revision.

KISS uses one scoped endpoint and the existing parsers. STE makes deferred/partial/stale evidence explicit. Fresh final scans/refs/worktree enumeration diagnose changes during loading and prevent a stale completion response from asserting documented completion.
