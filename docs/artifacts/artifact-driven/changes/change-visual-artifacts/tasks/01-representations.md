---
id: representations
depends_on: []
evidence_records:
  - id: dod
    method: Sentence-to-cell mapping of every replaced passage, count checks and heading comparison of the seven specifications.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-visual-artifacts/tasks/01-representations.md#evidence
---

# Correct D3 and D8 and add the representations

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files under docs/artifacts/artifact-driven/specifications: agent-efficiency.md, evidence-records.md, knowledge-layout.md, model-explanations.md, system-flows.md, task-dag.md and units-of-work.md. No other file changes.

## Governing knowledge

VA1 to VA4 in requirements/visual-artifacts.md; the decisions, corrections, validation and row specifications of specifications/visual-artifacts.md; the visual representation guide of ADD.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [x] D3 in units-of-work.md and D8 in system-flows.md are corrected with the wording rules of the Corrections section before the tables of those sections are written.
- [x] Each of the 11 representations of the Decisions table is in its section with its introduction and source line, in the mode and placement of its row specification.
- [x] For each replace row, the evidence maps every replaced sentence to a cell or to retained text; a comparison of the old and new section text finds no lost fact, condition, limit or exception.
- [x] All headings are unchanged.

## Evidence

Executed on 18 October 2026 on branch claude/visual-artifacts after the user approved the plan. The worker commit on branch claude/va-know-add was integrated as f21fda9. During integration the coordinator extended D3 to the evidence-source sentence of Shared evidence in units-of-work.md (b9c59c1), because the corrected Version provenance made that sentence contradict the file; the contract records the extension.

Worker branch claude/va-know-add, base 35fb143. Paths are relative to docs/artifacts. Counts come from the marked 18.1.1 lexer (the Plane renderer) and, for the graph, from the Mermaid 11.17.2 parser.

Order of work: D3 (units-of-work.md) and D8 (system-flows.md) were corrected in prose first; the tables of those sections were written after.

### Corrections

#### D3, artifact-driven/specifications/units-of-work.md

Three locations, wording of the row specification, in-place rule first.

- Version provenance, paragraph 1. Old: "A newly prepared version README declares its originating artifact-local change with YAML front matter: source_change: change-tenant-login and delivery_tasks: change." New: "A newly prepared version record declares its originating artifact-local change with YAML front matter: source_change: change-tenant-login. In the in-place layout of knowledge-layout.md, delivery_tasks is not written, and delivery always resolves to changes/<source_change>/tasks/. In the legacy layout, a version prepared with provenance also declares delivery_tasks: change."
- Version provenance, paragraph 2. Old: "The delivery_tasks marker is the literal change; invalid values are diagnosed. Its absence preserves legacy version-owned plans. New-layout deliveries require the exact retained originating change." Intermediate prose correction: "In the in-place layout, a version record has no delivery_tasks marker, and delivery resolves to the exact retained originating change. In the legacy layout, the delivery_tasks marker is the literal change; invalid values are diagnosed; its absence preserves legacy version-owned plans; a version with the marker requires the exact retained originating change." This prose was then replaced by table rows 1 to 4 (see below). The sentence "In the in-place layout, a version record has no delivery_tasks marker." stays in the table introduction.
- Guidance and delivery. Old: "Add source_change and delivery_tasks: change during new version preparation." New: "Add source_change during new version preparation. In the in-place layout, do not write delivery_tasks; add delivery_tasks: change only to a new version of an artifact that uses the legacy layout."

Residual finding, not edited (outside the three D3 locations of the contract): Shared evidence paragraph 1 still says "Sources can point to ... the exact retained originating change's task evidence for a version declaring delivery_tasks: change." An in-place version never declares delivery_tasks, so this sentence read literally excludes in-place versions. Reported to the coordinator.

#### D8, artifact-driven/specifications/system-flows.md

