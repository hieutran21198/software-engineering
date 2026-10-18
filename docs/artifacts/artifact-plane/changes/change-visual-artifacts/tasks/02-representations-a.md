---
id: representations-a
depends_on: []
evidence_records:
  - id: dod
    method: Sentence-to-cell mapping of every replaced passage, count checks, Mermaid parse and heading comparison of the eight specifications.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-visual-artifacts/tasks/02-representations-a.md#evidence
---

# Add representations to eight Plane specifications

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files under docs/artifacts/artifact-plane/specifications: authoring-workbench.md, change-impact.md, change-review.md, codex-execution.md, compact-context.md, evidence-correctness.md, explorer.md and incremental-observation.md.

## Governing knowledge

VP1 to VP3 and VP5 in requirements/visual-artifacts.md; the decisions, corrections, validation and row specifications of specifications/visual-artifacts.md for these files.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [x] The inspector clause of codex-execution.md, Derived states, is corrected before its table is written.
- [x] The 12 representations of these files in the Decisions table are in their sections with introduction and source line, in the mode and placement of their row specifications; the codex-execution sequence diagram has accTitle and accDescr and lists its three gaps in the text.
- [x] For each replace row, the evidence maps every replaced sentence to a cell or to retained text; a comparison of the old and new section text finds no lost fact, condition, limit or exception.
- [x] Headings are unchanged; the diagram parses with Mermaid 11.17.2 and its count check gives 4 parties, 8 messages, 2 notes and 1 loop.

## Evidence

Executed on 18 October 2026 on branch claude/visual-artifacts after the user approved the plan. The worker commit on branch claude/va-know-pa was integrated as 04b71b1.

Task: docs/artifacts/artifact-plane/changes/change-visual-artifacts/tasks/02-representations-a.md
Contract: docs/artifacts/artifact-plane/specifications/visual-artifacts.md (Decisions, Corrections, Validation, Row specifications)

### Correction (applied before any table was written)

File: specifications/codex-execution.md, section Derived states, Unknown item.

- Before: "- Unknown: expired active observation, restart without fresh matching activity, missing correlation, or contradictory report. Retain last observed state/time in the inspector."
- After: "- Unknown: expired active observation, restart without fresh matching activity, missing correlation, or contradictory report. Retain the last observed state and time."

The edit script applies this replacement before the Identity and Derived states tables.

### R1 authoring-workbench.md — Layout

- Form: table, 3 columns (Element, Default, Narrow layout), 11 rows. Mode: summarize. Placement: after the "At 800 pixels and below:" list, before `## Top bar`. Introduction sentence and source line as in the row specification.
- Re-verified against text: Layout (52, 264, 200–400, 40/56, 880, 960, 720, 240–280, 800 px list), Document page (1100 px Properties disclosure), Graph panel (420/320), Visual style Buttons row (36/44). Code: styles.css `--control-h` 36/44, `.graph-panel` 420/320, `--sidebar-width` 264; DocumentPage.jsx `useMedia('(max-width: 1100px)')`. All agree.
- Count: 11 rows; 4 rows have "—" in one column (Page column, Change page column, Document text column narrow; Primary actions and Tables default).
- Deviation (wording only): the cells write "pixels" instead of "px" (row spec), to keep one term with the rest of the file (STE). No value changed.

### R2 change-impact.md — Query (inputs)

