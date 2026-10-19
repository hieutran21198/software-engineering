---
id: tier-guidance
depends_on: [bundle-source]
---

# Tier guidance

## Scope and ownership

Coordinator, as implementer. Bundle files in `docs/artifact-driven`: a new guideline `06-guidelines/change-tiers.md` (tiers, criteria and deciders, records, commits and gates by tier, compatibility level and version number, owner look at a UI, configuration file, guarantees); `06-guidelines/writing-artifacts.md` (requirement IDs, `covers`, single-source records, validator use in self-checks, the wording "not required, but used when available"); `06-guidelines/minimal-change.md` (the scaffold by tier, `covers`, no Prerequisites section, evidence source default); `06-guidelines/units-of-work.md` (brief optional for small outcomes; evidence entries without copied text); `06-guidelines/evidence-records.md` (source default of task evidence records); `02-methodology/workflow.md` and `02-methodology/validation.md` (tiered phases, gates and the computed version); `01-foundation/artifact-model.md` (the tier and compatibility keys); `05-adoption/README.md` (the `tools/` directory and the validator); the 06-guidelines index.

## Governing knowledge

specifications/delivery-tiers.md; specifications/record-checks.md; specifications/knowledge.md, knowledge-layout.md, units-of-work.md, evidence-records.md and minimal-authoring.md as amended; decisions/015-change-tiers.md; requirements/delivery-improvements.md, DI1 to DI8 and DI12.

## Prerequisites

Task bundle-source.

## Definition of Done

- [x] `06-guidelines/change-tiers.md` states every row of the criteria table, the tier table, the version rule, the owner-look rule, the configuration keys with defaults and the guarantee table of specifications/delivery-tiers.md, with an example of a small change README in a text fence.
- [x] The writing, minimal-change, units-of-work, evidence, workflow, validation, artifact-model and adoption pages state their part and contradict no rule of the two contracts; a search for "phase commit", "explicit approval", "Prerequisites" and "No standalone runner" in the bundle finds only text that names the tier it applies to.
- [x] The minimal-change scaffold, copied for a small change, has 7 knowledge files or fewer, contains no Prerequisites section and no approval sentence in tasks, and its YAML examples parse.
- [x] Every relative link of the changed pages resolves, no changed page links a parent page, `go test ./...` passes and `npm run build` in website exits 0.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Change tiers guide | Read `06-guidelines/change-tiers.md` against specifications/delivery-tiers.md: tier record, 7 criteria with deciders, 4 results, the tier table (11 rows), level and number rule, owner look, configuration example and 4 keys with defaults, check with the validator, 5 guarantees; an invented small change README in a text fence | Passed | `06-guidelines/change-tiers.md` |
| Other pages | writing-artifacts.md (requirement IDs, `covers`, plan `compatibility`, single-source records, the validator section with its 14 check rows, "not required, but use it when it is available", version number), minimal-change.md (steps by tier, small scaffold, medium additions, evidence source default), units-of-work.md (brief by tier, one-line method), evidence-records.md (task source default), workflow.md (Change Tiers section, lifecycle, commits, approval), validation.md (validator in self-checks, approval by tier, level and number, owner look), artifact-model.md (`tier`, `compatibility`, `covers`, level confirmation), 05-adoption/README.md (Validator section, `tools/` in Result and step 1), the 06-guidelines index. The phrase search for "phase commit", "explicit approval", "explicit user approval", "Prerequisites" and "No standalone runner" finds tier-named text on the changed pages; the other matches are in 03-execution/README.md and the role skills (task role-skills) and in the change-delivery diagram of visual-examples.md, which shows the flow at revision 126990d | Passed | The diff of this task |
| Small scaffold | `TestMinimalChangeScaffold` now parses the small set (5 files, at most 7 allowed, no unit brief), `tier: small`, `compatibility: patch`, `covers` IDs defined in the copied requirement file, no Prerequisites section and no "approv" text in task files, then the unit brief of the medium additions; a YAML parse of the 17 YAML and front-matter blocks of the changed pages finds no error | Passed | `docs/artifact-driven/bundle_test.go` |
| Links, tests, build | A link script resolved 74 relative links and anchors of the changed pages with 0 findings and no link to an ancestor README (it reports all three defects of a seeded probe page); `go test ./...` and `go vet ./...` pass; `npm run build` in website exits 0 with 40 bundle pages; the Plane validator reports no error or warning | Passed | Commands in this row |

Outside the listed pages: 02-methodology/dependencies.md (approval by tier), and the agent requests in adopting-from-git.md and working-with-ai.md (tier-named approval and commits), because the phrase search covers the bundle.
