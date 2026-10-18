---
id: impact-index
depends_on: []
evidence_records:
  - id: index-checks
    method: node --test test/impact-index.test.js; npm test; node scripts/impact-benchmark.mjs <worktree> --measure-incremental
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/01-impact-index.md#index-checks
---

# Impact index

## Scope and ownership

Own apps/artifact-plane/server/impact-index.js, the dependencies acorn and acorn-jsx in package.json, and the Node tests test/impact-index.test.js with their fixtures.

## Governing knowledge

specifications/change-impact.md, section Index. requirements/change-impact.md, I2 and I9.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [x] impact-index.sqlite is created under the private state directory with the directory guard of flow-index.js and the tables files, imports, declarations, packages, embeds, mirrors, history, vocabulary and contexts.
- [x] File identities come from `git ls-files -s` and the hashes of dirty files; a second build with no change parses no file; a build after one changed file parses that file only, within 300 milliseconds on this repository.
- [x] JavaScript, JSX and ES modules yield import and export specifiers with local names, dynamic imports, top-level declarations and the identifiers each mentions; a file that fails to parse yields a diagnostic and file-level relations.
- [x] Go packages yield imports, test imports and go:embed targets when go is available; without go, not_analyzed names Go and the build succeeds.
- [x] Mirrors pair tracked non-empty files with identical content in different top-level directories; history pairs come from the last 500 non-merge commits without commits that touch more than 60 files; vocabulary keeps identifiers present in at most 12 percent of source files.
- [x] Interrupted builds publish no generation; a full build of this repository completes within 2 seconds, measured and recorded.

## Evidence

### index-checks

Checked on 18 October 2026 in the worktree of branch claude/impact-index-service (commits b772530 and b00a7f7, merged into claude/impact-intelligence). `node --test test/impact-index.test.js test/impact.test.js`: 11 passed, 0 failed. `npm test` in apps/artifact-plane: 348 tests, 347 passed, 1 skipped, 0 failed. impact-index.sqlite is created under the flow-index directory guard with the tables files, imports, declarations, packages, embeds, mirrors, history, vocabulary, contexts and diagnostics; a test proves that a failed update publishes nothing and that the file stays private. File identities come from `git ls-files -s -z` and the hashes of dirty files; a second build parses no file; a build after one changed file parses that file only. Measured on this repository with `node scripts/impact-benchmark.mjs <worktree> --measure-incremental`: full index 858 ms (154 modules, 422 history commits, go available), no-change update 23 ms, one changed file 36.9 ms (1 file parsed); earlier runs measured 737 to 1095 ms for the full build. acorn and acorn-jsx (package.json ^8.15.0 and ^5.3.2) parse specifiers with imported and local names, re-exports, export lists, `export *`, dynamic `import()` and `require()`, top-level declarations with per-declarator names and Identifier mentions; a parse failure records a parse-failure diagnostic and keeps file-level import relations. Go relations come from `go list -json ./...` and go:embed when go is available; without go the coverage statement names Go as not analyzed (tested through a goCommand option). Mirrors pair tracked non-empty files with the same committed blob in different top-level directories and mark a dirty copy diverged; history reads the last 500 non-merge commits across local refs in date order, skips commits touching more than 60 files and keeps pairs with support at least 2; vocabulary keeps identifiers present in at most max(3, 12 percent) of source files.
