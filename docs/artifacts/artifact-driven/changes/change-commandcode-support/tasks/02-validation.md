---
id: validation
depends_on: [guidance-and-profile]
covers:
  - element: requirements/commandcode-support.md
    ids: [CCA2, CCA3]
---

# Validate the ADD integration

## Scope and ownership

Implementer returns checks and commits. The coordinator owns knowledge evidence
and version preparation. Locations: Go bundle, adoption, link and knowledge
checks, plus live Command Code discovery. Governing contract:
`specifications/commandcode-support.md`.

## Definition of Done

- [x] `go test -count=1 ./...` and `go vet ./...` pass.
- [x] `npm --prefix website run build` passes, or the evidence names the
      concrete blocker.
- [x] The knowledge validator reports `ok: true` for this change with no
      uncovered new ID.
- [x] Live discovery records the Command Code version, the six project skills
      and the Plane MCP server from `cmd skills list` and `cmd mcp list`.
- [x] The evidence records actual commands and results and distinguishes
      static checks from live discovery.
- [x] Reassess the final branch impact and name any consumer outside this plan.

## Evidence

### Automated checks

`go test -count=1 ./...` and `go vet ./...` passed with go1.26.8 on
linux/amd64. `npm --prefix website run build` completed the Docusaurus
production build. `git diff --check` passed.

`node apps/artifact-plane/scripts/validate-knowledge.mjs --change
artifact-driven/change-commandcode-support` returned `ok: true` with seven
diagnostics: six `open-change-conflict` warnings from retained local and remote
branches that edit the same requirement and specification files, and one
informational `requirement-ids-missing` for the edited source inventory. No
error or coverage warning remains.

### Live discovery

`cmd --version` reported `1.85.1`. `cmd skills list` reported six project
skills: `add-coordinator`, `add-implementer`, `add-product-owner`,
`add-technical-lead`, `kiss` and `asd-ste-100`. `cmd mcp list` reported
`artifact-plane` as a project stdio server with status `enabled`.

This is discovery evidence. The Plane hook activation and its headless limits
belong to the dependent Plane member.

### Impact assessment

The embedded bundle, adoption consumers and website receive additive guidance.
No adoption copy behavior, CLI flag, record schema or ADD phase changed. The
Nix adoption package derives its version from the ADD identity record, so the
prepared 3.5.0 changes its metadata without a Nix implementation edit.
Artifact Plane is the only intended consumer of the harness contract; its
implementation remains gated on this member's establishment. State remains
repository and source inspection plus the executed Go, website, link and
knowledge checks, not a live interactive harness.
