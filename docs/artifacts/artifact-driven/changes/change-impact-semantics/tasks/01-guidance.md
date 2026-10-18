---
id: guidance
depends_on: []
evidence_records:
  - id: guidance-checks
    method: Link and hierarchy check of the three pages, cmp of both bundle copies, go test ./..., go vet ./..., npm run build in website
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-impact-semantics/tasks/01-guidance.md#guidance-checks
---

# Guidance

## Scope and ownership

Own the bundle pages that explain change impact: docs/artifact-driven/01-foundation/definitions.md (the impact-analysis row), the new docs/artifact-driven/06-guidelines/change-impact.md, the row in docs/artifact-driven/06-guidelines/README.md, and the identical copies under src/archs/artifact-driven. Drafts prepared during research exist outside the repository and are applied, not rewritten.

## Governing knowledge

specifications/change-impact.md, sections Tiers, Propagation rules, Coverage statement, Phase use and Authoring. requirements/change-impact.md, M5, M6 and A3.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [x] The impact-analysis definition names the five tiers, the relationship path, the evidence and the coverage of the analysis, and changes nothing else in the table.
- [x] 06-guidelines/change-impact.md explains how to ask, how to read each tier and the verify and investigate lists, how each phase uses the answer, the two optional declarations that raise precision, and the limits; it links no parent page.
- [x] The guideline index lists the new page in alphabetical position with a one-line purpose.
- [x] Both bundle copies are identical for the three files, every relative link resolves, and `go test ./...` passes with the new page embedded.
- [x] The website builds with the new page.

## Evidence

### guidance-checks

Checked on 18 October 2026 in the worktree of branch claude/impact-intelligence after the merge of main at 126990d (Artifact Plane 1.17.1). The definitions row keeps its first two sentences and adds one sentence that names the five tiers, the relationship path, the evidence and the coverage. The guideline has the sections Ask the question, Read the tiers (a table of the five tiers with what to do, plus the Verify and Investigate lists and the coverage statement), Use the answer in each phase, Keep the answer precise without a manual graph, and Limits; it links only the guideline directory. The index row sits after System flows. A link check of the three pages resolved every relative link; a search for parent links in the guideline found none. `cmp` reported the three files identical between docs/artifact-driven and src/archs/artifact-driven. `go test ./...`: ok for cmd/se-adopt, internal/adopt, src/archs/artifact-driven and src/archs/story-driven; `go vet ./...` clean. `npm run build` in website exited 0 with the new page.
