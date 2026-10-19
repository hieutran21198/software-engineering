---
id: validation
depends_on: [bundle-source, tier-guidance, role-skills, repository-setup, small-replay]
---

# Validation

## Scope and ownership

Coordinator. Combined checks of the ADD change, the unit evidence of the criteria that the ADD change can support, and the version record.

## Governing knowledge

requirements/delivery-improvements.md, A1 to A7 and DI15; the unit brief docs/artifacts/units-of-work/delivery-improvements/README.md.

## Prerequisites

Tasks bundle-source, tier-guidance, role-skills, repository-setup and small-replay.

## Definition of Done

- [ ] `go test ./...`, `go vet ./...` and `npm run build` in website pass on the combined branch; the release build archive lists the full bundle and `tools/README.md`.
- [ ] The Plane validator reports no new error on this repository (A5).
- [ ] For each of the five guarantees, a row in the evidence names the contract statement or check that holds it for small, medium and large changes (A6).
- [ ] A configuration fixture with a changed `max_code_lines` changes the result of the code-limit criterion when the rule is applied by hand; the automated check moves to the Plane validator (A7).
- [ ] The unit brief evidence records the reading and guarantees criteria from task evidence; the version record `versions/3.0.0/README.md` and `current_version: 3.0.0` are prepared after the owner confirmed the major level.

## Evidence

Not recorded.
