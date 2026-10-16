---
id: migrate-repository
depends_on: [layout-guidance]
evidence_records:
  - id: dod
    method: Reconciliation, byte equality, graph and census checks recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/04-migrate-repository.md#evidence
---

# Migrate this repository's artifacts to the in-place layout

## Scope and ownership

Coordinator owns this knowledge operation; an implementer can execute the mechanical steps. Scope: docs/artifacts/artifact-driven, docs/artifacts/artifact-plane, docs/artifacts/story-driven and docs/artifacts/dag.yaml. Established versions/<version>/ directories and delivered change directories are not modified.

## Governing knowledge and prerequisites

N7, N8, K4 to K6; specifications/knowledge-layout.md migration section; the reconciliation procedure in the established evidence-records contract. Explicit plan approval and the layout-guidance DoD are required. No upstream artifact contract is required.

## Definition of Done

- [x] Reconcile each declared current version against local and remote main: artifact-driven 2.3.0 through PR #28; artifact-plane by verifying which complete snapshot and retained delivery record among 1.11.0 to 1.13.0 landed through PRs #23 to #26; story-driven 1.1.0 through PR #21. Record the method and result. Stop on ambiguity.
- [x] artifact-driven: the artifact's working knowledge is the knowledge of change-agent-efficiency; those directories are removed from the change, which keeps README.md and tasks/. The README carries the identity record and no Markdown declaration or state sections. dependencies.yaml does not exist.
- [x] artifact-plane: the working knowledge is the knowledge of change-evidence-and-usability; those directories are removed from the change. The identity record declares the verified established version and depends_on: [artifact-driven].
- [x] story-driven: the working knowledge is byte-identical to versions/1.1.0 knowledge; the identity record declares 1.1.0 and depends_on: [artifact-driven]; the stale active-change link is removed; the delivered change directory is unchanged.
- [x] docs/artifacts/dag.yaml is deleted. `git diff --stat` shows no change under any versions/<version>/ knowledge directory or delivered change.
- [x] `diff -r` shows byte equality between each artifact's working knowledge and its source; the dependency graph has the same two edges; the legacy reader shows historical versions and units unchanged; the census script shows zero copied knowledge files in current knowledge. Record the before and after census.

## Evidence

Executed on 16 October 2026 after the layout-guidance DoD, by the coordinator with shell commands (`git mv`, `cp -r`, `git rm`), so the moves are byte-preserving.

- Reconciliation against local and remote main (6a0e0c9), method `git log --first-parent --diff-filter=A origin/main -- <version>/README.md`: artifact-driven 2.3.0 introduced by 6a0e0c9 (#28); story-driven 1.1.0 by 8327cd8 (#21); artifact-plane 1.13.0 by 2225e35 (#26), with its retained delivery record changes/change-ux-simplification/tasks on main and apps/artifact-plane/package.json at 1.13.0 on main. The Plane root declared 1.11.0; versions 1.11.1 to 1.13.0 landed through #23 to #26, so the verified established version is 1.13.0. No ambiguity remained.
- artifact-driven and artifact-plane: the requirements, specifications and decisions of change-agent-efficiency and change-evidence-and-usability moved to the artifact roots; the changes keep README.md and tasks/. story-driven: versions/1.1.0 knowledge copied to the root; the stale active-change link is gone; change-flow-discovery is unchanged. The three READMEs carry identity records (2.3.0 with no dependencies; 1.13.0 and 1.1.0 with depends_on: [artifact-driven]) and no declaration or state sections. No open change had dependencies.yaml. docs/artifacts/dag.yaml is deleted.
- Byte equality: `git hash-object` of each working file equals the HEAD blob of its source (artifact-driven 38/38, artifact-plane 59/59); `diff -r` of story-driven against versions/1.1.0 reports no difference. `git diff origin/main -- docs/artifacts/*/versions` is empty, and `git diff --cached --name-status` touches no delivered change.
- Graph: the identity records give the same two edges as the deleted index (artifact-driven to artifact-plane and to story-driven). The link script found 9 broken links after the move, all in the two change records and one unit brief link; they were corrected (0 remaining). The legacy reader check is part of the Plane layout reader validation.
- Census (scratchpad census.py, file and byte proxies): before 1,322 files, 5,851,350 bytes, 71.3 percent byte-identical copies; after 1,329 files, 5,871,448 bytes, 71.5 percent. Historical legacy snapshots are preserved, so the total does not drop. Knowledge files inside open changes: 97 before (38 and 59, of which 60 were byte-identical to a version), 0 after. Current knowledge contains no copy inside a change.
