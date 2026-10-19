---
name: add-coordinator
description: Coordinate Artifact-Driven Development from user discovery through requirements, specifications, plan approval, parallel implementation, validation, and PR handoff. Use when driving an ADD change across knowledge and implementation repositories.
---

# ADD Coordinator

Drive an ADD change or unit of work from the request to PRs ready for team review. Artifacts and Git are the only state.

## Steps

1. **Discover.** Inspect artifacts, code, instructions, branches, remotes and uncommitted work, then interview the user about need, scope, outcomes and constraints. Ask only for facts that you cannot find. Do not invent domain facts or decisions.
2. **Assign the tier.** Apply the [small-tier criteria](../../../06-guidelines/change-tiers.md#small-tier-criteria) and record `tier` in the change README. When a criterion is unresolved, use medium.
3. **Drive the phases.** Start the artifact's single active change on a dedicated branch. Apply the PO skill for Requirement, then the TL skill for Specification and Plan in one capable session. Small: one knowledge commit. Medium and large: one commit per phase and a unit brief.
4. **Get approval.** Medium and large: present the plan, open claims first, and wait for explicit approval, which also confirms the compatibility level. Small: the user's request is the approval. Silence is not approval. A new plan or a material change needs new approval.
5. **Gate.** Dependent implementation waits until required upstream versions are established and internal prerequisites satisfy their DoD.
6. **Implement.** Give each independent task to an implementer in a new context with the task path, governing paths and DoD. Each parallel worker uses its own worktree and branch. Keep knowledge edits under your control. Integrate commits and run combined checks.
7. **Version.** Compute the number from the confirmed level and the protected `current_version`. Add the version record, update the identity record, push and open linked PRs. Stop for team review and merge.

Never commit to `main` or `master`, merge PRs or deploy. Send each blocker to its owner: requirement gaps to the PO, contract gaps to Specification, task gaps to Plan, code defects to Implementation.

## Self-check

- KISS: the scope and plan are the smallest that meet the need.
- KISS: no new state, registry, gate or unused option.
- STE: one instruction or fact in each sentence, in active voice.
- STE: each term has one meaning, and each fact is written once.
- STE: the text changes no technical meaning.
- The validator, when available, reports `ok: true` for the change.
- Tier, approval and upstream establishment come from evidence, not assumption.

Read the full `kiss` and `asd-ste-100` skills in `../../../required-skills/` when this checklist does not settle a case.

## Read when

| Condition | Read |
| --- | --- |
| You start, resume, lose context, or a required skill is missing | [Load and resume](reference.md#load-and-resume) |
| You identify repositories, artifacts or the knowledge layout | [Context](reference.md#context), [artifact model](../../../01-foundation/artifact-model.md) |
| A change is small, or you check its tier | [Change tiers](../../../06-guidelines/change-tiers.md), [minimal change](../../../06-guidelines/minimal-change.md), [small changes](reference.md#small-changes) |
| Work uses upstream contracts, or you check the task graph | [Gates](reference.md#gates) |
| You dispatch implementers or integrate their work | [Implementation](reference.md#implementation), [working with AI](../../../06-guidelines/working-with-ai.md#implementer-context) |
| You prepare a version, open PRs, or a repository has no remote | [Publication](reference.md#publication) |
| A unit brief is required | [Units of work](reference.md#units-of-work) |
| The change affects system journeys | [System flows](reference.md#system-flows) |
| You assess what a change can reach | [Change impact](../../../06-guidelines/change-impact.md) |
| A change adds a table, diagram or derived view | [Representations](reference.md#representations) |
| A decision, assumption or limit is consequential | [Claims](reference.md#claims) |
| Checks run across branches or repositories | [Continuous integration](../../../04-patterns/continuous-integration.md) |
| A PR of a change merged | [After merge](../../../06-guidelines/runbooks.md#after-merge) |
| The protected branch moved after you prepared the version record | [Renumber](../../../06-guidelines/runbooks.md#renumber) |
| After plan approval, knowledge is wrong, a claim is refuted or the scope changes | [Amendment](../../../06-guidelines/runbooks.md#amendment) |
| The owner withdraws or pauses a change | [Stop](../../../06-guidelines/runbooks.md#stop) |
| An established version has a defect or must be undone | [Reverse](../../../06-guidelines/runbooks.md#reverse) |
| A DoD item needs a live harness, a running interface or a relaxed permission | [Live check](../../../06-guidelines/runbooks.md#live-check) |
| A required check fails | [Failed check](../../../06-guidelines/runbooks.md#failed-check) |
