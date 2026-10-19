---
id: validation
depends_on: [readers, record-checks, tier-check, validator-build, operations, description]
---

# Validation

## Scope and ownership

Coordinator. Combined checks of the Plane change, the unit criteria that need the Plane, the owner look at the change page, and the version record.

## Governing knowledge

requirements/delivery-improvements.md, PA1 to PA6; the unit brief docs/artifacts/units-of-work/delivery-improvements/README.md; docs/artifacts/units-of-work/framework-comparison/scores.md (anchors).

## Prerequisites

Tasks readers, record-checks, tier-check, validator-build, operations and description.

## Definition of Done

- [ ] `npm test`, the browser suite twice, `go test ./...` after the validator build, the website build and `npm run validate` on this repository pass.
- [ ] The small-path unit criterion is checked again with the new validator on the replay of artifact-driven task small-replay.
- [ ] The installed validator of a fresh adoption finds each seeded defect (unit criterion validator).
- [ ] The owner looked at screenshots of the change page at 1440 and 390 pixels before the version.
- [ ] ADD is rescored with the anchors of the framework-comparison scores; each raised score names the delivered mechanism, and the total is recorded in the unit evidence (unit criterion scores).
- [ ] The unit brief evidence covers every criterion; the version record `versions/1.21.0/README.md` and `current_version: 1.21.0` are prepared.

## Evidence

Not recorded.
