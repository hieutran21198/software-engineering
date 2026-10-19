---
id: validation
depends_on: [readers, record-checks, tier-check, validator-build, operations, description]
covers:
  - element: requirements/delivery-improvements.md
    ids: [PI8, PA6]
---

# Validation

## Scope and ownership

Coordinator. Combined checks of the Plane change, the unit criteria that need the Plane, the owner look at the change page, and the version record.

## Governing knowledge

requirements/delivery-improvements.md, PA1 to PA6; the unit brief docs/artifacts/units-of-work/delivery-improvements/README.md; docs/artifacts/units-of-work/framework-comparison/scores.md (anchors).

## Prerequisites

Tasks readers, record-checks, tier-check, validator-build, operations and description.

## Definition of Done

- [x] `npm test`, the browser suite twice, `go test ./...` after the validator build, the website build and `npm run validate` on this repository pass.
- [x] The small-path unit criterion is checked again with the new validator on the replay of artifact-driven task small-replay.
- [x] The installed validator of a fresh adoption finds each seeded defect (unit criterion validator).
- [ ] The owner looked at screenshots of the change page at 1440 and 390 pixels before the version.
- [x] ADD is rescored with the anchors of the framework-comparison scores; each raised score names the delivered mechanism, and the total is recorded in the unit evidence (unit criterion scores).
- [ ] The unit brief evidence covers every criterion; the version record `versions/1.21.0/README.md` and `current_version: 1.21.0` are prepared.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Combined checks | On the branch tip after all merges: `npm test` 409 tests, 408 passed, 0 failed, 1 skipped; `npm run build` exits 0; `npm run test:browser` twice, 108 passed each time; `npm run build:validator`, then `go test ./...` and `go vet ./...` pass; `npm run build` in website exits 0; `npm run validate` on this repository exits 0 with `ok: true`, 0 errors, one information diagnostic and one warning (`open-change-conflict`: the stale local branch claude/human-cognitive-support-old) | Passed |
| Small path (unit criterion small-path) | The validator of a fresh adoption (`se-adopt` built with the release command after `npm run build:validator`, 53 files) on the small-tier replay of #37 (ADD task small-replay) with `--change artifact-plane/change-hidden-tab-streams`: exit 0, `ok: true`, 0 errors, declared small and allowed small; the replay of #34 gives the same. With the replay counts (9 files, 130 lines, 2 commits, 1 gate) the criterion holds | Passed |
| Seeded defects (unit criterion validator) | The same adopted validator on the seeded fixture of task record-checks finds all 13 codes at their seeded paths (12 record codes and `tier-mismatch`); task validator-build shows that the built file and the Plane entry point give byte-identical JSON on the fixtures; on this repository both report no error | Passed |
| Owner look | Screenshots of the change page of change-delivery-improvements at 1440 and 390 pixels, from a disposable clone of this branch | Waiting for the owner |
| Rescore (unit criterion scores) | docs/artifacts/units-of-work/framework-comparison/scores.md, Rescore after delivery: ADD 39 to 48 of 55; Requirements, Living knowledge, Change management, Traceability, Validation and review, Extensibility, Low overhead and Human comprehension and control rise, each with its mechanism | Passed |

Flow reconciliation at Version: the impact service on this branch reaches five Plane flows that the unit does not declare; the unit brief records why their steps stay (claim plane-reached-flows-kept). On this repository the record checks add about 0.45 s to a 2.55 s exploration.
