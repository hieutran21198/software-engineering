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

- [ ] `06-guidelines/change-tiers.md` states every row of the criteria table, the tier table, the version rule, the owner-look rule, the configuration keys with defaults and the guarantee table of specifications/delivery-tiers.md, with an example of a small change README in a text fence.
- [ ] The writing, minimal-change, units-of-work, evidence, workflow, validation, artifact-model and adoption pages state their part and contradict no rule of the two contracts; a search for "phase commit", "explicit approval", "Prerequisites" and "No standalone runner" in the bundle finds only text that names the tier it applies to.
- [ ] The minimal-change scaffold, copied for a small change, has 7 knowledge files or fewer, contains no Prerequisites section and no approval sentence in tasks, and its YAML examples parse.
- [ ] Every relative link of the changed pages resolves, no changed page links a parent page, `go test ./...` passes and `npm run build` in website exits 0.

## Evidence

Not recorded.
