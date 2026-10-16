# Lazy repository exploration

## Scope

Apply requirements R8–R10 with the live-reload.md contract. Preserve the existing complete POST /api/explore response for compatibility and correctness comparisons. The browser moves to scoped overview/detail requests; historical full-response consumers and tests continue to work. No upstream ADD contract changes.

## Overview and deferred sections

Opening a repository reads selected-worktree artifact root declarations, dependency proposals/index and reference metadata needed for the overview graph, unit brief summaries/membership, and registered worktree identities/availability. Return metadata and diagnostics, not all Markdown, task bodies, detailed history, or publication conclusions. Read required reference metadata transiently and discard full source bodies after parsing. Availability checks on other registered worktrees do not scan their detail. An overview never runs historical git show or publication-byte comparisons.

Artifact and unit summaries identify deferred sections explicitly. Unit completion and version establishment remain Not loaded until a complete targeted evidence check succeeds. Declared current versions remain declared knowledge, not independently established conclusions.

Load sections as follows:

- Artifacts view: selected unit's dependency projection and transitive prerequisite metadata; reference metadata when expanding an artifact/type.
- Workflow view: selected unit members' phase evidence; fetch detailed commit history only when the user opens history. Minimal history needed for phase inference is still read when deriving those phases.
- Implementation view: selected unit's authoritative listed task metadata, dependencies, checklist counts, and complete evidence for required establishment gates. Full task/element Markdown loads when selected.
- Ungrouped changes: requested change summary/task graph/phase evidence under the same rules.
- Other worktrees: selected-worktree overview when chosen; no detailed enumeration of every registered root at open.
- Completion details: automatically request complete member version/publication and shared evidence checks for the selected active unit only, independent of which views were previously opened. Show local checking/error/retry under ux-simplification.md; other units remain deferred.
- Recorded executions: keep recorded graph context under the existing immutable execution contract. Fetch current knowledge only for explicit current-source inspection.

A requested graph must include its required external dependencies/gates or explicit missing/error diagnostics. Lazy loading is not permission to truncate a graph and present it as complete. Publication checks load complete required knowledge and exact retained task sets/bytes, even if that requires more reads than normal overview loading.

## Scoped API

Add POST /api/repository/query with application/json. Request: {path, section, worktree?, unit?, artifact?, change?, source?, dependencyMode?}. path is a validated absolute selected repository root. section is one of overview, artifacts, workflow, implementation, markdown, history, completion. For non-overview requests, worktree defaults to path and must match a currently registered root returned by fresh Git enumeration. The unit/artifact/change selectors must resolve to safely discovered records in that worktree. Unit IDs and artifact/change IDs follow existing safe naming rules. dependencyMode is established or planning for artifacts, default established.

For overview, selectors other than worktree are invalid. For artifacts, workflow, implementation, and completion, supply unit; artifacts/workflow/implementation also allow artifact plus change for ungrouped exploration instead of unit. Artifact metadata and Markdown inspection allow artifact without change so established artifacts without an active change remain inspectable. completion requires unit. history requires artifact and change. markdown requires source, a safe repository-relative path belonging to the selected discovered knowledge/evidence scope, plus unit or artifact/change context (artifact alone is sufficient for its root/current knowledge). Reject ambiguous selector combinations, unknown keys, and invalid section/selector types with 400. Missing discovered records return 404, unavailable worktrees/invalid roots 422, and sanitized unexpected failures 500. Existing body size, Host/origin/fetch-site, symlink, task-directory, and UTF-8 checks remain. This endpoint is not arbitrary filesystem access.

Response: {repository, worktree, section, context, revision, completeness, data, diagnostics}. context echoes normalized selectors. revision is a hash of freshly sampled content/ref/worktree inputs for the requested scope; it is freshness evidence, not workflow state. completeness is complete for a fully derived requested section, partial only when required component data is unavailable and explained by diagnostics. data uses existing graph/evidence shapes for that section, with summary records stripping Markdown and detailed history. Error responses never return a fabricated complete section. Every declared but deferred section includes loadState:not-loaded; the browser owns loading/loaded/stale/error transitions. Exact section projections must be checked against the complete legacy response, including resolved sources and diagnostics.

Coalesce identical in-flight section requests using root, worktree and normalized selectors. Never coalesce different view scopes as one response. Read current mutable inputs for each request. If scoped inputs change during derivation, return a stale diagnostic and enqueue a trailing read; never label that response Current. Older generation/revision responses cannot overwrite a newer active context.

## Observation and retention

Keep repository SSE as an invalidation signal. Input polling still covers supported knowledge and registered worktrees so unopened sections become current when requested. Fingerprint contents incrementally using safe traversal and byte hashing; do not retain complete Markdown maps or derive graphs/history for idle polls. Avoid overlapping scans and record scan duration/idle CPU for the large corpus. Overview metadata may be rebuilt after invalidation, but detailed inactive sections remain deferred.

Browser invalidation refreshes the overview and currently visible/requested detail only. Mark retained visible detail Stale until replaced. On reconnect/focus, revalidate active scopes. Manual Refresh follows the same scopes; it does not eagerly fetch every worktree/view. A switch clears inactive detail and cancels/ignores its requests. Use one active view result plus at most one selected Markdown/history detail; do not keep a growing cache of visited units. Overview metadata and required graph dependencies can remain while the repository is open. Runtime/recorded data follow their existing ownership.

Server detail responses are request-local, not a persistent derived-snapshot cache. Release source maps, publication buffers, and in-flight entries after requests finish. Historical byte cache has a process-wide 32 MiB accounted-byte limit across repositories, with bounded entry count (4,096), eviction, and no retained failed reads. JavaScript object/key overhead is measured separately: 32 MiB is not a total server RSS cap. New browser sessions reuse immutable bytes only while the server stays running; restart clears them.

## Validation and memory

Retain full-response reload benchmarks and their 70%/80% warm and 30% cold targets. Measure overview, first section, repeated active-section refresh, and time to usable selected view separately; do not compare a partial overview against a complete response and call it equivalent work.

Use the existing fixed corpus and a second generated corpus with at least 5,000 Markdown files, ten registered worktrees, and 100 knowledge-touching commits. Record corpus identity, response bytes, loaded file/worktree counts, wall time, Git commands, server RSS/heap/external memory at baseline/open/detail/after-navigation, browser heap where supported, and response/retained object counts. Report browser heap unavailable explicitly rather than inventing values. Include peak request memory and a 60-second idle polling sample. Memory readings are measurements on the test machine, not a fixed per-project guarantee.

Acceptance: opening either corpus runs no detailed history/publication reads, returns no deferred Markdown bodies, and loads no unrelated worktree detail. First overview response bytes are at most 25% of the full response on the same corpus. Twenty unit/view navigation cycles retain only active detail plus selected Markdown/history, with no growing detail-entry count and no growth in accounted historical bytes above the limit. Record actual total memory and any remaining corpus-dependent costs. Full conclusions match the complete reader for requested scopes; incomplete/error sources never establish versions or completion. Existing automatic update and context preservation checks apply to loaded sections.

## Specification self-check

R8–R10 map to scoped reads, explicit deferred states, evidence-complete conclusions, resource release, and measured memory. Existing full API compatibility is preserved. Invalidation reads bytes without retaining all source bodies; expensive history stays demand-driven. KISS uses one scoped query endpoint and bounded active context rather than a disk cache or persistent registry. STE distinguishes declared knowledge, unloaded evidence, and established conclusions. No Specification blocker remains.
