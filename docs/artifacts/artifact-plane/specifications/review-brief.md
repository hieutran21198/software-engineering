---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/review-brief.md#specification-self-check
references:
  - artifact: artifact-driven
    element: specifications/claim-records.md
    requires: Claim fields, status rules, the writing channel for verified_by and the diagnostics that the reader, the operations and validate-knowledge implement.
  - artifact: artifact-driven
    element: specifications/change-impact.md
    requires: Tiers, the declared assessment comparison and the coverage statement that the brief summarizes.
  - artifact: artifact-driven
    element: specifications/evidence-records.md
    requires: The evidence source rule that claim evidence reuses and the failed and incomplete results that the brief reports.
---

# Change brief contract

Governs B1–B11 in requirements/review-brief.md. The brief is derived local knowledge. It is not workflow state, approval or a store. The claim contract is proposed by the ADD change change-claim-records; it is established only after that change merges.

## Service and interfaces

The existing review service (server/change-review.js) gains the operation `brief`. It accepts the request fields of change-review.md and returns the existing envelope (repository, worktree, context, revision, freshness, completeness, data, diagnostics, pagination, omissions). `data` is the brief below. The same capture serves the packet: the packet operation adds `data.brief` with the same content. The schema of the packet stays `artifact-plane.change-context.v1`; the field is additive.

| Interface | Form |
| --- | --- |
| HTTP | `POST /api/review/query` with `operation: brief` |
| MCP | Read tool `get_change_brief` with path, worktree, artifact and change; read-only annotations; returns the envelope as structured content |
| Packet | `data.brief` in the packet operation and in the exported Markdown packet as a "Change brief" section |
| Browser | The Change brief section of the change page |

## Origins

| Change state | Impact origins | Unit for the declared comparison |
| --- | --- | --- |
| Open in-place change | `diff: {base: protected}` on the selected worktree, as the packet does today | The unique unit that owns the change |
| Delivered change (a version record names it in `source_change`) | The first-parent commit on the protected ref that introduced its version record, read with the existing introduction reader of server/units-of-work.js | The same |
| Legacy or no introducing commit | No impact; the brief states the reason | The same |

The brief calls the impact service once with these origins, `depth: 2`, `limit: 100` and the unit. A failed or partial impact answer makes the brief partial; the brief never invents an empty impact.

## Brief data

| Field | Content |
| --- | --- |
| `schema` | `artifact-plane.change-brief.v1` |
| `origin` | `{kind: protected-diff | delivery-commit | none, commit?, reason?}` |
| `answers` | Seven entries in the fixed order below, each `{question, summary, items}`. An entry with no items has `summary: null`. |
| `claims` | Every claim of the change (claim contract, "belongs to a change"), each with its fields, `file`, `step` and its diagnostics |
| `flows` | `{reached, declared, undecided}`. `reached` lists flows in the direct and transitive tiers with their steps; `declared` lists the unit's affected flows; `undecided` lists reached flows that are not declared and that no claim names in `about`, plus unresolved items |
| `attention` | At most seven rows `{category, text, source, step}` and `more`, the count of rows not shown |
| `delivery` | For a delivered change: unit evidence with result failed or incomplete, and unchecked DoD items of its tasks, each with its source |
| `counts` | Claims by step, by kind and by status; checks recorded by a person; checks recorded by an agent |

The seven questions and their sources:

| Question | Summary from | Items |
| --- | --- | --- |
| What changed? | Packet records and impact `changed` | Records and files with symbols; files that no task names in its Scope section are marked "not in any task scope" |
| Why? | The first section of the change README; decision claims | The reason paragraph; decision claims with their rejected options |
| What is affected? | Impact counts and `flows` | Reached, declared and undecided flows; unresolved items; coverage depth and frontier |
| What should I care about? | `attention` | The attention rows |
| What do I need to understand? | Claims and affected steps | Claim statements; affected steps with titles; documents the change governs |
| What can I verify? | Claim checks, impact `verify`, task evidence | Check text, test paths, recorded negative controls, each with its step |
| What needs my decision? | Open decision claims, undecided flows, recorded limits, the plan's approval section | Each item names the record to edit; the goal line quotes the plan's approval section and states "Approval not verified by this reader." |

Attention order: (1) failed or incomplete evidence and unchecked DoD of a delivered change; (2) claims with error diagnostics; (3) open decision claims; (4) open root-cause claims; (5) undecided flows and unresolved items; (6) open assumptions with `risk_if_wrong`; (7) unknown and risk claims. Inside a category, rows follow impact tier, then strength, then path. Creation date never orders rows.

## Verification ladder

Every claim and every check row carries exactly one step. The table lists the steps from weakest to strongest and the rule that assigns each.

| Step | Assigned when |
| --- | --- |
| Not analyzed | A claim of kind `unknown`; an item of the coverage `not_analyzed` list |
| Inferred | A claim with `basis: inferred`; a wording note |
| Explained | Rejected-option reasons, README text, and claims with `basis: documented` and no evidence |
| Observed activity | Codex observer attempts and tool names; never a result |
| Recorded experiment | A claim with status supported or refuted and evidence; an `evidence_records` entry; a test of the change |
| Fact from Git | Changed records and files, impact tiers, unit and task fields read from Git |
| Re-checked by an agent | A verified claim with `verified_by: agent`; shown as "Re-checked by an agent, not independent" |
| Checked by a person | A verified claim with `verified_by: person` |

A test that the change adds stays a recorded experiment. It counts as a check of a root cause only when the claim's evidence records a run that fails without the fix. No row shows the word verified for an agent record without the qualifier.

