---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/authoring-workbench.md#requirement-self-check
---

# Author ADD knowledge without learning its storage

## Need

People who maintain an ADD project must create artifacts and changes, write requirements, specifications and decisions, declare dependencies and references, plan tasks, group changes into units, maintain system flows, record evidence and prepare versions. Today the Plane shows all of this but changes none of it. A person edits Markdown and YAML in another tool, keeps cross-file invariants in their head, runs Git by hand, and returns to the Plane to find the mistakes. The need is a Plane in which a person performs these actions on domain concepts, while the Plane derives the file layout, records, identifiers, paths and Git mechanics deterministically.

## Verified findings

The audit inspected the Plane source (server, src, scripts, tests), the ADD contracts, the retained records of this repository and the rendered application on this repository at 1440 and 390 pixels on 17 October 2026. The findings below name the root cause, not the symptom.

| ID | Friction today | Why the person must do it | Root cause | Remove, derive or automate | AI value |
| --- | --- | --- | --- | --- | --- |
| F1 | No write path. Every ADD action is manual editing outside the Plane. | The product scope is read-only since 1.0. | Scope decision, not a technical limit; the readers already parse and validate every record. | Add a deterministic operation service over the existing readers; validate on the post-image before writing. | None for structure; drafting prose is optional. |
| F2 | Cross-file invariants kept by hand: plan task list ↔ task `id` and `depends_on`; unit `changes` ↔ change directories; version record ↔ `current_version`; `self_check` and `evidence_records` sources ↔ headings; `references` ↔ element paths; flow `supports` ↔ `support` ids. | ADD stores each fact once in its owning file, so every relation is a pair of entries. | Correct for the knowledge model; wrong for the authoring tool, which should keep both sides. | Each operation edits every side of an invariant in one step and rejects post-images that break it. | None. |
| F3 | Redundant declarations: `self_check.source` and `evidence_records[].source` almost always name the same document heading; unit `evidence` repeats criterion, method and source; the version record and the identity record must agree. | The formats make evidence addressable. | Evidence addressing needs the path, but the person does not need to type it. | Derive the source from the document and heading the person is recording into. | None. |
| F4 | Identifier strings typed by hand: artifact IDs, `change-` names, task ids, element paths, heading fragments, flow, step, support, participant and model ids. | Records reference each other by ID. | The Plane already indexes every ID and path. | Replace typing with selection; generate safe IDs from titles. | Low; suggestions can be deterministic. |
| F5 | Flow documents are 87–95 percent YAML with four cross-referenced ID namespaces (steps, support, participants, interactions) plus transitions. | The flow contract records a graph in one file. | The contract is sound; the authoring surface is the largest error surface in ADD. | Structured step, transition and support editing with immediate validation; raw front matter remains an escape hatch. | Medium for drafting step titles and support reasons; not required. |
| F6 | Lifecycle mechanics: dedicated branch, phase commits, version record, identity record bump, pull request. | ADD separates proposed and established state through Git. | The Plane knows the branch, the protected refs and the changed files but offers no action. | Create branch, commit knowledge paths, discard file changes; refuse writes on main or master; leave push, pull requests and merge outside. | None. |
| F7 | Three sibling views with separate sidebars, selection state and toolbars (Dependencies, Units of work, Flows); the artifact inspector mixes overview, delivery list, dependencies, knowledge groups, references and flow actions; the canvas is the home screen. | The application grew view by view. | Information architecture organized by graph type instead of by the person's work. | One navigation tree (current work, artifacts, units), content pages, graph on demand. | None. |
| F8 | Misleading labels: an artifact with no open change shows `Active change: Ambiguous`; a unit whose retained task evidence passes shows `Completion unknown` because no `publication_reviews` record exists. | The label code treats "no open change" as ambiguity; publication reviews must be written by hand after merge. | Presentation defect; missing authoring action. | Show `None` when no change is open; offer "Record publication review" with the repository and pull request prefilled from the remote and merge commit. | None. |
| F9 | Noticeable latency: flow detail still loading after 2.5 s; change review 4.8 s; the flow service loads the repository three times per query. | Freshness checks reload the whole worktree. | Correctness-first design; acceptable for reading, costly when every save triggers it. | Out of scope for editing; keep as a measured limitation and reuse the incremental observation for post-save refresh. | None. |

