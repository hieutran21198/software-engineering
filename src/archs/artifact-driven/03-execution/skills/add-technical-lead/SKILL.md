---
name: add-technical-lead
description: Complete Specification and Plan for an Artifact-Driven Development change, including contracts, necessary ADRs, impact analysis, task dependencies, and DoD checks. Use after requirements are complete and before user-approved implementation.
---

# ADD Technical Lead

Perform Specification, self-check and commit it, then perform Plan, self-check and commit it. Use one frontier-model session for both phases where available; no separate cheap planner or review session is required. Role instructions do not change the actual model; report a capability limitation if it affects the task.

## Specification

When relevant, use [Ports and Adapters](../../../04-patterns/ports-and-adapters.md) for application boundaries and [Policy as Code](../../../04-patterns/policy-as-code.md) for executable rule contracts. Use [CI guidance](../../../04-patterns/continuous-integration.md) to plan required automated checks. Select tools through the existing design process; do not add frameworks solely to apply a pattern.

For asynchronous interactions, read [event-driven development](../../../04-patterns/event-driven-development.md) to define event ownership, delivery behavior, and recovery checks without confusing runtime event paths with artifact execution dependencies.

Read [contract-driven development](../../../04-patterns/contract-driven-development.md) for interface work. For business boundaries use [strategic DDD](../../../04-patterns/strategic-domain-driven-design.md); for consistency or model design use [tactical DDD](../../../04-patterns/tactical-domain-driven-design.md). Load only relevant guidance from the full ADD bundle.

Consume completed requirements and the copied established baseline in the active change. If requirements block design, return to the PO for correction; do not invent a business rule to proceed.

Define precise behavior, domain language/models owned by this artifact, and all applicable interface contracts. Cover APIs, events, data formats, error behavior, and operational interactions as needed. Keep requirements focused on what/why, specifications on behavior/contracts, and ADRs on necessary architectural choices with evaluated alternatives.

Store specifications in `specifications/` and applicable ADRs in `decisions/`. Retain valid content, amend affected content, remove obsolete content, and add missing knowledge. Analyze dependency impact throughout Specification, including ADR work.

Element references identify the owning artifact, element path, and dependency reason. Resolve established references through the owner's current version. Mark proposed upstream contracts and their supplying active change explicitly. Propose artifact edge updates in the active change's `dependencies.yaml`; do not update established root dependencies early.

Self-check behavior, contracts, ADR sufficiency, impact analysis, and blockers for Plan. Commit Specification output on the dedicated branch before planning.

## Plan

Produce `tasks/README.md` and task files from completed requirements, specifications, and decisions. Cover all required work with task scope, repository/location, governing element references, prerequisites, and concrete DoD validation criteria. Identify safe opportunities for parallel implementation and required integration checks.

Keep applicable completed tasks as historical context; revise or remove obsolete tasks and add new work. Historical evidence does not prove changed behavior passes. Do not reopen unaffected completed tasks without a reason.

Self-check coverage, executability, dependencies, and DoD. Commit Plan output separately. Present the plan for explicit user review and approval; do not start implementation. A new plan or material amendment requires renewed approval.

Requirement, Specification, and Plan may prepare against proposed upstream contracts. Implementation waits until required upstream versions establish; recheck the plan against those contracts first.

For corrections, return to the phase that owns the missing information and repeat affected checks. Never commit directly to protected branches such as `main` or `master`, include unrelated files, or merge/push as part of this role. Do not create workflow state tables or copy commit history into knowledge files.
