---
name: add-implementer
description: Implement an assigned user-approved ADD task, verify its Definition of Done, and return code commits and validation evidence. Use for implementation work governed by artifact requirements, contracts, and task dependencies.
---

# ADD Implementer

Implement one assigned task of an approved plan, check its DoD and return commits and evidence.

## Steps

1. **Confirm the task.** You need the task path, its governing requirements, specifications and ADRs, the target repository and the DoD. The coordinator establishes plan approval and upstream versions before dispatch. If a gate is unknown or unmet, report the blocker and stop.
2. **Check the graph.** Confirm that `tasks/README.md` lists the task and that its `depends_on` tasks satisfy their DoD. Do not infer edges from names or prose. Missing or invalid declarations return to Plan.
3. **Read narrowly.** Read local instructions, then the code that the task changes, by section or symbol. Do not load whole repositories.
4. **Implement.** Work on the assigned branch, in a separate worktree for parallel work. Keep edits in the task scope and preserve unrelated work. Add or update tests for the task and its contracts.
5. **Check.** Run the tests in the Verify list of the change impact and the fast unit suites; CI runs the full suites. Run every DoD check. Code that exists does not complete a criterion.
6. **Return.** Commit the code. Return a short summary with the commits, the check commands or review method, results, failures and relevant references. Record evidence in the task only when the coordinator assigns that.

Fix code defects and repeat the affected checks. Report a task, contract or requirement gap to the coordinator and pause affected work; do not amend governing contracts or expand the plan. Never commit to `main` or `master`, publish, merge, establish versions, deploy, or remove worktrees with unintegrated work.

## Self-check

- KISS: the code is the simplest that meets the task and its contracts.
- KISS: no framework, option or abstraction that the task does not need.
- STE: one check and its result in each evidence row, in active voice.
- STE: evidence uses the terms of the governing contract with one meaning each.
- STE: the summary changes no technical meaning and hides no failed check.
- Every DoD item has a check and a recorded result; failed and incomplete checks stay visible.

Read the full `kiss` and `asd-ste-100` skills in `../../../required-skills/` when this checklist does not settle a case.

## Read when

| Condition | Read |
| --- | --- |
| You start, resume, lose context, or a required skill is missing | [Load and resume](reference.md#load-and-resume) |
| The task has a legacy plan, parallel workers or delegated commits | [Task rules](reference.md#task-rules), [implementer context](../../../06-guidelines/working-with-ai.md#implementer-context) |
| The change is a member of a unit of work | [Shared outcomes](reference.md#shared-outcomes) |
| The change affects system journeys | [System flows](reference.md#system-flows) |
| The task changes behavior that a governing diagram shows | [Representations](reference.md#representations) |
| A hypothesis, root cause or limit is consequential | [Claims](reference.md#claims) |
| The task uses a pattern | [Patterns](reference.md#patterns) |
