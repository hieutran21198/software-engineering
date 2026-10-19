---
id: validation
depends_on: [guidance-validation, ci-release, explore-scale]
covers:
  - element: requirements/app-release.md
    ids: [ARA1, ARA2, ARA3, ARA4, ARA5]
  - element: requirements/human-guidance.md
    ids: [HG12]
---

# Validation

## Scope and ownership

Coordinator. Combined checks, the downloaded executable, the supports of the five affected flows, the unit evidence and the version record.

## Governing knowledge

The unit brief docs/artifacts/units-of-work/plane-human-guidance/README.md; both specifications; requirements acceptance criteria.

## Definition of Done

- [x] The Linux AMD64 executable downloaded from the CI artifacts of the pull request passes its checksum, opens this repository with a `PATH` without Node.js, lists the MCP tools and answers a semantic query after `model-install`.
- [x] The six file sizes are recorded and compared with the claim bundled-onnx-runtime.
- [x] The supports of repository-exploration, change-review, knowledge-authoring, unit-inspection and source-retrieval name the new modules and tests; their steps keep their meaning.
- [x] `npm test`, both browser runs, `go test ./...` and `npm run validate` pass; the validator reports no error for this change.
- [ ] The owner looked at the screenshots and at the downloaded executable before the version.
- [ ] The unit brief has evidence for every criterion; the version record and `current_version` are prepared with the number computed from the protected branch and the minor level.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Downloaded executable | Artifact `artifact-plane-release` of pull request run 39229385285: `sha256sum --check SHA256SUMS` OK for all six files. The Linux AMD64 file in `env -i` with a PATH where `command -v node` fails and a private 0700 state directory: `--version` prints 1.21.1 (the version record comes later); serve on port 4351 prints its address, GET / 200; POST /api/explore on a one-worktree clone reports 3 artifacts, and on this repository with 13 worktrees 200 with 49,983,022 bytes in 9.0 s; `mcp --repository <clone>` answers initialize and lists 10 tools; `model-install` exits 0 in 19 s; a flow search then returns `semantic: true` with 5 results in 67 s (first embedding) | Passed |
| Sizes | darwin-amd64 183.0 MB, darwin-arm64 174.3 MB, linux-amd64 169.6 MB, linux-arm64 161.7 MB, windows-amd64 150.8 MB, windows-arm64 137.8 MB; all below the 200 MB of claim bundled-onnx-runtime | Passed |
| Flow supports | repository-exploration (select: app-entry, app-smoke, app-release-contract; overview: human-guidance-contract, guidance-pages, human-guidance-browser, explore-response, explore-response-tests), change-review (select and brief: change-status-model, change-status-tests, human-guidance-contract, human-guidance-browser), knowledge-authoring (edit), unit-inspection (brief: status-vocabulary) and source-retrieval (discover: model-install, app-release-contract); steps unchanged; the five reached flows are reconciled in the unit brief, claim reached-flows-kept | Passed |
| Suites | `npm test` 430 tests, 429 passed, 0 failed, 1 skipped; browser suite 117 of 117 on Chromium 149 and on the Playwright headless shell (task guidance-validation); pull request run 39229768458 at head 0b6cac0: artifact-plane, go (`go test`, `go vet`, binaries), docs, six plane-app jobs and plane-sums passed; `npm run validate` on this repository: `ok: true`, 0 errors | Passed |

Open until the owner look: the owner looks at the screenshots and at the downloaded executable; then the version record and the unit evidence follow.
