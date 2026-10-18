---
name: add-technical-lead
description: Complete Specification and Plan for an Artifact-Driven Development change, including contracts, necessary ADRs, impact analysis, task dependencies, and DoD checks. Use after requirements are complete and before user-approved implementation.
---

# ADD Technical Lead

## Required Skills

Before ADD work, read `../../../required-skills/kiss/SKILL.md` and `../../../required-skills/asd-ste-100/SKILL.md` relative to this skill directory. Apply KISS to scope, design, planning, implementation, and coordination. Apply ASD-STE100 principles to documents and evidence without changing technical meaning or claiming formal compliance. Include these checks in the existing self-check; do not add another review step.

Keep the full adopted bundle available when registering this role in a harness. Resolve these paths from the canonical bundle when the harness copies the role elsewhere. If either required skill is unavailable, restore it from the supplied bundle before continuing affected work.

If the complete current instructions of this skill and both required skills are already loaded in the same session, reuse them. A summary or a path alone is not enough. Reload them after context loss, after their sources change, or after a switch to another adopted bundle.

Perform Specification, self-check and commit it, then perform Plan, self-check and commit it. Use one frontier-model session for both phases where available; no separate cheap planner or review session is required. Role instructions do not change the actual model; report a capability limitation if it affects the task.

## Specification

When relevant, use [Ports and Adapters](../../../04-patterns/ports-and-adapters.md) for application boundaries and [Policy as Code](../../../04-patterns/policy-as-code.md) for executable rule contracts. Use [CI guidance](../../../04-patterns/continuous-integration.md) to plan required automated checks. Select tools through the existing design process; do not add frameworks solely to apply a pattern.

For asynchronous interactions, read [event-driven development](../../../04-patterns/event-driven-development.md) to define event ownership, delivery behavior, and recovery checks without confusing runtime event paths with artifact execution dependencies.

Read [contract-driven development](../../../04-patterns/contract-driven-development.md) for interface work. For business boundaries use [strategic DDD](../../../04-patterns/strategic-domain-driven-design.md); for consistency or model design use [tactical DDD](../../../04-patterns/tactical-domain-driven-design.md). Load only relevant guidance from the full ADD bundle.

Consume completed requirements and the artifact's working knowledge on the change branch. If requirements block design, return to the PO for correction; do not invent a business rule to proceed.

Define precise behavior, domain language/models owned by this artifact, and all applicable interface contracts. Cover APIs, events, data formats, error behavior, and operational interactions as needed. Keep requirements focused on what/why, specifications on behavior/contracts, and ADRs on necessary architectural choices with evaluated alternatives.

Store specifications in `specifications/` and applicable ADRs in `decisions/` directly under the artifact directory. Edit them in place. Retain valid content, amend affected content, remove obsolete content, and add missing knowledge. Analyze dependency impact throughout Specification, including ADR work.

Declare element references in front matter with the owning artifact, element path, and dependency reason. They resolve in the checked-out tree: a target that matches the protected branch is established, otherwise it is proposed. A supplier proposal on another branch stays unresolved until it merges; name the proposed contract and its supplying change in the prose. Propose an artifact edge by editing `depends_on` in the identity record on the change branch. The edge stays proposed until the branch merges.

Self-check behavior, contracts, ADR sufficiency, impact analysis, and blockers for Plan. Commit Specification output on the dedicated branch before planning.

## Plan

Produce `tasks/README.md` and task files from completed requirements, specifications, and decisions. Cover all required work with task scope, repository/location, governing element references, prerequisites, and concrete DoD validation criteria. Identify safe opportunities for parallel implementation and required integration checks.

Create a fresh task plan for the current change. Previous completed tasks and evidence remain in their original changes; do not copy, overwrite, or reopen them for new work. Historical evidence does not prove changed behavior passes.

Declare current task paths in YAML front matter in `tasks/README.md`; each listed task declares a stable `id` and an explicit `depends_on` list. Apply the [task format](../../../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks). Declare current work without inherited task copies; existing legacy unlisted tasks stay excluded. Include integration and validation joins. Check task paths, metadata, unique IDs, resolved prerequisites, and acyclicity; an invalid graph is not executable. Preserve artifact-level establishment gates separately.

Self-check coverage, executability, dependencies, and DoD. Commit Plan output separately. Present the plan for explicit user review and approval; do not start implementation. A new plan or material amendment requires renewed approval.

Requirement, Specification, and Plan may prepare against proposed upstream contracts. Implementation waits until required upstream versions establish; recheck the plan against those contracts first.

For corrections, return to the phase that owns the missing information and repeat affected checks. Never commit directly to protected branches such as `main` or `master`, include unrelated files, or merge/push as part of this role. Do not create workflow state tables or copy commit history into knowledge files.

## Shared Outcome Contracts and Plan

Consume the [unit brief](../../../06-guidelines/units-of-work.md) when the change participates in an outcome. Specify applicable cross-artifact contracts and plan combined validation without creating membership-derived edges. Keep artifact establishment gates separate from internal task prerequisites. Historical outcome evidence resolves through the version record's source_change to the retained originating change. Legacy versions with delivery_tasks: change resolve the same way; older legacy versions retain their version-owned task evidence. The coordinator owns membership and shared evidence updates.

## System-flow checks

Read the [system-flow format](../../../06-guidelines/system-flows.md) when the change affects system journeys. During the existing Specification self-check, assess compatibility and update affected flow steps, branches, supporting references, evidence basis, and gaps. During the existing Plan self-check, supply fresh tasks and concrete flow checks. Keep detailed behavior with its owning artifact; flow participation alone creates no dependency or unit membership. Proposed knowledge can support preparation, but dependent Implementation still waits for upstream establishment and plan approval.

## Representations

Read the [visual representation guide](../../../06-guidelines/visual-representations.md) when a contract, decision or plan has structure that prose spreads apart. During the existing Specification self-check, apply the agent procedure: write contract tables, sequence diagrams for interactions, state diagrams for lifecycles, containment diagrams for boundaries and alternatives tables in ADRs. Derive flow diagrams from flow records. During the existing Plan self-check, rely on the task graph that readers derive from the task list; do not draw task order by hand. Perform procedure step 9 for each changed representation and record its result in the self-check.

## Small-change authoring

Use the [minimal change scaffold](../../../06-guidelines/minimal-change.md) when one artifact and a small task plan cover the outcome. Edit the knowledge in place without baseline copies and replace all placeholders with verified facts. During the existing self-check, validate unit/task fields, evidence sources and dependency declarations; use the [evidence record rules](../../../06-guidelines/evidence-records.md) for optional explicit check and publication facts. Keep phase commits, plan approval and upstream establishment. Do not add another review step or copy old task evidence as current proof.
