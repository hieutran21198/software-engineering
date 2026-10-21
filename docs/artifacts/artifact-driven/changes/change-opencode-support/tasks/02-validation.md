---
id: validation
depends_on: [guidance-and-profiles]
covers:
  - element: requirements/opencode-support.md
    ids: [OC5, OCA3]
---

# Validate the ADD integration

## Scope and ownership

Implementer returns checks and code-test commits. The coordinator owns knowledge evidence and version preparation. Locations: Go bundle and adoption tests, documentation links and OpenCode profile fixtures. Governing contract: `specifications/opencode-support.md`.

## Definition of Done

- [x] Automated checks validate the six canonical skill targets and four V2 profile definitions.
- [x] `go test ./...` and `go vet ./...` pass with unchanged adoption copy behavior.
- [x] `npm --prefix website run build` and bundle/link checks pass.
- [x] The knowledge validator reports `ok: true` for this change with no uncovered new IDs.
- [x] Reassess the final branch impact; identify any consumer not covered by this plan before publication.
- [x] Record actual commands and results, not fixture file presence, as evidence.

## Evidence

### Automated checks

`docs/artifact-driven/opencode_test.go` checks the exact six canonical symlinks and four native profiles. Negative cases reject missing, wrong and dangling targets; unsupported, missing and duplicate front-matter fields; wrong modes and missing role/gate instructions; broken links, missing anchors and ancestor references. These are static contract checks, not live OpenCode execution.

`go test -count=1 ./...` and `go vet ./...` passed with Go 1.26.8 on linux/amd64. The Go suites include canonical bundle fidelity, adoption regression and the new OpenCode checks. `git diff --check` passed. Both member knowledge validators passed again after integration with the protected branch and proposed ADD version preparation; the ADD source-inventory notice remained informational only.

The original-checkout knowledge validator, called with `validateKnowledge(process.cwd(), {change: "artifact-driven/change-opencode-support"})`, reported `ok: true`, no errors, no warnings and no uncovered IDs. The source inventory table retains one informational `requirement-ids-missing` notice.

### Website build

The first `npm --prefix website run build` failed during Docusaurus static rendering with `Cannot read properties of undefined (reading 'id')` while this worktree used a symlink to the original checkout's `website/node_modules`. That setup mixed physical package paths across checkouts. No tracked website source changed.

Removed only the symlink created for this check and installed worktree-local dependencies with `npm --prefix website ci --ignore-scripts --no-audit --no-fund`. The same website build then passed with Docusaurus 3.10.2 and generated static files in `website/build`. The successful log is `/tmp/opencode/opencode-add-website-build.log`. Dependencies and generated output remain ignored and are not part of the PR.

### Integrated impact assessment

Reviewed the branch paths against the protected branch, the ADD embed and adoption sources, website source preparation, role registrations and both Plane flow records. The bundle, adoption command and website receive additive guidance only. The Plane receives a proposed harness contract and retained plan; its implementation remains gated on upstream establishment. No Plane runtime, MCP configuration or browser source changed.

During validation the protected branch added Nix package version derivation from the ADD identity record. Integrated that protected update without conflicts and inspected `nix/packages/se-adopt/default.nix`: the package automatically adopts the ADD version and needs no change here. `nix eval --raw .#packages.x86_64-linux.se-adopt.version` returned `3.3.0` with Nix 2.35.3 after proposed version preparation. Its check phase still runs only the adoption packages. The new repository-profile tests are not bundled for consumers. Story-Driven bundle tests pass unchanged. Coverage is bounded repository and source inspection plus executed Go/link/website checks and Nix metadata evaluation, not a live harness, a Nix package build or whole-system semantic impact proof.
