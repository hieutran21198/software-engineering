# Read local worktree and workflow evidence

## Scope and ownership

Own server reader/Git helpers and a small plain workflow-evidence module, plus Node Git fixtures and API contract checks. Keep UI work for task 08.

## Prerequisites and governing elements

User approval and completed specification. Requirements 17–20 and B12–B14; Read-only API extension and Step evidence contracts.

## Definition of Done

- [x] Enumerate registered worktrees safely, including spaces, detached HEAD, locked/prunable entries, missing roots, and non-ADD roots; isolate each root containment.
- [x] Return the additive workflow contract on Open/Refresh without recursion, background activity, branch switching, writes, or remote fetching.
- [x] Bound relevant history to 200 commits; retain full IDs/messages and multiple phase associations, and diagnose truncation/shallow history.
- [x] Compare copied baselines and current snapshots; inherited completed tasks and stale declarations never prove ongoing work.
- [x] Derive observed/inferred/documented/unknown states and exact completion commits only under specified evidence rules; approval remains unknown.
- [x] Git fixtures cover distinct commits, squash ambiguity, uncommitted edits, empty/malformed evidence, missing worktrees, and unchanged files/metadata.

## Evidence

The combined Node suite passed 24 checks. Real Git fixtures cover registered worktrees, detached/locked/missing roots, arbitrary commit subjects, uncommitted work, inherited checklists, phase associations, squash ambiguity, finished history, and completion evidence introduction. Parser fixtures check history bounds, shallow history, and non-ADD isolation. Markdown examples and negative/planned self-check prose cannot prove completion. Existing containment tests and full worktree/file/Git fingerprints passed. The real repository read took approximately 1.2 seconds for three registered worktrees and preserved its Git index. No repository writes, polling, remote fetch, or persistent workflow state were introduced.
