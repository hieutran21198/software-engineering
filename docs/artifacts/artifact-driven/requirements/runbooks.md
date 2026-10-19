---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/runbooks.md#requirement-self-check
---

# Runbook requirements

## Outcome

A coordinator who meets one of seven recurring situations finds one ordered procedure for it. The procedure tells the coordinator what to do, what to check, when the work is done and where the owner decides. The procedure applies the existing ADD rules.

## Need

Facts measured on this repository at main e613972 on 19 October 2026:

- A search of the bundle for "runbook", "withdraw", "abandon", "cancel", "revert" and "rollback" finds no text.
- After a merge, the coordinator reference says only "Read merges from Git". No step names the release, the check of the protected branch or the removal of worktrees and branches. The repository has tags v2.0.0 and v3.0.0. Established ADD versions 2.1.0 to 2.9.0 have no tag.
- For a protected branch that moves before merge, the bundle has one sentence: "compute the number again and rename the version record".
- The Corrections table of the workflow names the phase that owns a problem. It does not say which change is material, or how to get approval again. After approval, change-agent-integration of Artifact Plane amended a DoD item of task 04 and refuted the claim codex-subagent-identity. After approval, the owner approved two amendments in change-delivery-improvements.
- No text says what happens when a change stops before merge. An artifact has one active change.
- For an established version, the bundle has one sentence: "Handle later defects or missing evidence with a new change". No text says how a change reverses an established version or which number it gets.
- In change-agent-integration, a live check in a disposable clone found that Claude Code sends `prompt_id` and no `turn_id`. The fixture tests did not find this. No guidance describes a disposable copy for such a check.
- In change-agent-integration, CI run 39255201333 failed only on the windows-arm64 target. The continuous-integration pattern says: investigate flaky or environmental failures; a retry is not proof. It gives no steps.

## Requirements

- RB1: ADD gives one ordered procedure, a runbook, for each of these situations: after merge; the protected branch moved before merge; a change after plan approval; a change stops or pauses; a defect in, or a reversal of, an established version; a check that needs a live environment; a required check fails on one platform or environment.
- RB2: Each runbook states when it applies, its inputs, its ordered steps, its done condition and the decisions that belong to the owner.
- RB3: A runbook applies existing rules and links to the page that owns each rule. A runbook does not restate or change a rule that another page owns.
- RB4: The coordinator finds the runbook for a situation from its skill.
- RB5: After merge, the coordinator reads establishment from Git. Release publication and the removal of worktrees and branches happen only with an owner action or the owner's consent.
- RB6: ADD defines what a change that stops leaves on the protected branch and in its unit brief, and when the artifact can start another change.
- RB7: ADD defines how a change reverses an established version. Established version records stay unchanged, and version numbers never decrease.
- RB8: A check that needs a live harness, a running interface or a relaxed permission runs in a disposable copy. Its evidence names the environment and stays separate from fixture evidence.
- RB9: A failed required check goes to the phase that owns its cause. A retry that passes is not proof of correctness.
- RB10: The runbooks add no workflow state, registry, gate, role, phase or record type. Existing records stay valid.

## Acceptance criteria

- RA1: The bundle has the seven runbooks of RB1, and each runbook has the five parts of RB2.
- RA2: The coordinator skill names each situation and links to its runbook. The guideline index lists the runbooks.
- RA3: A reading check of each runbook against the pages that it links finds no restated or contradicting rule.
- RA4: Each runbook, applied to the situation from this repository that the Need section names, gives steps that the coordinator can follow without other guidance.
- RA5: Every relative link of the changed pages resolves, no changed page links a parent page, `go test ./...` passes, the website builds, and the validator reports no new diagnostic on this repository.
- RA6: The difference adds no approval field, state, registry, gate, role or phase.

## Affected artifacts and flows

Artifact Plane and Story-Driven depend on ADD. Their knowledge does not change: the runbooks add guidance and two rules for the coordinator, and no record format changes. Candidate ADD flows: change-delivery (a change after approval, a change that stops, a live check and a failed check) and version-publication (renumbering, the work after merge and the reversal of a version). Adoption, dependency-gates and unit-validation are candidates for discovery in Specification.

## Facts, assumptions and exclusions

Facts: the measurements above come from the repository at e613972 and from GitHub. Assumption: one page with seven runbooks costs less to read than steps spread across the skill references. Exclusions: automation that runs a runbook, runbooks for other roles, release tag policy of consumer projects.

## Requirement self-check

Each requirement states a need and is observable through RA1–RA6. RB6 and RB7 ask for rules that the bundle does not have; Specification chooses them. RB10 keeps the artifact model without new state. KISS: guidance only, with two missing rules. STE: one requirement per item, active voice; facts are separate from the assumption. No blocker prevents Specification.