- Form: table, 5 columns (Input, Presence, Values, Default, Maximum), 11 rows. Mode: replace sentence 1 of paragraph 1. Placement: start of `## Query`: introduction, table, source line, then the retained sentence, then paragraph 2.
- Code check (server/impact.js, read only): FIELDS, exactly one of origins/commit/range/diff, depth 1–4 default 2, budget ≤100000 default 8000, limit 1–200 default 25, format json|text. Agrees. Not drawn (text does not state): `knowledge` field, ≤100 origins, budget minimum 0, format default json.
- Replaced sentence: "Inputs: path, optional worktree, and one of origins (a list of {path | element | flow | step | model} with optional symbols, or {path, commit} to take that path's change from that commit), commit, range, or diff with base protected or a ref; depth from 1 to 4 (default 2); budget in characters for the compact text (default 8000, maximum 100000); format json or text; limit per section (default 25, maximum 200); optional unit."
  - "path" → row path (Presence required).
  - "optional worktree" → row worktree (optional).
  - "one of origins, commit, range, or diff" → Presence cell of rows origins, commit, range, diff ("one of origins, commit, range or diff").
  - "a list of {path | element | flow | step | model} with optional symbols" → origins Values "list of {path, element, flow, step or model} with optional symbols".
  - "or {path, commit} to take that path's change from that commit" → origins Values "or {path, commit} to take that path's change from that commit".
  - "diff with base protected or a ref" → diff Values "base: protected or a ref".
  - "depth from 1 to 4 (default 2)" → depth Values "1 to 4", Default 2, Maximum 4.
  - "budget in characters for the compact text (default 8000, maximum 100000)" → budget Values "characters of the compact text", Default 8000, Maximum 100000.
  - "format json or text" → format Values "json or text"; Presence and Default "not stated" (the sentence states neither).
  - "limit per section (default 25, maximum 200)" → limit Values "entities per section", Default 25, Maximum 200. "entities" follows the row spec and the text "the first limit entities per tier" (Interfaces) and "one line per entity" (paragraph 3).
  - "optional unit" → row unit (optional).
- Retained text: "Validate selectors as the flow query does; reject unknown fields and unregistered worktrees." Paragraph 2 unchanged.
- Old/new comparison: no fact, condition, limit or exception lost.

### R3 change-impact.md — Query (response)

- Form: tree listing in a `text` block, 22 lines (1 root, 11 envelope fields, 10 data fields), depth 2. Mode: replace sentences 1 and 2 of paragraph 3. Placement: paragraph 3 becomes introduction, tree, source line, then the two retained sentences.
- Code check: server/impact.js result keys repository, worktree, context, revision, generation, freshness, completeness, data, diagnostics, omissions, metrics. Agrees. Not drawn: `result.text`, a `steps` data section and the "Declared assessment" compact section (not stated in the text).
- Replaced sentence 1: "Response envelope: repository, worktree, context, revision, generation, freshness, completeness, data, diagnostics, omissions and metrics with the phase timings of the query."
  - repository, worktree, context, revision, generation, freshness, completeness, data, diagnostics, omissions, metrics → tree lines 2 to 8, 9, 20, 21, 22 (indent 1, source order).
  - "with the phase timings of the query" → line "metrics: the phase timings of the query".
- Replaced sentence 2: "data has changed, direct, transitive, verify, investigate, potential, potential_total, unresolved, declared and coverage, with the explanation record and the coverage fields of the ADD contract."
  - the 10 data fields → tree lines 10 to 19 under data (indent 2, source order).
  - "with the explanation record and the coverage fields of the ADD contract" → line "data: with the explanation record and the coverage fields of the ADD contract".
- Retained text: "Sections longer than limit are cut with their total in omissions." and "The compact text has the sections Changed, Direct, Transitive, Verify, Potential (confirm before acting), Investigate, Unresolved and Coverage, one line per entity with its kind, strength, hops, path summary and evidence, cut to budget with a note."
- Old/new comparison: no fact lost.
- Addition to the introduction: one sentence that says what indentation means (authoring rule 2).

### R4 change-review.md — Query and source boundaries

- Form: table, 4 columns (Field, Presence, Values or rule, Default), 9 rows; `comparison` excluded per row spec. Mode: summarize. Placement: after paragraph 1, before "Envelope: ...".
- Code check: server/change-review.js `fields` = path, worktree, artifact, change, operation, limit, budget, cursor, source. Agrees.
- Count: 9 rows.

### R5 codex-execution.md — Derived states

