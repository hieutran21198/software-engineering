---
id: fixture
depends_on: []
---

# AWS fixture repository

## Scope and ownership

Implementer. Add test/browser/fixtures/diagram-scopes/ and the helper that builds a Git repository from it for browser tests. Governing section: [Fixture repository](../../../specifications/diagram-scopes.md#fixture-repository). Its knowledge mirrors the established example page of the ADD member.

## Definition of Done

- [ ] The fixture has the in-place artifacts `platform`, `storefront`, `ordering` and `payments` with identity records, and `ordering` has the flow record `place-order`.
- [ ] platform/specifications/system-overview.md declares `system_view: true` and holds the three system views with owner tables whose links resolve in the fixture.
- [ ] `ordering` holds the sequence, state and data model views, one `Stale:` line, one block without a source line, one illustrative block, one icon name outside the set and one label longer than 60 characters.
- [ ] `payments` has no diagram.
- [ ] The helper creates the repository with a local `main` branch, and the fixture passes validate-knowledge without an error.

## Evidence

Pending.
