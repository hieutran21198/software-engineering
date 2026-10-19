---
id: guidance
depends_on: []
---

# Guidance

## Scope and ownership

Coordinator, as implementer. Files in docs/artifact-driven and their identical copies under src/archs/artifact-driven: 06-guidelines/evidence-records.md (new Claims section), 01-foundation/definitions.md (a Claim row), 06-guidelines/writing-artifacts.md (one reason per rejected ADR alternative; where claims go), 01-foundation/artifact-model.md (a row in phase evidence), 06-guidelines/working-with-ai.md (Review the Plan reads open claims first and separates the goal from verification), and the skills add-coordinator, add-technical-lead and add-implementer (the consequential rule and when to record claims). The required-skills copies do not change.

## Governing knowledge

specifications/claim-records.md (all sections); decisions/014-evidence-linked-claims.md; requirements/claim-records.md, C1–C10, A2 and A3.

## Prerequisites

Explicit plan approval. No internal prerequisite.

## Definition of Done

- [x] The Claims section of the evidence guideline states the fields, the status rules, the consequential rule, the writing channel and the diagnostics, and gives the hidden-tab example and a flow dismissal in text fences.
- [x] The definition, writing, artifact-model and working-with-AI pages state their part in one to three sentences each and change nothing else.
- [x] Each of the three skills states the consequential rule and where its role records claims, in one paragraph, and adds no step or gate.
- [x] Both bundle copies are identical for every changed file, every relative link resolves, no changed page links a parent page, `go test ./...` and `go vet ./...` pass, and `npm run build` in website exits 0.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Claims section | Read docs/artifact-driven/06-guidelines/evidence-records.md against specifications/claim-records.md: field table (12 fields), status table (5 statuses), consequential rule (4 conditions), writing channel, diagnostics (6 codes), review use, two `~~~text` examples (debugging task with a refuted hypothesis and a root cause; unit-brief flow dismissal) | Passed | `## Claims` and its five subsections |
| One to three sentences per page | `git diff` of definitions.md (one Claim row), writing-artifacts.md (one sentence on rejected alternatives, two on where claims go), artifact-model.md (one Claims row), working-with-ai.md (three sentences in Review the Plan) | Passed | The diff of this task |
| Three skills | Each of add-coordinator, add-technical-lead and add-implementer ends with one `## Claims` paragraph: the consequential rule, where the role records claims, `verified_by: agent` only, and no step, gate or registry | Passed | The three SKILL.md files |
| Copies, links, tests, build | `diff -r docs/artifact-driven src/archs/artifact-driven -x '*.go'` reports only the existing required-skills directory; the link check of the changed pages resolves every relative link; no new link targets a README or an ancestor page; `go test ./...` passes; `go vet ./...` passes; `npm run build` in website exits 0 | Passed | Commands in this row |

The 06-guidelines index row of Evidence records now names claims. That one-line wording change keeps the index accurate and is the only file outside the listed scope.