Support kind element, first corrected as a bullet, then carried into the support kinds table. Old bullet: "kind: element uses artifact and element (the existing safe knowledge element path); optional status and change follow the established/proposed reference contract. Same-owner references with no explicit selector resolve in the flow's own snapshot; cross-artifact references default to the current established snapshot. Explicit proposed references identify status: proposed and their supplying change. Do not pin an old version in an element path." Corrected bullet: "kind: element uses artifact and element (the existing safe knowledge element path). In the in-place layout, the target resolves in the same checked-out tree, as knowledge-layout.md defines for references; the status and change selectors are legacy-only and have no effect. In the legacy layout, optional status and change follow the established/proposed reference contract: same-owner references with no explicit selector resolve in the flow's own snapshot; cross-artifact references default to the current established snapshot; explicit proposed references identify status: proposed and their supplying change. Do not pin an old version in an element path."

Final table cells: Optional fields of element "status, change (legacy layout: follow the established/proposed reference contract)"; Source selection of element "In the in-place layout, the target resolves in the same checked-out tree, as knowledge-layout.md defines for references; the status and change selectors are legacy-only and have no effect. In the legacy layout, same-owner references with no explicit selector resolve in the flow's own snapshot; cross-artifact references default to the current established snapshot; explicit proposed references identify status: proposed and their supplying change." Kind flow keeps "The same source-selection rules as element", so the correction applies to it. Basis: knowledge-layout.md, Structural facts and identity: "A reference resolves in the same checked-out tree. ... The status and change selectors of the legacy contract are unnecessary for in-place artifacts; readers tolerate them without effect. Flow support of kind element and kind flow follows the same rule."

model-explanations.md participant selector wording is drawn as written (Corrections section).

### Representations

#### 1. agent-efficiency.md, Adoption diagnostics

Form: table Object | Field | Type or values | Rule. 17 rows (result 10, diagnostic 4, error 3), 4 columns. Mode: replace in paragraph 4; summarize for paragraph 1 (stays unchanged). Placement: after "... in JSON mode."; introduction keeps the schema name se-adopt.result.v1; table; source line; then paragraph 5 ("The CLI must select ..."). Paragraphs 1, 2, 3 and 5 are unchanged.

Removed sentences to cells:

| Removed sentence | Carried by |
| --- | --- |
| "Schema se-adopt.result.v1 has operation (list, preview, adopt), ok (boolean), architecture (string or null), destination (absolute string or null), created and unchanged (integers), diagnostics (array), complete (boolean), and error (null or {code,message,action})." | Introduction ("Schema se-adopt.result.v1 has these fields"); rows result/operation "list, preview or adopt", result/ok "boolean", result/architecture "string or null", result/destination "absolute string or null", result/created "integer", result/unchanged "integer", result/diagnostics "array", result/complete "boolean", result/error "null or {code, message, action}"; rows error/code, error/message, error/action |
| "List adds architectures with name and description." | result/architectures: "entries with name and description" and rule "List operation only." |
| "Preview created means would-create." | result/created rule: "Preview created means would-create." |
| "A failed operation never claims files were created from a preflight count: created is zero; optionally report pending separately." | result/created rule, verbatim |
| "On a write failure, zero created does not prove rollback succeeded; retain the documented rollback limitation in error.action." | result/created rule "On a write failure, zero created does not prove rollback succeeded."; error/action rule "On a write failure, retain the documented rollback limitation." |

Summarized (kept) facts: diagnostic code/path/message/action strings, the three code values and the workspace-relative forward-slash path rule from paragraph 1; "Counts refer only to safely checked identical and missing files." from paragraph 2 (in created and unchanged rules). Not drawn, per row spec: no "complete is false" rule, no error code values; error field types are "—".

#### 2. evidence-records.md, Check records

Form: table Record | Field | Type or values | Rule, 6 rows (evidence_records 4, self_check 2). Mode: replace in paragraph 1; self_check rows summarize paragraph 2 sentence 1, which stays. Placement: after "A task or phase document may declare evidence_records, ..."; introduction in the same paragraph; table; source line; "Reject traversal, ... Commands are inert text." as a paragraph; paragraph 2 unchanged.

| Removed sentence | Carried by |
| --- | --- |
| "id is unique within that file and matches [a-z0-9][a-z0-9-]*." | evidence_records/id: type "matches `[a-z0-9][a-z0-9-]*`", rule "Unique within that file" |
| "method is nonempty descriptive text." | evidence_records/method: "nonempty descriptive text" |
| "result is passed, failed or incomplete." | evidence_records/result: "passed, failed or incomplete" |
| "source is a safe repository-relative Markdown path with an optional heading fragment, resolving to nonempty check details." | evidence_records/source: type "safe repository-relative Markdown path with an optional heading fragment", rule "Resolves to nonempty check details." |
| "It may target the same file's Evidence section." | evidence_records/source rule: "It may target the same file's Evidence section." |

