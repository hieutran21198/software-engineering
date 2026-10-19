---
id: validator-build
depends_on: [tier-check]
---

# Validator build

## Scope and ownership

Implementer, `apps/artifact-plane/scripts/validate-knowledge.mjs`, `package.json`, `.github/workflows/ci.yml` and the release job. Implement `--repository`, `--change`, the `add-validate.result.v1` output and exit statuses 0, 1 and 2; add `npm run validate` and `npm run build:validator`, which writes `docs/artifact-driven/tools/add-validate.mjs` as one ES module without runtime package dependencies; run `npm ci` and `npm run build:validator` before `go test` and the release build.

## Governing knowledge

specifications/delivery-support.md (Validator entry point and build); artifact-driven specifications/record-checks.md (Validator, Install); artifact-driven decisions/016-validator-delivery.md; requirements/delivery-improvements.md, PI2 and PA1.

## Prerequisites

Task tier-check.

## Definition of Done

- [ ] On the fixture of task record-checks, the built file and the entry point give byte-identical JSON, and both give no error on this repository.
- [ ] The built file runs with only Node.js 24 and no `node_modules` directory in the target repository.
- [ ] `go test ./...` after the build shows `tools/add-validate.mjs` in the embedded bundle, and an adoption copies it.
- [ ] CI and release workflow files run the build before the Go steps; a local run of the same commands passes.

## Evidence

Not recorded.
