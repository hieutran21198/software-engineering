# Use notifications with periodic full reconciliation

## Decision

Use bounded directory watchers and an in-memory content map for incremental reads. Preserve periodic full-byte scans and a slower polling fallback.

## Alternatives

Full scans every two seconds preserve correctness but reread retained history while idle. Metadata-only caching misses repeated same-size/timestamp edits. Notifications alone can be dropped or unsupported. Notifications plus a periodic correctness scan reduce idle reads while preserving bounded eventual detection.

## Consequences

Resource cleanup, watcher limits, fallback visibility and delayed recovery require tests. A 30-second reconciliation interval plus scan duration bounds missed-event detection; degraded polling uses 10 seconds plus scan duration. Measured byte reduction is an acceptance criterion, not an assumed result.
