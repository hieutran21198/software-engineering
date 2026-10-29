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

- [ ] The reader returns the commits from the base revision to `HEAD` with short ID and subject, at most the 100 newest.
- [ ] The reader returns the changed files from `git diff --numstat -z` against the base revision plus untracked files that Git does not ignore. Each file has its path, status (`A`, `M`, `D` or `R`), added and removed lines, binary flag and committed flag. The list stops at 500 files and says so.
- [ ] The diff of one listed path stops at 256 KiB with a truncation notice. An untracked text file shows as added lines. A binary file shows no diff. A path that is not in the list is refused.
- [ ] The reader returns the DoD progress of the task file in the session worktree with the existing checklist reader.
- [ ] The reader uses the existing Git process limits. A test confirms that a read changes no file, index or other Git metadata.
- [ ] Tests cover renames, deletions, paths with spaces and non-ASCII names, and a base revision that is no longer an ancestor of `HEAD`.
