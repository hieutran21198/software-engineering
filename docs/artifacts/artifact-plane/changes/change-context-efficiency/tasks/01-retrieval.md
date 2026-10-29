---
id: retrieval
depends_on: []
covers:
  - element: requirements/context-efficiency.md
    ids: [CE1, CE2, CE3, CE4, CEA1, CEA2]
---

# Compact and delta service with adapters

## Scope and ownership

Sequential implementer, coordinated in this checkout. apps/artifact-plane/server, scripts and relevant Node and adapter tests.

## Governing knowledge

requirements/context-efficiency.md and specifications/context-efficiency.md. Existing ADD boundaries and approval rules apply. The combined plan was explicitly approved in the conversation before implementation.

## Definition of Done

- [x] Implement the governed behavior and preserve legacy behavior.
- [x] Run relevant tests and record actual results, distinguishing incomplete live checks.
- [x] Check integrated validation and preserve source, evidence and approval uncertainty.

## Evidence

The full Node suite passed 585 tests with no failures and one optional pinned-model skip. After the final compact evidence projection, the focused compact, real HTTP/stdio adapter and benchmark suites passed 18 tests with no skips. Checks cover whole-response caps, Unicode fragments, source reconstruction, zero budget, cursor binding, expiry/eviction/restart, repository isolation, dirty-file edits, deletions, protected-ref movement and stale-response rejection. Legacy HTTP/MCP parity remains covered.

`npm run build:validator`, `npm run build`, `go test ./...`, `go vet ./...` and the CLI build passed. Both artifact-scoped record validators report ok true with no diagnostics. A real local HTTP request for this change returned 200, compact schema, fresh input, explicit approval uncertainty and a continuation at 3,583 bytes under a 4,096-byte cap. The probe preceded the final evidence projection, which has independent adapter coverage. No assertion treats a PID or port as a functional check.