#### 3. evidence-records.md, Publication records

Form: table Record | Field | Type or values | Rule, 7 rows (publication_reviews 4, required_changes 3). Mode: replace in paragraph 1. Placement: after "An artifact root or owning unit brief may declare publication_reviews, ..."; introduction in the same paragraph; table; source line; "Reject credentials ... dependency inventory." as a paragraph; paragraph 2 unchanged.

| Removed sentence | Carried by |
| --- | --- |
| "artifact is a safe artifact ID; version is an existing snapshot directory ID; source resolves to nonempty scoped review detail." | publication_reviews/artifact "safe artifact ID"; publication_reviews/version "existing snapshot directory ID" (verbatim, as the row spec says); publication_reviews/source rule "Resolves to nonempty scoped review detail" |
| "required_changes is a nonempty list of objects with repository, scope and pull_request." | publication_reviews/required_changes: "nonempty list of objects with repository, scope and pull_request" |
| "repository is the repository's explicit HTTPS remote identity; scope is nonempty human-reviewed text defining required knowledge, implementation and retained-delivery changes; pull_request is a same-host, same-repository HTTPS PR URL." | required_changes/repository "the repository's explicit HTTPS remote identity"; required_changes/scope type "nonempty human-reviewed text", rule "Defines required knowledge, implementation and retained-delivery changes"; required_changes/pull_request "same-host, same-repository HTTPS PR URL" |

#### 4. knowledge-layout.md, Layout (legacy listing)

Form: text listing, 12 entries in 13 text lines (the README entry wraps to a second line, as in the row specification). Mode: summarize; nothing removed. Placement: after the layout-detection paragraph ("An artifact uses the in-place layout when ..."), before "Nested directories under the three knowledge directories are allowed. ...". Source line as in the row specification.

Fact list (entry: source in knowledge-layout.md):

1. docs/artifacts/<artifact>/: Layout listing line 1.
2. README.md with Markdown sections Current established version, Established dependencies or Active change: Records paragraph 1 ("In the in-place layout, readers do not interpret Markdown sections such as ..."), Migration step 3.
3. No knowledge directories directly under the artifact: layout detection paragraph ("Otherwise it uses the legacy layout").
4. changes/<change>/README.md: Migration step 2 ("the change keeps README.md and tasks/").
5. changes/<change>/requirements/ with specifications/ and decisions/, copied knowledge: Migration steps 2 and 5.
6. changes/<change>/dependencies.yaml, dependency edges: Migration step 4 ("after applying its edges to depends_on"), step 5, Derived facts last paragraph.
7. changes/<change>/tasks/: Migration step 2.
8. versions/<version>/README.md, can carry a delivery_tasks marker: Migration step 5 ("Remove delivery_tasks markers"), Records paragraph 3.
9. versions/<version>/requirements/ with specifications/ and decisions/: Migration steps 2 and 5, Derived facts "Established knowledge".
10. versions/<version>/tasks/, version-owned tasks where present: Migration step 5.
11. docs/artifacts/dag.yaml, legacy-only, deleted when no legacy artifact remains: Migration step 4, Derived facts last paragraph.
12. docs/artifacts/units-of-work/<unit>/README.md unchanged: Layout listing.

Count check: 12 entries, 12 facts, in the line order of the in-place listing. No fact from knowledge.md or task-retention.md (D1, D4 not touched). No "add and remove lists". The in-place listing is unchanged.

Deviation: line 6 reads "dependency edges", not "proposed dependency edges". knowledge-layout.md says only "applying its edges to depends_on"; it does not call the edges proposed.

#### 5. knowledge-layout.md, Migration step 5

