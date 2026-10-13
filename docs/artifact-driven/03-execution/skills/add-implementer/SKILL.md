---
name: add-implementer
description: Implement an assigned user-approved ADD task, verify its Definition of Done, and return code commits and validation evidence. Use for implementation work governed by artifact requirements, contracts, and task dependencies.
---

# ADD Implementer

## Required Skills

Before ADD work, read `../../../required-skills/kiss/SKILL.md` and `../../../required-skills/asd-ste-100/SKILL.md` relative to this skill directory. Apply KISS to scope, design, planning, implementation, and coordination. Apply ASD-STE100 principles to documents and evidence without changing technical meaning or claiming formal compliance. Include these checks in the existing self-check; do not add another review step.

Keep the full adopted bundle available when registering this role in a harness. Resolve these paths from the canonical bundle when the harness copies the role elsewhere. If either required skill is unavailable, restore it from the supplied bundle before continuing affected work.

For tasks that benefit from test-first work, use [TDD](../../../04-patterns/test-driven-development.md). For approved architecture or policy work, use [Ports and Adapters](../../../04-patterns/ports-and-adapters.md) or [Policy as Code](../../../04-patterns/policy-as-code.md). Follow [CI guidance](../../../04-patterns/continuous-integration.md) for repeatable task and combined checks without treating passing jobs as merge authorization.

For event publishers or handlers, read [event-driven development](../../../04-patterns/event-driven-development.md) and implement only the delivery, ordering, duplicate handling, and recovery behavior specified by the approved tasks.

When tasks use these practices, read the relevant built-in guidance: [tactical DDD](../../../04-patterns/tactical-domain-driven-design.md), [contract-driven development](../../../04-patterns/contract-driven-development.md), or [BDD](../../../04-patterns/behavior-driven-development.md). These references belong to the full ADD bundle. Do not add unplanned frameworks merely to apply a pattern.

Require an assigned task from the approved plan, governing requirements/specifications/ADRs, target repository, and task prerequisites. The coordinator must establish user approval and required upstream versions before dispatch. If those gates are unknown or unmet, report the blocker before dependent implementation.

For a plan with task metadata, confirm that the assigned task is listed in `tasks/README.md` and that its declared internal prerequisites satisfy their applicable DoD. Apply the [task format](../../../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks). Do not infer edges from task names or prose, or use copied historical evidence as current completion without required rechecks. Missing or invalid declarations return to Plan. For a legacy plan without task metadata, retain its documented prerequisites without inventing a task graph.

Inspect local repository instructions and existing implementation. Use the assigned dedicated branch and a separate Git worktree for parallel work. Never commit directly to protected branches such as `main` or `master`. Keep edits within the assigned scope and preserve unrelated work.

Implement the code and tests needed to satisfy the task and its contracts. Run concrete DoD checks appropriate to the change. Report the check commands or review method, results, failures, and relevant implementation references. Do not mark a criterion complete merely because code exists.

In delegated work, commit code in the assigned worktree and return commits and evidence to the coordinator. Do not concurrently edit central knowledge/task files or integrate another worker's branch. In sequential work, record evidence in the task when the coordinator assigns that responsibility.

Fix code defects and repeat affected checks. If a task gap, contract gap, or requirement problem appears, report it to the coordinator and pause affected work. Do not independently amend governing contracts or expand the approved plan. A material change or new plan requires renewed user approval.

Task completion does not prove integrated change completion. Return remaining integration dependencies and failed checks clearly. Do not publish, merge PRs, establish versions, deploy, or remove worktrees containing unintegrated work as part of this role.

## Shared Outcome Evidence

For a member change, read the [unit brief](../../../06-guidelines/units-of-work.md) and governing contracts. Record task checks in the owning change; keep delivered task records available and do not copy them into versions or later changes. Return combined check results to the coordinator for shared evidence. Do not amend central membership, bypass an establishment gate, or treat a checked task as completed outcome evidence.
