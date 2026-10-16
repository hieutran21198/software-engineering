---
id: knowledge-scripts
depends_on: [layout-reader]
evidence_records:
  - id: dod
    method: Script tests and the scripted migration cross-check recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/13-knowledge-scripts.md#evidence
---

# Add validate and migrate scripts

## Scope and ownership

Own scripts/validate-knowledge.mjs, scripts/migrate-layout.mjs, test/knowledge-scripts.test.js and the scripts section of README.md.

## Governing knowledge

L6, M5; specifications/knowledge-layout-reading.md scripts section; the ADD migration procedure in specifications/knowledge-layout.md.

## Prerequisites

Explicit approval and the layout-reader DoD.

## Definition of Done

- [x] validate-knowledge runs the scanner, snapshot, task, unit and flow readers on one repository path, prints diagnostics as JSON and exits nonzero for error diagnostics; it passes on the fixtures and on this repository after migration.
- [x] migrate-layout defaults to dry-run, accepts --write and --artifact, refuses ambiguous identity declarations, applies the six-step procedure, writes only inside docs/artifacts of the selected worktree, and reports byte equivalence and the files it would create, change and delete.
- [x] Tests run both scripts on the legacy fixture and a transition case, assert unchanged bytes in dry-run and the exact written set with --write.
- [x] README documents both scripts as optional tools; ADD remains usable without them.

## Evidence

Executed on 16 October 2026 after the layout-reader DoD.

- scripts/validate-knowledge.mjs runs scanRepository, buildSnapshot (inside the scan), buildTaskGraph for every change, unitBriefs with member checks and buildFlowGraph. It prints JSON with severity per diagnostic: info from the readers, flow-evidence-gap as a warning, and everything else as an error. It exits 1 on any error. On this repository after migration it exits 0, with 3 artifacts, 742 elements, 15 units, 16 flows, 0 errors and 3 informational diagnostics.
- scripts/migrate-layout.mjs is a dry run by default; `--write` applies the plan, and `--artifact` and `--version` select and confirm. It follows the six steps:
  - It refuses ambiguous declarations, and a declared version older than existing snapshot directories unless `--version` confirms it.
  - It copies from the open change when that change carries knowledge, otherwise from the version.
  - It replaces the declaration sections with the identity record and lists the remaining README headings for manual prose review.
  - It applies and deletes dependencies.yaml, and deletes dag.yaml when no legacy artifact remains.
  - It leaves versions and delivered changes untouched.
  - It verifies the planned tree (in-place detection, byte equivalence, unchanged effective edges, no new error diagnostics) before writing.
  - It writes only inside docs/artifacts, refuses symlinked parents and never overwrites.
- Cross-check: on a clone at the pre-migration revision 4eb71e3, the script refused artifact-plane with "declared version 1.11.0 is older than 1.11.1, 1.12.0, 1.12.1, 1.12.2, 1.13.0", which matches the manual reconciliation. Run with `--version 1.13.0` and then for artifact-driven and story-driven, it produced knowledge files byte-identical to the manual migration commit. `git diff --cached dc93750 -- docs/artifacts` differs only in README prose, change-record links and task evidence. Graph before and after: the same two edges.
- test/knowledge-scripts.test.js has 4 cases:
  - validate passes the in-place fixture and fails the legacy fixture on unresolved-reference.
  - A dry run on the legacy fixture leaves bytes unchanged, `--write` changes exactly the planned set with byte-identical copies, and validation after migration shows in-place artifacts; missing version READMEs block writing.
  - A mixed repository keeps dag.yaml while a legacy artifact remains.
  - Outdated and in-place selections are refused with exit 3 and unchanged bytes.
- README.md documents the layouts and the three scripts as optional tools; ADD remains usable without them. `npm test`: 294 tests, 292 pass, 1 skipped, plus the unrelated code-highlight failure.
