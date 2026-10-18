---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/requirements/visual-artifacts.md#requirement-self-check
---

# Visual representations in the ADD project knowledge

## Need and observed facts

On 18 October 2026 the user asked to improve the current artifacts with the representations that the ADD 2.7.0 [visual representation guide](../../../artifact-driven/06-guidelines/visual-representations.md) selects. The shared outcome and acceptance criteria are in the [visual-artifacts unit](../../units-of-work/visual-artifacts/README.md); its [survey](../../units-of-work/visual-artifacts/survey.md) records the per-file decisions.

Observed facts at revision 3c47a48, rechecked at 89ed23a (main, ADD 2.8.0):

- The working knowledge of artifact-driven has no diagram. The survey read 44 of its requirement, specification, decision and flow files; the two visual-knowledge documents already follow the guide.
- Nine high- and medium-priority candidates are in seven specifications. Most are contract facts that one long paragraph lists: record fields, result fields and condition-to-outcome rules.
- The survey verified seven defects, D1 to D7. Several restate legacy rules as current: D3 in units-of-work.md says that a new version declares `delivery_tasks: change`, while knowledge-layout.md says that `delivery_tasks` is not written. A table drawn from such a passage would show the wrong rule.
- Artifact Plane references five of the affected specifications (knowledge-layout, task-dag, units-of-work, system-flows, evidence-records) from its knowledge-editing contract. The references name elements, not sections.

## Requirements

- VA1 Representations. Add these representations, or reject one with its reason in the Specification self-check:

  | Element | Section | Representation | Priority |
  | --- | --- | --- | --- |
  | specifications/agent-efficiency.md | Adoption diagnostics | Table of the `se-adopt.result.v1` fields and the diagnostic and error fields | high |
  | specifications/evidence-records.md | Check records; Publication records | Table of record, field, values and rule | high |
  | specifications/knowledge-layout.md | Layout | Paired listings of the legacy and in-place layouts | high |
  | specifications/knowledge-layout.md | Migration, step 5 | Table of record, condition and conversion action | medium |
  | specifications/model-explanations.md | Model declarations; Flow participants and interactions | Table of record, field, rule and resolution target | high |
  | specifications/system-flows.md | Document contract | Table of flow, step, transition and support fields | high |
  | specifications/system-flows.md | Document contract, support kinds | Table of support kind, fields, source selection and limits | medium |
  | specifications/task-dag.md | Plan membership; Task declarations | Table of condition and outcome | medium |
  | specifications/units-of-work.md | Version provenance | Table of member condition and resolution result | medium |

- VA2 Guide conformance. Each representation follows the guide: an introduction, a source line, accessible title and description for a diagram, and the facts in the body text. A table can replace the prose that it restates only when every fact, condition, limit and exception of that prose is in the table or in the remaining text. Otherwise the prose stays.
- VA3 Corrections. Correct each verified defect in a passage that a VA1 representation draws from, so that the passage states the in-place rule and limits the legacy rule to the legacy layout. Leave the other defects recorded in the survey.
- VA4 Preservation. Change no ADD rule, contract value or flow behavior except through VA3. Keep the headings, so that existing links and anchors resolve. Do not edit retained changes, version records or files that the survey keeps.

## Scope

Included: the seven specifications of VA1 and the passages of VA3; the change record, specification, plan, tasks and version record of change-visual-artifacts.

Excluded: the reusable bundle under docs/artifact-driven; low-priority candidates; defects outside VA3; the other 37 surveyed files.

## Acceptance criteria

- AVA1: Each VA1 row is present in its section or rejected with a reason, and has a recorded check that compares the facts of the replaced or summarized prose with the representation.
- AVA2: A comparison with the previous text finds no lost fact, condition or limit; the only rule changes are the recorded VA3 corrections.
- AVA3: Every relative link and anchor of the changed files and of their referring documents resolves; validate-knowledge reports no error.

## Requirement self-check

Facts are taken from the survey and the files at 89ed23a. Assumption: D3 is the only defect that a VA1 row depends on; Specification confirms it per row. Affected artifacts: Artifact Plane reads these elements as references, and their rules do not change, so no Plane contract changes for this artifact. Suggested version: a patch release, because only presentation and defect corrections change. KISS: tables first, no new notation or record. STE: one obligation per requirement. No Requirement blocker prevents Specification.
