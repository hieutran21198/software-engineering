---
id: runbook-guide
depends_on: []
covers:
  - element: requirements/runbooks.md
    ids: [RB1, RB2, RB3, RB5, RB8, RB9, RA1, RA3]
---

# Runbook guide

## Scope and location

Coordinator, as implementer. Bundle files in `docs/artifact-driven`: a new page `06-guidelines/runbooks.md` with the opening table, the seven runbooks after-merge, renumber, amendment, stop, reverse, live-check and failed-check in the form of specifications/runbooks.md, and the material test; one row in the `06-guidelines/README.md` index.

## Definition of Done

- [x] `06-guidelines/runbooks.md` opens with a table of the seven situations with links, and each runbook has When, Inputs, Steps, Done when and Owner decides in this order, with the content of its contract row.
- [x] Each step that applies a rule of another page links to that page; a reading check of each runbook against the pages that it links finds no restated or contradicting rule.
- [x] The page states the material test of the contract once, and commands appear only in text fences.
- [x] The guideline index lists the page with its purpose.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Seven runbooks in the contract form | Read `06-guidelines/runbooks.md` against the seven rows of specifications/runbooks.md: an opening table of 7 situations with section links; after-merge, renumber, amendment, stop, reverse, live-check and failed-check each have When, Inputs, Steps, Done when and Owner decides in this order (8 "Owner decides" strings in the built page: 7 parts and the introduction); steps, done conditions and owner decisions match their rows | Passed | `docs/artifact-driven/06-guidelines/runbooks.md` |
| Links to owning pages, no restated rule | Each step that applies a rule links to its page: validation.md (establishing a version, findings after establishment), units-of-work.md (establishment and completion), dependencies.md (implementation gates), workflow.md (change lifecycle, corrections), change-tiers.md (version number, small-tier criteria, owner look), evidence-records.md (claims, check records), continuous-integration.md (validation). The reading check found two restated rules in the stop and reverse steps (branch-only knowledge, number always higher); both now link to the workflow rule instead. No step contradicts a linked page: renumber merges instead of a force push, which the coordinator reference forbids; failed-check keeps "a retry is not proof" of the CI pattern | Passed | The diff of this task |
| Material test once, commands in fences | The material test appears once, in the amendment runbook; workflow.md links to it. The only commands are three `git` lines in one `text` fence | Passed | `docs/artifact-driven/06-guidelines/runbooks.md` |
| Index row | `06-guidelines/README.md` lists Runbooks with its purpose before Working with AI | Passed | `docs/artifact-driven/06-guidelines/README.md` |
| Amendment after replay | The renumber replay in task validation showed that step 2 stopped on the version record conflict that every renumber has. The specification row was corrected (material; the owner approved the amendment on 19 October 2026), and step 2 now keeps the protected version record and resolves the identity record with the new number. After-merge step 7 also stops processes that run from a worktree (not material) | Passed | `docs/artifact-driven/06-guidelines/runbooks.md` |
