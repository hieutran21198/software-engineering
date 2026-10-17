---
id: git-lifecycle
depends_on: []
evidence_records: []
---

# Git lifecycle

## Scope and ownership

Own apps/artifact-plane/server/knowledge-git.js and its tests: status, branch.create, commit and discard.

## Governing knowledge

specifications/knowledge-editing.md, section Git lifecycle.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [ ] status returns branch, protected, detached, HEAD, dirty knowledge paths with status letters and the count of dirty paths outside docs/artifacts.
- [ ] branch.create validates the name, refuses main and master, runs git switch -c and keeps uncommitted changes.
- [ ] commit refuses a protected branch, a detached HEAD, an empty message and any path outside docs/artifacts; it stages only the given paths, commits with the configured author and returns the commit ID; the repository's other dirty files stay unstaged.
- [ ] discard restores a tracked knowledge file or deletes an untracked one and refuses other paths.
- [ ] No test or code path runs push, fetch, pull, merge, rebase, reset, tag, stash or clean; mutations are serialized per repository.

## Evidence

Implementation has not started.