Validation rule classes that a hand author can violate, counted from the ADD guidance lists: task plans 12, unit briefs 10, flows 15, references 4, identity records 3, evidence records 8. The Plane reports each class as a diagnostic after the fact. The format guidance an agent must read to author these records by hand is about 48,000 bytes across the writing, unit, flow, evidence and minimal-change guides.

## Baseline measurements

Recorded on 17 October 2026 on this repository (3 artifacts; Artifact Plane has 18 requirements, 31 specifications, 10 decisions and 14 changes), Node 24.21, Git 2.55, Chromium at 1440×1000 and 390×844. Methods: a line and front-matter counting script over docs/artifacts, a Playwright script that drives the built application, and the Plane test suite.

| Measure | Baseline | Method |
| --- | --- | --- |
| Smallest delivered outcome (legacy-conversion unit and Plane change) | 4 files written, 142 lines, 61 YAML lines, 26 typed identifiers or source paths | Count of front-matter lines and ID or path values in the retained records |
| Largest recent Plane change (change-ux-simplification) | 13 change files, 486 lines, 34 YAML lines, plus a 118-line brief with 87 YAML lines and 8 flow record updates | Same script |
| Unit briefs (17) | 38–161 lines, 19–120 YAML lines each | Same script |
| Flow documents (24) | 86–281 lines, 87–95 percent YAML | Same script |
| Task files (159) | 114 carry front matter; `id` and `depends_on` average 2 YAML lines; evidence records add 4 lines each | Same script |
| Git actions per change by hand | 1 branch, at least 3 phase commits, 1 version preparation, 1 push, 1 pull request | ADD workflow |
| Open this repository to Current | 2.6 s at 1440 px | Playwright timing |
| Review a delivered change | 4.8 s to Loaded | Playwright timing |
| Flow detail | Still loading after 2.5 s | Playwright screenshot |
| Actions to read a specification | 3 (select artifact, open Specifications group, select document) | Playwright script |
| Actions to see change evidence | 3 (select artifact, open Delivery history, select change); task graph and review add 1 each | Playwright script |
| Actions to see unit completion or a flow | 2 each (switch view, select) | Playwright script |
| Unit tests | 309 tests, 308 pass, 1 skipped, 15.0 s | `npm test` |
| Horizontal overflow at 390 px | None; the inspector stacks below a 60 percent shorter canvas | Playwright evaluation and screenshot |

Round-trip preservation has no baseline because the Plane writes nothing today.

## Requirements