Form: table Record | Condition | Action on conversion, 9 rows, indented 3 spaces inside list item 5. Mode: replace inside item 5. Placement: item 5 keeps "Optionally convert the retained legacy records, in the same or a later change." plus the introduction; table; source line; "Every deleted file must exist unchanged in the commit that introduced its version. Without conversion, leave these directories untouched." Item 6 follows. Rendering check with marked 18.1.1: one ordered list of 6 items; the table and both paragraphs are inside item 5; item 6 stays item 6. GitHub (cmark-gfm) supports a table indented to the list-item content column, so no fallback was needed.

| Removed sentence | Carried by |
| --- | --- |
| "Delete the knowledge directories of versions/<version>/ and the copied knowledge directories and dependencies.yaml of delivered changes." | Rows 1 ("Knowledge directories of `versions/<version>/` / — / Delete"), 2 ("Copied knowledge directories of a change / The change is delivered / Delete"), 3 ("dependencies.yaml of a change / The change is delivered / Delete") |
| "Delete version-owned tasks that are byte-identical to the originating change's tasks, and keep task sets that have no such copy." | Rows 4 ("Version-owned tasks / Byte-identical to the originating change's tasks / Delete") and 5 ("Version-owned task set / No such byte-identical copy / Keep") |
| "Keep the copied knowledge of a change that no version names; it remains a retained legacy record." | Row 6 ("Copied knowledge of a change / No version names the change / Keep; it remains a retained legacy record") |
| "Remove delivery_tasks markers." | Row 7 |
| "Point unit evidence and links at the retained change tasks, or name the Git snapshot in plain text." | Row 8 |
| "Restate affirmative prose publication reviews as publication_reviews after verifying the merged PRs." | Row 9 ("Affirmative prose publication reviews / After verifying the merged PRs / Restate as publication_reviews") |

#### 6. model-explanations.md, Model declarations

Form: table Field | Rule | Resolves to, 4 rows. Mode: replace in paragraph 1. Placement: after "Each record has id, title, description and sources."; table; source line; "A source is evidence, ... document names." as a paragraph; paragraph 2 unchanged.

| Removed sentence | Carried by |
| --- | --- |
| "IDs use the existing safe flow-ID syntax and are unique across an artifact snapshot." | id rule "Existing safe flow-ID syntax; unique across an artifact snapshot"; id resolves to "Logical identity artifact:model-id" (summarizes paragraph 2) |
| "title and description are nonempty strings." | title and description rules "Nonempty string" |
| "sources is a nonempty unique list of existing safe knowledge-element paths within that owner's snapshot." | sources rule "Nonempty unique list of existing safe knowledge-element paths"; resolves to "Knowledge elements within that owner's snapshot" |

#### 7. model-explanations.md, Flow participants and interactions

Form: table Record | Field | Rule | Resolves to, 11 rows (participant 6, interaction 5). Mode: replace. Placement: after the interactions paragraph, before "Existing steps and transitions retain ...". Selector wording drawn as written.

| Removed sentence | Carried by |
| --- | --- |
| "IDs, owner and model use safe-ID syntax; requires is a nonempty description of the model's role in this journey." | participant/id "Safe-ID syntax"; participant/artifact "Safe-ID syntax; the owner"; participant/model "Safe-ID syntax"; participant/requires "Nonempty description of the model's role in this journey" |
| "Optional status/change use the existing established/proposed selector rules." | participant/status and participant/change: "Optional; the existing established/proposed selector rules" |
| "Endpoints name declared participant IDs; action and outcome are nonempty text; supports is a nonempty unique list of existing flow support IDs." | interaction/from and interaction/to "Declared participant ID", resolves to "Participant of this flow"; interaction/action and interaction/outcome "Nonempty text"; interaction/supports "Nonempty unique list of existing flow support IDs" |

Kept text summarized in Resolves to: "Proposed selection explicitly identifies its supplying change." (change row); "Missing model targets stay unresolved and visible." (model row); "Evidence basis and observed evidence are taken from those support records" (supports row).

#### 8. system-flows.md, Document contract (fields)

Form: table Record | Field | Type or values | Rule, 22 rows (flow 11, step 3, transition 3, support 5). Mode: replace in paragraphs 1 and 2. Placement: after "Use Markdown with YAML front matter. The flow key is an object with ..."; introduction; table; source line; paragraph "A test file's existence alone is static evidence. Inferred support remains visible as a candidate; it cannot prove compatibility or establishment. Markdown records purpose, ... second authority."; then the support kinds table; then "Examples use YAML values literally." and the YAML example unchanged. The id row only points to Ownership and identity, so D6 does not apply.