- Form: table, 3 columns (State, Entered when, Left or cleared when), 8 rows. Mode: summarize, after the correction. Placement: after the expiry paragraph, before `## Local API and live browser updates`.
- Count: 8 rows; exit "Not stated." in 6 rows (No recorded execution, Validating, Interrupted, Failed, Done (reported), Unknown).
- Gap line added after the source line: no exit for 6 of 8 states; terminal reports are not named, so the overwrite rule is not in a row (from the row spec Gaps item).
- The table does not use the removed inspector clause.

### R6 codex-execution.md — Identity and retained graph context

- Form: table, 4 columns (Field, Binding and task matching, Capture, Agent identity), 12 rows. Mode: summarize. Placement: after paragraph 1, before "The local runtime CLI provides ...".
- Re-verified against codex-execution.md paragraph 1 and evidence-correctness.md Worktree-bound observation paragraph 1. Capture column = union of named capture fields (canonical source worktree, source HEAD/revision when known, unit selector, graph digest). The sentence "Capture identity also includes source revision and graph digest." stays in the text.
- Count: 12 rows.

### R7 codex-execution.md — Local API and live browser updates (sequence diagram)

- Form: `sequenceDiagram` with accTitle "Live runtime update path" and accDescr. Mode: summarize. Placement: after the single paragraph of the section, before `## UI`. Introduction states solid arrows = requests, writes or checks; dashed arrows = replies or events.
- Fact list:
  - Participants (4): Hook = Codex command hook; Store = Runtime store (runtime.sqlite); Server = Plane server (watcher and runtime endpoints); Browser.
  - Messages (8): 1 Browser->>Server POST /api/runtime/query, contained root and optional context ID (initial query); 2 Server-->>Browser repository ID, contexts, attempt summaries, freshness, latest sequence; 3 Browser->>Server GET /api/runtime/events, same-origin SSE; 4 Hook->>Store write event with a unique event ID, in a transaction; 5 Server->>Store check database sequence (in the loop); 6 Server-->>Browser SSE invalidation that contains only the latest sequence; 7 Browser->>Server POST /api/runtime/query for the selected runtime context (refetch); 8 Server-->>Browser query response.
  - Notes (2): over Store "SQLite supplies a monotonically increasing ingestion sequence, duplicate event IDs are ignored" (the row-spec semicolon is a comma, authoring rule 1); over Server,Browser "initial query and reconnect recover missed updates".
  - Blocks (1): loop "once per second while clients are connected" around message 5.
  - Gaps (listed in the text after the source line, 3): no stated condition for the invalidation; hook write position is one case (a hook can write at any time, also when Plane is not running); no stated store reply to the check.
- Count check with Mermaid 11.17.2 (website/node_modules/mermaid, mermaid.core.mjs; DOMPurify stubbed for Node because no DOM is available, parse only): `mermaid.parse` → diagramType sequence; db: 4 actors (Hook, Store, Server, Browser); 5 SOLID + 3 DOTTED = 8 messages; 2 NOTE; 1 LOOP_START / 1 LOOP_END; accTitle "Live runtime update path"; accDescr present. Expected 4 parties, 8 messages, 2 notes, 1 loop: matches.
- Rule checks: no HTML in labels, no semicolon in any label or accDescr, no init directive, no click directive.
- Code check: server/runtime-api.js `intervalMs=1000`, `text/event-stream`, timer only while clients exist, `maxClients=16`; src/Runtime.jsx `postJSON('/api/runtime/query')`, `new EventSource('/api/runtime/events')`. Agrees.

### R8 compact-context.md — Request and compatibility

- Form: table, 3 columns (Attribute, Default v1 packet, Compact format), 8 rows. Mode: summarize. Placement: after the paragraph ending "Compact source reads are not required: use registered existing source reads.", before `## Response and byte accounting`.
- Re-verified against compact-context.md and context-packets.md Schema and budgets ("budget limits excerpt characters, default 12000 and maximum 100000; it is not a token or full-response-byte cap"). Comparison selectors not in a row.
- Count: 8 rows; 1 "not stated" cell.

### R9 evidence-correctness.md — Flow ordering

