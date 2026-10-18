---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/visual-artifacts.md#specification-self-check
---

# Visual representations of the Artifact Plane knowledge

Governs VP1 to VP3 and VP5 for knowledge in [requirements/visual-artifacts.md](../requirements/visual-artifacts.md); the [diagram rendering contract](diagram-rendering.md) governs VP4. Each representation follows the visual representation guide of ADD 2.7.0. Every row was checked against the current workbench contract in authoring-workbench.md and against the code under apps/artifact-plane at 5d7935a.

## Decisions

18 of the 25 VP1 candidates are kept and 7 are rejected. The knowledge-editing write path becomes two diagrams.

| Element | Section | Representation | Size | Mode |
| --- | --- | --- | --- | --- |
| specifications/authoring-workbench.md | Layout | Table of element, wide layout and narrow layout | 11 rows | Summarize |
| specifications/change-impact.md | Query | Table of input, presence, values, default and maximum | 11 rows | Replace sentence 1 |
| specifications/change-impact.md | Query | Tree listing of the response envelope and data | 22 lines | Replace sentences 1 and 2 of the response paragraph |
| specifications/change-review.md | Query and source boundaries | Table of request field, presence, rule and default | 9 rows | Summarize |
| specifications/codex-execution.md | Derived states | Table of state, entered when and left when | 8 rows | Summarize, after one correction |
| specifications/codex-execution.md | Identity and retained graph context | Table of identity field, task binding, capture and agent identity | 12 rows | Summarize |
| specifications/codex-execution.md | Local API and live browser updates | Sequence diagram | 4 parties, 8 messages, 2 notes, 1 loop | Summarize |
| specifications/compact-context.md | Request and compatibility | Table of attribute, v1 packet and compact format | 8 rows | Summarize |
| specifications/evidence-correctness.md | Flow ordering | Table of request kind, first key, next key, tie breaker and unknown dates | 3 rows | Replace 3 sentences of paragraph 1 |
| specifications/explorer.md | Read-only API extension | Tree listing of the POST /api/explore response | 14 lines | Summarize |
| specifications/explorer.md | Step evidence and commit association | Table of phase, associated paths and current-step evidence, for legacy changes | 6 rows | Summarize |
| specifications/incremental-observation.md | Sampling and events | Table of bound, value and applies when | 8 rows | Summarize |
| specifications/knowledge-editing.md | Operation service | Two sequence diagrams, plan and validate, and apply | 4 parties, 9 messages, 1 note; 3 parties, 7 messages, 1 note | Summarize |
| specifications/knowledge-editing.md | Operation service, Templates | Table of template, front matter, headings and fixed content | 9 rows | Replace the parenthetical list |
| specifications/knowledge-layout-reading.md | Layout detection and records | Table of concern, in-place and legacy | 10 rows | Summarize |
| specifications/lazy-loading.md | Scoped API | Table of section, required context and other allowed selectors | 7 rows | Summarize |
| specifications/project-tabs.md | Explorer isolation and lifecycle | State diagram of one project tab | 5 states, 13 transitions, 4 gaps | Summarize |
| specifications/ux-simplification.md | Contained source navigation | Table of link target, rule and outcome | 13 rows | Summarize |

Rejected:

| Element | Section | Reason |
| --- | --- | --- |
| specifications/explorer.md | Snapshot response and UI; Logical element ordering; Knowledge display | The expanded artifact group on the canvas no longer exists; the graph panel never expands artifacts. |
| specifications/change-impact.md | Index | The table and column names of the text disagree with server/impact-index.js; a table would repeat the drift. Recorded in the survey. |
| specifications/knowledge-layout-reading.md | Declared evidence instead of history | Three source groups with one relation; the guide selects no representation. |
| specifications/live-reload.md | Browser behavior (repository freshness states) | The Updating, Current and Stale labels were removed by the 1.17.0 redesign. |
| specifications/reading-controls.md | Left navigation resizing (panel width limits) | The right and center panels no longer exist; the left-panel values are in the authoring-workbench Layout table. |
| specifications/search-label-usability.md | UI interaction (named filtering vs discovery) | Three of the four compared options no longer exist in the workbench. |
| specifications/ux-simplification.md | Honest loading, completion and recovery (section request state) | The modelled request states and labels no longer exist in the code. |

## Corrections

One verified defect is in a drawn passage: the Unknown item of codex-execution.md, Derived states, says that the last observed state is retained "in the inspector", which the 1.17.0 redesign removed. Correct it to "Retain the last observed state and time." The other survey defects are not in a drawn passage and stay recorded, including the findings of this phase that the survey now lists.

## Validation

Each task records, per representation: the fact list, the count check, and for replace mode a mapping from every replaced sentence to a cell or to retained text. A comparison of the old and new section text confirms that no fact, condition, limit or exception is lost. Diagrams follow authoring rules 1 to 8 of the guide; each renders on GitHub-compatible Mermaid and in the Plane. Headings stay unchanged, and every relative link and anchor of the changed files resolves. validate-knowledge reports no error.

## Row specifications

### specifications/authoring-workbench.md — Layout

1. **Decision: adjust.** The breakpoint of the properties column is 1100 px, not 800 px (Document page section; code `pages/DocumentPage.jsx` `useMedia('(max-width: 1100px)')`). The column header "value at 800 px and below" would misstate it. Use a "Narrow layout" column and name the breakpoint in each cell.
2. **Form: table, 3 columns, 11 rows.**
   - Columns: `Element` | `Default` | `Narrow layout`.
   - Row keys and cells (— = the text states no value for this width):
     1. Top bar | 52 pixels high; parts as in Top bar | At 800 px and below: menu button, repository name with the branch below it, uncommitted-files button, More button
     2. Sidebar | 264 pixels wide; divider resizes it between 200 and 400 pixels | At 800 px and below: drawer from the menu button; closes when a page opens
     3. Content padding | 40 pixels at the top, 56 pixels at the sides | At 800 px and below: 24 pixels at the top, 16 pixels at the sides
     4. Page column | at most 880 pixels | —
     5. Change page column | at most 960 pixels | —
     6. Document text column | at most 720 pixels | —
     7. Document properties column | 240 to 280 pixels | At 1100 px and below: Properties disclosure under the title
     8. Graph panel | 420 pixels high | At 800 px and below: 320 pixels high
     9. Buttons | 36 pixels high | At 800 px and below: 44 pixels high
     10. Primary actions in cards | — | At 800 px and below: full width
     11. Tables | — | At 800 px and below: stacked rows
   - Source line: `Source: artifact-plane:specifications/authoring-workbench.md, sections Layout, Document page, Graph panel and Visual style (Buttons row); derived one row per element that the sections give a size or a narrow behavior; current snapshot.`
3. **Mode: summarize.** The prose stays. The table collects values from 4 sections, and the Graph panel, Document page and Visual style sections must keep their own values. A replace of the Layout prose would split the divider, keyboard and overflow rules from their values.
4. **Placement:** after the "At 800 pixels and below:" list, which ends with "Tables become stacked rows. No page overflows horizontally at 390, 700, 851 and 1440 pixels." and before `## Top bar`. One introduction sentence before the table: it collects the sizes of the layout and the values at narrow widths, and "—" means that the text states no value for that width.
5. **Defect dependency: none.** The section is the current 1.17.0 contract. Code agrees for every row value (styles.css: `.topbar` 52px, `--sidebar-width` 264px, `.page` padding 40px 56px and 24px 16px at ≤800, `.column` 880/960, `.document-main` 720, `.document-side` 240–280, `.graph-panel` 420/320, `--control-h` 36/44; main.jsx divider 200–400). Observation only, no correction: code sets the narrow top bar to 56px and the drawer width to min(320px, 86vw); the text states neither, so the narrow top bar cell lists only its parts, and the table does not show these values.
6. **Anchors:** keep `## Layout`, `## Top bar`, `### Document page`, `## Graph panel`, `## Visual style`, `## Specification self-check` (front-matter link `#specification-self-check`). Inbound: 7 flow records (change-review, knowledge-authoring, repository-exploration, repository-refresh, source-retrieval, unit-inspection, project-tabs), explorer.md Authoring extension, README.md, requirements/visual-artifacts.md; all file-level.
7. **Facts that stay in text:** pointer and arrow/Home/End resizing; width stays with its project for the session; the content area scrolls; page header parts and their order; the overflow check widths 390, 700, 851 and 1440; the Top bar parts list; the Graph panel, Document page and Visual style values in their own sections.