| Removed sentence | Carried by |
| --- | --- |
| "title, trigger and outcome are nonempty strings." | flow/title, flow/trigger, flow/outcome: "nonempty string" |
| "artifact must match the owning directory." | flow/artifact rule |
| "entry_steps is a nonempty list of unique declared step IDs." | flow/entry_steps |
| "steps is a nonempty list; each step has unique id, nonempty title and supports (a list of unique declared support IDs)." | flow/steps "nonempty list of step records"; step/id "Unique"; step/title "Nonempty"; step/supports "list of unique declared support IDs" |
| "transitions is a list of from/to step IDs with optional nonempty condition text." | flow/transitions "list of transition records"; transition/from and transition/to "step ID"; transition/condition "optional nonempty text" |
| "Support-free steps are readable but produce an evidence-gap diagnostic unless their gap is explained." | step/supports rule |
| "Optional gaps and exclusions are lists of nonempty strings." | flow/gaps and flow/exclusions "optional list of nonempty strings" |
| "A support record has unique id, kind, nonempty requires and basis." | flow/support "support records"; support/id "Unique"; support/kind; support/requires "Nonempty"; support/basis |
| "basis is documented, static, observed or inferred." | support/basis values |
| "It describes the evidence basis, not an approval or verified-execution state." | support/basis rule |
| "observed requires nonempty evidence paths to recorded check/trace details." | support/evidence "paths to recorded check/trace details", rule "Nonempty when basis is observed" |

Moved, not removed: "Markdown records purpose, ..." (paragraph after the table). Kept: "A test file's existence alone is static evidence."; "Inferred support remains visible as a candidate; ...". flow/id "string; Follows the ID rules in Ownership and identity" is added from the field list of the flow key; support/kind values come from the support kinds. "nonempty" is not written for transitions or support.

#### 9. system-flows.md, Document contract (support kinds)

Form: table Kind | Required fields | Optional fields | Source selection | Meaning and limits, 3 rows. Mode: replace the three bullets, after correction D8. Placement: where the bullets were, after "... without duplicating a second authority." and before "Examples use YAML values literally.".

| Removed sentence (corrected bullet) | Carried by |
| --- | --- |
| element: "kind: element uses artifact and element (the existing safe knowledge element path)." | element / Required fields |
| element: "In the in-place layout, the target resolves in the same checked-out tree, as knowledge-layout.md defines for references; the status and change selectors are legacy-only and have no effect." (D8) | element / Source selection, sentence 1 |
| element: "In the legacy layout, optional status and change follow the established/proposed reference contract: same-owner references ...; cross-artifact references default to the current established snapshot; explicit proposed references identify status: proposed and their supplying change." | element / Optional fields "status, change (legacy layout: follow the established/proposed reference contract)"; element / Source selection, sentence 2 |
| element: "Do not pin an old version in an element path." | element / Meaning and limits |
| flow: "kind: flow uses artifact and flow (the target's local flow ID), with the same source-selection rules." | flow / Required fields; flow / Source selection "The same source-selection rules as element."; Optional fields "—" |
| flow: "It links a named subjourney; it does not turn step transitions into execution prerequisites." | flow / Meaning and limits |
| implementation or test: "kind: implementation or test uses a safe repository-relative path and optional symbol (a nonempty advisory location)." | implementation or test / Required fields "path (a safe repository-relative path)"; Optional fields "symbol (a nonempty advisory location)" |
| "Sources must be readable tracked files within the selected worktree; never follow escaping symlinks or permit .git, credential files or arbitrary file access." | Source selection "Sources must be readable tracked files within the selected worktree."; Meaning and limits "Never follow escaping symlinks or permit .git, credential files or arbitrary file access." |
| "Renames preserve flow IDs but require source references to be updated." | implementation or test / Meaning and limits |
| "A symbol match alone does not prove runtime behavior." | implementation or test / Meaning and limits |

#### 10. task-dag.md, Plan membership and Task declarations

