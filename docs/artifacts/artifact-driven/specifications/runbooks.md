---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/runbooks.md#specification-self-check
claims:
  - id: one-runbook-page
    kind: decision
    statement: The seven runbooks are sections of one guideline page, and each
      runbook is one row of the coordinator's Read-when table.
    status: supported
    basis: documented
    evidence:
      - docs/artifacts/artifact-driven/changes/change-runbooks/README.md#reason-and-scope
    check: Open the coordinator SKILL.md and confirm one Read-when row per
      runbook that links to a section of 06-guidelines/runbooks.md, and that
      the core without the table has at most 400 words.
    rejected:
      - option: Spread the steps over the coordinator reference sections.
        reason: The reference sections hold rules; mixing ordered steps into
          them makes each section longer for every reader.
      - option: One page for each runbook.
        reason: Seven short pages add index rows and links with no reader gain.
  - id: stopped-change-no-record
    kind: decision
    statement: A change that stops before merge leaves no record on the
      protected branch; the reason goes in the closing PR comment, and its
      branch stays until the owner allows its removal.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-driven/changes/change-runbooks/tasks/03-validation.md#evidence
    check: Withdraw a test change in a disposable clone by the runbook and
      confirm that the protected branch has no file of it, the validator
      reports no diagnostic, and the branch still exists.
    risk_if_wrong: Readers lose the reason for a stopped change that a later
      change needs.
    rejected:
      - option: Keep the change directory on the protected branch with a
          status field.
        reason: It adds workflow state, which RB10 excludes.
      - option: Delete the branch when the change stops.
        reason: The owner can still resume the work.
  - id: reversal-is-new-change
    kind: decision
    statement: A reversal of an established version is a new change with a
      higher version number; the reversed version record and its change
      directory stay unchanged on the protected branch.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-driven/changes/change-runbooks/tasks/03-validation.md#evidence
    check: Apply the runbook to a test reversal in a disposable clone and
      confirm that the validator reports no version or retention diagnostic,
      and that the old version record and change directory are byte-identical.
    risk_if_wrong: A Git revert of a merge removes the delivery record that an
      established version references.
    rejected:
      - option: Revert the merge commit as it is.
        reason: The revert deletes the version record and the change directory
          of an established version.
      - option: Give the reversal the number of the version before the
          reversed one.
        reason: A number would then name two different contents.
---

# Runbook contract

