---
id: validation
depends_on: [configuration-and-guides]
covers:
  - element: requirements/agent-integration.md
    ids: [AIA1, AIA7, AIA8, AIA9]
---

# Validation

## Scope and ownership

Coordinator. Claim verification (`antigravity-hook-adapter`), `npm test` and `npm run build` in `apps/artifact-plane`, knowledge validation and combined unit evidence in `docs/artifacts/units-of-work/antigravity-support/README.md`.

## Governing knowledge

`specifications/agent-integration.md`: Validation; `docs/artifacts/units-of-work/antigravity-support/README.md`.

## Definition of Done

- [ ] Claim `antigravity-hook-adapter` in `specifications/agent-integration.md` is verified with recorded test evidence.
- [ ] `npm test` and `npm run build` in `apps/artifact-plane/` pass.
- [ ] `node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-plane/change-antigravity-support` reports `ok: true` with 0 errors.
- [ ] Combined unit evidence is recorded in `docs/artifacts/units-of-work/antigravity-support/README.md`.
