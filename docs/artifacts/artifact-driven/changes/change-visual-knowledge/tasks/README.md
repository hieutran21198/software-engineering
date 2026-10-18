---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-visual-knowledge/tasks/README.md#plan-self-check
tasks:
  - 01-foundation.md
  - 02-guideline.md
  - 03-role-skills.md
  - 04-worked-examples.md
  - 05-validation.md
---

# Visual knowledge plan

1. [Write the foundation page and the new principle](01-foundation.md)
2. [Write the representation guideline and the navigation edits](02-guideline.md)
3. [Add the Representations sections to the role skills and the AI guide](03-role-skills.md), after task guideline
4. [Build the worked examples from this repository's artifacts](04-worked-examples.md), after task guideline
5. [Validate the combined change](05-validation.md), after all other tasks

Tasks foundation and guideline edit disjoint files and can run concurrently in separate worktrees; the coordinator keeps both bundle copies central. Sequential execution is valid. The TL performed Specification and Plan in this session.

## Approval and prerequisites

Present this plan for explicit user approval before implementation. No upstream artifact is required. A material change to the principles, the categories, the selection guide or the page ownership requires renewed approval.

Sequencing with a concurrent change: branch claude/impact-intelligence carries the artifact-driven change change-impact-semantics with a prepared 2.7.0 version record and edits to the change-delivery flow and the guideline index. ADD keeps one active change per artifact, so the two changes merge in sequence. If change-impact-semantics lands on main first, rebase this branch, keep both flow support records and both index rows, and prepare 2.8.0; otherwise this change prepares 2.7.0 and the other change rebases. The coordinator repeats the link, parity and validate-knowledge checks after a rebase.

After all tasks pass, the coordinator suggests the version (a compatible minor release: it adds guidance and changes no rule), adds the version record and the unit evidence, and opens one PR. Publishing a release tag is outside this change.

## Plan self-check

V1 and AV1 map to task foundation. V2, V3, V4 (rules and procedure), V5, V6, V7, V9 and V10 map to task guideline. V4 (role instructions) and AV4 map to task role-skills. V8 and AV3 map to task worked-examples. AV2 to AV6 map to task validation on the combined result. The graph has five listed tasks, unique IDs and six edges (guideline to role-skills, guideline to worked-examples, and the four edges into validation); it has no cycle. No artifact edge changes. KISS: one editing task per page group and one validation join; the examples are derived with the same script that the validation count check uses. STE: each DoD item names one observable check. Plan approval is the only unresolved user decision before implementation.
