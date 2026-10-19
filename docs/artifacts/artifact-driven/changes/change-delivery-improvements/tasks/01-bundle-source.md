---
id: bundle-source
depends_on: []
---

# Bundle source

## Scope and ownership

Coordinator, as implementer. Move `src/archs/artifact-driven/bundle.go` and `bundle_test.go` into `docs/artifact-driven` (package artifactdriven) and embed README.md, 01-foundation to 06-guidelines and `tools` from there; keep the required-skills mount. Update `src/archs/catalog.go` and every import. Remove the Markdown copy under `src/archs/artifact-driven`. Add `docs/artifact-driven/tools/README.md`, which explains how to run the validator and that the file `add-validate.mjs` is present only when the release supplies it. Add `docs/artifact-driven/tools/add-validate.mjs` to `.gitignore`. Change `website/scripts/prepare-docs.mjs` to copy the bundle Markdown from `docs/artifact-driven` to the site path `src/archs/artifact-driven`.

## Governing knowledge

specifications/delivery.md (Bundle interface); specifications/record-checks.md (Install); decisions/016-validator-delivery.md; decisions/017-single-bundle-source.md; requirements/delivery-improvements.md, DI13, A2 and A4.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [x] `git ls-files src/archs/artifact-driven` lists no file, and `docs/artifact-driven` holds the only copy of every bundle Markdown file.
- [x] A Go test confirms that the embedded bundle contains no `.go` file, contains `tools/README.md`, and contains `tools/add-validate.mjs` only when that file exists at build time.
- [x] An adoption test copies a bundle with and without `tools/add-validate.mjs`; both adoptions succeed and the validator file is copied only when present.
- [x] `go test ./...` and `go vet ./...` pass; `npm run build` in website exits 0, and the site keeps its `/src/archs/artifact-driven/` pages.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| One copy | `git ls-files src/archs/artifact-driven` lists no file; `git mv` moved bundle.go and bundle_test.go to docs/artifact-driven; the catalog, `cmd/se-adopt/main_test.go` and `internal/adopt/adopt_test.go` import `software-engineering/docs/artifact-driven` | Passed | The diff of this task |
| Bundle contents | `TestBundleContents` passes without the validator file; with a temporary `tools/add-validate.mjs` the docs/artifact-driven, se-adopt and adopt tests pass and the file is embedded; `TestCanonicalBundleFidelity` now walks the package directory and skips Go files; `git check-ignore` matches the validator path | Passed | `docs/artifact-driven/bundle_test.go` |
| Adoption with and without the validator | `TestAdoptOptionalValidator` copies a bundle with and without `tools/add-validate.mjs`; both copies succeed and the file exists only in the second | Passed | `internal/adopt/adopt_test.go` |
| Go and website | `go test ./...` and `go vet ./...` pass; `npm ci` and `npm run build` in website exit 0 with strict broken-link handling; the build has 39 pages under `/src/archs/artifact-driven/` for 39 bundle Markdown files (38 before, plus `tools/README.md`) | Passed | Commands in this row |

Outside the listed files: the root README links and project-structure tree point to docs/artifact-driven, and the site generator rewrites those links to the site path; the artifact README, specifications/delivery.md (Documentation and release interface) and the `minimal-scaffold-check` support path of the change-delivery flow name the new location. Delivered task records and the Plane impact benchmark cases keep the old path, because they describe past states. The Plane validator reports no error or warning on the worktree.