### specifications/codex-execution.md — Derived states

1. **Decision: adjust.** Use the state-by-event table, but drop the "display label and color" column. Reason: the labels and colors come from the UI section, which is stale against the current workbench (see item 5). The table shows entry and exit conditions only.
2. **Form: table, 3 columns, 8 rows.**
   - Columns: `State` | `Entered when` | `Left or cleared when`.
   - Rows:
     1. No recorded execution | No matching attempt exists (internal waiting state). | Not stated.
     2. Processing | A bound UserPromptSubmit or PreToolUse is observed. | After ten minutes without fresh matching evidence, it shows Unknown.
     3. Blocked | A PermissionRequest is observed, or an explicit blocked report with a bounded reason label arrives. | The next corresponding activity can clear it. After ten minutes without fresh matching evidence, it shows Unknown.
     4. Validating | Stop or SubagentStop is observed, or an explicit execution-returned report arrives. | Not stated.
     5. Interrupted | Interrupt is observed for the matching main turn. | Not stated.
     6. Failed | An explicit failed report arrives. | Not stated.
     7. Done (reported) | An explicit validated report arrives with a nonempty validation method and a safe existing Markdown evidence reference with nonempty check details. | Not stated.
     8. Unknown | An active observation expires, a restart has no fresh matching activity, correlation is missing, or a report is contradictory. | Not stated.
   - Gaps: the exit is "Not stated" for 6 of 8 states. "Terminal reports are not overwritten by later unrelated tool events" does not name which reports are terminal, so it stays in text and is not put in a row. "Active observations" = Processing or Blocked, as the expiry paragraph states ("show Unknown / last observed Processing or Blocked").
   - Source line: `Source: artifact-plane:specifications/codex-execution.md, Derived states list and the expiry paragraph after it; derived one row per listed state, entry from its bullet, exit only where the section states one; current snapshot.`
3. **Mode: summarize.** The bullets carry the assertion limits ("Neither hook proves success", "an assertion is not independent verification", "no success/failure inference ..."), which a cell would shorten. The list and the paragraph stay.
4. **Placement:** after the paragraph that starts "Active observations expire after ten minutes without fresh matching evidence", before `## Local API and live browser updates`. Introduction: the table gives the condition that enters each derived state and the condition that leaves it; "Not stated" marks a gap of the source.
5. **Defect dependency: no verified defect. Unverified stale findings (VP3 does not cover them until the coordinator verifies them):**
   - Unknown bullet: "Retain last observed state/time in the inspector." The 1.17.0 redesign removed the inspector (requirements/workbench-redesign.md; authoring-workbench.md "Runtime badges keep their place in the expanded task row of the change page"). Code shows "stale, last observed <state>" in the expanded task row (pages/ChangePagePlan.jsx `TaskRuntime`) and on the Recorded executions page (pages/RecordedPage.jsx `TaskDetails`). Proposed wording: "Unknown: expired active observation, restart without fresh matching activity, missing correlation, or contradictory report. Retain the last observed state and time." The table does not use the removed clause, so it can be drawn before or after this correction.
   - UI section (not drawn from): the colors "gray ... blue Processing, amber Validating/Blocked ..., green Done (reported), red Failed, and neutral Interrupted" do not match code: ChangePagePlan.jsx gives Done the `ok` tone, Failed, Blocked and Interrupted the `failed` tone and the others no tone; task nodes (pages/UnitPageGraph.jsx) show the label text only. Code labels Validating "Validating" (runtime-model.js), not "execution returned / DoD pending". "show last tool label and event time" is not shown (RuntimeDetails in Runtime.jsx is not imported by any page). "Inspectors expose attempts ..." (UI paragraph 2) and "inspector prerequisites" (Visualization correction contract) name the removed inspector.
6. **Anchors:** keep `## Derived states`, `## UI`, `## Visualization correction contract`. Inbound: 8 task files of changes/change-codex-execution, change-evidence-review-context and change-evidence-and-usability; requirements/visual-artifacts.md; all file-level.
7. **Facts that stay in text:** SessionStart alone is idle/unknown; neither hook proves success; labels execution returned / DoD pending; no invented child interruption events; no success/failure inference from tool output or generic Stop; Done (reported) is an assertion, not independent verification; runtime validation references do not replace artifact-local evidence; freshness expiry is not proof that the agent stopped; no heartbeat or process scanning; SessionEnd terminates activity visibility but does not prove DoD; terminal reports are not overwritten; multiple attempts and concurrency count; projection order Processing, then Blocked, then Validating; mixed results cannot produce an unqualified Done; no runtime event changes DAG edges or establishment gates; the labels and colors of the UI section.

### specifications/codex-execution.md — Identity and retained graph context

1. **Decision: confirm.** Columns and rows as proposed. The Capture column shows only the fields that a source names for capture identity (see item 2), because the two documents name capture identity differently.
2. **Form: table, 4 columns, 12 rows.**
   - Columns: `Field` | `Binding and task matching` | `Capture` | `Agent identity`. "—" = not named for that identity.
   - Rows:
     1. Repository ID (random, associated with the canonical Git common directory) | included | — | —
     2. Canonical source worktree | included | included | —
     3. Unit | unit ID, nullable for individual plans | unit selector | —
     4. Artifact | included | — | —
     5. Originating change | included | — | —
     6. Task path (relative) | included | — | —
     7. Task signature | included | — | —
     8. Source revision (HEAD) | — | included, when known | —
     9. Graph digest | — | included | —
     10. Session ID | — | — | included
     11. Subagent ID | — | — | optional
     12. Attempt ID | created by each binding | — | —
   - Source line: `Source: artifact-plane:specifications/codex-execution.md, Identity and retained graph context paragraph 1; artifact-plane:specifications/evidence-correctness.md, Worktree-bound observation paragraph 1; derived one row per named identity field, a cell only where a source names the field for that identity; current snapshot.`
   - Note for the TL: codex-execution says "Capture identity also includes source revision and graph digest"; evidence-correctness lists canonical source worktree, source HEAD/revision when known, unit selector and graph digest. The table shows the union of the explicitly named capture fields. Whether "also" adds the binding fields is not stated; keep that sentence in text.
3. **Mode: summarize.** The paragraph holds rules (one active binding, rebinding, plan-local IDs, alias rules) that the table does not carry.
4. **Placement:** after the paragraph that starts "Register a random repository ID in the runtime store", before "The local runtime CLI provides register, bind, report, and hook commands."
5. **Defect dependency: none.** Both passages agree with code (Runtime.jsx and RecordedPage.jsx show captured worktree and revision; runtime-store binds by worktree and task identity).
6. **Anchors:** keep `## Identity and retained graph context` (codex-execution.md) and `## Worktree-bound observation` (evidence-correctness.md). Inbound: as for Derived states; evidence-correctness.md is cited by flows/execution-observation.md support `evidence-review-contract` (file-level).
7. **Facts that stay in text:** the random repository ID is registered in the runtime store; apply evidence-correctness.md for aliases, legacy records and changed HEADs; a session or agent has at most one active binding; rebinding closes the prior attempt as superseded/unknown and creates a new attempt; task IDs remain plan-local; identical plans in another worktree or captured revision cannot reuse a capture; persisted sourceWorktree and sourceRevision; legacy records without source identity; Git remote URLs are not identity.

### specifications/codex-execution.md — Local API and live browser updates

