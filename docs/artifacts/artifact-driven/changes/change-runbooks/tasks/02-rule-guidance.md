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

- [ ] The workflow states the stopped-change rule and the reversal rule of specifications/knowledge-layout.md#lifecycle, each once, and the Corrections section links to the material test.
- [ ] The Version Record section of the writing rules states the reversal rule or links to it, and keeps "Handle later defects or missing evidence with a new change".
- [ ] The coordinator Read-when table has seven new rows, one per runbook, each linking to a runbook section; `wc -w` on the SKILL.md body without front matter and without the Read-when table is at most 400.
- [ ] A search of the difference for `status:`, `approved`, `approval:` and new front-matter keys finds no field, state, registry, gate, role or phase.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
