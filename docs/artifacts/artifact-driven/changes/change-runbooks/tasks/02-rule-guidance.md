---
id: rule-guidance
depends_on: [runbook-guide]
covers:
  - element: requirements/runbooks.md
    ids: [RB4, RB6, RB7, RB10, RA2, RA6]
---

# Rule guidance

## Scope and location

Coordinator, as implementer. Bundle files in `docs/artifact-driven`: `02-methodology/workflow.md` (the stopped-change and reversal rules in Change Lifecycle, and a link from Corrections to the material test); `06-guidelines/writing-artifacts.md` (the reversal rule in Version Record); `03-execution/skills/add-coordinator/SKILL.md` (one Read-when row per runbook).

## Definition of Done

- [x] The workflow states the stopped-change rule and the reversal rule of specifications/knowledge-layout.md#lifecycle, each once, and the Corrections section links to the material test.
- [x] The Version Record section of the writing rules states the reversal rule or links to it, and keeps "Handle later defects or missing evidence with a new change".
- [x] The coordinator Read-when table has seven new rows, one per runbook, each linking to a runbook section; `wc -w` on the SKILL.md body without front matter and without the Read-when table is at most 400.
- [x] A search of the difference for `status:`, `approved`, `approval:` and new front-matter keys finds no field, state, registry, gate, role or phase.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Rules in the workflow | `02-methodology/workflow.md` Change Lifecycle states the stopped-change rule and the reversal rule of specifications/knowledge-layout.md#lifecycle, once each, and links to the runbooks; Corrections links to the material test (`runbooks.md#amendment`) | Passed | `docs/artifact-driven/02-methodology/workflow.md` |
| Version Record | `06-guidelines/writing-artifacts.md` keeps "Handle later defects or missing evidence with a new change" and adds the reversal sentence with a link to the reverse runbook | Passed | `docs/artifact-driven/06-guidelines/writing-artifacts.md` |
| Coordinator rows and core size | Seven new Read-when rows in the coordinator SKILL.md, one per runbook section; `wc -w` on the body without front matter and without the Read-when table: 399 (limit 400); with the table: 669 | Passed | `docs/artifact-driven/03-execution/skills/add-coordinator/SKILL.md` |
| No new state | A search of the bundle difference and of runbooks.md for `status:`, `approved`, `approval:`, front-matter delimiters and YAML keys finds no field; the matches of "approv" in runbooks.md are prose about the existing plan approval | Passed | The diff of this task |
