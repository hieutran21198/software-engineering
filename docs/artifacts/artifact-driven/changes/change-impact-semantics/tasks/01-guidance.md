---
id: guidance
depends_on: []
---

# Guidance

## Scope and ownership

Own the bundle pages that explain change impact: docs/artifact-driven/01-foundation/definitions.md (the impact-analysis row), the new docs/artifact-driven/06-guidelines/change-impact.md, the row in docs/artifact-driven/06-guidelines/README.md, and the identical copies under src/archs/artifact-driven. Drafts prepared during research exist outside the repository and are applied, not rewritten.

## Governing knowledge

specifications/change-impact.md, sections Tiers, Propagation rules, Coverage statement, Phase use and Authoring. requirements/change-impact.md, M5, M6 and A3.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [ ] The impact-analysis definition names the five tiers, the relationship path, the evidence and the coverage of the analysis, and changes nothing else in the table.
- [ ] 06-guidelines/change-impact.md explains how to ask, how to read each tier and the verify and investigate lists, how each phase uses the answer, the two optional declarations that raise precision, and the limits; it links no parent page.
- [ ] The guideline index lists the new page in alphabetical position with a one-line purpose.
- [ ] Both bundle copies are identical for the three files, every relative link resolves, and `go test ./...` passes with the new page embedded.
- [ ] The website builds with the new page.

## Evidence

No checks have run.
