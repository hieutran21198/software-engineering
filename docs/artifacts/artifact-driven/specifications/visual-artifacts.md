---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/specifications/visual-artifacts.md#specification-self-check
---

# Visual representations of the ADD project knowledge

Governs VA1 to VA4 in [requirements/visual-artifacts.md](../requirements/visual-artifacts.md). Each representation follows the [visual representation guide](../../../artifact-driven/06-guidelines/visual-representations.md). The row specifications below were checked against the files at 5d7935a. Paths are relative to docs/artifacts.

## Decisions

All nine VA1 candidates are kept. Two of them become two tables each, because one table would cross a heading.

| Element | Section | Representation | Size | Mode |
| --- | --- | --- | --- | --- |
| specifications/agent-efficiency.md | Adoption diagnostics | Table of object, field, values and rule | 17 rows | Replace the schema sentences of paragraph 4; paragraph 1 stays |
| specifications/evidence-records.md | Check records | Table of field, values and rule | 6 rows | Replace |
| specifications/evidence-records.md | Publication records | Table of field, values and rule | 7 rows | Replace |
| specifications/knowledge-layout.md | Layout | Legacy listing in the line order of the existing in-place listing | 12 lines | Summarize |
| specifications/knowledge-layout.md | Migration, step 5 | Table of record, condition and conversion action | 9 rows | Replace, inside list item 5 |
| specifications/model-explanations.md | Model declarations | Table of field and rule | 4 rows | Replace |
| specifications/model-explanations.md | Flow participants and interactions | Table of record, field, rule and resolution target | 11 rows | Replace |
| specifications/system-flows.md | Document contract | Table of record, field, values and rule | 22 rows | Replace |
| specifications/system-flows.md | Document contract, support kinds | Table of kind, required fields, optional fields, source selection, meaning and limits | 3 rows | Replace, after correction D8 |
| specifications/task-dag.md | Task declarations | Table of condition and outcome for Plan membership and Task declarations | 11 rows | Summarize |
| specifications/units-of-work.md | Version provenance | Table of member condition and resolution result | 8 rows | Replace, after correction D3 |

Replace mode removes only the sentences that a row specification names; summarize mode keeps the prose and puts the table after it. If the list-item table of Migration step 5 does not render on GitHub or in the Plane, use summarize mode and put the table after step 6.

## Corrections

- D3, units-of-work.md, Version provenance and Guidance and delivery: state the in-place rule first. A new version record declares `source_change` only and does not write `delivery_tasks`; delivery resolves to `changes/<source_change>/tasks/`. Limit the `delivery_tasks: change` rules to versions in the legacy layout. Correct line 50 with the same rule, so that the file does not contradict itself.
- D8, system-flows.md, support kinds element and flow: state that a support resolves in the same checked-out tree, as references do in knowledge-layout.md, and that the status and change selectors are legacy-only and have no effect for in-place artifacts. D8 is added to the survey; it was found in this phase.

Defects D1, D2 and D4 to D7 are not in a drawn passage and stay recorded in the survey. The participant selector wording of model-explanations.md is not contradicted by a current rule and is drawn as written.

## Validation

Each task records, per representation: the fact list, the count check, and for replace mode a mapping from every replaced sentence to a cell or to retained text. A comparison of the old and new section text confirms that no fact, condition, limit or exception is lost. Diagrams follow authoring rules 1 to 8 of the guide; each renders on GitHub-compatible Mermaid and in the Plane. Headings stay unchanged, and every relative link and anchor of the changed files resolves. validate-knowledge reports no error.

## Row specifications

### artifact-driven/specifications/agent-efficiency.md — Adoption diagnostics

