---
id: output-reader
depends_on: []
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO20, AOA9]
---

# Session output reader

## Scope and ownership

One implementer adds the output reader as a server module in `apps/artifact-plane/server`, with Node tests on fixture Git repositories. The task adds no HTTP route; `session-api` adds the routes.

## Governing knowledge

`specifications/agent-orchestration.md`: Output and Failures.

## Definition of Done

- [x] The reader returns the commits from the base revision to `HEAD` with short ID and subject, at most the 100 newest.
- [x] The reader returns the changed files from `git diff --numstat -z` against the base revision plus untracked files that Git does not ignore. Each file has its path, status (`A`, `M`, `D` or `R`), added and removed lines, binary flag and committed flag. The list stops at 500 files and says so.
- [x] The diff of one listed path stops at 256 KiB with a truncation notice. An untracked text file shows as added lines. A binary file shows no diff. A path that is not in the list is refused.
- [x] The reader returns the DoD progress of the task file in the session worktree with the existing checklist reader.
- [x] The reader uses the existing Git process limits. A test confirms that a read changes no file, index or other Git metadata.
- [x] Tests cover renames, deletions, paths with spaces and non-ASCII names, and a base revision that is no longer an ancestor of `HEAD`.

## Evidence

Commit 200b8d0 adds `server/session-output.js` (`readBase`, `readOutput`, `readDiff`, `OutputError`) and `test/session-output.test.js`. The tests run against temporary repositories with a linked session worktree.

- Commits: two commits come newest first with the short ID of `git rev-parse --short`; 101 commits give the 100 newest.
- Changed files: one fixture holds a committed rename to a path with a space and a non-ASCII name, a committed deletion, a committed binary file, uncommitted edits, an untracked text file, an untracked binary file and an ignored file. The list equals the expected list, and the ignored file is absent. 501 untracked files give 500 entries and `truncated: true`.
- Diff: a modified file, a rename, a deletion and an untracked file (added lines only) show their diffs. Binary files give no diff. An unchanged, ignored, missing, rename-source, empty and `../` path each give status 400. Committed and untracked files of about 330 KB stop at 256 KiB on a whole line with the notice "The diff stops at 256 KiB."
- DoD progress: the reader counts the checklist of the uncommitted task file in the worktree with `checklist()` and lists its items with `checklistItems()`. A missing file gives state `unknown`, and an unsafe path gives 400.
- Read-only: while a test holds all 8 Git slots, a read waits. A fingerprint of the repository and the worktree, with two stat-dirty files, is equal before and after every read. Without `diff.autoRefreshIndex=false`, this test fails on a rewritten worktree index.
- A base revision that is no longer an ancestor of `HEAD` still gives the commits after it and the changed files.

The coordinator reran the focused suite: 12 tests passed. The implementer ran `npm test`: 598 tests, 597 passed, 1 skipped (the existing pinned-model network test), 0 failed.

Open points for the contract: the meaning of the committed flag, the status of `T`, `U` and `C` records (the reader shows `M`), and the status for a base revision that is no longer in the repository (the reader returns 409). The coordinator sends them to the Specification with the findings of `verify-interfaces`.