- W1: Organize the application around the person's work. The page layout, sidebar and page contents are defined in workbench-redesign.md (D1–D11), which replaces the 1.16.0 navigation tree.
- W2: Read and edit in one place. A document page renders Markdown and switches to editing of the same page. Structural facts in front matter appear as properties with pickers and forms, never as YAML text in the normal path. A raw front-matter editor remains available for unknown or advanced fields and validates before saving.
- W3: Provide deterministic domain operations: create artifact; start change; add, save and delete a requirement, specification or decision; set dependencies; add and remove references; record a document self-check; add, update and remove tasks and prerequisites; check a DoD item; record task evidence; record the plan self-check; create a unit; add and remove members; add, update and remove acceptance criteria; record unit evidence; set affected flows; create a flow; add, update and remove steps, transitions and support; set gaps and exclusions; prepare a version; record a publication review; migrate a legacy artifact. Every operation derives identifiers, paths and source fragments from the person's selection, generates safe IDs from titles, and never asks for a value the Plane already knows.
- W4: Keep every write safe. Writes stay inside docs/artifacts of the selected worktree, never follow symlinks, require a checked-out branch other than main or master, refuse version records and delivered change tasks, preserve unrelated bytes, unknown keys, key order and comments, replace files atomically, detect concurrent edits through expected content digests, support a dry-run preview for every operation, and keep a bounded undo journal.
- W5: Validate before writing. An operation is applied only when the post-image passes the existing readers for the records it touches: identity and cycle checks, task graph membership and acyclicity, unit membership uniqueness, flow validity, reference resolution and evidence source resolution. Diagnostics name the field and offer a deterministic fix where one exists.
- W6: Provide Git lifecycle actions limited to what knowledge authoring needs: show the branch and protected state, create a branch, commit selected knowledge paths with a message, and discard a file's changes after confirmation. The Plane never pushes, opens pull requests, merges, rebases or commits to a protected branch. Approval remains a user decision outside the files; publication remains team review and merge.
- W7: Show review and readiness. A change page lists its changed knowledge against main, live diagnostics, declared phase evidence, the task plan with its graph, and a readiness checklist that names what blocks version preparation. Version preparation writes the version record and the identity record together. Publication review recording is available for a merged version.
- W8: Offer the same operations to agents. Expose preview and apply operations over HTTP and, behind an explicit opt-in flag, as MCP tools. The Plane contains no AI inference; AI assistance is optional and external.
- W9: Preserve compatibility. Existing read endpoints, MCP read tools, packet schemas, legacy reading and the observation and runtime services stay unchanged. Legacy snapshot artifacts stay read-only and offer the migration operation.
- W10: Show honest state. Replace `Ambiguous` with `None` when no change is open; explain unknown completion with the missing record and its recording action; keep every existing uncertainty label.
- W11: Keep editing usable on every supported width and by keyboard. No horizontal page overflow at 390, 700, 851 and 1440 pixels. Unsaved edits survive repository refresh and the late reply of an earlier operation, and are protected on navigation with a confirmation.
- W12: Measure the result. Scenario tests record user actions, manual YAML lines, files written, validation results and round-trip preservation for the eight benchmark scenarios and compare them with the baseline above.

## Benchmark scenarios

Each scenario starts from a clean fixture on a non-protected branch. Baseline values describe the manual path with the current formats. The Target column records the 1.16.0 thresholds. The workbench redesign replaces the action targets: a scenario must not need more actions than its 1.16.0 measurement, and the other targets stay.

| ID | Scenario | Baseline (manual) | Target (Plane) |
| --- | --- | --- | --- |
| S1 | Create a single-artifact change with one requirement, one task and a unit | 6 files, about 24 YAML lines, 7 typed identifiers, 2 tools, at least 2 Git commands | At most 10 user actions, 0 YAML lines, 0 typed identifiers or paths, 1 tool; files and diagnostics generated |
| S2 | Create a multi-artifact unit with two member changes and an integration criterion | 1 brief with about 30 YAML lines, 2 change records, 2 plans, 9 typed identifiers | At most 8 actions, 0 YAML lines; duplicate membership and missing integration criterion rejected before writing |
| S3 | Add, modify and remove a dependency with its explaining reference | 2 front-matter edits in 2 files, 1 path, cycle check by running a script | At most 6 actions; cycle rejected with the path named; established and proposed edges labelled |
| S4 | Create a flow with three steps, two transitions and two supports, then modify a step and remove a support | About 45 YAML lines, 7 typed ids and 2 source paths | At most 14 actions, 0 YAML lines; invalid endpoints impossible by construction |
| S5 | Edit a requirement and a specification, record both self-checks | 2 body edits, 2 front-matter edits with source fragments, 2 headings | At most 6 actions; sources derived; bytes outside the edited body and keys unchanged |
| S6 | Resume an existing change: open it from current work, check two DoD items, record evidence, commit | Locate files by path, edit checklist characters, write an evidence record with a source, Git add and commit | At most 7 actions; next-step hint visible on the work list |
| S7 | Resolve an unresolved reference and a concurrent edit | Read the diagnostic, find the path, edit YAML; concurrent edits silently overwrite | At most 3 actions to fix the reference by picking the target; a concurrent save is rejected with both versions shown and a reload action |
| S8 | Export and reload edited knowledge without loss | Not applicable | After every scenario, validate-knowledge reports 0 errors and every file outside the targeted keys and sections is byte-identical |

