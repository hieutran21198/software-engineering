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

- [x] Claim `antigravity-hook-adapter` in `specifications/agent-integration.md` is verified with recorded test evidence.
- [x] `npm test` and `npm run build` in `apps/artifact-plane/` pass.
- [x] `node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-plane/change-antigravity-support` reports `ok: true` with 0 errors.
- [x] Combined unit evidence is recorded in `docs/artifacts/units-of-work/antigravity-support/README.md`.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Claim `antigravity-hook-adapter` | Verified in `docs/artifacts/artifact-plane/specifications/agent-integration.md` (`status: verified`, `basis: observed`, `verified_by: agent`) from `test/agent-hook.test.js` (`AIA1`, `AIA8`), `test/runtime-binding.test.js` and live Antigravity `PreToolUse` execution in this workspace | Passed |
| Plane test and build suites | `npm --prefix apps/artifact-plane test`, `npm --prefix apps/artifact-plane run build` and `node apps/artifact-plane/scripts/check-release-version.mjs plane-v1.26.0` pass | Passed |
| Knowledge validator | `node apps/artifact-plane/scripts/validate-knowledge.mjs --change artifact-plane/change-antigravity-support` and full repository validation report `ok: true` with 0 errors | Passed |
| Combined unit evidence and version | `docs/artifacts/units-of-work/antigravity-support/README.md` records passing evidence for all four acceptance criteria; `versions/1.26.0/README.md` (`artifact-plane`, renumbered after `origin/main` 1.25.0) and `versions/3.2.0/README.md` (`artifact-driven`) are prepared | Passed |