1. **Decision: adjust.** One sequence diagram, as proposed, with 4 parties instead of 5. The source states no message between the server watcher and the HTTP runtime service, so they are one participant, "Plane server (watcher and runtime endpoints)". The flow record flows/execution-observation.md has steps and transitions but no participants or interactions, so no reader-derived view shows the parties.
2. **Form: sequenceDiagram. Fact list:**
   - Participants (4): `Hook` = Codex command hook; `Store` = runtime store (runtime.sqlite); `Server` = Plane server (watcher and runtime endpoints); `Browser`.
   - Messages (8), in order:
     1. Browser ->> Server: POST /api/runtime/query, contained root and optional context ID (initial query)
     2. Server -->> Browser: repository ID, contexts, attempt summaries, freshness, latest sequence
     3. Browser ->> Server: GET /api/runtime/events, same-origin SSE
     4. Hook ->> Store: write event with a unique event ID, in a transaction
     5. Server ->> Store: check database sequence — inside `loop once per second while clients are connected`
     6. Server -->> Browser: SSE invalidation that contains only the latest sequence
     7. Browser ->> Server: POST /api/runtime/query for the selected runtime context (refetch)
     8. Server -->> Browser: query response
   - Notes (2): over Store: "SQLite supplies a monotonically increasing ingestion sequence; duplicate event IDs are ignored"; over Browser and Server: "initial query and reconnect recover missed updates".
   - Blocks (1): the loop of message 5.
   - Gaps (state in the text list after the source line): the source does not state the condition under which the server sends an invalidation after a sequence check, so message 6 has no condition; a hook write can occur at any time, also when Plane is not running, so the order of message 4 relative to messages 1 to 3 is illustrative of one case; the store reply to message 5 is not stated and is not drawn.
   - accTitle: "Live runtime update path". accDescr: the browser queries, subscribes to SSE, a hook writes an event, the server checks the sequence once per second while clients are connected and sends an invalidation with the latest sequence, and the browser refetches its selected context; initial query and reconnect recover missed updates.
   - Source line: `Source: artifact-plane:specifications/codex-execution.md, sections Codex lifecycle adapter (direct store write, unique event ID), Observation event contract and ordering (ingestion sequence, duplicates, transactions) and Local API and live browser updates; derived one message per stated request, reply, write or check; current snapshot.`
   - Count check: 4 participants, 8 messages, 2 notes, 1 loop; within the size rule (about 10 messages).
3. **Mode: summarize.** The paragraph stays; it holds the limits (SSE client cap, watcher cleanup, failure isolation, no write endpoints).
4. **Placement:** after the single paragraph of the section, which starts "Reuse existing loopback host/origin checks.", before `## UI`. Introduction: the diagram shows how an event that a hook writes reaches the browser; solid arrows are requests or writes, dashed arrows are replies or events.
5. **Defect dependency: none.** Code agrees: server/runtime-api.js `intervalMs=1000`, `text/event-stream`, timer only while clients exist; src/Runtime.jsx `postJSON('/api/runtime/query')` and `new EventSource('/api/runtime/events')`.
6. **Anchors:** keep `## Codex lifecycle adapter`, `## Observation event contract and ordering`, `## Local API and live browser updates`. Inbound: file-level only (task files, flow records do not cite this file).
7. **Facts that stay in text:** loopback host/origin checks; limit SSE clients; clean up watchers on disconnect; runtime-store failure does not fail knowledge exploration; no event-write, execution, shell or arbitrary file-read HTTP endpoint; writes only through the local CLI/hook; browsers cannot bind tasks or report validation; no repository scan or polling is added; SessionStart additionalContext, empty JSON stdout and fail-open exit 0; the 10000 unbound diagnostic events.

### specifications/evidence-correctness.md — Flow ordering

1. **Decision: adjust.** Drop the "UI label" column. The labels come from a sentence that is stale against the current workbench (item 5). Keep 3 rows.
2. **Form: table, 5 columns, 3 rows.**
   - Columns: `Request (query after trimming)` | `First order` | `Then` | `Tie breaker` | `Unknown creation dates`.
   - Rows:
     1. Nonempty search | Unique exact opaque, logical or local ID matches | Reciprocal-rank-fusion score of the FTS5 and exact cosine vector ranks, descending | Opaque ID | Not used; creation dates never override this order
     2. Empty query (browse) | Creation date (createdAt), descending | — | Opaque ID | Last
     3. Impact | Creation date (createdAt), descending, deterministic and independent of search scoring | — | Opaque ID | Last
   - Source line: `Source: artifact-plane:specifications/evidence-correctness.md, Flow ordering paragraph 1; artifact-plane:specifications/flow-readability.md, Lazy pages and creation-date order paragraph 3; artifact-plane:specifications/flows.md, Index and freshness paragraph 3; derived one row per request kind; current snapshot.`
3. **Mode: replace, three sentences of paragraph 1 only.** Replaced:
   - "Empty queries browse by creation date descending, opaque ID ties and unknown dates last." → row 2 (first order, tie breaker, unknown dates).
   - "Nonempty queries put unique exact opaque/logical/local ID matches first, then existing reciprocal-rank-fusion score descending and opaque ID ties." → row 1 (first order, then, tie breaker).
   - "Impact output retains deterministic newest-first order independently of search scoring." → row 3 (first order with "deterministic" and "independent of search scoring"); its tie breaker and unknown-date cells come from flow-readability.md, which stays unchanged.
   - Retained in paragraph 1: "Trim whitespace." "Ambiguous local IDs remain multiple candidates; detail still needs an unambiguous selector." "Recency never overrides search relevance." Paragraph 2 stays unchanged. Every fact of the replaced sentences maps to a cell. flow-readability.md ("as defined by specifications/evidence-correctness.md") still resolves to this section. If the TL prefers no replace in this file, summarize is the fallback with the same table.
4. **Placement:** after the retained text of paragraph 1 ("... Recency never overrides search relevance."), before paragraph 2 "Sort before paging". Introduction: the table gives the order of flow records for each request kind, applied before paging.
5. **Defect dependency: no verified defect. Unverified stale finding (not drawn from after the adjustment):** paragraph 2, "UI labels search Relevance first and browsing/impact Newest records first." The 1.17.0 workbench has no flow list view (requirements/workbench-redesign.md D1, G1); pages/DiscoverPage.jsx sends only nonempty searches and says "most relevant first" in its subtitle; no "Relevance first" or "Newest records first" string exists in src/. If the coordinator verifies it, a proposed wording is: "The Discover behavior page lists search results most relevant first." The server order agrees with code (server/flow-index.js sorts by createdAt descending, unknown last, then id).
6. **Anchors:** keep `## Flow ordering`, `## Worktree-bound observation`. Inbound: flow-readability.md (by file path in text), units-of-work.md, flows/unit-inspection.md, flows/source-retrieval.md, flows/execution-observation.md, codex-execution.md; all file-level.
7. **Facts that stay in text:** trimming; ambiguous local IDs and the unambiguous detail selector; recency never overrides relevance; sort before paging; cursor, budget, model-fallback and HTTP/MCP parity; the UI label sentence (until verified); the tests and the real-model checks; flows.md page size 10 and cap 100; flow-readability.md 20 records per page and createdAt from the first introducing Git commit.

### specifications/explorer.md — Snapshot response and UI; Read-only API extension

1. **Decision: confirm.** A tree listing of the record and field names of the POST /api/explore response that explorer.md defines. The introduction states that scope (other contracts add fields, item 5).
2. **Form: tree listing in a `text` block. Fact list:**
   ```text
   POST /api/explore response
     repository: branch, HEAD, dirty status
     artifacts[]: identifier, title, README, currentVersion (nullable), activeChange (nullable), change candidates, elements
       elements[]: artifact, relative path, snapshot source, Markdown content
     edges[]: source, target, status
     references[]: consuming element, target artifact/path/source, reason, status, resolution succeeded
     diagnostics[]: code, source path, message
     workflow: worktrees, diagnostics, historyLimit (200)
       worktrees[]: path, branch (nullable), head (nullable), selected, detached, locked, prunable, availability, changes, diagnostics
         changes[]: artifact, name, declaredActive, currentStep (nullable), inferenceReason, history, historyReason, lastCommitAt (nullable), steps, tasks
           steps[]: name, state, evidence, commits, completionCommit (nullable)
             evidence[]: kind, relative file, short explanation
             commits[]: full id, subject
           tasks[]: path, checked and unchecked counts
   ```
   - Count: 6 top-level keys; 13 record types; 60 fields; depth 5 below the root (workflow, worktree, change, step, evidence or commit). 14 lines.
   - Source line: `Source: artifact-plane:specifications/explorer.md, Runtime and opening paragraph 3 (repository context), Snapshot response and UI paragraph 1, Read-only API extension paragraph 1 and Workflow history and navigation contract paragraph 2 (history, historyReason, lastCommitAt); derived one line per record type with its fields in source order; current snapshot.`