## Acceptance criteria

- A1: A person completes S1–S8 in the Plane with 0 YAML lines, 0 typed identifiers or paths and 0 validation errors; the scenario tests record the action counts, which must not exceed the 1.16.0 measurements (workbench-redesign.md B6).
- A2: No write leaves docs/artifacts of the selected worktree, follows a symlink, happens on main or master, or touches a version record or delivered change tasks; each case is a rejected request with a reason.
- A3: For every operation, a test shows that bytes outside the targeted front-matter keys and body sections are unchanged, that unknown keys and comments survive, and that a dry run writes nothing.
- A4: A save whose expected digest no longer matches is rejected with the current content; an undo restores the previous bytes only while the post-image is unchanged; an interrupted multi-file write leaves a reported partial state that Git status shows.
- A5: Every operation that would create a new error diagnostic for the touched records is rejected and returns the diagnostics; successful operations leave validate-knowledge at 0 errors on the fixtures.
- A6: The branch, protected state, commit and discard actions behave as specified; commits contain only the selected knowledge paths; the Plane refuses to commit on main or master.
- A7: The work, artifact, document, change, unit and flow pages exist as specified in the authoring workbench contract; existing reading, graph, delivery, review, flow discovery and runtime observation capabilities remain reachable.
- A8: The HTTP operation route and the opt-in MCP tools apply the same operation with the same result; without the flag the MCP server registers no write tool.
- A9: Legacy artifacts remain readable and read-only with a migration action; existing Node tests, fixtures and read endpoints pass unchanged.
- A10: Screenshots and geometry at 390, 700, 851 and 1440 pixels show usable editing without horizontal overflow; keyboard-only completion of S1 is covered by a browser test; the label corrections of W10 are covered by tests.

## Facts, assumptions and exclusions

Facts: the readers parse front matter with the yaml library and bodies with marked; the migrate-layout script already writes inside docs/artifacts with containment, symlink refusal and byte checks; the yaml Document API preserves comments and unknown keys on round-trip; the incremental observer already reports local file changes within seconds; the repository has no change in flight on the Plane artifact.

Assumptions: a person works in one worktree at a time; most edits are small; agents that author knowledge use the MCP tools or the files directly, never both at once on one file. Rankings of friction are engineering judgment supported by the measurements.

Exclusions: ADD contract changes (the formats are sufficient; redundancy is removed by derivation, not by format change); AI inference in the Plane; push, pull request and merge actions; edits to established versions or delivered evidence; renames with reference rewriting; drag-and-drop graph editing; the flow model layer beyond raw front matter; hosted services; a workflow state database.

## Affected artifacts and flows

Artifact Plane is the only affected artifact; its `depends_on` stays `[artifact-driven]`. The ADD contracts for the in-place layout, tasks, units, flows and evidence records are consumed as established knowledge. Affected flows: a new knowledge-authoring journey; repository-exploration, source-retrieval, unit-inspection, change-review, project-tabs and repository-refresh are modified; context-handoff and execution-observation are unchanged.

## Requirement self-check

The findings name root causes with evidence from source, records and rendered screens. Each requirement states what and why; acceptance criteria are observable and tied to scenario measurements with recorded baselines. The read-only constraint in requirements/explorer.md is amended to reading operations. KISS keeps one operation service over the existing readers, no new storage and no AI dependency. STE keeps obligations and exclusions explicit. No unresolved blocker prevents Specification.

change-browser-suite-fixes amends W11 and keeps its ID. The added failure case is observable: a late reply of an earlier operation closed the form of another step and lost its input. No requirement ID is added.