## Claim reader and diagnostics

Module server/claims.js parses `claims` with the rules of the ADD claim contract and reuses the evidence source resolver of server/workflow.js. It returns claims with their diagnostics. diagnose() in server/knowledge-operations.js and scripts/validate-knowledge.mjs both call it. The warnings `claim-check-missing`, `claim-unverified-at-version` and `claim-list-long` do not change the exit status of validate-knowledge.

The brief derives two more facts. They are not file diagnostics:

| Fact | Rule |
| --- | --- |
| Undecided flow | A flow in the direct or transitive tier that is not in the unit's affected flows and that no claim of the change names in `about` |
| Stale claim | A file named in a claim's `about` or `evidence` changed in the change's diff, while the file that holds the claim did not |

## Wording notes

A document page and a flow page show an inferred note when the record belongs to a delivered change or an established version and its text contains "remain pending", "is pending", "not started" or "proposed for team review". The note names the matched sentence and says that the match is by wording. The brief of a delivered change lists the notes of the records it changed.

## Knowledge operations

Two operations join the operation table of knowledge-editing.md.

| Operation | Input | Files | Derived and validated |
| --- | --- | --- | --- |
| claim.record | path, kind, statement, status (open, supported or refuted), basis, evidence (optional list), detail (optional), check, rejected, riskIfWrong, about, supersededBy, id (optional) | `claims` front matter; with detail, a subsection named by the id under the Evidence section of a task or the "Claim evidence" section of another document | Record type may hold claims; id from the statement and unique; `verified` and `verifiedBy` refused; detail becomes an evidence source; the post-image passes the claim diagnostics |
| claim.verify | path, id, ran, observed, outcome (holds or fails) | The claim; a subsection `<id>-check` with ran, observed, channel and date | Claim exists and is not superseded; observed nonempty; holds sets status verified, appends the source and sets `verified_by` from the channel; fails sets status refuted and appends the source |

createKnowledgeService takes `channel` (`person` or `agent`, default `agent`). server/http.js creates the service with `person`; server/flow-mcp.js keeps the default. The request has no channel field, so no input can choose the value. A script that calls the HTTP route is recorded as a person; Git authorship stays the audit.

## Change page

The change page shows the Change brief section between the phase steps and the plan. It follows the approved mockups and the 1.17.0 layout rules.

- Seven rows, one line each; a row expands in place; empty rows are hidden; the attention row opens by default.
- A Claims section lists claims in attention order. Each card shows kind, status, step, statement, basis, evidence, about, "Wrong if", check and folded rejected options.
- When one file holds two or more hypothesis or root-cause claims, a hypothesis table shows statement, status, the deciding evidence and step.
- A flows table shows reached, declared and undecided flows with the deciding claim.
- "Record my check" opens an inline form with "What you ran" and "What you observed"; the submit button stays disabled until "What you observed" has text. It calls claim.verify with outcome holds or fails.
- "Challenge" opens claim.record with kind hypothesis and status open in the same file.
- The decision row shows two parts: the goal line and the correctness line (claims by step, checks by a person).

Differences from the prototype of the human-cognitive-support unit: the "Accept goal and scope" and "Ask for an independent check" buttons are not built, because they would need stored state; the goal line and "Record my check" replace them. Prediction prompts, "new here" notes and the "Last week" page are not built in this change.

## Errors and limits

The review service errors of change-review.md apply. A change without claims returns the brief with empty claim lists; this is not an error. A brief on a legacy change or without an introducing commit returns `origin.kind: none` and no impact answers. The brief inherits the impact limits: dynamic calls, HTTP and process boundaries, and Go and CSS symbols are not analyzed.

## Validation plan

- Node tests: claim parsing and every diagnostic code on fixtures; both operations, including the refusals of `verified` in claim.record, of an empty observed result, and of a channel field; HTTP records person and MCP records agent; brief answers for an open and a delivered fixture change; undecided and stale facts; attention order and cap; packet and MCP parity with the brief operation.
- Repository checks: the brief of change-hidden-tab-streams shows 6 reached, 1 declared and 5 undecided flows; the brief of change-impact-intelligence shows 6 reached flows not declared and 5 unresolved items; the briefs of the delivered changes of add-agent-efficiency, evidence-and-usability, plane-authoring-workbench and plane-workbench-redesign show their failed or incomplete evidence or the unchecked DoD item; a warm brief returns in at most 2 seconds.
- Browser tests: section order, expansion, empty rows hidden, the check form, no horizontal overflow at 390, 700, 851 and 1440 pixels, one title and one navigation.
- Screenshot review against the approved mockups at 1440 and 390 pixels, then owner acceptance.

## Specification self-check

B1 maps to Change page and the seven questions; B2 to Service and interfaces and Origins; B3 to Verification ladder; B4 to the undecided flow fact; B5 to `delivery` and Wording notes; B6 to Claim reader and diagnostics; B7 to Knowledge operations; B8 to the decision row and the absence of an approval store; B9 to Service and interfaces; B10 and B11 to Change page and the validation plan. The design reuses the review service, the impact service, the evidence resolver, the version introduction reader and the operation writer; it adds one module, one operation, two edit operations and one MCP tool, and no store. The proposed ADD contract is named with its supplying change; tasks that read or write claims wait for it to establish. Representations: seven tables, each checked against the text (3 origins, 8 fields, 7 questions, 8 steps, 2 facts, 2 operations, 4 interfaces). KISS: one service operation instead of a second service. STE: one rule per row. No blocker prevents Plan.
