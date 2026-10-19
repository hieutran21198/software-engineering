---
id: record-checks
depends_on: [readers]
covers:
  - element: requirements/delivery-improvements.md
    ids: [PI2, PA1]
---

# Record checks

## Scope and ownership

Implementer, `apps/artifact-plane/server/record-checks.js`. Implement source-unresolved, link-broken (ignoring code spans and fences), placeholder-text, version-identity-mismatch, version-number-invalid, upstream-unestablished, requirement-ids-missing, covers-unknown-id, requirement-uncovered and open-change-conflict, using local Git refs only. Readers, the validator entry point and the review service call this module.

## Governing knowledge

specifications/delivery-support.md (Shared checks); artifact-driven specifications/record-checks.md (Checks); requirements/delivery-improvements.md, PI2 and PA1.

## Prerequisites

Task readers.

## Definition of Done

- [x] A fixture repository has one seeded defect for each code of the Checks table and a clean variant; tests assert the code, severity and path of each diagnostic and no diagnostic on the clean variant.
- [x] The diagnostics appear in the knowledge views where readers show diagnostics today.
- [x] `npm test` passes, and existing tests pass without edits.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Seeded fixture | `test/record-fixtures.js` builds a repository with an open small change on branch change-fix and a clean and a seeded variant; the seeded variant has one defect for each code of the Checks table except tier-mismatch (task tier-check), and a second branch `other` that edits the same requirement file. `test/record-checks.test.js` asserts the code, severity and path of all 12 seeded codes, that no other code appears, the message of six of them, no diagnostic on the clean variant with and without `--change` scope, and that the scope keeps only the paths of the change's artifact and the configuration file | Passed |
| Views | `exploreRepository` adds the record diagnostics to the snapshot diagnostics that the views show; a test finds all 12 codes in the explored snapshot | Passed |
| Suite | `npm test`: 387 tests, 386 passed, 0 failed, 1 skipped; no existing test file changed | Passed |

`server/record-checks.js` reads scanner records, the filesystem below the repository root for link targets, and local Git refs (protected identity and blobs, merge bases, branch differences); it does not write, fetch or run record text. `open-change-conflict` compares only files that also differ from the protected branch, so squash-merged branches do not count. Two decisions while implementing: `placeholder-text` matches the scaffold placeholder `REPLACE` only, because the contract quotes "Replace this text." in its own prose and the scaffold never uses that text; `requirement-uncovered` uses the covers of every change of the artifact that no protected version record names, because the snapshot does not count a change with a proposed version record as active.

On this repository, after the local `main` was fast-forwarded to the merged ADD 3.0.0 (caf960b), the checks report one warning and nothing else: the local branch `claude/human-cognitive-support-old` holds the unmerged change change-review-brief on artifact-plane.
