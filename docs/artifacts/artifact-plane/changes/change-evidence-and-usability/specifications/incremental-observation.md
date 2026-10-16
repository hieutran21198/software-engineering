# Incremental observation with bounded reconciliation

Governs P5 and P7. Replace routine full-byte rescans with a process-memory per-worktree map of safe knowledge paths and content hashes. Keep repositoryFingerprint available as the full reconciliation oracle. No cache or observation registry is written into inspected repositories.

## Sampling and events

Perform an initial full scan. Watch discovered knowledge directories using Node filesystem notifications, with an explicit maximum of 4096 watch handles per shared repository observer. Notifications are hints: debounce 250 ms, invalidate affected contained paths, and reread their bytes regardless of unchanged size/mtime. Rename or ambiguous notifications rescan the affected directory; ref/status/worktree metadata is polled every two seconds. Metadata changes invalidate relevant snapshots and add/remove watch registrations. Registered flow/review supporting sources remain included in invalidation through the existing query/observation integration. Never traverse unsafe symlinks.

Run a complete byte reconciliation at least every 30 seconds after the previous full scan completes, even when no events arrive. If watch creation fails, the cap is reached or an event cannot be resolved safely, use full-scan fallback every 10 seconds after scan completion and expose degraded observation. Wake/focus/manual refresh triggers immediate reconciliation. There is at most one scan per observer; coalesce invalidations received during scanning and drain them afterward. Bound queues by coalescing to directory/root invalidation rather than retaining unbounded event lists.

Missed events are detected by the next full scan; the bound is the applicable 30-second or 10-second interval plus scan duration. Do not promise two-second detection in degraded mode. Current means the latest requested reconciliation succeeded with connected observation, not continuous filesystem truth. Updating/Stale behavior and last usable content remain as before. Failures recover on the next scheduled reconciliation.

## Lifecycle and evidence

Share watchers across subscribers. Closing the final subscriber closes every watch, timer, queued scan and map; shutdown does the same. Inactive tabs retain existing pause behavior. Immutable Git-byte caching remains separate. Expose scan duration, knowledge bytes read, full/incremental scan counts and watch mode to the benchmark interface without adding high-cardinality persistent telemetry.

Compare the existing large-corpus 60-second idle benchmark before and after on the same hardware and fixture. Acceptance requires at least 80 percent fewer knowledge bytes read, no missed final state, and no overlapping scans. Report CPU, duration, watch counts and degradation honestly. Exercise same-size repeated dirty edits with preserved timestamps, new nested directories, rename/delete, dropped notifications, metadata changes, unreadable inputs, watch exhaustion and subscriber cleanup. Use deterministic clocks/event adapters for timing checks; keep real filesystem integration coverage.

Self-check: passed. Events accelerate safe invalidation; periodic full reads bound recovery. KISS retains the current correctness oracle and subscription lifecycle.
