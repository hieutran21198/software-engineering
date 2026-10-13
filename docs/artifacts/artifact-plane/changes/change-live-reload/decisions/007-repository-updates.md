# Repository updates and bounded reload reuse

## Context

The existing explore endpoint recomputes all registered worktree evidence on every Refresh. A diagnostic sample spent 7.3 seconds deriving workflow evidence and issued 2,493 Git commands. Users request automatic updates and faster reloading.

## Alternatives

1. Repeated full browser refresh is simple but repeats costly history processing when inputs do not change.
2. Native filesystem watchers with server-sent invalidation can respond quickly, but require correct handling of atomic saves, missing filenames, symlinks, worktree Git metadata, and fallback reconciliation. Node documents platform/filesystem reliability caveats: https://nodejs.org/api/fs.html#caveats .
3. Bounded server polling of safe input fingerprints plus SSE reuses the reader and existing event transport. It detects current sampled inputs uniformly, including ref and worktree changes, without a new watcher dependency.

## Decision

Choose option 3 with a two-second polling interval and 250 ms grouping. Avoid history derivation when sampled inputs match. Optimize reloads with request-scoped deduplication, bounded immutable historical byte reuse, and batched/bounded Git reads. Recompute mutable publication decisions from current bytes and freshly resolved protected refs.

## Consequences

Automatic updates have a sampling delay. Save/revert pairs entirely between samples can be missed. Polling costs safe input reads while subscribed, but avoids repeated expensive history processing and ends when no subscribers remain. Tests must cover staleness, recovery, resource release, and exact evidence equality. A native watcher is reconsidered only if measured polling cost warrants it; the current plan does not require both mechanisms.
