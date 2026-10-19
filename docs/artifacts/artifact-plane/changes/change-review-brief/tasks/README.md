---
tasks:
  - 01-claims-reader.md
  - 02-claim-operations.md
  - 03-brief-service.md
  - 04-mockups.md
  - 05-change-page.md
  - 06-validation.md
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-review-brief/tasks/README.md#plan-self-check
---

# Change brief implementation plan

Six fresh tasks deliver the Plane side of the human-cognitive-support unit.

1. [Claims reader](01-claims-reader.md): parse claims and report their diagnostics in diagnose() and validate-knowledge.
2. [Claim operations](02-claim-operations.md): claim.record and claim.verify with the service channel, after task claims-reader.
3. [Brief service](03-brief-service.md): the brief operation, the packet field and the MCP tool, after task claims-reader.
4. [Mockups](04-mockups.md): align the prototype with the contract and obtain owner approval.
5. [Change page](05-change-page.md): the Change brief section, claim cards and the check form, after tasks claim-operations, brief-service and mockups.
6. [Validation](06-validation.md): combined checks, owner acceptance and the version, after task change-page.

## Sequence and parallelism

Task mockups can start right after plan approval. Tasks claims-reader, claim-operations and brief-service read the claim contract of ADD change-claim-records; they start only after ADD 2.9.0 establishes on main, and they recheck the contract first. Tasks claim-operations and brief-service change different modules and can run in parallel in separate worktrees. Task change-page waits for both and for the approved mockups.

## Approval and prerequisites

Present this plan for explicit user approval before implementation. Artifact Plane 1.19.0 and ADD 2.8.1 are established on main. The claim contract is proposed by change-claim-records in the same unit. The owner approves the mockups before task change-page starts. A material change to the brief fields, the ladder, the operations or the page requires renewed approval. After all tasks pass, the coordinator suggests version 1.20.0 (minor: a new review operation, two edit operations, a new MCP tool and an additive packet field; no route, tool or field is removed).

## Plan self-check

- Coverage: B1 and B10 → mockups and change-page; B2, B4, B5 and B9 → brief-service; B3 → brief-service (ladder data) and change-page (display); B6 → claims-reader; B7 → claim-operations; B8 → brief-service and change-page; B11 and P1–P7 → validation, with P1, P2 and P5 also in brief-service.
- The graph is valid: six listed tasks, unique IDs, prerequisites claims-reader → claim-operations, claims-reader → brief-service, claim-operations, brief-service and mockups → change-page, change-page → validation; no cycle. No artifact edge changes; depends_on stays [artifact-driven].
- The upstream gate (ADD 2.9.0 established) and the owner's mockup approval stay separate from task prerequisites.
- Each DoD item is observable by a test, a command, a measurement or an owner decision.
- KISS: one module, one service operation, two edit operations, one MCP tool; no store. STE: one check per DoD item.
- No blocker prevents implementation after approval.