Governs RB1–RB10 in requirements/runbooks.md. ADD owns the runbook guide `06-guidelines/runbooks.md` in the bundle and the two lifecycle rules that it applies. The rules are in [knowledge-layout.md](knowledge-layout.md#lifecycle). A runbook is guidance. It adds no record type, field, state, gate, role or phase.

## Runbook form

A runbook is one section of the guide. Each runbook has these five parts, in this order:

| Part | Content |
| --- | --- |
| When | The trigger, in one or two sentences, and the evidence that shows it. |
| Inputs | The records, refs and results that the coordinator reads first. |
| Steps | A numbered list. Each step is one action with the check that ends it. A step that applies a rule links to the page that owns the rule and does not restate it. |
| Done when | The observable state that ends the runbook. |
| Owner decides | The decisions that the coordinator does not make. When there is none, the part says so. |

The guide opens with a table of the seven runbooks: situation and link. It contains no example records and no project-specific commands; a command is an example in a text fence and names its tool.

## The seven runbooks

| ID | Situation | Steps apply | Done when | Owner decides |
| --- | --- | --- | --- | --- |
| after-merge | A PR of a change landed on the protected branch. | Read the merge from Git. Confirm that the protected branch holds the version record, the identity record, the change directory and the code of every required repository. Read the checks of the protected branch at that revision. Report the version as established ([knowledge-layout.md](knowledge-layout.md#lifecycle)). Reassess the unit and release dependent work ([version-publication](flows/version-publication.md) shared step). When the project publishes releases, verify the published assets after the owner tags. Remove the worktrees and branches of the change after a check that each holds no work missing from the protected branch. | The version is reported established with the check result, dependent work is released or named as waiting, and each worktree and branch is removed or kept by the owner's choice. | The release tag, and the removal of worktrees and branches. |
| renumber | The protected branch moved after the version record was prepared and before merge. | Bring the protected branch into the change branch without a force push. A conflict in the version record or the identity record is expected when another change of the artifact merged first: keep the protected branch's version record and resolve the conflict with the new number. Stop when other knowledge of the artifact conflicts. Compute the number again and rename the version record ([delivery-tiers.md](delivery-tiers.md)). Recheck specifications and the plan against new upstream versions ([dependency gates](flows/dependency-gates.md)). Run the validator and the checks on the new revision. | The validator reports no version diagnostic and the checks pass on the new head. | The level, only when it changed; the order of two changes of one artifact. |
| amendment | After plan approval, a requirement, contract, task or DoD item is wrong, a claim is refuted, or the owner changes scope. | Pause the affected tasks. Send the problem to its owning phase (workflow Corrections). Apply the material test below. Correct, self-check and commit in the owning phase. For a material amendment, present the amendment and wait for explicit approval. Continue unaffected tasks. | The corrected phase output is committed; a material amendment has the owner's approval. | Approval of a material amendment. |
| stop | The owner withdraws or pauses a change before merge. | Apply the stopped-change rule. Withdraw: close the PR with the reason, and keep the branch. Pause: keep the PR as a draft or keep the branch; before resuming, apply renumber and recheck the plan. When the unit brief on the protected branch names the change, remove the member and record the reason in its excluded scope in the next PR of the unit, or in its own PR. | The protected branch holds no record of the change, the reason is in the PR or the handoff, and the artifact can start another change. | Withdraw or pause; the removal of the branch. |
| reverse | An established version has a defect, or the owner wants its effect undone. | Reproduce the defect against the established revision, and record a root-cause claim with a check that fails before the fix. Start a new change on the artifact; apply the reversal rule. Assign the tier with its criteria. Edit knowledge and code in place; keep the reversed version record and change directory. Compute the level from the effect on consumers of the current version. | The new change follows its tier to a PR. | Fix forward or reverse; the order against an active change; the level. |
| live-check | A DoD item needs a live harness, a running interface, a real service or a relaxed permission. | Make a disposable copy: a new clone in a temporary directory, with a local protected branch, and a private state directory. Copy in only the configuration that the check needs. Use a relaxed permission only with the owner's consent and only in the copy. Run the check. Record the environment, the tool versions, the revision and the observation as live evidence, separate from fixture evidence. Send findings to their owning phase. Delete the copy and its state. | The evidence is recorded with its environment and the copy is deleted. | A relaxed permission; the owner look at an interface ([delivery-tiers.md](delivery-tiers.md)). |
| failed-check | A required check fails, on one platform or environment or on all. | Confirm that the check ran on the intended revision. Read the failing step and reproduce it where possible. Classify the cause: code or test defect, contract gap, environment, or unknown. Send a defect to Implementation and a contract gap to amendment. Report an environment cause to the owner with its evidence. Investigate a flaky result; a passing retry is not proof ([continuous integration](../../../artifact-driven/04-patterns/continuous-integration.md)). Record the cause and the result in the task evidence. | Every required check passes on the head, or the owner has the blocker with its evidence. | Accept a platform limit as a risk claim; change or skip a required check. |

## Material test

An amendment after approval is material when it does one of these: adds, removes or changes a requirement, an acceptance criterion or a contract; changes a declared flow or a dependency; adds or removes a task; weakens a DoD item; changes the compatibility level; or refutes a claim that one of these depends on. Other amendments are not material: wording, evidence detail, a stricter DoD item, a fixed link. The runbook guide owns this test. The workflow Corrections section links to it.

## Coordinator access

The coordinator skill has one Read-when row for each runbook. The row names the situation and links to the runbook section. The 06-guidelines index lists the guide. The skill core keeps at most 400 words without the Read-when table.

## Specification self-check

RB1 and RB2 map to the form and the seven rows. RB3 maps to the link rule in Steps. RB4 maps to coordinator access. RB5 maps to after-merge, RB6 to stop and the stopped-change rule, RB7 to reverse and the reversal rule, RB8 to live-check, RB9 to failed-check. RB10 holds: the contract adds only guide text, two lifecycle rules and a test, and no field. KISS: one page, two rules, one test; no ADR, because the claims record the two rejected options of each choice. STE: one rule per row; each term has one meaning. No blocker prevents Plan.
