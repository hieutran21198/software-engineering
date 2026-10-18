---
id: guidance
depends_on: []
evidence_records: []
---

# Rewrite the adoption guidance in both bundle copies

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files, each in docs/artifact-driven and then copied to src/archs/artifact-driven:

- 05-adoption/README.md
- 06-guidelines/adopting-from-git.md
- 06-guidelines/getting-started.md
- 06-guidelines/working-with-ai.md
- 06-guidelines/README.md
- README.md (bundle overview)

No Go, website or Artifact Plane file changes.

## Governing knowledge

G1–G3 in requirements/adoption-guidance.md; specifications/adoption-guidance.md (page ownership, release selection, After Adoption, agent-ready request).

## Prerequisites

Explicit user approval of this plan. No upstream artifact is required.

## Definition of Done

- [ ] 05-adoption/README.md has the release paragraph and both scripts of the release-selection contract, keeps the headings Download the Binary and Adopt, and adds After Adoption with the five ordered steps, their links and the authorization statement. The Result paragraphs about the coordinator skill and AI-assisted setup are removed.
- [ ] adopting-from-git.md has no command block, links to the Download the Binary, Adopt and After Adoption sections, and contains the request with the two contract edits. Its blocker and authorization rules stay.
- [ ] getting-started.md has no se-adopt command and links to the adoption guide; working-with-ai.md links to the agent-ready request; the guide index and the bundle overview rows match the contract.
- [ ] No bundle page uses a fixed past release tag as an example default.
- [ ] Each changed file in src/archs/artifact-driven is byte-identical to its docs/artifact-driven source.

## Evidence

Implementation has not started.
