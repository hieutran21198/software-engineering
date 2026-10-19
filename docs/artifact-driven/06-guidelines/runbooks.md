# Runbooks

A runbook is an ordered procedure for a situation that occurs again and again during delivery. The coordinator follows it. Each step applies a rule of another page and links to it. A runbook adds no record, field, state, gate, role or phase.

| Situation | Runbook |
| --- | --- |
| A PR of a change landed on the protected branch. | [After merge](#after-merge) |
| The protected branch moved after you prepared the version record, and before merge. | [Renumber](#renumber) |
| After plan approval, a requirement, contract, task or DoD item is wrong, a claim is refuted, or the owner changes scope. | [Amendment](#amendment) |
| The owner withdraws or pauses a change before merge. | [Stop](#stop) |
| An established version has a defect, or the owner wants its effect undone. | [Reverse](#reverse) |
| A DoD item needs a live harness, a running interface, a real service or a relaxed permission. | [Live check](#live-check) |
| A required check fails. | [Failed check](#failed-check) |

Each runbook has five parts. **When** names the trigger. **Inputs** names what you read first. **Steps** are actions in order, each with the check that ends it. **Done when** names the state that ends the runbook. **Owner decides** names the decisions that you do not make.

## After merge

**When.** Git shows that the PR of a change landed on the protected branch. Read the merge from Git; do not ask the owner to report it.

**Inputs.** The merge commit, the PRs of companion repositories, the check results of the protected branch, the unit brief, and the worktrees and branches of the change.

**Steps.**

1. Fetch the protected branch. Confirm that it holds the version record, the identity record, the change directory and the code. For a change across repositories, confirm the merge in each required repository ([establishing a version](../02-methodology/validation.md#establishing-a-version)).
2. Read the required checks of the protected branch at the merge revision. When a check failed, follow [Failed check](#failed-check).
3. Report the version as established, with the merge revision and the check result.
4. Reassess the unit. Report completion only with the evidence that [establishment and completion](units-of-work.md#establishment-and-completion) requires.
5. Find the plans that wait for this version. Release them through the [implementation gates](../02-methodology/dependencies.md#preparation-and-implementation-gates): compare the established contract with the contract that the plan used.
6. When the project publishes releases, tell the owner that the release can start. After the owner creates it, confirm that the release names the merge revision and that its assets and checksums are complete.
7. List the worktrees and branches of the change. For each one, confirm that it has no uncommitted work and no commit whose content is missing from the protected branch. A squash merge changes commit identities, so compare content, not only ancestry. Ask the owner, then remove the ones that the owner releases.

```text
git worktree list
git status --porcelain            # in each worktree: no output
git cherry -v origin/main <branch> # "-" lines are already on main
```

**Done when.** The version is reported as established with its check result. Each waiting plan is released or named with what it waits for. Each worktree and branch is removed or kept by the owner's choice.

**Owner decides.** The release and its tag. The removal of worktrees and branches.

## Renumber

**When.** The protected branch has a new commit that the change branch does not contain, and the change branch already has a version record.

**Inputs.** The protected branch, the change branch, the identity record on both, the plan level and the validator result.

**Steps.**

1. Merge the protected branch into the change branch. Do not force-push a branch that has a PR.
2. When the merge conflicts in knowledge of the same artifact, stop. Two changes of one artifact are active, and the owner decides their order ([lifecycle](../02-methodology/workflow.md#change-lifecycle)).
3. Compute the number again from the confirmed level and the new `current_version`. Rename the version record and set `current_version` in the identity record ([version number](change-tiers.md#compatibility-level-and-version-number)).
4. When the new commits establish an upstream version that the change uses, recheck the specifications and the plan against it ([implementation gates](../02-methodology/dependencies.md#preparation-and-implementation-gates)). A material result goes to [Amendment](#amendment).
5. Run the validator and the required checks on the new head.

**Done when.** The validator reports no version diagnostic, and the required checks pass on the new head.

**Owner decides.** The order of two changes of one artifact. The level, but only when the level changed after approval.

## Amendment

**When.** After plan approval, a requirement, contract, task or DoD item is wrong, a claim is refuted, or the owner changes scope.

**Inputs.** The approved plan, the finding with its evidence, the [corrections table](../02-methodology/workflow.md#corrections) and the material test below.

**Steps.**

1. Pause the tasks that the finding affects. Unaffected tasks continue.
2. Send the finding to its owning phase with the corrections table.
3. Apply the material test.
4. Correct the knowledge in the owning phase. Repeat its self-check, and the self-checks of the later phases that it affects. Commit the correction.
5. For a material amendment, present the difference, its reason and the affected tasks to the owner. Wait for explicit approval before the affected tasks continue.
6. Record a refuted claim with its evidence ([claims](evidence-records.md#claims)). Do not delete it.

**Material test.** An amendment after approval is material when it does one of these:

- adds, removes or changes a requirement, an acceptance criterion or a contract;
- changes a declared flow or a dependency;
- adds or removes a task, or weakens a DoD item;
- changes the compatibility level;
- refutes a claim that one of these depends on.

Other amendments are not material, for example a wording fix, more evidence detail, a stricter DoD item or a fixed link.

**Done when.** The correction is committed and its self-checks pass. A material amendment has the owner's approval.

**Owner decides.** Approval of a material amendment. A change of scope.

## Stop

**When.** The owner withdraws a change, or pauses it, before its PR merges.

**Inputs.** The change branch and PR, the unit brief and the [stopped-change rule](../02-methodology/workflow.md#change-lifecycle).

**Steps.**

1. Confirm that no file of the change is on the protected branch.
2. To withdraw: close the PR with a comment that states the reason. Keep the branch.
3. To pause: mark the PR as a draft, or keep the branch without a PR. The change stays the active change of the artifact. Before you resume, follow [Renumber](#renumber) when the protected branch moved, and recheck the plan.
4. When a unit brief on the protected branch names a withdrawn change, remove the member and record the reason in the excluded scope. Do this in the next PR of the unit, or in its own PR. A completed unit keeps its brief; a new unit records a later outcome ([establishment and completion](units-of-work.md#establishment-and-completion)).
5. Remove the branch and its worktree only when the owner allows it.

**Done when.** The protected branch holds no record of the change. The PR comment or the handoff states the reason. The artifact can start another change.

**Owner decides.** Withdraw or pause. The removal of the branch.

## Reverse

**When.** An established version has a defect, or the owner wants its effect undone.

**Inputs.** The established revision, the defect report, the active change of the artifact and the [reversal rule](../02-methodology/workflow.md#change-lifecycle).

**Steps.**

1. Reproduce the defect against the established revision. Record a root-cause claim with a check that fails before the fix ([claims](evidence-records.md#claims)).
2. When the artifact has an active change, ask the owner for the order.
3. Start a new change on the artifact ([findings after establishment](../02-methodology/validation.md#findings-after-establishment)). Its requirement names the version and the reason. Assign the tier with the [small-tier criteria](change-tiers.md#small-tier-criteria).
4. Edit knowledge and code in place. Keep the reversed version record and its change directory unchanged. When you use a Git revert, restore those files before you commit.
5. Propose the level by the reversal rule, and compute the number at Version like for every change.
6. Follow the tier of the change to its PR.

**Done when.** The new change has a PR for team review.

**Owner decides.** Fix forward or reverse. The order against an active change. The level.

## Live check

**When.** A DoD item needs a live harness, a running interface, a real service or a relaxed permission, and the working checkout or a shared service must not change.

**Inputs.** The DoD item, the revision under check and the configuration that the check needs.

**Steps.**

1. Clone the repository into a new temporary directory. Create a local protected branch in the clone, so that comparisons with it work. Check out the revision under check.
2. Copy in only the configuration that the check needs. Use a private state directory. Do not use a server or a store that other work uses.
3. Use a relaxed permission only with the owner's consent, and only in the clone.
4. Run the check. Record the environment, the tool versions, the revision and what you observed. Label the result as live evidence, separate from fixture evidence ([check records](evidence-records.md#check-records)). Record no secret, token or private content.
5. Send each finding to its owning phase. After plan approval, follow [Amendment](#amendment).
6. Delete the clone and its state.

**Done when.** The evidence is recorded with its environment, and the clone and its state are deleted.

**Owner decides.** A relaxed permission. The owner look at a changed interface ([owner look](change-tiers.md#owner-look-at-a-user-interface)).

## Failed check

**When.** A required check fails, on one platform or environment or on all of them.

**Inputs.** The run, its revision and the log of the failing step.

**Steps.**

1. Confirm that the check ran on the intended revision and configuration ([continuous integration](../04-patterns/continuous-integration.md#validation)).
2. Read the failing step. Reproduce it locally or on the same platform when possible.
3. Classify the cause: a code or test defect, a contract gap, an environment fault, or unknown.
4. Send a defect to Implementation. Send a contract gap to [Amendment](#amendment). Report an environment fault to the owner with its evidence.
5. Investigate a flaky or unknown result. A retry that passes is not proof of correctness.
6. Record the cause, the fix and the result in the task evidence.

**Done when.** Every required check passes on the head, or the owner has the blocker with its evidence.

**Owner decides.** Accepting a platform limit; record it as a risk claim. Changing or skipping a required check.
