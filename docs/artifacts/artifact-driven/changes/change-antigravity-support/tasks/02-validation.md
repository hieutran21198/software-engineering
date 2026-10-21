---
id: validation
depends_on: [bundle-and-repo-guidance]
covers:
  - element: requirements/antigravity-support.md
    ids: [AGY5, AGYA3]
---

# Validation

## Scope and ownership

Coordinator. Bundle parity, link checks, Go test and vet suites, website build and ADD record validation.

## Governing knowledge

`specifications/antigravity-support.md` and `docs/artifacts/units-of-work/antigravity-support/README.md`.

## Definition of Done

- [x] The embedded bundle in `docs/artifact-driven` passes its filesystem tests and all relative Markdown links resolve without child-to-parent links.
- [x] `go test ./...` and `go vet ./...` pass.
- [x] `npm run build` in `website/` passes.
- [x] `node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-driven/change-antigravity-support` reports `ok: true` with 0 errors.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Embedded bundle and link checks | `go test ./docs/artifact-driven/...` passes (`0.011s`), and all relative Markdown links in `docs/artifact-driven/` resolve without child-to-parent links | Passed |
| Go test and vet suites | `go test ./...` (`cmd/se-adopt`, `docs/artifact-driven`, `internal/adopt`, `src/archs/story-driven`) and `go vet ./...` exit 0 | Passed |
| Website build | `npm --prefix website run build` compiles client and server bundles and generates static files in `website/build` with 0 errors | Passed |
| Knowledge validator | `node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-driven/change-antigravity-support` reports `ok: true` with 0 errors | Passed |
