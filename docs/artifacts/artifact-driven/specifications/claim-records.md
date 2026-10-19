---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/claim-records.md#specification-self-check
---

# Claim record contract

Governs C1–C10 in requirements/claim-records.md. ADD owns this optional YAML list in existing Markdown records. A claim records a consequential assertion and the evidence for it. A claim records no workflow state and no approval. It reuses the source rule of specifications/evidence-records.md and the basis vocabulary of specifications/system-flows.md.

## Where claims appear

A record may declare `claims` in its YAML front matter. The table lists the records.

| Record | May declare claims |
| --- | --- |
| Requirement, specification or decision under the artifact | Yes |
| Plan (`changes/<change>/tasks/README.md`) and task files | Yes |
| Unit brief (`units-of-work/<unit>/README.md`) | Yes, for coordination claims such as the dismissal of computed flows |
| Change README, version record, identity record, flow record | No |

A claim belongs to a change when it is in the plan or a task of that change, or in a knowledge document that the change adds or modifies compared with the protected branch, or in the brief of the unit that owns the change.

## Fields

| Field | Presence | Values or rule |
| --- | --- | --- |
| `id` | required | Matches `[a-z0-9][a-z0-9-]*`; unique among the claims of the file |
| `kind` | required | `decision`, `assumption`, `hypothesis`, `root_cause`, `unknown` or `risk` |
| `statement` | required | One nonempty assertion. Not a DoD item, requirement or summary. |
| `status` | required | `open`, `supported`, `verified`, `refuted` or `superseded` |
| `basis` | required | `documented`, `static`, `observed` or `inferred`, with the meanings of the flow support basis |
| `evidence` | see status rules | Nonempty list of sources. Each source follows the `evidence_records` source rule: a safe repository-relative Markdown path with an optional heading fragment that resolves to nonempty detail. |
| `check` | see status rules | Nonempty inert text: the cheapest verification a reader can perform |
| `verified_by` | see status rules | `person` or `agent` |
| `rejected` | optional, `decision` only | Nonempty list of objects with `option` and `reason`, both nonempty text |
| `risk_if_wrong` | optional | One line of text |
| `about` | optional | Nonempty list of entity identities from the change-impact contract (`<artifact>:<path>`, `<artifact>:<flow>`, `<artifact>:<flow>:<step>`, `<artifact>:<model>`) or tracked repository paths |
| `superseded_by` | see status rules | The `id` of another claim in the same file |

Unknown keys inside a claim are an error. A claim list that is not a list is an error.

## Status rules

| Status | Meaning | Required | Forbidden |
| --- | --- | --- | --- |
| `open` | Asserted; no supporting evidence is recorded | — | `verified_by`, `superseded_by` |
| `supported` | Rests on the author's own recorded evidence | `evidence` | `verified_by`, `superseded_by` |
| `verified` | Checked again with its own recorded detail | `evidence`, `verified_by` | `superseded_by` |
| `refuted` | Recorded evidence shows that it is wrong | `evidence` | `verified_by`, `superseded_by` |
| `superseded` | Replaced by another claim of the same file | `superseded_by` | `verified_by` |

Additional rules:

- `basis: observed` requires `evidence`.
- A `decision`, `root_cause` or `assumption` claim with status `open`, `supported` or `verified` should state `check`.
- A status never means approval. Approval is not a file fact.
- A refuted or superseded claim stays in the file. It records what was ruled out.

## Writing and verification

Authors record a claim only when it is consequential. A claim is consequential when at least one condition is true:

1. It selects between options that change a contract, a flow, a dependency or files outside the task scope.
2. If it is wrong, a DoD item, an acceptance criterion or a declared flow is wrong.
3. It dismisses a computed impact item or a tested hypothesis.
4. It names a limit that the version ships with.

A writer sets `verified` only together with the detail of the check: what was run and what was observed. The writer puts the detail under a heading in the same file and sets `evidence` to that heading. The writer sets `verified_by` from the channel that performs the write: `person` for an interface that a person operates, `agent` for an agent interface. The input of the write never sets `verified_by`. A text editor or a script that writes the field directly makes an unchecked assertion; Git authorship remains the audit.

A reader never shows the word verified for a claim with `verified_by: agent` without the qualifier that an agent check is not independent. A test that the same change adds counts as recorded evidence. It counts as a check of a root cause only when the detail records a run that fails without the fix.

## Diagnostics

| Code | Severity | Rule |
| --- | --- | --- |
| `invalid-claim` | error | A field breaks the field table or the status table, or `superseded_by` names no claim of the file |
| `claim-evidence-missing` | error | An `evidence` source does not resolve or resolves to an empty section |
| `claim-evidence-conflict` | error | A `supported` or `verified` claim cites a source that is also the source of an `evidence_records` entry or a `self_check` with result `failed` or `incomplete` |
| `claim-check-missing` | warning | The check rule of the status table is not met |
| `claim-unverified-at-version` | warning | The change has a version record that is not on the protected branch, and a claim of the change of kind `decision`, `root_cause` or `assumption` has status `open` or `supported` |
| `claim-list-long` | warning | A file declares more than ten claims |

An error makes the claim unavailable as evidence. A warning keeps it available. Errors never fall back to a favorable prose reading.

## Review use

The plan review reads the open claims of the change first. A reviewer accepts or amends the goal and scope; this acceptance stays outside the files, as before. Verification of correctness comes from checks and their recorded results. A reviewer may record a check of a claim, challenge it with a counter-claim, or ask for a change. Version preparation reports the `claim-unverified-at-version` warnings. No new gate, phase or role is added.

## Example

The example uses claims from the hidden-tab change of Artifact Plane. It does not assert that these records exist.

```text
claims:
  - id: slow-reads
    kind: hypothesis
    statement: The server reads documents slowly.
    status: refuted
    basis: observed
    evidence: [docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/01-hidden-tab-streams.md#slow-reads]
  - id: connections
    kind: root_cause
    statement: Each tab keeps two event streams open, so three tabs use all six browser connections to the host and reads wait.
    status: supported
    basis: observed
    evidence: [docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/01-hidden-tab-streams.md#evidence]
    check: Run test/browser/project-tabs.spec.js on the 1.18.0 main.jsx (fails) and on the fix (passes).
    about: [artifact-plane:repository-refresh:observe]
```

A unit brief dismisses reached flows with one claim:

```text
claims:
  - id: five-flows-unchanged
    kind: assumption
    statement: The five reached flows keep their steps; the reply guard changes no successful reply and no route.
    status: open
    basis: inferred
    check: Compare the diffs of src/main.jsx and server/http.js with the supports of the five flows and run their browser tests.
    about: [artifact-plane:repository-exploration, artifact-plane:knowledge-authoring, artifact-plane:context-handoff, artifact-plane:source-retrieval, artifact-plane:change-impact]
```

## Specification self-check

C1 maps to Where claims appear and Fields; C2 and C3 to Fields and Status rules; C4 to the check rule; C5 to Writing and verification; C6 to the consequential rule; C7 to `rejected`; C8 to Review use; C9 to Diagnostics; C10 to the optional list and the unchanged records. The contract adds no mandatory field, no approval value and no state that a workflow reads. Reader behavior beyond the diagnostics belongs to the readers. The examples are text fences, so no reader treats them as records. Representations: four tables, each checked against the text (6 kinds, 5 statuses, 6 diagnostics, 12 fields). KISS: one list, two reused rules. STE: one rule per row. No blocker prevents Plan.
