# Derive workflow visibility from local evidence

## Decision

Use registered local worktrees, bounded Git history, working-tree differences, and existing Markdown evidence. Compute the view on demand in memory. Show uncertainty and associated commits when exact completion is unavailable. Do not execute workflow steps.

## Alternatives

A persisted workflow registry would create a second source of truth and violate the read-only scope. Commit-message conventions alone are unreliable after squash merges or custom messages. Reading remote PRs would require network access and credentials beyond a local-first application. The selected approach retains local evidence limits explicitly.

## Consequences

Progress is inferred and can be unknown. History is bounded and may be shallow. Existing declarations may be stale. The UI must explain these limits without converting them into completion or approval claims.

## Applicability in this change

Specifications/task-retention.md replaces standalone Workflow canvas/navigation requirements and delivered task-source rules. Unit Workflow and derived workflow evidence remain supported.
