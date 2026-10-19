---
id: validator-build
depends_on: [tier-check]
covers:
  - element: requirements/delivery-improvements.md
    ids: [PI2, PA1]
---

# Validator build

## Scope and ownership

Implementer, `apps/artifact-plane/scripts/validate-knowledge.mjs`, `package.json`, `.github/workflows/ci.yml` and the release job. Implement `--repository`, `--change`, the `add-validate.result.v1` output and exit statuses 0, 1 and 2; add `npm run validate` and `npm run build:validator`, which writes `docs/artifact-driven/tools/add-validate.mjs` as one ES module without runtime package dependencies; run `npm ci` and `npm run build:validator` before `go test` and the release build.

## Governing knowledge

specifications/delivery-support.md (Validator entry point and build); artifact-driven specifications/record-checks.md (Validator, Install); artifact-driven decisions/016-validator-delivery.md; requirements/delivery-improvements.md, PI2 and PA1.

## Prerequisites

Task tier-check.

## Definition of Done

- [x] On the fixture of task record-checks, the built file and the entry point give byte-identical JSON, and both give no error on this repository.
- [x] The built file runs with only Node.js 24 and no `node_modules` directory in the target repository.
- [x] `go test ./...` after the build shows `tools/add-validate.mjs` in the embedded bundle, and an adoption copies it.
- [x] CI and release workflow files run the build before the Go steps; a local run of the same commands passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Same JSON, no error here | `test/validator-build.test.js` builds the validator into an empty temporary directory and runs it and `scripts/validate-knowledge.mjs` on the clean and seeded fixtures of task record-checks with six argument sets (repository, seeded, `--change`, default repository, unknown change, unknown argument): stdout and exit status are identical. The seeded run finds the 12 seeded codes and `tier-mismatch`, sorted by path and code, exit 1; the scoped run returns the tier object; a bad `--change` exits 2. On this repository `npm run validate` and the adopted file report `ok: true`, 0 errors, one information diagnostic and one warning (`open-change-conflict` for the stale local branch claude/human-cognitive-support-old) | Passed |
| Node.js only | The bundle (412 KB, one ES module) imports only `node:` modules; its `require` calls load `process` and `buffer`. The test runs it from a temporary directory with no `node_modules` above it | Passed |
| Embedded and adopted | After `npm run build:validator`, `go test ./...` passes (TestBundleContents finds the built file in the embedded bundle, the full-bundle adoption tests copy it) and `go vet ./...` passes; an `se-adopt` binary built with the release command adopts 53 files, and `cmp` shows the adopted `tools/add-validate.mjs` equals the built file | Passed |
| CI and release | `.github/workflows/ci.yml`: the `go` job sets up Node.js 24, runs `npm ci` and `npm run build:validator` in apps/artifact-plane before `go test`, `go vet` and the binary build; the release job publishes those binaries. The same commands pass locally | Passed |

The entry point keeps the earlier output fields (`artifacts`, `counts`) next to the `add-validate.result.v1` fields, because existing tests and the browser measurement read them, and it still accepts a single positional repository path. Without `--change`, it runs the tier check (standalone) for each undelivered change that declares small. `npm test`: 393 tests, 392 passed, 0 failed, 1 skipped.