- Form: table, 5 columns (Request (query after trimming), First order, Then, Tie breaker, Unknown creation dates), 3 rows. Mode: replace 3 sentences of paragraph 1. Placement: after the retained text of paragraph 1, before paragraph 2.
- Code check: server/flow-index.js order (createdAt descending, unknown last, then id) per row spec; flows.md paragraph 3 supplies "FTS5 and exact cosine vector ranks"; flow-readability.md paragraph 3 supplies createdAt, opaque ID tie breaker, unknown dates last, "creation dates never override that order".
- Replaced sentence: "Empty queries browse by creation date descending, opaque ID ties and unknown dates last." → row "Empty query (browse)": First order "Creation date (createdAt), descending"; Tie breaker "Opaque ID"; Unknown creation dates "Last".
- Replaced sentence: "Nonempty queries put unique exact opaque/logical/local ID matches first, then existing reciprocal-rank-fusion score descending and opaque ID ties." → row "Nonempty search": First order "Unique exact opaque, logical or local ID matches"; Then "Existing reciprocal-rank-fusion score of the FTS5 and exact cosine vector ranks, descending"; Tie breaker "Opaque ID".
- Replaced sentence: "Impact output retains deterministic newest-first order independently of search scoring." → row "Impact": First order "Creation date (createdAt), descending, deterministic and independent of search scoring". Tie breaker and Unknown creation dates cells come from flow-readability.md (unchanged).
- Retained in paragraph 1: "Trim whitespace." (also in the column header "query after trimming"), "Ambiguous local IDs remain multiple candidates; detail still needs an unambiguous selector.", "Recency never overrides search relevance." Paragraph 2 unchanged, including the UI label sentence.
- Deviation (wording only): the Then cell starts with "Existing" (not in the row spec) so that the word "existing" of the replaced sentence is not lost.
- Old/new comparison: no fact lost.

### R10 explorer.md — Read-only API extension (tree listing)

- Form: tree listing in a `text` block, 14 lines. Mode: summarize. Placement: after the paragraph "POST /api/explore keeps its input ...", before "Enumerate registered worktrees".
- Count: 6 top-level keys (repository, artifacts, edges, references, diagnostics, workflow); 13 record types; 60 fields (3+7+4+3+5+3+3+10+10+5+3+2+2); depth 5 below the root; 14 lines.
- Code check: server/workflow.js `historyLimit: 200`, change and step fields. Not drawn: unitsOfWork, taskGraph, layout, version, state not-declared (other contracts); introduction says other contracts add fields.

### R11 explorer.md — Step evidence and commit association

- Form: table, 3 columns (Phase, Associated commit paths, Evidence for the current step), 6 rows. Mode: summarize. Placement: after paragraph 3, before `### UI and failures`. Introduction carries the legacy scope with a link to knowledge-layout-reading.md#declared-evidence-instead-of-history (sibling specification; anchor resolves to `## Declared evidence instead of history`).
- Re-verified: knowledge-layout-reading.md "Legacy changes keep the existing inference."; server/workflow.js `phases` (6) and "History is replayed only for legacy artifacts."
- Count: 6 rows.

### R12 incremental-observation.md — Sampling and events

- Form: table, 3 columns (Bound, Value, Applies when), 8 rows. Mode: summarize. Placement: after paragraph 3, before `## Lifecycle and evidence`.
- Code check: server/repository-events.js `debounceMs=250`, `fullMs=30000`, `fallbackMs=10000`, `maxWatches=4096`, `repositoryService({intervalMs=2000})`. Agrees.
- Count: 8 rows.

### Combined checks

- Headings: `grep '^#'` before and after is identical for all 8 files (22, 8, 8, 11, 4, 7, 26, 3 headings).
- `git diff --stat`: 8 files, 227 insertions, 4 deletions (the 4 deleted lines are the 3 replaced paragraphs/sentences and the corrected Unknown item).
- `git diff --check`: no whitespace errors.
- validate-knowledge: errors 0, diagnostics 1 (info, retained-legacy-change, pre-existing).
