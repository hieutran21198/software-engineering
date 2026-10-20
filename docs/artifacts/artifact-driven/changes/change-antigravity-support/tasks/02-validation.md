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

- [ ] `docs/artifact-driven` and `src/archs/artifact-driven` resolve identically and all relative Markdown links resolve without child-to-parent links.
- [ ] `go test ./...` and `go vet ./...` pass.
- [ ] `npm run build` in `website/` passes.
- [ ] `node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-driven/change-antigravity-support` reports `ok: true` with 0 errors.
