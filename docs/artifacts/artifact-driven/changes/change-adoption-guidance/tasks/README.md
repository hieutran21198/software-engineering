---
tasks:
  - 01-guidance.md
  - 02-validation.md
---

# Adoption guidance plan

1. [Rewrite the adoption guidance in both bundle copies](01-guidance.md)
2. [Validate the combined change](02-validation.md), after task guidance

## Approval and prerequisites

Present this plan for explicit user approval before implementation. No upstream artifact is required. A material change to scope, page ownership or the release-selection contract requires renewed approval.

After both tasks pass, the coordinator suggests the version, adds the version record and the unit evidence, and opens one PR. Publishing a release tag that ships the new guidance is outside this change.

## Plan self-check

Task guidance covers G1–G3 and the page ownership, release selection, After Adoption and request edits of the contract. Task validation covers G4 and AG1–AG4 on the combined result. The graph has two listed tasks, unique IDs and one edge (guidance → validation); it has no cycle. No artifact edge changes. KISS: one editing task and one validation join; no parallel worker is useful, because both bundle copies must receive the same bytes. STE: each DoD item names one observable check.
