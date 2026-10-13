# Existing delivery validation

## Scope and location

Run existing checks for cmd/se-adopt, internal/adopt, embedded bundles and website. Record results in this task; no implementation or dependency changes. Generated build output and temporary binaries must remain outside tracked knowledge.

## Governing knowledge

- [Requirements](../requirements/baseline.md): R4–R5, R7–R8; A2/A5/A6.
- [Delivery contract](../specifications/delivery.md).
- [Embedded adoption decision](../decisions/002-embedded-safe-adoption.md).
- [Publishing decision](../decisions/003-derived-documentation.md).

## Prerequisites

[Source fidelity](01-source-fidelity.md) complete; approved plan remains valid. Use existing Go 1.25+ and Node 24 tooling. A missing tool or unavailable installation is reported rather than silently counted as a passed check.

## Checks

Run go test ./... and go vet ./... from repository root. Existing tests cover complete embedded bytes/utilities, repeat/idempotent adoption, custom output/dry-run, invalid flags/names, containment/symlinks/type conflicts, preflight preservation and missing-file repair. Build cmd/se-adopt into a temporary directory, run --list and preview/real/repeat adoption into a fresh temporary consumer workspace. Compare copied files to packaged inputs and verify relative links. Never adopt over project source files.

Reuse existing website dependencies when available; otherwise install from its lockfile with npm ci. Run npm run build from website. Review CI's six binary targets, checksums, PR/default-branch/tag conditions against the contract. Build the six existing targets locally with CGO disabled to verify portability if supported; retain outputs only in a temporary directory. Do not publish releases or trigger deployment.

## Definition of Done

- [ ] Existing Go behavior tests and vet pass against the combined branch.
- [ ] Temporary consumer adoption/list/preview/repeat results satisfy the recovered interface, contain the full bundle and preserve valid bundle links.
- [ ] Documentation production build passes strict link checks using existing configuration.
- [ ] All six configured binary targets build; checksum file covers each asset. Configuration review confirms publication conditions without claiming live deployment or release success.
- [ ] Results identify commands, actual outcomes and relevant test/source paths; failures are visible and block applicable completion.
- [ ] No tracked implementation, dependency, harness, reusable bundle or consumer source is modified.

## Evidence

Not executed. Existing test coverage is a validation method, not current passing evidence. Browser checks for Artifact Plane are outside the unchanged ADD delivery boundary; existing PR CI can still run them.
