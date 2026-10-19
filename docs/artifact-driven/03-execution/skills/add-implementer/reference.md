# ADD Implementer reference

The implementer reads a section of this page when its condition in the skill's Read-when table is true.

## Load and resume

Read the skill core before ADD work. Apply the KISS and STE checklist of the core in the existing self-check; read `../../../required-skills/kiss/SKILL.md` and `../../../required-skills/asd-ste-100/SKILL.md`, relative to the skill directory, when the checklist does not settle a case. Apply ASD-STE100 principles without changing technical meaning or claiming formal compliance. Do not add another review step.

Keep the full adopted bundle available when registering this role in a harness. Resolve these paths from the canonical bundle when the harness copies the role elsewhere. If either required skill is unavailable, restore it from the supplied bundle before continuing affected work.

If the complete current instructions of this skill are already loaded in the same session, reuse them. A summary or a path alone is not enough. Reload them after context loss, after their sources change, or after a switch to another adopted bundle. Start a new context at a phase boundary when the harness allows it.

## Task rules

For a plan with task metadata, apply the [task format](../../../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks). Do not use copied historical evidence as current completion without required rechecks. For a legacy plan without task metadata, retain its documented prerequisites without inventing a task graph.

Use the assigned dedicated branch and a separate Git worktree for parallel work. In delegated work, commit code in the assigned worktree and return commits and evidence to the coordinator. Do not concurrently edit central knowledge/task files or integrate another worker's branch. In sequential work, record evidence in the task when the coordinator assigns that responsibility.

A material change or new plan requires renewed user approval. Task completion does not prove integrated change completion. Return remaining integration dependencies and failed checks clearly.

## Shared outcomes

For a member change, read the [unit brief](../../../06-guidelines/units-of-work.md) and governing contracts. Record task checks in the owning change; keep delivered task records available and do not copy them into versions or later changes. Return combined check results to the coordinator for shared evidence. Do not amend central membership, bypass an establishment gate, or treat a checked task as completed outcome evidence.

## System flows

Read the [system-flow format](../../../06-guidelines/system-flows.md) when the change affects system journeys. During the existing task self-check, compare affected behavior with the approved flow knowledge and validate the task's supporting references and evidence. A test source is static support unless recorded execution evidence supports an observed claim. Return new requirement or contract facts to their owning phase; do not amend governing flow contracts independently or bypass approval and establishment gates.

## Representations

Read the [visual representation guide](../../../06-guidelines/visual-representations.md) when a task changes behavior that a diagram of the governing specification shows. During the existing task self-check, record evidence as a table of DoD item, check, result and source. Recheck the behavior diagrams of the governing specification against the implemented behavior, and report a stale diagram to the coordinator. Do not edit a governing diagram to match the code; return the contract change to its owning phase.

## Claims

Read the [claim rules](../../../06-guidelines/evidence-records.md#claims). Record a claim only when it is consequential: it selects between options that change a contract, a flow, a dependency or files outside the task scope; if it is wrong, a DoD item, an acceptance criterion or a declared flow is wrong; it dismisses a computed impact item or a tested hypothesis; or it names a limit that the version ships with. Record hypothesis and root-cause claims in the task, including refuted hypotheses with the measurement that decided them. Record a limit of the delivered behavior as a `risk` or `unknown` claim. A root-cause check is a test that fails without the fix; record that run in the task evidence. Report a claim that changes a contract to the coordinator. Set `verified` only with the recorded check detail. Write `verified_by: agent`, never `person`. Do not add a step, a gate or a claim registry.

## Patterns

These references belong to the full ADD bundle. Do not add unplanned frameworks merely to apply a pattern.

| Task | Pattern |
| --- | --- |
| Test-first work | [TDD](../../../04-patterns/test-driven-development.md) |
| Approved architecture or policy work | [Ports and Adapters](../../../04-patterns/ports-and-adapters.md), [Policy as Code](../../../04-patterns/policy-as-code.md) |
| Repeatable task and combined checks, without treating passing jobs as merge authorization | [Continuous integration](../../../04-patterns/continuous-integration.md) |
| Event publishers or handlers: implement only the delivery, ordering, duplicate handling, and recovery behavior that the approved tasks specify | [Event-driven development](../../../04-patterns/event-driven-development.md) |
| Domain model, interface or behavior checks | [Tactical DDD](../../../04-patterns/tactical-domain-driven-design.md), [contract-driven development](../../../04-patterns/contract-driven-development.md), [BDD](../../../04-patterns/behavior-driven-development.md) |
