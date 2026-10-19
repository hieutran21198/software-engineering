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

- [ ] `git ls-files src/archs/artifact-driven` lists no file, and `docs/artifact-driven` holds the only copy of every bundle Markdown file.
- [ ] A Go test confirms that the embedded bundle contains no `.go` file, contains `tools/README.md`, and contains `tools/add-validate.mjs` only when that file exists at build time.
- [ ] An adoption test copies a bundle with and without `tools/add-validate.mjs`; both adoptions succeed and the validator file is copied only when present.
- [ ] `go test ./...` and `go vet ./...` pass; `npm run build` in website exits 0, and the site keeps its `/src/archs/artifact-driven/` pages.

## Evidence

Not recorded.
