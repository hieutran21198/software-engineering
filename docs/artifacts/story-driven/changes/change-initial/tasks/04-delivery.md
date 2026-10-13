---
id: delivery
depends_on: [examples]
---

# Adoption and documentation integration

## Scope and location

Repository: software-engineering. Embed the bundle, register the catalog, document adoption, and update CLI/repository/website discovery.

## Governing knowledge

- [Requirements](../requirements/framework.md)
- [Specification](../specifications/framework.md)
- [Decision](../decisions/001-shared-knowledge.md)

## Prerequisites

The declared internal prerequisites must satisfy their DoD. The user has approved this scope. No external establishment gate applies.

## Definition of Done

- [x] Verify filesystem completeness, all Markdown links and hierarchy, architecture selection/listing, custom output, dry run, repeated adoption and consumer conflict protection.

## Evidence

`GOCACHE=/tmp/story-driven-go-cache go test ./...` passed, including filesystem invariants, source/bundle fidelity, canonical utility mounting, portable targets/anchors, downward navigation, creative skill discovery, and actual CLI adoption behavior. Tests cover listing, selection, default/custom output, no-write dry run, repeat adoption and preflight preservation of consumer edits. `go vet` and the CLI build passed with the same writable cache. Two fresh temporary projects adopted all 58 files without any source workspace dependency. The website production build passed. Existing ADD adoption prose was updated only to remove the obsolete single-architecture claim, consistently in canonical and packaged guidance; no ADD contract or snapshot changed. KISS and clear technical writing checked.
