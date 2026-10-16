# Existing delivery validation

## Scope and location

Run existing checks for cmd/se-adopt, internal/adopt, embedded bundles and website. Record results in this task; no implementation or dependency changes. Generated build output and temporary binaries must remain outside tracked knowledge.

## Governing knowledge

- Requirements: R4–R5, R7–R8; A2/A5/A6.
- Delivery contract.
- Embedded adoption decision.
- Publishing decision.

## Prerequisites

[Source fidelity](01-source-fidelity.md) complete; approved plan remains valid. Use existing Go 1.25+ and Node 24 tooling. A missing tool or unavailable installation is reported rather than silently counted as a passed check.

## Checks

Run go test ./... and go vet ./... from repository root. Existing tests cover complete embedded bytes/utilities, repeat/idempotent adoption, custom output/dry-run, invalid flags/names, containment/symlinks/type conflicts, preflight preservation and missing-file repair. Build cmd/se-adopt into a temporary directory, run --list and preview/real/repeat adoption into a fresh temporary consumer workspace. Compare copied files to packaged inputs and verify relative links. Never adopt over project source files.

Reuse existing website dependencies when available; otherwise install from its lockfile with npm ci. Run npm run build from website. Review CI's six binary targets, checksums, PR/default-branch/tag conditions against the contract. Build the six existing targets locally with CGO disabled to verify portability if supported; retain outputs only in a temporary directory. Do not publish releases or trigger deployment.

## Definition of Done

- [x] Existing Go behavior tests and vet pass against the combined branch.
- [x] Temporary consumer adoption/list/preview/repeat results satisfy the recovered interface, contain the full bundle and preserve valid bundle links.
- [x] Documentation production build passes strict link checks using existing configuration.
- [x] All six configured binary targets build; checksum file covers each asset. Configuration review confirms publication conditions without claiming live deployment or release success.
- [x] Results identify commands, actual outcomes and relevant test/source paths; failures are visible and block applicable completion.
- [x] No tracked implementation, dependency, harness, reusable bundle or consumer source is modified.

## Evidence

Go 1.26.8 (module minimum 1.25), Node 24.21.0. GOCACHE=/tmp/add-recovery-go-cache go test ./... passed the existing cmd/se-adopt, internal/adopt and embedded-bundle tests; go vet ./... passed. Initial execution failed because the default cache was read-only; the temporary-cache rerun passed.

Native go build -trimpath passed with access to worktree Git metadata. An initial sandboxed build could not obtain VCS status and produced no binary; the authorized retry retained VCS stamping and succeeded. --list reported artifact-driven. A fresh temporary consumer preview reported 38 new files and wrote none; adoption reported 38 new/0 unchanged, and repeat reported 0 new/38 unchanged. Compared all copied bytes to the local bundle and checked all 51 relative links: passed. Existing tests cover conflict, unsafe path, symlink and type-error cases, plus utility inclusion and missing-file repair.

Built cmd/se-adopt with CGO_ENABLED=0 and trimpath for linux/amd64, linux/arm64, darwin/amd64, darwin/arm64, windows/amd64 and windows/arm64. All six passed; SHA256SUMS verification passed for every asset. Outputs remained in temporary validation directories.

website: npm ci succeeded from the unchanged lockfile; npm run build passed strict Docusaurus link checks and generated the site. Installation reported 49 existing audit findings (3 low, 15 moderate, 15 high, 16 critical), a deprecated uuid dependency and an install-script advisory. No dependency or security repair is included in this recovery. Docusaurus could not write its optional update-check cache; production generation still succeeded.

Reviewed .github/workflows/ci.yml: PR/default-branch/tag triggers, Go/docs prerequisites, six targets/checksums, default-branch Pages condition and v* releases match the contract. No deployment, tag or release was triggered. Git diff confirmed tracked implementation, dependencies, harness and bundle files unchanged.
