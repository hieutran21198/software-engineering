---
id: tier-check
depends_on: [record-checks]
---

# Tier check

## Scope and ownership

Implementer, `apps/artifact-plane/server/tier-check.js`. Return the tier object for one change with each criterion decided as the Tier check table states, using the impact service for impact-contained in the Plane services and `coordinator` in the standalone validator. Report `tier-mismatch`.

## Governing knowledge

specifications/delivery-support.md (Tier check); artifact-driven specifications/delivery-tiers.md (Small-tier criteria); requirements/delivery-improvements.md, PI5 and PA4.

## Prerequisites

Task record-checks.

## Definition of Done

- [ ] Fixtures from the knowledge and code of #34 and #37 give allowed `small`; #36 gives `large` or `medium` with the failing criteria named.
- [ ] Without an impact index, impact-contained is `unresolved` in the services and `coordinator` in the standalone validator, and no index is built by the validator.
- [ ] `npm test` passes.

## Evidence

Not recorded.
