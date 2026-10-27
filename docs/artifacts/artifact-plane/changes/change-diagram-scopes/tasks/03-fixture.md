---
id: fixture
depends_on: []
---

# AWS fixture repository

## Scope and ownership

Implementer. Add test/browser/fixtures/diagram-scopes/ and the helper that builds a Git repository from it for browser tests. Governing section: [Fixture repository](../../../specifications/diagram-scopes.md#fixture-repository). Its knowledge mirrors the established example page of the ADD member.

## Definition of Done

- [x] The fixture has the in-place artifacts `platform`, `storefront`, `ordering` and `payments` with identity records, and `ordering` has the flow record `place-order`.
- [x] platform/specifications/system-overview.md declares `system_view: true` and holds the three system views with owner tables whose links resolve in the fixture.
- [x] `ordering` holds the sequence, state and data model views, one `Stale:` line, one block without a source line, one illustrative block, one icon name outside the set and one label longer than 60 characters.
- [x] `payments` has no diagram.
- [x] The helper creates the repository with a local `main` branch, and the fixture passes validate-knowledge without an error.

## Evidence

An implementer delivered commit f07b65a on branch claude/diagram-scopes-03-fixture; the coordinator merged it (a27a2ca).

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Four artifacts and the flow | Validator output and the Node test | platform, storefront, ordering and payments are in-place 1.0.0; ordering has the flow `place-order` | apps/artifact-plane/test/diagram-scopes-fixture.test.js |
| System view document | The Node test parses `system_view` (boolean, one file), the three `accTitle` lines, a `Source:` line after each view, three owner tables and every relative link; a copy with one broken link makes the validator report `link-broken` | All pass; the owner table links reach storefront, ordering and payments | same test file |
| Ordering views and cases | The Node test and a script over the icon names against the 65 `logos` and 24 `lucide` names of the ADD guide | Sequence, state and data model views; one `Stale:` line after the state source line; one block without a source line (orders-api.md, Idempotency check); one illustrative block with `logos:aws-bedrock` and a 66-character label; every other icon is in the set | same test file |
| Payments without diagrams | The Node test looks for a Mermaid fence in every payments file | None | same test file |
| Helper and validator | The Node test builds the repository, checks the branch `main` and runs `node scripts/validate-knowledge.mjs --repository <root>` | Branch `main`; exit 0, `ok: true`, 0 diagnostics | same test file |

All 8 fixture blocks pass `mermaid.parse` and `mermaid.render` with Mermaid 11.17.2 and the Plane options in Chromium. `npm test`: 559 tests, 558 pass, 0 fail, 1 skipped.
