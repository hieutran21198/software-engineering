---
id: git-lifecycle
depends_on: []
evidence_records:
  - id: git-tests
    method: node --test test/knowledge-git.test.js
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/05-git-lifecycle.md#git-tests
---

# Git lifecycle

## Scope and ownership

Own apps/artifact-plane/server/knowledge-git.js and its tests: status, branch.create, commit and discard.

## Governing knowledge

specifications/knowledge-editing.md, section Git lifecycle.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [x] status returns branch, protected, detached, HEAD, dirty knowledge paths with status letters and the count of dirty paths outside docs/artifacts.
- [x] branch.create validates the name, refuses main and master, runs git switch -c and keeps uncommitted changes.
- [x] commit refuses a protected branch, a detached HEAD, an empty message and any path outside docs/artifacts; it stages only the given paths, commits with the configured author and returns the commit ID; the repository's other dirty files stay unstaged.
- [x] discard restores a tracked knowledge file or deletes an untracked one and refuses other paths.
- [x] No test or code path runs push, fetch, pull, merge, rebase, reset, tag, stash or clean; mutations are serialized per repository.

## Evidence

### git-tests

Checked in apps/artifact-plane at commit 8514ef3: 5 of 5 tests passed. status reports branch, protection, detached HEAD, dirty knowledge paths with status letters and one dirty path outside docs/artifacts. branch.create refuses main, master and invalid names, rejects an existing branch with 409 and keeps an uncommitted edit. commit refuses main, an empty message, paths outside docs/artifacts and clean paths; it commits a modified and a new knowledge file with the configured author, leaves another modified knowledge file unstaged and keeps an unrelated staged file staged. discard restores a tracked file, deletes an untracked knowledge file and refuses untracked.txt. A source check finds no push, fetch, pull, merge, rebase, reset, tag, stash, clean or config command. Mutations run through serialize() per worktree. Implementation: server/knowledge-git.js.