1. **Decision:** adjust. One table with an Object column instead of two parts (KISS, one table, 4 columns).
2. **Form:** table `Object | Field | Type or values | Rule`. 17 rows:
   - result (10): `operation` (list, preview or adopt); `ok` (boolean); `architecture` (string or null); `destination` (absolute string or null); `created` (integer; rule: "Preview created means would-create." A failed operation is zero and never claims files were created from a preflight count; a pending count can be reported separately. On a write failure, zero does not prove rollback succeeded. Counts refer only to safely checked identical and missing files); `unchanged` (integer; counts refer only to safely checked identical and missing files); `diagnostics` (array); `complete` (boolean); `error` (null or {code, message, action}); `architectures` (list operation only; entries with name and description).
   - diagnostic (4): `code` (string: content-conflict, destination-type or parent-type); `path` (string; workspace-relative with forward slashes); `message` (string); `action` (string).
   - error (3): `code`, `message`, `action` (type not stated: write "—"; `action` rule: on a write failure it retains the documented rollback limitation).
   Do not write "complete is false when the inventory is incomplete": paragraph 2 says only "State that the inventory is incomplete". Do not state error code values; the text gives none.
3. **Mode:** mixed, stated explicitly.
   - Replace in paragraph 4 (line 27–36) these sentences: "Schema se-adopt.result.v1 has operation (list, preview, adopt), ok (boolean), architecture (string or null), destination (absolute string or null), created and unchanged (integers), diagnostics (array), complete (boolean), and error (null or {code,message,action}). List adds architectures with name and description. Preview created means would-create. A failed operation never claims files were created from a preflight count: created is zero; optionally report pending separately. On a write failure, zero created does not prove rollback succeeded; retain the documented rollback limitation in error.action." Every fact maps to a result or error row above. Keep the schema name `se-adopt.result.v1` in the introduction sentence.
   - Summarize for paragraph 1 (line 8–13): the diagnostic rows restate "A diagnostic has code, path, message and action strings. Codes distinguish content-conflict, destination-type and parent-type. Paths are workspace-relative using forward slashes." Paragraph 1 stays unchanged, because it also holds the Go API rules.