3. **Mode: summarize.** The sentences carry the enumerated values (edge status, availability, step state) and rules (bounded runtime data, malformed checklists unknown), which stay in text.
4. **Placement:** after the paragraph that starts "POST /api/explore keeps its input and existing snapshot fields." in `### Read-only API extension`, before "Enumerate registered worktrees". Introduction: the tree shows the nesting of the records and fields that this contract defines; enumerated values are in the text; other contracts add fields.
5. **Defect dependency: none for the drawn passages.** The drawn paragraphs agree with code (server/workflow.js `historyLimit: 200`, change fields declaredActive, currentStep, inferenceReason, history, historyReason, lastCommitAt; step fields with completionCommit). Scope finding: units-of-work.md adds `unitsOfWork` and task-dag.md adds `taskGraph` to this response, and code also returns change fields `layout`, `version` and step state `not-declared` (knowledge-layout-reading.md). The tree does not show them; the introduction says that the tree covers this contract only. The verified defect group 2 #3 (Resizable inspector, Revised validation) and the stale UI paragraphs 2 to 4 of Snapshot response and UI are not drawn from.
6. **Anchors:** keep `## Runtime and opening`, `## Snapshot response and UI`, `### Read-only API extension`, `## Workflow history and navigation contract`. Inbound: domain-model.md, 11 task files of versions/1.5.0, requirements/visual-artifacts.md; task 07-worktree-evidence (three copies) names "Read-only API extension and Step evidence" in text; all file-level.
7. **Facts that stay in text:** edge status values established, proposed-add, proposed-remove; availability values readable, unavailable, non-add; step states observed, inferred, documented-complete, unknown; malformed or empty checklists are unknown; additive fields are bounded runtime data, never stored in inspected files; the history rules and timestamp rules.

### specifications/explorer.md — Step evidence and commit association

1. **Decision: adjust.** Drop the "documented completion" column: the source states one general completion rule, not a rule per phase, so the column would repeat one sentence six times. Add the scope to the introduction: this inference applies to legacy changes; in-place changes use declared fields (knowledge-layout-reading.md, Declared evidence instead of history: "Legacy changes keep the existing inference"; code server/workflow.js "History is replayed only for legacy artifacts").
2. **Form: table, 3 columns, 6 rows.**
   - Columns: `Phase` | `Associated commit paths` | `Evidence for the current step`.
   - Rows:
     1. Requirement | requirements/ | Requirement or specification edits identify observed work.
     2. Specification | specifications/ and decisions/ | Requirement or specification edits identify observed work.
     3. Plan | tasks/README.md and task definitions | Task definition edits identify Plan work.
     4. Implementation | task checklist and evidence changes | Unchecked current tasks with implementation evidence.
     5. Validation | task evidence that describes check results | Only explicit current-task validation evidence.
     6. Version preparation | versions/ changes and artifact root version changes | Distinguishable snapshot preparation.
   - Source line: `Source: artifact-plane:specifications/explorer.md, Step evidence and commit association paragraphs 1 and 3 and Workflow history and navigation contract paragraph 1 (six phases); derived one row per phase in phase order; current snapshot.`
3. **Mode: summarize.** Paragraphs 1 and 3 mix the association with bounds and priority rules; a partial replace would split them.
4. **Placement:** after paragraph 3, which starts "Current step prioritizes relevant uncommitted file changes", before `### UI and failures`. Introduction: for legacy changes, the table gives the paths that associate a commit with each phase and the evidence that identifies the current step; knowledge-layout-reading.md gives the declared-evidence rule for in-place changes.
5. **Defect dependency: no verified defect.** Unverified scope finding: the section does not say that it applies to legacy changes only. No prose correction is proposed (VP5); the introduction carries the scope with a link. Workbench check: the change page shows five phase steps (authoring-workbench.md Labels: Validation counts as Implementation, Version preparation is Version); the six phase records stay in the data (server/workflow.js `phases`), so the rows are current.
6. **Anchors:** keep `### Step evidence and commit association`, `## Workflow history and navigation contract`. Inbound: as for the previous row.
7. **Facts that stay in text:** at most the latest 200 commits reachable from each worktree HEAD that touch docs/artifacts; delimiter-safe output; association by content and paths, never by commit subject alone; newest first; truncation and shallow-history disclosure; a squash can belong to several steps; no unregistered branches or remote history; paragraph 2 (copied baselines); uncommitted changes first, then the latest distinguishable committed evidence; missing or conflicting evidence yields unknown with a reason; a higher phase never completes preceding phases; documented completion rule and its label; approval is not inferable and no Approval phase is shown; the completionCommit rule and "Exact completion commit unknown".

### specifications/change-review.md — Query and source boundaries

