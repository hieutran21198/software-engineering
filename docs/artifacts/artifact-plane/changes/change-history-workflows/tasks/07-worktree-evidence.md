# Read local worktree and workflow evidence

## Scope and ownership

Own server reader/Git helpers and a small plain workflow-evidence module, plus Node Git fixtures and API contract checks. Keep UI work for task 08.

## Prerequisites and governing elements

User approval and completed specification. Requirements 17–20 and B12–B14; Read-only API extension and Step evidence contracts.

## Definition of Done

- [ ] Enumerate registered worktrees safely, including spaces, detached HEAD, locked/prunable entries, missing roots, and non-ADD roots; isolate each root containment.
- [ ] Return the additive workflow contract on Open/Refresh without recursion, background activity, branch switching, writes, or remote fetching.
- [ ] Bound relevant history to 200 commits; retain full IDs/messages and multiple phase associations, and diagnose truncation/shallow history.
- [ ] Compare copied baselines and current snapshots; inherited completed tasks and stale declarations never prove ongoing work.
- [ ] Derive observed/inferred/documented/unknown states and exact completion commits only under specified evidence rules; approval remains unknown.
- [ ] Git fixtures cover distinct commits, squash ambiguity, uncommitted edits, empty/malformed evidence, missing worktrees, and unchanged files/metadata.

## Evidence

Implementation has not started.
