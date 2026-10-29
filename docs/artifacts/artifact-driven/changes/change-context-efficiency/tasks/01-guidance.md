---
id: guidance
depends_on: []
covers:
  - element: requirements/context-efficiency.md
    ids: [CE1, CE2, CE3, CE4, CEA1, CEA2]
---

# Selective guidance and profiles

## Scope and ownership

Sequential implementer, coordinated in this checkout. Canonical ADD role cores, references, working-with-ai guidance, AGENTS.md and project role profiles.

## Governing knowledge

requirements/context-efficiency.md and specifications/context-efficiency.md. Existing ADD boundaries and approval rules apply. The combined plan was explicitly approved in the conversation before implementation.

## Definition of Done

- [x] Implement the governed behavior and preserve legacy behavior.
- [x] Run relevant tests and record actual results, distinguishing incomplete live checks.
- [x] Check integrated validation and preserve source, evidence and approval uncertainty.

## Evidence

`go test ./...` and `go vet ./...` passed. The embedding tests exercise the canonical bundle and its retained references. Inspection confirmed all four role cores use selective entry, profiles retain inherited permissions/model and conditional KISS/STE reads, and handoffs retain DoD/prerequisite/approval context. AGENTS.md plus the four Codex profiles decreased from 9,656 to 7,950 bytes (17.7%); this is an instruction-byte proxy, not a model-token result. The artifact-scoped validator reports ok true with no diagnostics. The user's approved combined plan supplies authorization; no gate is inferred from a packet.
