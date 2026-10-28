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

- [ ] `go test -count=1 ./...` and `go vet ./...` pass.
- [ ] `npm --prefix website run build` passes, or the evidence names the
      concrete blocker.
- [ ] The knowledge validator reports `ok: true` for this change with no
      uncovered new ID.
- [ ] Live discovery records the Command Code version, the six project skills
      and the Plane MCP server from `cmd skills list` and `cmd mcp list`.
- [ ] The evidence records actual commands and results and distinguishes
      static checks from live discovery.
- [ ] Reassess the final branch impact and name any consumer outside this plan.

## Evidence

Filled during implementation.