1. **Decision: adjust.** Exclude the `comparison` row. It is defined in evidence-and-comparison.md, whose upstream reference carries the verified stale status (group 2 #5), and current code does not accept it: server/change-review.js `fields` = path, worktree, artifact, change, operation, limit, budget, cursor, source, and unknown fields return 400. The existing `## Evidence and comparison extension` section of change-review.md already links to it. 9 rows.
2. **Form: table, 4 columns, 9 rows.**
   - Columns: `Field` | `Presence` | `Values or rule` | `Default`.
   - Rows:
     1. path | required | permitted or open repository | —
     2. worktree | optional | registered readable worktree | —
     3. artifact | required | existing safe-ID rules | —
     4. change | required | existing safe-ID rules; starts with change- | —
     5. operation | required | review, packet or source | —
     6. limit | optional | 1–100 | 20
     7. budget | optional | 0–100000 excerpt characters | 12000
     8. cursor | for source operations | at most 10000 characters | —
     9. source | for source operations | at most 10000 characters | —
   - Note for the TL: the text says "cursor and source for source operations". Code accepts `cursor` for every operation (review pagination returns `nextCursor`) and requires `source` exactly for the source operation. The table keeps the text wording; the ambiguity is an unverified finding, not a VP3 correction.
   - Source line: `Source: artifact-plane:specifications/change-review.md, Context and comparison paragraph 1 (repository and worktree) and Query and source boundaries paragraph 1; derived one row per request field in source order; current snapshot.`
3. **Mode: summarize.** Because of the cursor wording, the sentence stays as the governing text; the table follows it.
4. **Placement:** after paragraph 1 of the section, which starts "One small review service supplies UI, packet, HTTP and MCP.", before "Envelope: repository, worktree, context". Introduction: the table lists the request fields with presence, rule and default.
5. **Defect dependency: none for this passage.** Verified defect group 2 #4 is in `## UI and refresh` of this file (Review change in delivery details, inspector, view switcher) and is not drawn from; it stays recorded. Code agrees with every row value (limit 1–100 default 20, budget 0–100000 default 12000, cursor and source ≤10000, change must start with change-).
6. **Anchors:** keep `## Query and source boundaries`, `## Evidence and comparison extension`. Inbound: flows/change-review.md, flows/knowledge-authoring.md, flows/repository-exploration.md, artifact-driven/specifications/visual-knowledge.md (`../../artifact-plane/specifications/change-review.md`), requirements/visual-artifacts.md, task files; all file-level.
7. **Facts that stay in text:** one service for UI, packet, HTTP and MCP; reject unknown fields; existing 16 KiB HTTP cap and host/origin safeguards; the envelope, revision, source registration, source pages and errors paragraphs; the optional comparison object (evidence-and-comparison.md).

### specifications/compact-context.md — Request and compatibility; Response and byte accounting

1. **Decision: confirm.** Comparison table of the default v1 packet and the compact format. The contract is deferred ("retained unchanged for that later decision"); a summary table changes no fact and serves that decision. Exclude comparison selectors from the rows (item 5).
2. **Form: table, 3 columns, 8 rows.**
   - Columns: `Attribute` | `Default v1 packet` | `Compact format`.
   - Rows:
     1. Selector | format omitted | format: compact
     2. Schema | artifact-plane.change-context.v1 | artifact-plane.change-context.compact.v1
     3. Budget field | budget: 0–100000 excerpt characters, default 12000 | maxBytes: integer 4096..65536, default 16384; budget is rejected
     4. What the budget limits | excerpt characters; not a token or full-response-byte cap | UTF-8 bytes of the entire serialized result, the larger of the HTTP JSON body and the MCP tool result
     5. Source text | governing source pointers and excerpts | no raw excerpts by default; registered existing source reads
     6. MCP result | text plus structuredContent | one JSON text block without structuredContent
     7. Cursor | v1 cursor; cannot be used in compact mode | bound to repository, worktree, artifact/change, comparison, revision, format, category ordering and next offset
     8. Budget too small | not stated | 422 with reason response-budget-too-small; invalid budgets return 400
   - Source line: `Source: artifact-plane:specifications/compact-context.md, Request and compatibility and Response and byte accounting; artifact-plane:specifications/context-packets.md, Schema and budgets; artifact-plane:specifications/change-review.md, Query and source boundaries (budget range); derived one row per attribute that the sources state for at least one format; current snapshot.`
3. **Mode: summarize.** The contract is retained unchanged; all prose stays.
4. **Placement:** after the paragraph of `## Request and compatibility` that ends "Compact source reads are not required: use registered existing source reads.", before `## Response and byte accounting`. Introduction: the table compares the default v1 packet with the deferred compact format for the request and the response.
5. **Defect dependency: none for the drawn facts.** "Existing comparison selectors still apply" depends on evidence-and-comparison.md (verified defect group 2 #5, stale reference status) and on a selector that current code does not accept; the table does not show it. Code has no format or maxBytes (server/change-review.js `fields`), which agrees with "Deferred".
6. **Anchors:** keep `## Request and compatibility`, `## Response and byte accounting`, `## Scope and validation`. Inbound: flows/context-handoff.md support (file-level), context-packets.md (`(compact-context.md)`), requirements/visual-artifacts.md, changes/change-evidence-and-usability/tasks/08-compact-context.md.
7. **Facts that stay in text:** the Deferred paragraph; reject maxBytes without compact format, unsupported formats and compact with budget; existing comparison selectors still apply; the mandatory limit statements; evidence and diagnostic counts stay visible; HTTP headers, JSON-RPC framing and tokenization are excluded; deterministic item sequence and category totals; fit whole items, never trim bytes; partial completeness; a different maxBytes may change page size, not order; no stored session, index or cache; the fallback action of the 422; errors are not pages; benchmarks and targets.

### specifications/incremental-observation.md — Sampling and events

1. **Decision: adjust.** Use `Bound | Value | Applies when` instead of separate connected and degraded columns. Reason: most bounds are stated without a mode condition, so a two-mode layout would need "not stated" cells for them. The "Applies when" cell names the mode where the source names it.
2. **Form: table, 3 columns, 8 rows.**
   - Rows:
     1. Watch handles | at most 4096 per shared repository observer | Reaching the cap starts degraded observation.
     2. Notification debounce | 250 ms | Watch notifications; stated without a mode condition.
     3. Metadata poll (ref, status, worktree) | every 2 seconds | Stated without a mode condition.
     4. Full byte reconciliation | at least every 30 seconds after the previous full scan completes, also when no events arrive | Connected observation.
     5. Full-scan fallback | every 10 seconds after scan completion | Degraded observation: watch creation fails, the cap is reached, or an event cannot be resolved safely.
     6. Missed-event bound | the applicable interval (30 or 10 seconds) plus scan duration | Both modes; no two-second detection in degraded mode.
     7. Immediate reconciliation | on wake, focus or manual refresh | Stated without a mode condition.
     8. Scans per observer | at most one; invalidations received during a scan coalesce and drain afterward | Stated without a mode condition.
   - Source line: `Source: artifact-plane:specifications/incremental-observation.md, Sampling and events paragraphs 1 to 3; derived one row per stated bound, with the mode that the source names; current snapshot.`
3. **Mode: summarize.** The paragraphs hold the non-numeric rules (hints, rereads regardless of size or mtime, renames, symlinks, queues, the meaning of Current).
4. **Placement:** after paragraph 3, which starts "Missed events are detected by the next full scan", before `## Lifecycle and evidence`. Introduction: the table lists the bounds of observation and the mode in which each applies.
5. **Defect dependency: none.** Code agrees: server/repository-events.js `debounceMs=250`, `fullMs=30000`, `fallbackMs=10000`, `maxWatches=4096`, `repositoryService({intervalMs=2000 ...})`. Verified defect group 3 #5 (flows/repository-refresh.md gap and support target) concerns the flow record, not this passage.
6. **Anchors:** keep `## Sampling and events`. Inbound: live-reload.md (`(incremental-observation.md)`, Observation refinement defers to these intervals), flows/repository-refresh.md support `evidence-usability-contract`, requirements/visual-artifacts.md, changes/change-evidence-and-usability/tasks/05-incremental-refresh.md; all file-level.
7. **Facts that stay in text:** initial full scan; Node filesystem notifications; notifications are hints; invalidate affected contained paths and reread bytes regardless of size or mtime; renames or ambiguous notifications rescan the directory; metadata changes invalidate snapshots and add or remove watches; registered flow/review sources stay in invalidation; never traverse unsafe symlinks; bound queues by coalescing; the meaning of Current; Updating/Stale behavior; failures recover on the next reconciliation.

### specifications/change-impact.md — Query (inputs)

1. **Decision: adjust.** Add a `Presence` column, because the inputs include one exclusive group (one of origins, commit, range or diff), and name the limit column `Maximum`.
2. **Form: table, 5 columns, 11 rows.**
   - Columns: `Input` | `Presence` | `Values` | `Default` | `Maximum`.
   - Rows:
     1. path | required | repository path | — | —
     2. worktree | optional | registered worktree | — | —
     3. origins | one of origins, commit, range or diff | list of {path, element, flow, step or model} with optional symbols, or {path, commit} for that path's change in that commit | — | —
     4. commit | one of origins, commit, range or diff | a commit | — | —
     5. range | one of origins, commit, range or diff | a range | — | —
     6. diff | one of origins, commit, range or diff | base: protected or a ref | — | —
     7. depth | optional | 1 to 4 | 2 | 4
     8. budget | optional | characters of the compact text | 8000 | 100000
     9. format | not stated | json or text | not stated | —
     10. limit | optional | entities per section | 25 | 200
     11. unit | optional | a unit | — | —
   - Source line: `Source: artifact-plane:specifications/change-impact.md, Query paragraph 1; derived one row per input in source order; current snapshot.`
3. **Mode: replace, sentence 1 of paragraph 1.** Replaced: "Inputs: path, optional worktree, and one of origins (...), commit, range, or diff with base protected or a ref; depth from 1 to 4 (default 2); budget in characters for the compact text (default 8000, maximum 100000); format json or text; limit per section (default 25, maximum 200); optional unit." Every fact maps to a cell: path, optional worktree, the exclusive group, both origin shapes and optional symbols, diff base, depth range and default, budget unit, default and maximum, format values, limit unit, default and maximum, optional unit. Retained: "Validate selectors as the flow query does; reject unknown fields and unregistered worktrees."
4. **Placement:** at the start of `## Query`: introduction sentence, table, source line, then the retained sentence "Validate selectors as the flow query does; ...", then paragraph 2 "Resolve origins as the ADD contract requires".
5. **Defect dependency: none for this passage.** Code agrees with every stated value (server/impact.js: one of origins, commit, range, diff; depth 1–4 default 2; budget default 8000, max 100000; limit 1–200 default 25; format json or text). Unverified findings, not shown in the table: code also accepts a `knowledge` field and at most 100 origins, budget minimum 0 and format default json, which the text does not state; line 10 of the file ("Consumes the proposed artifact-driven change-impact contract ...; dependent implementation waits for its establishment") is stale because artifact-driven/README.md declares `current_version: 2.8.0` with source_change change-impact-semantics. Neither passage is drawn from.
6. **Anchors:** keep `## Query`, `## Index`, `## Interfaces`. Inbound: flows/change-impact.md (2 supports), flows/context-handoff.md, flows/change-review.md, flows/source-retrieval.md, flows.md, context-packets.md, requirements/change-impact.md, decisions/016-typed-impact-ledger.md, README.md, changes/change-impact-intelligence/tasks/02-impact-service.md; all file-level.
7. **Facts that stay in text:** validate selectors as the flow query does; reject unknown fields and unregistered worktrees; paragraph 2 (origin resolution, propagation, tiers and thresholds, declared comparison).

### specifications/change-impact.md — Query (response)

1. **Decision: adjust.** Tree listing of the envelope and the data sections only. The compact text sections stay in the sentence that also defines each line; a listing of only their names would repeat that sentence.
2. **Form: tree listing in a `text` block, 22 lines, depth 2.**
   ```text
   Impact query response
     repository
     worktree
     context
     revision
     generation
     freshness
     completeness
     data: with the explanation record and the coverage fields of the ADD contract
       changed
       direct
       transitive
       verify
       investigate
       potential
       potential_total
       unresolved
       declared
       coverage
     diagnostics
     omissions
     metrics: the phase timings of the query
   ```
   - Count: 1 root, 11 envelope fields, 10 data fields.
   - Source line: `Source: artifact-plane:specifications/change-impact.md, Query paragraph 3, sentences 1 and 2; derived one line per named field in source order; current snapshot.`
3. **Mode: replace, sentences 1 and 2 of paragraph 3.** Replaced: "Response envelope: repository, worktree, context, revision, generation, freshness, completeness, data, diagnostics, omissions and metrics with the phase timings of the query." and "data has changed, direct, transitive, verify, investigate, potential, potential_total, unresolved, declared and coverage, with the explanation record and the coverage fields of the ADD contract." Every field and both qualifications map to a line. Retained: "Sections longer than limit are cut with their total in omissions." and "The compact text has the sections Changed, Direct, Transitive, Verify, Potential (confirm before acting), Investigate, Unresolved and Coverage, one line per entity with its kind, strength, hops, path summary and evidence, cut to budget with a note."
4. **Placement:** paragraph 3 of `## Query` becomes: introduction sentence ("The response envelope and its data sections are:"), the tree, the source line, then the two retained sentences.
5. **Defect dependency: none.** Code agrees (server/impact.js `result` keys repository, worktree, context, revision, generation, freshness, completeness, data, diagnostics, omissions, metrics). Unverified finding, not drawn: with format text the code adds `result.text`, and the compact text adds a "Declared assessment" section; the text states neither.
6. **Anchors:** keep `## Query`. Inbound: as for Query (inputs).
7. **Facts that stay in text:** sections longer than limit are cut with their total in omissions; the compact text sections, their order, line content and the budget cut note; the Interfaces section (tier cap 200, truncated-impact, packet additions).

### specifications/knowledge-layout-reading.md — Layout detection and records (comparison through Version snapshots and unit completion)

1. **Decision: adjust.**
   - Columns: concern, in-place artifact, legacy artifact.
   - Drop the proposed "labels" row. The Navigation and presentation passage is stale against the current UI (see item 5), and it is not a verified defect.
   - Keep 10 rows. Mark the legacy cell "Not stated in this contract" where the text gives only the in-place rule. Do not infer the legacy behavior.
2. **Form.** Table, 10 rows × 3 columns. Header: `Concern | In-place artifact | Legacy artifact`. Row keys and cells:
   1. Layout detection | requirements, specifications or decisions exists directly under the artifact directory | none of them exists there (the text says "otherwise legacy")
   2. Identity declarations | current_version, depends_on and publication_reviews from front matter only; Markdown declaration sections ignored; a missing or malformed identity record is an invalid-identity diagnostic, with no prose fallback | the existing parser, including Markdown sections, dag.yaml checks and dependencies.yaml proposals
   3. Version directory | a version directory with knowledge subdirectories is a diagnostic | Not stated in this contract
   4. Change directory | open when no version record names it and it has no knowledge directories; copied knowledge directories: read as a retained legacy change, with an informational diagnostic | Not stated in this contract
   5. Active-change link and delivery_tasks marker | not read | Not stated in this contract
   6. Established baseline on main or master | the artifact directory tree, when that ref holds the in-place layout | versions/<current_version on that ref>/, otherwise
   7. Comparison with the baseline | `git diff --name-status <ref> -- docs/artifacts/<artifact>/{README.md,requirements,specifications,decisions}` and blob reads; each file added, modified, removed or unchanged; version and change selectors rejected with 422 | the comparison selectors of evidence-and-comparison.md
   8. Displayed steps | from declared fields; a step without a declaration is "not declared"; Git history is not replayed | the existing inference
   9. Version snapshot | the tree of the first-parent protected-branch commit that introduced the version record, or the tag `<artifact>/<version>` when both agree | Not stated in this contract
   10. Publication | compares the version record, the identity record and the retained tasks on that ref; publication_reviews available | prose publication-review parsing; publication_reviews available

   - Row 6: the split depends on the layout that the ref holds, not on the working layout. The concern cell says "on main or master" for this reason.
   - Source line: `Source: artifact-plane:specifications/knowledge-layout-reading.md, sections Layout detection and records, Baseline and comparison through Git, Declared evidence instead of history, and Version snapshots and unit completion; derived one row per concern that the sections name for the in-place path; current snapshot.`
3. **Mode: summarize.** The prose stays.
   - The cells shorten rules that have more conditions in the text.
   - Four legacy cells are gaps.
   - The sections keep facts that are not in the table (item 7).
   - A replace is not safe.
4. **Placement.** At the end of Layout detection and records, after the paragraph that starts "Version records are versions/<version>/README.md with source_change." The introduction sentence says that the table summarizes the four sections and that the sections state the full rules.
5. **Defect dependency.**
   - Verified survey defect (artifact-plane specifications group 3, item 6): front matter `references[0]` has `status: proposed` and `change: change-agent-efficiency`. Line 15 says "Implementation waits for the referenced ADD contract to establish and be rechecked."
   - The table does not draw from the front matter or from line 15, so under VP3 this defect stays in the survey.
   - If the coordinator corrects it while the file is open, use this wording:
     - Delete the `status: proposed` and `change: change-agent-efficiency` lines. artifact-driven:specifications/knowledge-layout.md, section Element references, says "The status and change selectors of the legacy contract are unnecessary for in-place artifacts; readers tolerate them without effect".
     - Replace the line-15 sentence with "The referenced ADD contract is established in artifact-driven 2.4.0." artifact-driven/versions/2.4.0/README.md has `source_change: change-agent-efficiency`.
   - Stale passage, not a verified defect: Navigation and presentation, "Group an in-place artifact's elements as Working knowledge". The label exists only in src/elements.js `elementGroups`. The only UI consumer is canvas.js through GraphPanel.jsx, which calls `canvasGraph(scope, new Set(), true)` with no expanded artifacts, so the label is never shown.
   - "Established on main view" still exists. src/pages/DocumentPage.jsx reads `revision: 'established'` for removed documents and for Compare with main.
   - The table therefore excludes this row. Report the passage to the coordinator for the survey.
6. **Anchors.**
   - Keep all headings: Layout detection and records, Baseline and comparison through Git, Declared evidence instead of history, Version snapshots and unit completion, Navigation and presentation, Scripts, Validation and measurement, Self-check.
   - Inbound: `#scripts` (change-legacy-conversion README) and `#self-check` (front matter).
7. **Facts that stay in text.**
   - The general sentences "Version records are versions/<version>/README.md with source_change" and "Change records are changes/<change>/README.md".
   - Both refs must agree. Missing refs, shallow history and disagreement produce the existing unknown diagnostics.
   - The review service uses the comparison as its record list and baseline source map.
   - Element identity collapses to the working tree, `<artifact>:<path>`, and the concrete identity adds repository, worktree and revision.
   - References and flow support resolve in the working tree and are labelled proposed when they differ from the baseline.
   - The per-step declared sources. No phase is inferred from prose or commit subjects. Approval is "not verified by this reader".
   - Unit evidence, acceptance and completion are unchanged.
   - All of Navigation and presentation.

### specifications/knowledge-editing.md — Operation service / Writer (write-path sequence)

1. **Decision: confirm** the two segmented sequence diagrams of worked example E3. Two wording adjustments follow the text:
   - The journal note: "journal keeps, per repository root and in memory, the pre-image bytes and the pre- and post-image digests of the last 50 applied operations". The text is in Writer, Journal and undo.
   - The accDescr of the second diagram adds one sentence about the journal note, so that the text alternative agrees with the diagram. E3's accDescr omits it.
2. **Form.** Fact list. Parties are named as the source names them.
   - Diagram 1, "Knowledge operation, plan and validate". Parties (4): Caller (HTTP, MCP or test), Operation service, scanRepository, Readers. Messages (9):
     1. Caller→Service: request: path, worktree, operation, input, expected, dryRun
     2. Service→Service: resolve root and registered worktree, check branch
     3. Service→scanRepository: scan the worktree
     4. scanRepository-->Service: metadata with full bodies for the touched artifact, units and flows
     5. Service→Service: build the plan and the post-image file map
     6. Service→Readers: validate the post-image
     7. Readers-->Service: diagnostics
     8. alt "new error diagnostic in the post-image": Service-->Caller: 422 with diagnostics
     9. else "dryRun": Service-->Caller: files, diagnostics and expected digests, nothing written
     - else "apply": note over Service: continue with the apply path. This is 1 note.
   - Diagram 2, "Knowledge operation, apply". Parties (3): Caller, Operation service, Writer. Messages (7):
     1. Service→Writer: apply the plan with expected digests
     2. Writer→Writer: compute current digests of touched files
     3. alt "digest mismatch": Writer-->Service: rejected with current content
     4. Service-->Caller: 409 with current content
     5. else "digests match": Writer→Writer: write temporary files, rename in fixed order
     6. Writer-->Service: written files
     7. Service-->Caller: applied, operationId, files, diagnostics, revision
     - Note over Writer: the adjusted journal note. This is 1 note.
   - Arrow meaning: solid arrows are calls; dashed arrows are replies.
   - Gap: the contract does not name the module that records the journal, so the journal is a note and not a message.
   - Source line, as in E3, with the revision changed to "current snapshot".
   - Count check: 4 parties, 9 messages and 1 note; 3 parties, 7 messages and 1 note.
   - The code agrees with this order. server/knowledge-operations.js `apply` runs requireEditableBranch, context (scan), plan, post-image diagnose (422), dryRun return, then writePlan.
   - The service also does an early digest check before validation. The contract does not state it, so the diagram does not draw it.
3. **Mode: summarize.** The prose stays. The diagrams show the order and do not replace the contract.
4. **Placement.** In Operation service, after the paragraph that starts "Response: repository, worktree, operation, applied (false for a dry run)", and before "Identifiers." Write one introduction paragraph: "The two diagrams show the order of one operation request across this section and the Writer section. Solid arrows are calls; dashed arrows are replies." Then the two fenced blocks, each followed by the source line.
5. **Defect dependency.**
   - No verified defect in the drawn passages.
   - Not stale: the workbench redesign states "The knowledge editing contract supplies every write and does not change". In Validation, "buildFlowGraph for the planning view" names a server option (`knowledge: 'planning'` in knowledge-operations.js line 718), not the removed UI control.
6. **Anchors.**
   - Keep: Two layers, one writer; Writer; Operation service; Operations (h3); Git lifecycle; HTTP interface; MCP interface; Observation and freshness; Compatibility and limits; Validation plan; Specification self-check.
   - Inbound: `#specification-self-check` (front matter). Visual-examples E3 and E8 name the file and its sections.
7. **Facts that stay in text.**
   - Containment.
   - Front-matter and body edit rules.
   - Partial-write recovery.
   - The rule that only the dry-run and apply pair may modify a file without an expected digest.
   - Undo and the 409 for undo.
   - The diagnostic counting rule (not info and not flow-evidence-gap) and the pre-image comparison rule. document.delete warnings. The diagnostic labels new and existing.
   - Field-rule rejection before planning.
   - The response field details.
   - Identifiers, Templates and the Operations table.
   - The other status codes.

### specifications/knowledge-editing.md — Operation service (Templates paragraph)

1. **Decision: confirm.**
2. **Form.** Table, 9 rows × 4 columns. Header: `Template | Front matter | Headings | Other fixed content`. "Not named" means that the contract names nothing for that cell. Row keys and cells:
   1. requirement | Not named | Need and constraints, Acceptance criteria, Self-check | Not named
   2. specification | Not named | Governing requirement, Behavior and interfaces, Self-check | Not named
   3. decision | Not named | Context, Alternatives, Decision, Consequences | Not named
   4. change record | Not named | Reason and scope, Baseline and ownership | Not named
   5. plan | `tasks: []` | Approval and prerequisites, Plan self-check | Not named
   6. task | id and depends_on | Scope and ownership, Governing knowledge, Prerequisites, Definition of Done, Evidence | Definition of Done with one unchecked item; Evidence with "Implementation has not started."
   7. unit brief | the unit brief fields (not listed in this contract) | Purpose, Included scope, Excluded scope, Validation evidence | Not named
   8. flow | front matter with the first step as the entry step | Not named | Not named
   9. version record | source_change | Not named | a compatibility sentence and the link to the retained plan

   Source line: `Source: artifact-plane:specifications/knowledge-editing.md, Operation service, Templates paragraph; derived one row per template in the order of the paragraph; current snapshot.`
3. **Mode: replace.** The safe replace is the parenthetical list.
   - Replaced text: the part of the first sentence after "name what to replace:", from "requirement (Need and constraints, Acceptance criteria, Self-check)" to "version record (source_change front matter, compatibility sentence and the link to the retained plan)."
   - Retained text:
     - "Templates. New documents use fixed templates derived from the ADD guidance, with headings only and short placeholder sentences that name what to replace." This is the same sentence, ending at "replace".
     - A new introduction sentence: "The table lists the nine templates; Not named means that this contract names no content for that column."
     - "Templates never contain a passed self-check or a checked DoD item."
   - Every fact of the list maps to one cell: 9 templates, 23 headings, 5 front-matter cells (tasks: [], id and depends_on, unit brief fields, entry step, source_change) and 2 fixed-content cells (task: unchecked DoD item and Evidence sentence; version record: compatibility sentence and plan link). Nothing is lost.
4. **Placement.** In place of the list, inside the paragraph that starts "Templates. New documents use fixed templates". The table follows the retained first sentence and the introduction sentence. The source line follows the table, and then "Templates never contain a passed self-check or a checked DoD item." The h3 "Operations" follows unchanged.
5. **Defect dependency.** None. The templates are not workbench UI.
6. **Anchors.** As in the previous row. No heading is added.
7. **Facts that stay in text.**
   - Templates derive from the ADD guidance.
   - Templates hold headings only, with short placeholder sentences.
   - The never-passed and never-checked rule.

### specifications/lazy-loading.md — Scoped API

1. **Decision: adjust.**
   - Use rows by section, with "required context" and "other allowed selectors". Do not use a 7 × 6 selector matrix.
   - The text does not state many matrix cells. Examples: source and dependencyMode outside markdown and artifacts, and unit with history. A matrix would need about 15 "not stated" cells, or it would take cell values from the code.
2. **Form.** Table, 7 rows × 3 columns. Header: `Section | Required context | Other allowed selectors`. Row keys and cells:
   1. overview | none | worktree only; every other selector is invalid
   2. artifacts | unit, or artifact and change for ungrouped exploration instead of unit | dependencyMode: established or planning, default established
   3. workflow | unit, or artifact and change for ungrouped exploration instead of unit | None stated
   4. implementation | unit, or artifact and change for ungrouped exploration instead of unit | None stated
   5. completion | unit | None stated
   6. history | artifact and change | None stated
   7. markdown | source (a safe repository-relative path in the selected discovered knowledge or evidence scope), plus unit or artifact and change | artifact alone, for its root or current knowledge

   - Gap line after the source line: "Gap: the text lets artifact metadata and Markdown inspection use artifact without change, so that established artifacts without an active change remain inspectable. It does not name the section that serves artifact metadata." In code, `validateQuery` accepts artifact without change for artifacts and markdown, but the table must not state this.
   - Source line: `Source: artifact-plane:specifications/lazy-loading.md, Scoped API paragraphs 1 and 2; derived one row per section value; current snapshot.`
3. **Mode: summarize.** Paragraphs 1 and 2 stay.
   - They hold the worktree default and registration rule, the safe-naming rules, the ungrouped reason, the 400/404/422/500 status codes, the retained guards and "not arbitrary filesystem access".
   - The gap above also makes a replace unsafe.
4. **Placement.** After paragraph 2 of Scoped API, which starts "For overview, selectors other than worktree are invalid.", and before the paragraph that starts "Response: {repository, worktree, section".
5. **Defect dependency.**
   - No verified defect in Scoped API.
   - The API still exists. server/repository-query.js has `sections=['overview','artifacts','workflow','implementation','markdown','history','completion']`, and the current pages request all seven: UnitPage, ChangePage, DocumentPage and main.jsx.
   - dependencyMode is still accepted for artifacts. The browser no longer sends it, because the Planning control was removed. It stays an HTTP contract value under VP5.
   - Spec drift, not a verified defect: the code accepts a request key `revision` (only `'established'`, only with section markdown). It is used by DocumentPage.jsx and ChangePageReview.jsx and is documented only in changes/change-evidence-and-usability/tasks/12-layout-navigation.md. The contract's Request list and "Reject ... unknown keys" omit it.
   - Report it to the coordinator. A corrected Request would add `revision?` and the sentence "revision is established only for markdown and reads the protected-ref bytes of an in-place working source." This change is outside VP3 unless the coordinator records it.
   - Stale UI words outside the drawn passage: Overview and deferred sections lists "Artifacts view", "Workflow view" and "Implementation view" (the removed unit tabs). Leave them.
6. **Anchors.** Keep: Scope; Overview and deferred sections; Scoped API; Observation and retention; Validation and memory; Specification self-check. No inbound anchor.
7. **Facts that stay in text.**
   - path validation.
   - The worktree default and fresh enumeration.
   - The safe naming rules.
   - "for ungrouped exploration" and the inspectability reason.
   - Rejection of ambiguous combinations, unknown keys and invalid types with 400. Missing records give 404, unavailable worktrees give 422, and failures give 500.
   - The retained checks.
   - "not arbitrary filesystem access".

### specifications/project-tabs.md — Workspace and identity / Explorer isolation and lifecycle / Browser persistence (tab lifecycle)

1. **Decision: confirm** a state diagram (`stateDiagram-v2`, direction LR) of one project tab.
   - It is not the flow record artifact-plane:project-tabs. That record is a behavior journey (restore, open, select, navigate, close), not tab states.
   - authoring-workbench Top bar item 2: "The project tabs. Their behavior does not change."
2. **Form.** Fact list. Arrow meaning: each arrow is an event that changes the state of one tab.
   - States (5):
     - Empty: "an empty tab".
     - Restored: label "Restored, not yet loaded". Gap: the text does not name this state; it says "Restored inactive tabs load when first selected".
     - Active: the active tab and the active explorer.
     - Inactive: hidden, its session state preserved, its loaded data "stale until reconciled".
     - Error: a missing or unreadable project, which keeps its tab and path with an error and retry/open controls.
   - Transitions (13):
     1. [*] → Empty: Plus adds and selects an empty tab, closing the last tab creates one, or there are no saved projects
     2. [*] → Restored: reload restores a saved project path
     3. Empty → Active: a successful open assigns the canonical path
     4. Empty → [*]: the open finds a duplicate canonical path; the existing tab is selected and this tab is removed
     5. Restored → Active: it opens at once as the restored active tab, otherwise when it is first selected
     6. Restored → Error: the project is missing or unreadable
     7. Active → Inactive: another tab is selected; the event stream closes and reads are cancelled
     8. Inactive → Active: the tab is selected again; the overview reconciles and the selected detail reloads
     9. Empty → [*]: close
     10. Restored → [*]: close
     11. Active → [*]: close
     12. Inactive → [*]: close
     13. Error → [*]: close
   - Note on the end marker: close unmounts the explorer and releases its resources. The next tab at the closed index is selected, otherwise the preceding tab.
   - Gaps, listed after the source line:
     - the state after retry or open in Error is not stated;
     - whether an Empty tab becomes inactive when another tab is selected is not stated;
     - an open failure from Empty is not stated in this contract;
     - "replaces the tab" is not defined here.
   - Count check: 5 states and 13 transitions. 2 transitions start from the initial marker and 6 end at the final marker.
   - Labels must not contain semicolons. Use commas.
   - Source line: `Source: artifact-plane:specifications/project-tabs.md, sections Workspace and identity, Explorer isolation and lifecycle and Browser persistence; derived one state per tab condition that the text names and one transition per stated event; current snapshot.`
   - The code agrees with the drawn facts. src/project-tabs.js `closeTab` creates an empty tab when none remains. src/main.jsx `ProjectExplorer` opens when `isActive`.
3. **Mode: summarize.** The prose stays.
4. **Placement.** At the end of Browser persistence, after the paragraph that starts "Restored inactive tabs load when first selected." Every drawn fact comes before this point. Write one introduction paragraph that names the three sections and the arrow meaning.
5. **Defect dependency.**
   - None in the drawn passages.
   - Related verified defect, not drawn from: survey group 2, item 6, in flows/project-tabs.md. Step `navigate` has the title "Maintain project-scoped graph and inspector state", and the record has support `source-bar`. Leave it under VP3.
   - Explorer isolation names "panels" generically. This is not stale.
6. **Anchors.** Keep: Governing knowledge; Workspace and identity; Explorer isolation and lifecycle; Browser persistence; Validation and impact; Specification self-check. No inbound anchor.
7. **Facts that stay in text.**
   - Ordered records and the session ID.
   - The canonical identity.
   - Distinct worktree roots, and active worktree selection that changes only the exploration context.
   - The label suffix rule and the accessible descriptions.
   - The tablist pattern and the accessible names.
   - The ownership list.
   - The canvas reconciliation.
   - No initial-open resets.
   - Generation checks, and the rule that late responses do not cross tabs.
   - The localStorage key, shape and validation.
   - The restoration warning.
   - Cross-window and origin scope.
   - The validation list.

### specifications/ux-simplification.md — Contained source navigation (link target → outcome)

1. **Decision: adjust.**
   - Drop the "authority (client map / server)" column. The text gives authority once for all targets: "Client resolution is a convenience, never the security authority." It does not give it per target, so the rule stays in text.
   - Merge targets that share one rule and one outcome.
2. **Form.** Table, 13 rows × 3 columns. Header: `Link target | Rule | Outcome`. Row keys and cells:
   1. Relative Markdown path | resolved against the exact displayed source, not the repository root or a current-version shortcut; path segments normalized; decoded once | navigable only under row 4; otherwise as the rows below
   2. Path with a `../` segment | the resolved destination decides containment | not rejected merely because the segment exists
   3. Absolute path, root escape, scheme, .git or credential destination, invalid encoding | none | rejected
   4. Root, current or change knowledge source; declared unit or evidence source; registered flow or review source | already allowed in the active context | navigable
   5. Cross-artifact link | resolves only to discovered artifact and source identities; exact version and change selectors retained | navigable only under row 4
   6. Historical version outside the known allowlist | a newer or current version is never substituted for the exact unavailable snapshot | inert, with an accessible unavailable reason and the destination visible on demand
   7. External URL, missing file, unsupported file type | none | inert, with an accessible unavailable reason and the destination visible on demand
   8. Repository-supplied event handlers, href schemes, forged data attributes, HTML | sanctioned navigation uses locally handled controls backed by the trusted target map | cannot install callbacks or bypass the map
   9. Server rejection of a read | server markdown reads validate declared scope, realpath containment, task-directory containment and UTF-8 | local unavailable feedback; Back retained
   10. Flow support row, resolved | resolves to source IDs already returned by the selected detail response | opens that registered source directly through the existing flow source operation
   11. Flow support row, unresolved | none | stays visibly unresolved
   12. Same-document heading anchor, supported | uses generated heading identities after sanitization | navigable
   13. Unrecognized anchor | none | explicit unavailable destination

   - Gap line after the source line: "Gap: the text rejects schemes and keeps external URLs inert; it does not state how a rejected target appears or which row applies to an external URL." In code, src/knowledge-navigation.js returns `kind: 'unavailable'` with a reason for both, but the table must not state this.
   - Source line: `Source: artifact-plane:specifications/ux-simplification.md, Contained source navigation paragraphs 1 to 4; derived one row per target kind or shared rule that the paragraphs name; current snapshot.`
3. **Mode: summarize.** The prose stays. Replace is unsafe for these facts:
   - the security rules: DOMPurify and the current blocked tags and resources stay, there is no new filesystem endpoint, no hosted fetch or external load, and the client is not the authority;
   - the optional callback and the generated map;
   - the secondary source-selector condition;
   - the revision-bound review source IDs.
4. **Placement.** At the end of Contained source navigation, after the paragraph that starts "Flow support rows resolve to source IDs already returned by the selected detail response.", and before "## Independent disclosure and explicit graph reveal".
5. **Defect dependency.**
   - None in the survey.
   - Checked against the current code: src/knowledge-navigation.js `resolveKnowledgeLink` (decode once, `../` popping with a root-escape check, scheme and absolute rejection, .git and credential names, heading fragment, and the allowed-target map) and src/Markdown.jsx (unavailable links with a reason and the destination in the title).
   - Not stale. "Back" still exists in the shell (`back` and `canGoBack` in main.jsx).
   - "Review source readers" maps to the change page comparison readers.
6. **Anchors.** As in the previous row. The table adds no heading.
7. **Facts that stay in text.**
   - The navigation callback and the generated allowed-target map.
   - No general filesystem endpoint, hosted link fetch or external resource load.
   - DOMPurify and the blocked tags and resources.
   - "Client resolution is a convenience, never the security authority."
   - Keep a source selector only as a secondary browse-all affordance if it still serves a distinct purpose.
   - Review source readers keep revision-bound registered IDs.

## Specification self-check

VP1 maps to Decisions and the row specifications, VP2 to the modes and Validation, VP3 to Corrections and the rejected rows, VP5 to Validation and the anchor items. Every kept row was compared with the current workbench contract and the code. KISS: tables first, four diagrams only where order or state is the subject. STE: gaps are named, not drawn. No Specification blocker prevents Plan.