4. **Placement:** directly after the kept sentences of paragraph 4: "Add --json to the existing CLI. Emit exactly one JSON object on stdout without human success text or error prefixes. Keep stderr free of duplicate human errors in JSON mode." Then the introduction ("Schema se-adopt.result.v1 has these fields; diagnostic and error objects follow.") and the table, then paragraph 5 ("The CLI must select JSON error rendering ...").
5. **Defect dependency:** none.
6. **Anchors:** keep `## Adoption diagnostics` (#adoption-diagnostics) and all other headings. No inbound anchor links found (grep of docs, apps, src, website). The file has no front matter.
7. **Stays in text:** adopt.Copy(bundle, project, output, dryRun) and Result source compatibility; additive extension and the typed aggregate error; sort by path then code and deduplicate the same blocked parent; no consumer file contents in diagnostics; all of paragraphs 2, 3 and 5 (continued inspection, no descent or symlink follow, fatal errors with collected diagnostics, "State that the inventory is incomplete", no writes on preflight error, unchanged copy/rollback; human output default and se-adopt: prefix; --json flag forms, --help exception, nonzero exit, structured errors for unsupported architectures and malformed arguments, additive field compatibility and versioned schema rule).

### artifact-driven/specifications/evidence-records.md — Check records; Publication records

1. **Decision:** adjust. Two tables, one per section, because one table cannot belong to two headings (VA4).
2. **Form:**
   - Check records table `Record | Field | Type or values | Rule`, 6 rows: evidence_records `id` (string; matches [a-z0-9][a-z0-9-]*; unique within the file), `method` (nonempty descriptive text), `result` (passed, failed or incomplete), `source` (safe repository-relative Markdown path with an optional heading fragment; resolves to nonempty check details; may target the same file's Evidence section); self_check `result` and `source` (phase document only; same rules as evidence_records).
   - Publication records table `Record | Field | Type or values | Rule`, 7 rows: publication_reviews `artifact` (safe artifact ID), `version` (existing snapshot directory ID), `source` (resolves to nonempty scoped review detail), `required_changes` (nonempty list of objects); required_changes `repository` (the repository's explicit HTTPS remote identity), `scope` (nonempty human-reviewed text defining required knowledge, implementation and retained-delivery changes), `pull_request` (same-host, same-repository HTTPS PR URL).
   Total 13 rows.
3. **Mode:**
   - Check records: replace in paragraph 1 (line 9): "id is unique within that file and matches [a-z0-9][a-z0-9-]*. method is nonempty descriptive text. result is passed, failed or incomplete. source is a safe repository-relative Markdown path with an optional heading fragment, resolving to nonempty check details. It may target the same file's Evidence section." Each maps to a cell. The self_check rows summarize paragraph 2 sentence 1, which stays.
   - Publication records: replace in paragraph 1 (line 15): "artifact is a safe artifact ID; version is an existing snapshot directory ID; source resolves to nonempty scoped review detail. required_changes is a nonempty list of objects with repository, scope and pull_request. repository is the repository's explicit HTTPS remote identity; scope is nonempty human-reviewed text defining required knowledge, implementation and retained-delivery changes; pull_request is a same-host, same-repository HTTPS PR URL." Each maps to a cell.
4. **Placement:** Check records table after "A task or phase document may declare evidence_records, a list of objects with id, method, result and source."; the rest of paragraph 1 ("Reject traversal, ... Commands are inert text.") follows as a paragraph, then paragraph 2 unchanged. Publication table after "An artifact root or owning unit brief may declare publication_reviews, a list of objects with artifact, version, source and required_changes."; then "Reject credentials in URLs, ... Records are claims about required merges, not a machine-derived complete code dependency inventory." as a paragraph, then paragraph 2 unchanged.
5. **Defect dependency:** none of D1–D7. Observation only: "version is an existing snapshot directory ID" uses snapshot wording; it is not a verified defect, so copy it verbatim.
6. **Anchors:** keep `## Check records`, `## Publication records` and all headings. No inbound anchor links to this file (the bundle links go to 06-guidelines/evidence-records.md, a different file). Element-level reference from artifact-plane:specifications/knowledge-editing.md and evidence-and-comparison.md; no anchor.
7. **Stays in text:** the reject lists of both sections (traversal, absolute paths, backslashes, NUL, escaping symlinks, duplicate IDs or keys, wrong types, missing targets, empty sections; credentials in URLs, duplicate repository/PR pairs, mismatched artifact/version ownership, missing/ambiguous provenance, invalid types, conflicting assertions); source-detail content and "A bare marker or front matter is insufficient. Commands are inert text."; all of paragraph 2 of Check records (meaning of a passed self_check, DoD precedence, empty list, conflicting results, reader display); "Records are claims ..."; all of paragraph 2 of Publication records (source statement, protected-ref verification, unknown/unverified establishment, offline reader, coordinator reconciliation, prose fallback only when publication_reviews is absent).

### artifact-driven/specifications/knowledge-layout.md — Layout (with Migration)

1. **Decision:** adjust. Keep the existing in-place listing unchanged (it is the contract, VA4) and add one legacy listing in the same line order, so that each line faces the existing line. Take the legacy facts only from knowledge-layout.md itself, not from knowledge.md line 24 (D1) or task-retention.md lines 7 and 21 (D4).
2. **Form:** `text` listing, 12 lines, each from a named sentence:
   ```text
   docs/artifacts/<artifact>/
     README.md                       Markdown sections such as Current established version,
                                     Established dependencies or Active change
     (no requirements/, specifications/ or decisions/ directly under the artifact)
     changes/<change>/README.md      change README
     changes/<change>/requirements/  copied knowledge; also specifications/ and decisions/
     changes/<change>/dependencies.yaml   proposed dependency edges
     changes/<change>/tasks/         plan, tasks, DoD and evidence
     versions/<version>/README.md    version README; can carry a delivery_tasks marker
     versions/<version>/requirements/   version knowledge; also specifications/ and decisions/
     versions/<version>/tasks/       version-owned tasks, where present
   docs/artifacts/dag.yaml           legacy-only; deleted when no legacy artifact remains
   docs/artifacts/units-of-work/<unit>/README.md   unchanged
   ```
   Fact sources: README sections line 40 and Migration step 3; no knowledge directories line 25; change README and tasks step 2 ("the change keeps README.md and tasks/"); copied knowledge steps 2 and 5; dependencies.yaml steps 4 and 5 and line 99; version knowledge step 2 and step 5 and Derived facts "Established knowledge"; version-owned tasks step 5; delivery_tasks marker step 5 and line 50; dag.yaml step 4 and line 99; units line 22. Do not add "add and remove lists" (that fact is in knowledge.md, not here).
3. **Mode:** summarize. Nothing is removed. Source line: `Source: artifact-driven:specifications/knowledge-layout.md, sections Layout, Records and Derived facts and Migration steps 2 to 5; derived one line per directory or record that these sections name for the legacy layout, in the order of the in-place listing; current snapshot.`
4. **Placement:** after the paragraph that starts "An artifact uses the in-place layout when at least one of requirements, specifications or decisions exists ..." (line 25), with an introduction such as "The legacy layout, for comparison, in the same line order:". The paragraph "Nested directories under the three knowledge directories are allowed. ..." follows.
5. **Defect dependency:** none if the facts come only from this file. If the implementer draws from knowledge.md line 24 or task-retention.md line 7/21, D1 and D4 apply and must be corrected first; do not do that.
6. **Anchors:** keep `## Layout` (#layout; cited as text "artifact-driven:specifications/knowledge-layout.md#layout" in artifact-driven/specifications/visual-knowledge.md line 251), `## Records`, `## Structural facts and identity` (linked from visual-knowledge.md line 139), `## Migration`, `## Specification self-check` (front matter self_check source). Element-level references from Plane knowledge-editing, knowledge-layout-reading and flow records; no anchors.
7. **Stays in text:** layout detection per artifact and mixed repositories; nested directories; flows under specifications/flows; task format; all Records, Derived facts and Migration text; the legacy listing shows no rule about readers.

### artifact-driven/specifications/knowledge-layout.md — Migration, step 5

1. **Decision:** confirm.
2. **Form:** table `Record | Condition | Action on conversion`, 9 rows:
   | Record | Condition | Action on conversion |
   | --- | --- | --- |
   | Knowledge directories of versions/<version>/ | — | Delete |
   | Copied knowledge directories of a change | The change is delivered | Delete |
   | dependencies.yaml of a change | The change is delivered | Delete |
   | Version-owned tasks | Byte-identical to the originating change's tasks | Delete |
   | Version-owned task set | No such byte-identical copy | Keep |
   | Copied knowledge of a change | No version names the change | Keep; it remains a retained legacy record |
   | delivery_tasks markers | — | Remove |
   | Unit evidence and links | — | Point at the retained change tasks, or name the Git snapshot in plain text |
   | Affirmative prose publication reviews | After verifying the merged PRs | Restate as publication_reviews |
3. **Mode:** replace, inside list item 5. Replaced sentences: "Delete the knowledge directories of versions/<version>/ and the copied knowledge directories and dependencies.yaml of delivered changes. Delete version-owned tasks that are byte-identical to the originating change's tasks, and keep task sets that have no such copy. Keep the copied knowledge of a change that no version names; it remains a retained legacy record. Remove delivery_tasks markers. Point unit evidence and links at the retained change tasks, or name the Git snapshot in plain text. Restate affirmative prose publication reviews as publication_reviews after verifying the merged PRs." All facts map to the 9 rows.
4. **Placement:** item 5 keeps "Optionally convert the retained legacy records, in the same or a later change." plus a short introduction, then the table indented 3 spaces under item 5 (blank lines around it), then, still in item 5, "Every deleted file must exist unchanged in the commit that introduced its version. Without conversion, leave these directories untouched." Item 6 follows. Check that GitHub and the Plane renderer (marked) keep the list numbering and render the nested table; if not, fall back to summarize mode with the table after item 6.
5. **Defect dependency:** none.
6. **Anchors:** keep `## Migration` and all headings; no inbound anchor link to #migration found.
7. **Stays in text:** optional conversion in the same or a later change; "Every deleted file must exist unchanged in the commit that introduced its version."; "Without conversion, leave these directories untouched."; steps 1–4 and 6 as a numbered list; the version-number rule after the list.

### artifact-driven/specifications/model-explanations.md — Model declarations; Flow participants and interactions

1. **Decision:** adjust. Two tables, one per section (the survey's single table would cross a heading). The Resolves to column stays.
2. **Form:**
   - Model declarations table `Field | Rule | Resolves to`, 4 rows: `id` (existing safe flow-ID syntax; unique across an artifact snapshot | logical identity artifact:model-id); `title` (nonempty string | —); `description` (nonempty string | —); `sources` (nonempty unique list of existing safe knowledge-element paths | knowledge elements within that owner's snapshot).
   - Flow participants and interactions table `Record | Field | Rule | Resolves to`, 11 rows: participant `id` (safe-ID syntax | —), `artifact` (safe-ID syntax; the owner | owning artifact), `model` (safe-ID syntax | a model of that artifact; a missing model target stays unresolved and visible), `requires` (nonempty description of the model's role in this journey | —), `status` (optional; existing established/proposed selector rules | —), `change` (optional; existing established/proposed selector rules | supplying change of a proposed selection); interaction `from` and `to` (declared participant IDs | participants of this flow), `action` (nonempty text | —), `outcome` (nonempty text | —), `supports` (nonempty unique list of existing flow support IDs | flow support records; evidence basis and observed evidence come from them).
   Total 15 rows.
3. **Mode:** replace.
   - Model declarations paragraph 1 (line 5): replace "IDs use the existing safe flow-ID syntax and are unique across an artifact snapshot. title and description are nonempty strings. sources is a nonempty unique list of existing safe knowledge-element paths within that owner's snapshot."
   - Participants paragraph (line 11): replace "IDs, owner and model use safe-ID syntax; requires is a nonempty description of the model's role in this journey. Optional status/change use the existing established/proposed selector rules."
   - Interactions paragraph (line 13): replace "Endpoints name declared participant IDs; action and outcome are nonempty text; supports is a nonempty unique list of existing flow support IDs."
   Every replaced fact maps to a cell.
4. **Placement:** model table after "Each record has id, title, description and sources."; then "A source is evidence, not model identity. Models can describe business or technical concepts without requiring a DDD category. Do not generate declarations from document names." as a paragraph; paragraph 2 unchanged. Participant table after the interactions paragraph (the one starting "A step may add interactions, ..."), before "Existing steps and transitions retain their identity, ...".
5. **Defect dependency:** none of D1–D7. Possible conflict (see the cross-cutting finding): line 11 selection rules versus knowledge-layout.md line 82. If the coordinator records it, proposed wording: "In the legacy layout, optional status/change use the existing established/proposed selector rules: same-owner implicit selection uses the flow snapshot; cross-artifact implicit selection uses the owner's declared current established version; proposed selection explicitly identifies its supplying change. In the in-place layout, the model resolves in the same checked-out tree, as knowledge-layout.md defines for references, and status and change have no effect." Without that decision, copy the wording verbatim.
6. **Anchors:** keep `## Model declarations`, `## Flow participants and interactions` and all headings. No inbound anchor links found.
7. **Stays in text:** "A flow may add participants, a list of unique records with id, artifact, model and requires." and "A step may add interactions, a list of records with from, to, action, outcome and supports." (introductions); "A source is evidence, not model identity."; no DDD category requirement; no generation from document names; all of Model declarations paragraph 2 (identity, ownership, duplicate and unsafe-source diagnostics, no arbitrary duplicate); the implicit and proposed selection sentences; self-interactions allowed; evidence from support records, not action text; cross-artifact interaction is not an artifact prerequisite; missing model targets unresolved and visible; invalid participant/interaction metadata does not invalidate a valid legacy step/transition; all of paragraph 3.

### artifact-driven/specifications/system-flows.md — Document contract

1. **Decision:** adjust. One table with a Record column instead of four separate parts (the Record column groups the rows).
2. **Form:** table `Record | Field | Type or values | Rule`, 22 rows:
   - flow (11): `id` (string; ID rules in Ownership and identity), `artifact` (must match the owning directory), `title`, `trigger`, `outcome` (nonempty strings), `entry_steps` (nonempty list of unique declared step IDs), `steps` (nonempty list of step records), `transitions` (list of transition records), `support` (support records), `gaps` and `exclusions` (optional lists of nonempty strings).
   - step (3): `id` (unique), `title` (nonempty), `supports` (list of unique declared support IDs; a support-free step is readable but produces an evidence-gap diagnostic unless its gap is explained).
   - transition (3): `from`, `to` (step IDs), `condition` (optional nonempty text).
   - support (5): `id` (unique), `kind` (element, flow, implementation or test; kind fields in the support kinds table), `requires` (nonempty), `basis` (documented, static, observed or inferred; describes the evidence basis, not an approval or verified-execution state), `evidence` (paths to recorded check/trace details; nonempty when basis is observed).
   Do not write "nonempty" for transitions or support; the text does not say it.
3. **Mode:** replace. Paragraph 1 (line 11): replace "title, trigger and outcome are nonempty strings. artifact must match the owning directory. entry_steps is a nonempty list of unique declared step IDs. steps is a nonempty list; each step has unique id, nonempty title and supports (a list of unique declared support IDs). transitions is a list of from/to step IDs with optional nonempty condition text. Support-free steps are readable but produce an evidence-gap diagnostic unless their gap is explained. Optional gaps and exclusions are lists of nonempty strings." Paragraph 2 (line 13): replace "A support record has unique id, kind, nonempty requires and basis. basis is documented, static, observed or inferred. It describes the evidence basis, not an approval or verified-execution state. observed requires nonempty evidence paths to recorded check/trace details." Every fact maps to a cell ("It describes ..." moves into the basis rule, because its referent would otherwise be lost).
4. **Placement:** after "Use Markdown with YAML front matter. The flow key is an object with id, artifact, title, trigger, outcome, entry_steps, steps, transitions and support." Then a paragraph: "A test file's existence alone is static evidence. Inferred support remains visible as a candidate; it cannot prove compatibility or establishment. Markdown records purpose, branch explanations, coverage and evidence detail without duplicating a second authority." Then the support kinds (next row), then "Examples use YAML values literally." and the YAML example unchanged.
5. **Defect dependency:** none, if the id row only points to Ownership and identity. D6 is in that section's paragraph (line 7, "Its authoritative document is specifications/flows/<id>.md in one owning artifact's change or version knowledge."). If the implementer copies the ID syntax from line 7 into the table, D6 must be corrected first. Proposed wording: "Its authoritative document is specifications/flows/<id>.md in the working knowledge of one owning artifact; in the legacy layout, it is in that artifact's change or version knowledge."
6. **Anchors:** keep `## Document contract` and all headings. No inbound anchor links found. Element-level references from flow records and Plane knowledge-editing; no anchor.
7. **Stays in text:** Markdown with YAML front matter; the flow key field list (introduction); static evidence of a test file; inferred support as candidate; the Markdown body role; the YAML worked example; all of Graph semantics and validation (reject list, diagnostics).

### artifact-driven/specifications/system-flows.md — Document contract (support kinds)

1. **Decision:** adjust. Rename the last column from "Limits" to "Meaning and limits", because the flow kind's facts are a meaning ("links a named subjourney"), not a limit.
2. **Form:** table `Kind | Required fields | Optional fields | Source selection | Meaning and limits`, 3 rows:
   - element: artifact, element (the existing safe knowledge element path) | status, change (follow the established/proposed reference contract) | same-owner references with no explicit selector resolve in the flow's own snapshot; cross-artifact references default to the current established snapshot; explicit proposed references identify status: proposed and their supplying change | do not pin an old version in an element path.
   - flow: artifact, flow (the target's local flow ID) | — | the same source-selection rules as element | links a named subjourney; does not turn step transitions into execution prerequisites.
   - implementation or test: path (safe repository-relative) | symbol (a nonempty advisory location) | readable tracked files within the selected worktree | never follow escaping symlinks or permit .git, credential files or arbitrary file access; renames preserve flow IDs but require source references to be updated; a symbol match alone does not prove runtime behavior.
3. **Mode:** replace the three bullets (lines 15–17). Every fact of the bullets maps to a cell; the basis rules of paragraph 2 are in the field table.
4. **Placement:** where the bullets are now: after the paragraph that ends "... without duplicating a second authority." and before "Examples use YAML values literally."
5. **Defect dependency:** none of D1–D7. Conflict (see the cross-cutting finding): the element and flow selection rules contradict knowledge-layout.md line 82 for in-place artifacts. If the coordinator records it, proposed wording for the Source selection cell of element (and, by "the same rules", of flow): "In the in-place layout, the target resolves in the same checked-out tree, as knowledge-layout.md defines for references; status and change have no effect. In the legacy layout, same-owner references with no explicit selector resolve in the flow's own snapshot; cross-artifact references default to the current established snapshot; explicit proposed references identify status: proposed and their supplying change." Optional fields of element then read "status, change (legacy layout: follow the established/proposed reference contract)". Without that decision, copy the wording verbatim.
6. **Anchors:** same section as the previous row; keep `## Document contract`.
7. **Stays in text:** nothing of the bullets if replaced; the YAML example stays as the worked example.

### artifact-driven/specifications/task-dag.md — Plan membership; Task declarations

1. **Decision:** confirm, with 11 rows instead of about 9 (the source names 11 distinct conditions).
2. **Form:** table `Condition | Outcome`, 11 rows:
   | Condition | Outcome |
   | --- | --- |
   | A listed path is a unique string relative to tasks/, uses forward slashes, ends in .md and identifies a readable Markdown task file within the change; nested paths are allowed | Member of the plan |
   | A file is in tasks/ but not listed | Excluded; remains historical or context knowledge |
   | README.md is listed | Cannot be a task |
   | A listed path is absolute, has dot segments, backslashes or NUL, or is outside tasks/ | Invalid |
   | tasks is an explicit empty list | Valid empty plan |
   | tasks front matter is missing | Graph unavailable for a legacy plan; historical knowledge stays valid |
   | tasks has the wrong type | Invalid |
   | depends_on is [] | No internal prerequisite |
   | Self-dependency, missing IDs, malformed metadata, duplicate IDs, duplicate prerequisite entries or a cycle | Graph invalid |
   | YAML duplicate mapping keys | Invalid |
   | Unknown metadata keys, prose or filenames | No edge |
   Do not write "Invalid" for README.md; the text says only "cannot be a task".
3. **Mode:** summarize. Prose stays in both sections, because the table joins two sections and the rows draw from both headings.
4. **Placement:** end of Task declarations, after the paragraph that starts "A graph edge goes from prerequisite to dependent task." Introduction: the table lists the conditions of Plan membership and Task declarations and their outcomes; invalid plans are not executable.
5. **Defect dependency:** none. D2 is in External gates and lifecycle line 38 ("New versions contain no tasks and declare delivery_tasks: change alongside source_change."); the table does not draw from it, so VA3 does not correct it.
6. **Anchors:** keep `## Plan membership`, `## Task declarations` and all headings. No inbound anchor links found. Element-level reference from Plane knowledge-editing (plan membership, task id and depends_on rules); no anchor.
7. **Stays in text:** all prose (summarize). Especially: ID stability on rename; each dependency resolves to a listed task in this same change; edge direction and acyclicity; validation order (membership, then edges, then cycles); invalid plans not executable; self-checks enforce, the visualizer only diagnoses; no runner or CLI validator.

### artifact-driven/specifications/units-of-work.md — Version provenance

1. **Decision:** confirm, after the D3 correction; 8 rows.
2. **Form:** table `Member condition | Resolution result`, 8 rows (with D3 corrected):
   | Member condition | Resolution result |
   | --- | --- |
   | In-place layout: a version record names the change in source_change | Delivery resolves to changes/<source_change>/tasks/ of the exact retained originating change |
   | Legacy layout: the version declares delivery_tasks: change | Requires the exact retained originating change |
   | Legacy layout: the version has no delivery_tasks marker | Legacy version-owned plan |
   | delivery_tasks has an invalid value | Diagnosed |
   | No originating version exists | Retained change knowledge is preparatory |
   | Neither a version nor a retained change exists | missing-member |
   | Several versions claim the change | Ambiguous |
   | Legacy version without provenance | Readable; its source is not guessed by name, timestamp or matching bytes |
3. **Mode:** replace, in paragraph 2 (line 34), the case sentences: "The delivery_tasks marker is the literal change; invalid values are diagnosed. Its absence preserves legacy version-owned plans. New-layout deliveries require the exact retained originating change. If no originating version exists, retained change knowledge is preparatory. If neither exists, report missing-member. Several version claims are ambiguous." The first three sentences are D3 locations; their corrected facts are rows 1–4. Paragraph 1 is corrected in prose (item 5) and stays.
4. **Placement:** after "Resolve a member from its retained change directory and version provenance. Inspect safe immediate version directories' README metadata, including historical versions; read detailed knowledge for the resolved delivered versions and their retained originating plans." Then the table, then "Legacy versions without provenance remain readable; do not guess their source by name, timestamp, or matching bytes." (kept; row 8 summarizes it).
5. **Defect dependency:** D3. Correct it before drawing the table. D3 is one verified defect at lines 32, 34 and 50; correct all three locations, so that the file does not contradict itself (line 50 is in Guidance and delivery, outside the table, but part of the same defect; coordinator confirms this reading of VA3). Proposed wording, in-place rule first:
   - Line 32, replace "A newly prepared version README declares its originating artifact-local change with YAML front matter: source_change: change-tenant-login and delivery_tasks: change." with "A newly prepared version record declares its originating artifact-local change with YAML front matter: source_change: change-tenant-login. In the in-place layout of knowledge-layout.md, delivery_tasks is not written, and delivery always resolves to changes/<source_change>/tasks/. In the legacy layout, a version prepared with provenance also declares delivery_tasks: change."
   - Line 34, the three D3 sentences become (as table rows 1–4, or as prose if the table is rejected): "In the in-place layout, a version record has no delivery_tasks marker, and delivery resolves to the exact retained originating change. In the legacy layout, the delivery_tasks marker is the literal change; invalid values are diagnosed; its absence preserves legacy version-owned plans; a version with the marker requires the exact retained originating change."
   - Line 50, replace "Add source_change and delivery_tasks: change during new version preparation." with "Add source_change during new version preparation. In the in-place layout, do not write delivery_tasks; add delivery_tasks: change only to a new version of an artifact that uses the legacy layout."
   Basis: knowledge-layout.md line 50 ("delivery_tasks is not written: a version record never contains tasks, so delivery always resolves to changes/<source_change>/tasks/") and line 9 (snapshot-copy layout of knowledge.md and task-retention.md is the legacy layout); version records 1.2.0–2.8.0 have no delivery_tasks (grep at 5d7935a). D7 (line 58, Project adoption extension) is not drawn from; leave it.
6. **Anchors:** keep `## Version provenance`, `## Guidance and delivery` and all headings. No inbound anchor links found. Element-level reference from Plane knowledge-editing and units-of-work; no anchor.
7. **Stays in text:** paragraph 1 (corrected): directory semantic version identifies the version; one change per version; at most one established version per artifact/change pair; provenance written during Version preparation, not into established snapshots; brief membership not updated to a newer change or an artifact-only reference. Paragraph 2: inspection of version README metadata and retained plans; legacy versions without provenance readable, no guessing.

## Specification self-check

VA1 maps to Decisions and the row specifications, VA2 to the modes and Validation, VA3 to Corrections, VA4 to Validation and the anchor items of each row. No candidate is rejected. Each replace row names the replaced sentences and maps their facts. KISS: tables first, one listing, no new record or notation. STE: one rule per table row. No Specification blocker prevents Plan.