Form: table Condition | Outcome, 11 rows. Mode: summarize; all prose stays. Placement: end of Task declarations, after the paragraph "A graph edge goes from prerequisite to dependent task. ...". Introduction says that the table lists the conditions of both sections and their outcomes and that invalid plans are not executable.

Fact list (row: source sentence):

1. Member of the plan: Plan membership paragraph 2 "Paths are unique strings relative to tasks/, use forward slashes, and end in .md."; "Nested task paths are allowed."; "Listed paths must identify readable Markdown task files within the change."
2. Excluded: "Unlisted files remain historical/context knowledge and are excluded."
3. Cannot be a task: "README.md cannot be a task." (not written as "Invalid").
4. Invalid: "Absolute paths, dot segments, backslashes, NUL, and paths outside tasks/ are invalid."
5. Valid empty plan: "An explicit empty list is a valid empty plan."
6. Graph unavailable: "Missing tasks front matter means graph unavailable for a legacy plan; it does not invalidate historical knowledge."
7. Invalid: "A tasks value with the wrong type is invalid."
8. No internal prerequisite: Task declarations paragraph 2 "[] declares no internal prerequisite."
9. Graph invalid: "Self-dependencies, missing IDs, malformed metadata, duplicate IDs, duplicate prerequisite entries, and cycles invalidate the graph."
10. Invalid: "YAML duplicate mapping keys are invalid."
11. No edge: "Unknown metadata keys do not define edges."; "No prose or filename fallback creates dependencies."

Count check: 11 rows, 11 conditions. D2 (External gates and lifecycle) is not drawn from.

#### 11. units-of-work.md, Version provenance

Form: table Member condition | Resolution result, 8 rows, after D3. Mode: replace in paragraph 2. Placement: after "Resolve a member ... retained originating plans."; introduction; table; source line; "Legacy versions without provenance remain readable; do not guess their source by name, timestamp, or matching bytes." (kept; row 8 summarizes it).

| Removed sentence (after D3) | Carried by |
| --- | --- |
| "In the in-place layout, a version record has no delivery_tasks marker, and delivery resolves to the exact retained originating change." | Introduction sentence "In the in-place layout, a version record has no delivery_tasks marker."; row 1 "In-place layout: a version record names the change in source_change / Delivery resolves to `changes/<source_change>/tasks/` of the exact retained originating change" |
| "In the legacy layout, the delivery_tasks marker is the literal change; invalid values are diagnosed; its absence preserves legacy version-owned plans; a version with the marker requires the exact retained originating change." | Row 2 "Legacy layout: the version declares delivery_tasks: change / Requires the exact retained originating change"; row 3 "Legacy layout: the version has no delivery_tasks marker / The legacy version-owned plan is preserved"; row 4 "Legacy layout: delivery_tasks has a value other than the literal change / Diagnosed as invalid" |
| "If no originating version exists, retained change knowledge is preparatory." | Row 5 |
| "If neither exists, report missing-member." | Row 6 "Neither a version nor a retained change exists / Report missing-member" |
| "Several version claims are ambiguous." | Row 7 "Several versions claim the change / Ambiguous" |

Deviation in wording: row 4 condition reads "Legacy layout: delivery_tasks has a value other than the literal change / Diagnosed as invalid" instead of "delivery_tasks has an invalid value / Diagnosed", so that the fact "the marker is the literal change" stays in a cell and the corrected prose scope (legacy layout) is kept. Rows 2 and 3 have the prefix "Legacy layout:" as in the row specification; row 3 reads "The legacy version-owned plan is preserved" for "Legacy version-owned plan".

### Checks

- Table counts with the marked 18.1.1 lexer: agent-efficiency 17x4; evidence-records 6x4 and 7x4; knowledge-layout listing 13 text lines (12 entries) and Migration 9x3 inside item 5; model-explanations 4x3 and 11x4; system-flows 22x4 and 3x5; task-dag 11x2; units-of-work 8x2; framework 8x3 and one mermaid block. Each row has the column count of its header.
- Headings: `grep '^#'` before and after is identical for all 8 files.
- Links: no relative link added, removed or changed in the diff.
- validate-knowledge.mjs on the worktree: 0 errors, 1 diagnostic (info, retained-legacy-change, docs/artifacts/artifact-plane/changes, change-model-explanations), pre-existing.
