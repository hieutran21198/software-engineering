# Repository update and reload contract

## Scope and unchanged contracts

Apply requirements R1–R10 from requirements/live-reload.md. Existing explorer, task, unit, runtime, and retained-delivery contracts remain authoritative. Artifact Plane consumes established artifact-driven 2.0.0; no new dependency edge or proposed upstream contract is required. All changes live in this repository.

## Reload cost and reuse

The preparation sample measured 185 ms scanning and 7,331 ms workflow processing with 2,493 workflow Git commands. evidenceFor caches historical content only within one worktree computation; publication reads protected-ref paths and bytes repeatedly. First optimize these demonstrated costs.

Use a reload-scoped promise cache for duplicate read-only Git commands, shared across workflow/history and unit publication checks. Keep root, exact arguments, and output mode in the key. Resolve moving revisions to immutable object IDs before reusing historical content across reloads. Bound historical byte reuse in memory to 32 MiB with eviction. Do not retain failed commands across requests. Never cache mutable status, ref resolution, worktree membership, or publication conclusions across reloads. Publication checks must compare current safely scanned bytes/path sets against freshly resolved protected refs. Existing dirty/history/shallow/missing-ref diagnostics remain intact.

Batch historical blob reads or use bounded parallel reads (at most eight Git child processes) where profiling shows benefit. Preserve exact bytes, missing-path semantics, and ordering in the produced evidence. Do not substitute empty history or omit worktrees from complete responses to meet targets. Scoped lazy responses explicitly defer unrelated work under lazy-loading.md. Whole derived snapshots need not be cached; start with reusable immutable reads and request deduplication.

Coalesce concurrent full explore requests for the same canonical root into one in-flight computation; scoped requests use the selector key defined in lazy-loading.md. If inputs change while it runs, mark a trailing reload; do not discard the change. Manual Refresh always performs fresh mutable reads. Failure clears in-flight entries so a later request can recover.

## Change detection

Use one shared in-memory observer per opened canonical repository while subscribed. Poll every two seconds after the previous poll completes; polling never overlaps itself. Reuse safe traversal with incremental hashing, without retaining complete source maps, to fingerprint supported Markdown/YAML contents and path sets, root declarations, unit evidence sources, diagnostics, HEAD/branch, protected main/master object IDs, shallow state, repository status, and registered worktree membership. Include corresponding inputs for each registered readable ADD worktree. Unreadable or removed worktrees are fingerprinted as unavailable so recovery triggers an update. Never recursively inspect generic source contents or Git object directories. Source edits are observed through Git status for dirty context; source bytes are not workflow evidence.

Fingerprint content bytes, not only timestamps. Ref or worktree changes require fresh evidence even when knowledge bytes match. An unchanged fingerprint emits no invalidation and performs no history/publication derivation. Group detected changes for 250 ms before notification; a burst produces one invalidation with a later invalidation if another change arrives during reload. Keep the reader's containment rules, including symlink rejection. No repository writes or persistent observation state.

Detection is eventual: a save and revert entirely between polls may not be observed. Views represent current sampled evidence, not an audit of every filesystem event. Native filesystem watching is a future alternative if bounded polling itself proves costly.

## Event API

Add GET /api/repository/events?path=<encoded absolute root>. Validate Host/origin/fetch-site with existing HTTP checks and validate the root using the same readable-worktree rules before subscribing. Use 400/404/422 for invalid/missing/unreadable roots and 429 above 16 concurrent clients. Return text/event-stream with no-store and the existing security headers. This observation endpoint exposes no generic file route and performs no mutation.

Emit JSON event data {sequence, available}; sequence is a nonnegative monotonically increasing integer scoped to one in-memory observer. Send an initial event after the initial input sample, and emit whenever the sampled fingerprint or availability changes. available means sampling succeeded, not that a browser snapshot is current. Events invalidate snapshots; they do not carry knowledge or authorize work. Send an SSE comment heartbeat every 15 seconds. Missed sequence values are acceptable because clients reload the current snapshot; no replay log is required. Do not compare sequence numbers across new connections or server restarts.

Share the poll across subscribers for the same root. Closing the final subscriber releases polling and root-specific transient resources. Server shutdown closes streams and timers. Observation errors emit available:false without replacing the last successful UI snapshot; later successful sampling emits a recovery event. Existing runtime observation uses its separate endpoint and contract.

## Browser behavior

Order unit tabs Artifacts, Workflow, Implementation and use Artifacts for a new repository or newly selected unit. Refresh preserves the current tab. Recorded executions remain Implementation only.

Subscribe after successful open. Every initial event, changed sequence, reconnect, online transition, and browser focus requests a fresh overview and active section under lazy-loading.md. Coalesce requests with one in-flight fetch and a single trailing-request flag. Manual Refresh shares the same queue and remains usable after failures. Abort/ignore old requests and streams on repository switch or unmount; a generation token prevents late response overwrite.

Show Updating while a read runs, Current only after the latest requested read succeeds with observation connected, and Stale with a concise reason on disconnected/failed sampling or reload. Keep old graphs and details usable while updating. A transport reconnection alone does not mark an old snapshot current. Automatic retries remain bounded by the normal poll/reconnect cadence.

Reconcile stable node IDs after updates. Retain valid selections, filters, expansion, inspector width, dependency mode, tab, pan, and zoom. Clear only invalid selections. Do not remount React Flow or automatically fit an existing canvas on data refresh. Newly opened canvases can use initial fit-view; explicit Fit remains available.

## Validation and performance targets

Before changing the reload implementation, create a fixed temporary Git corpus with two registered ADD worktrees, at least 250 knowledge files, historical change/version evidence, protected-ref publication checks, and at least 100 knowledge-touching commits. Preserve corpus contents/history across compared revisions. Record five runs per condition with median wall time, actual Git subprocess count, file count, and equal normalized snapshots. Measure cold process reload, repeated unchanged manual reload, and warm reload after one task edit. Exclude fixture creation from timings.

Targets on the same machine/corpus: repeated unchanged and one-task-edit median reload time decreases at least 70%; corresponding Git subprocess count decreases at least 80%; cold reload median time decreases at least 30%. Absolute times are reported rather than guaranteed across machines. Browser fixtures must reflect a stable saved task edit within five seconds, and fallback recovery within five seconds of a successful sample/reconnection, after fixture reload work completes within the budget. If targets cannot be met with the contracted approach, return to Specification/Plan before material architecture changes.

Check edits, creation/deletion/rename, protected-ref movement, commits, worktree registration/removal, concurrent saves, reconnect, server restart, old responses, inaccessible roots, and resource cleanup. Verify no unnecessary history reload for unchanged samples. Complete Node tests, browser tests, production build, documentation link/hierarchy checks, and repository read-only fingerprints.

## Specification self-check

R1–R10 map to navigation, sampled invalidation, reuse, recovery, and measurement contracts. Event delivery is eventual with explicit missed-event recovery. Immutable cache keys and fresh publication comparisons preserve evidence. KISS chooses bounded polling plus existing SSE without a watcher dependency, persistent registry, or delta protocol. STE keeps sampling distinct from live activity and established versions. No Specification blocker remains.

## Lazy loading extension

[lazy-loading.md](lazy-loading.md) defines scoped overview/detail queries, active-section invalidation, and memory checks. It refines automatic browser reloads without removing the compatible complete explore endpoint.
