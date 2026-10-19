# ADD Technical Lead reference

The Technical Lead reads a section of this page when its condition in the skill's Read-when table is true.

## Load and resume

Read the skill core before ADD work. Apply the KISS and STE checklist of the core in the existing self-check; read `../../../required-skills/kiss/SKILL.md` and `../../../required-skills/asd-ste-100/SKILL.md`, relative to the skill directory, when the checklist does not settle a case. Apply ASD-STE100 principles without changing technical meaning or claiming formal compliance. Do not add another review step.

Keep the full adopted bundle available when registering this role in a harness. Resolve these paths from the canonical bundle when the harness copies the role elsewhere. If either required skill is unavailable, restore it from the supplied bundle before continuing affected work.

If the complete current instructions of this skill are already loaded in the same session, reuse them. A summary or a path alone is not enough. Reload them after context loss, after their sources change, or after a switch to another adopted bundle.

Use one frontier-model session for Specification and Plan where available; no separate cheap planner or review session is required. Role instructions do not change the actual model.

## Specification and Plan

Keep requirements focused on what and why, specifications on behavior and contracts, and ADRs on necessary architectural choices with evaluated alternatives. Store specifications in `specifications/` and applicable ADRs in `decisions/` directly under the artifact directory. Edit them in place. Retain valid content, amend affected content, remove obsolete content, and add missing knowledge. Analyze dependency impact throughout Specification, including ADR work.

Element references resolve in the checked-out tree: a target that matches the protected branch is established, otherwise it is proposed. A supplier proposal on another branch stays unresolved until it merges; name the proposed contract and its supplying change in the prose. A proposed artifact edge stays proposed until the branch merges.

Self-check behavior, contracts, ADR sufficiency, impact analysis, and blockers for Plan.

Produce `tasks/README.md` and task files from completed requirements, specifications, and decisions. Each task states its scope, repository or location, the requirement IDs that it `covers`, and concrete DoD validation criteria; `depends_on` is its only prerequisite record, and a task does not restate the plan approval. Propose the compatibility level in the plan front matter and explain its impact; do not write a version number.

Create a fresh task plan for the current change. Previous completed tasks and evidence remain in their original changes; do not copy, overwrite, or reopen them for new work. Historical evidence does not prove changed behavior passes.

Declare current task paths in YAML front matter in `tasks/README.md`; each listed task declares a stable `id` and an explicit `depends_on` list. Apply the [task format](../../../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks). Declare current work without inherited task copies; existing legacy unlisted tasks stay excluded. Check task paths, metadata, unique IDs, resolved prerequisites, and acyclicity; an invalid graph is not executable. Preserve artifact-level establishment gates separately.

For a medium or large change, present the plan for explicit user review and approval; do not start implementation. A new plan or material amendment requires renewed approval. Requirement, Specification, and Plan may prepare against proposed upstream contracts. Do not create workflow state tables or copy commit history into knowledge files.

## Small changes

Use the [minimal change scaffold](../../../06-guidelines/minimal-change.md) when the change is small, or when one artifact and a small task plan cover a medium outcome. Edit the knowledge in place without baseline copies and replace all placeholders with verified facts. A small change has no ADR, adds no requirement ID, changes no element that another artifact references, declares `compatibility: patch`, and has one task with `covers`; write the plan as one short paragraph in the change README. If the design needs more, tell the coordinator, because the change is then medium or large. During the existing self-check, validate task fields, `covers`, evidence sources and dependency declarations; use the [evidence record rules](../../../06-guidelines/evidence-records.md) for optional explicit check and publication facts. Keep upstream establishment for every tier, and phase commits and explicit plan approval for medium and large changes. Do not add another review step or copy old task evidence as current proof.

When a medium or large change changes a user interface, add one DoD item for the owner look at screenshots or at the running interface.

## Shared outcomes

Consume the [unit brief](../../../06-guidelines/units-of-work.md) when the change participates in an outcome. Specify applicable cross-artifact contracts and plan combined validation without creating membership-derived edges. Keep artifact establishment gates separate from internal task prerequisites. Historical outcome evidence resolves through the version record's source_change to the retained originating change. Legacy versions with delivery_tasks: change resolve the same way; older legacy versions retain their version-owned task evidence. The coordinator owns membership and shared evidence updates.

## System flows

Read the [system-flow format](../../../06-guidelines/system-flows.md) when the change affects system journeys. During the existing Specification self-check, assess compatibility and update affected flow steps, branches, supporting references, evidence basis, and gaps. During the existing Plan self-check, supply fresh tasks and concrete flow checks. Keep detailed behavior with its owning artifact; flow participation alone creates no dependency or unit membership. Proposed knowledge can support preparation, but dependent Implementation still waits for upstream establishment and plan approval.

## Representations

Read the [visual representation guide](../../../06-guidelines/visual-representations.md) when a contract, decision or plan has structure that prose spreads apart. During the existing Specification self-check, apply the agent procedure: write contract tables, sequence diagrams for interactions, state diagrams for lifecycles, containment diagrams for boundaries and alternatives tables in ADRs. Derive flow diagrams from flow records. During the existing Plan self-check, rely on the task graph that readers derive from the task list; do not draw task order by hand. Perform procedure step 9 for each changed representation and record its result in the self-check.

## Claims

Read the [claim rules](../../../06-guidelines/evidence-records.md#claims). Record a claim only when it is consequential: it selects between options that change a contract, a flow, a dependency or files outside the task scope; if it is wrong, a DoD item, an acceptance criterion or a declared flow is wrong; it dismisses a computed impact item or a tested hypothesis; or it names a limit that the version ships with. Record decision claims in the specification or ADR that makes the choice, with one reason for each rejected option in `rejected`. Record assumption and unknown claims in the specification or plan that depends on them. Give each decision and assumption claim a `check`. Set `verified` only with the recorded check detail. Write `verified_by: agent`, never `person`. Do not add a step, a gate or a claim registry.

## Patterns

Load only relevant guidance from the full ADD bundle. Select tools through the existing design process; do not add frameworks solely to apply a pattern.

| Problem | Pattern |
| --- | --- |
| Application boundaries | [Ports and Adapters](../../../04-patterns/ports-and-adapters.md) |
| Executable rule contracts | [Policy as Code](../../../04-patterns/policy-as-code.md) |
| Required automated checks | [Continuous integration](../../../04-patterns/continuous-integration.md) |
| Asynchronous interactions: event ownership, delivery behavior and recovery checks, without confusing runtime event paths with artifact execution dependencies | [Event-driven development](../../../04-patterns/event-driven-development.md) |
| Interface work | [Contract-driven development](../../../04-patterns/contract-driven-development.md) |
| Business boundaries | [Strategic DDD](../../../04-patterns/strategic-domain-driven-design.md) |
| Consistency or model design | [Tactical DDD](../../../04-patterns/tactical-domain-driven-design.md) |
