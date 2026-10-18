---
id: representations-b
depends_on: []
evidence_records:
  - id: dod
    method: Count checks, list-item mapping of the templates table, Mermaid rendering in Chromium and heading comparison of the five specifications.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-visual-artifacts/tasks/03-representations-b.md#evidence
---

# Add representations to five Plane specifications

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files under docs/artifacts/artifact-plane/specifications: knowledge-editing.md, knowledge-layout-reading.md, lazy-loading.md, project-tabs.md and ux-simplification.md.

## Governing knowledge

VP1 to VP3 and VP5 in requirements/visual-artifacts.md; the decisions, validation and row specifications of specifications/visual-artifacts.md for these files; worked example E3 of the ADD visual examples.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [x] The 6 representations of these files in the Decisions table are in their sections with introduction and source line, in the mode and placement of their row specifications.
- [x] The two knowledge-editing diagrams count 4 parties, 9 messages and 1 note, and 3 parties, 7 messages and 1 note; the project-tabs state diagram counts 5 states and 13 transitions and lists its 4 gaps in the text; each diagram has accTitle and accDescr and parses with Mermaid 11.17.2.
- [x] For the templates table, the evidence maps every item of the replaced list to a cell; headings are unchanged.

## Evidence

Executed on 18 October 2026 on branch claude/visual-artifacts after the user approved the plan. The worker commit on branch claude/va-know-pb was integrated as 216d29f. After the real-knowledge check of the validation task, the coordinator removed `direction LR` from the project-tabs state diagram (65d5df9): top to bottom it is 927 pixels wide instead of wider than the column, and it fits the 720-pixel column at 1440. States and transitions are unchanged.

Worker branch claude/va-know-pb, base 35fb143. Code under apps/artifact-plane is unchanged between 5d7935a and 35fb143 (`git diff --stat 5d7935a 35fb143 -- apps` is empty), so the code checks of the row specifications hold. Mermaid check: Mermaid 11.17.2 (website/node_modules/mermaid/dist/mermaid.min.js) in Playwright Chromium, `mermaid.parse` and `mermaid.render` for each block; script scratchpad/checks/mermaid-parse-pb.cjs.

### 1. knowledge-editing.md — Operation service — two sequence diagrams

- Form: two `sequenceDiagram` blocks with accTitle and accDescr, one introduction paragraph (verbatim from the row specification), a source line after each block, a gap line after the second.
- Mode: summarize. No prose removed.
- Placement: after the "Response: repository, worktree, operation, applied ..." paragraph, before "Identifiers.".
- Diagram 1 "Knowledge operation, plan and validate". Parties (4): Caller (HTTP, MCP or test), Operation service, scanRepository, Readers. Messages (9):
  1. Caller->>Service request: path, worktree, operation, input, expected, dryRun (Operation service, Request)
  2. Service->>Service resolve root and registered worktree, check branch (Processing)
  3. Service->>Scan scan the worktree (Processing)
  4. Scan-->>Service metadata with full bodies for the touched artifact, units and flows (Processing)
  5. Service->>Service build the plan and the post-image file map (Processing)
  6. Service->>Readers validate the post-image (Processing, Validation)
  7. Readers-->>Service diagnostics (Validation)
  8. alt new error diagnostic: Service-->>Caller 422 with diagnostics (Validation)
  9. else dryRun: Service-->>Caller files, diagnostics and expected digests, nothing written (Response)
  - Note (1): else apply, Note over Service: continue with the apply path.
- Diagram 2 "Knowledge operation, apply". Parties (3): Caller, Operation service, Writer. Messages (7):
  1. Service->>Writer apply the plan with expected digests (Expected digests)
  2. Writer->>Writer compute current digests of touched files (Expected digests)
  3. alt digest mismatch: Writer-->>Service rejected with current content (Expected digests)
  4. Service-->>Caller 409 with current content (Expected digests)
  5. else digests match: Writer->>Writer write temporary files, rename in fixed order (Atomic replacement)
  6. Writer-->>Service written files
  7. Service-->>Caller applied, operationId, files, diagnostics, revision (Response)
  - Note (1): Note over Writer: "journal keeps, per repository root and in memory, the pre-image bytes and the pre- and post-image digests of the last 50 applied operations" (Writer, Journal and undo; adjusted wording of the row specification).
  - accDescr of diagram 2 adds the journal sentence (row specification item 1).
- Count check (scripted from the block text): diagram 1 = 4 participants, 9 messages, 1 note; diagram 2 = 3 participants, 7 messages, 1 note. Expected 4/9/1 and 3/7/1. Pass. No semicolon in any message label.
- Arrow meaning stated once in the introduction: solid arrows are calls, dashed arrows are replies.
- Gap stated in text: the contract does not name the module that records the journal, so the journal is a note.
- Not drawn: the early digest check of server/knowledge-operations.js (not stated in the contract).
- Mermaid 11.17.2: both blocks parse and render; SVG has title and desc. Pass.

### 2. knowledge-editing.md — Operation service, Templates paragraph — table

- Form: table, 9 rows x 4 columns, header `Template | Front matter | Headings | Other fixed content`.
- Mode: replace (the parenthetical list only).
- Placement: inside the Templates paragraph. Retained first sentence (ending at "replace."), the new introduction sentence, the table, the source line, then "Templates never contain a passed self-check or a checked DoD item." The h3 Operations follows unchanged.
- Mapping of each removed list item to cells:

| Removed list item | Cells |
| --- | --- |
| requirement (Need and constraints, Acceptance criteria, Self-check) | requirement / Headings: Need and constraints, Acceptance criteria, Self-check |
| specification (Governing requirement, Behavior and interfaces, Self-check) | specification / Headings: Governing requirement, Behavior and interfaces, Self-check |
| decision (Context, Alternatives, Decision, Consequences) | decision / Headings: Context, Alternatives, Decision, Consequences |
| change record (Reason and scope, Baseline and ownership) | change record / Headings: Reason and scope, Baseline and ownership |
| plan: "tasks: [] front matter" | plan / Front matter: `tasks: []` |
| plan: Approval and prerequisites, Plan self-check | plan / Headings: Approval and prerequisites, Plan self-check |
| task: "id and depends_on front matter" | task / Front matter: id and depends_on |
| task: Scope and ownership, Governing knowledge, Prerequisites | task / Headings (first three) |
| task: "Definition of Done with one unchecked item" | task / Headings: Definition of Done; Other fixed content: Definition of Done with one unchecked item |
| task: 'Evidence with "Implementation has not started."' | task / Headings: Evidence; Other fixed content: Evidence with "Implementation has not started." |
| unit brief: "front matter fields" | unit brief / Front matter: front matter fields (not listed in this contract) |
| unit brief: "the Purpose, Included scope, Excluded scope and Validation evidence headings" | unit brief / Headings: Purpose, Included scope, Excluded scope, Validation evidence |
| flow (front matter with the first step as the entry step) | flow / Front matter: front matter with the first step as the entry step |
| version record: "source_change front matter" | version record / Front matter: source_change |
| version record: "compatibility sentence and the link to the retained plan" | version record / Other fixed content: a compatibility sentence and the link to the retained plan |

- Counts: 9 templates (9 rows), 23 headings (3+3+4+2+2+5+4), 5 front-matter cells, 2 fixed-content cells, 13 "Not named" cells. Nothing lost.
- Retained text: "Templates. New documents use fixed templates derived from the ADD guidance, with headings only and short placeholder sentences that name what to replace." and "Templates never contain a passed self-check or a checked DoD item." `git diff -U0` shows the Templates line as the only removed line of the file.

### 3. knowledge-layout-reading.md — Layout detection and records — table

- Form: table, 10 rows x 3 columns, header `Concern | In-place artifact | Legacy artifact`. Row keys: Layout detection, Identity declarations, Version directory, Change directory, Active-change link and delivery_tasks marker, Established baseline on main or master, Comparison with the baseline, Displayed steps, Version snapshot, Publication.
- Mode: summarize. Placement: end of Layout detection and records, after the "Version records are ..." paragraph. Introduction names the four sections and says they state the full rules.
- Cells rechecked against the text of lines 19, 21, 25, 27, 31 and 35. 4 legacy cells are "Not stated in this contract" (Version directory, Change directory, Active-change link, Version snapshot). The "labels" row is excluded (Navigation and presentation is stale).
- Wording within the cells: row 7 "each file classified as added, ..." (text: "classify each file as"); row 9 keeps the text's word "optional" for the tag.

### 4. lazy-loading.md — Scoped API — table

- Form: table, 7 rows x 3 columns, header `Section | Required context | Other allowed selectors`. Row keys: overview, artifacts, workflow, implementation, completion, history, markdown.
- Mode: summarize. Placement: after paragraph 2 ("For overview, selectors other than worktree are invalid."), before "Response: {repository, ...".
- Source line, then the gap line of the row specification.
- Cells rechecked against paragraphs 1 and 2. Introduction adds: every request has path and every section allows worktree (Request shape `worktree?`; overview allows worktree; non-overview defaults worktree to path), so "None stated" does not read as "worktree not allowed".
- Markdown "Other allowed selectors" cell: "artifact alone instead of that context, for its root or current knowledge" (text: "artifact alone is sufficient for its root/current knowledge"); the words "instead of that context" make clear that artifact alone replaces the context.

### 5. project-tabs.md — Browser persistence (tab lifecycle) — state diagram

- Form: `stateDiagram-v2`, direction LR, accTitle "States of one project tab", accDescr.
- Mode: summarize. Placement: end of Browser persistence, after the "Restored inactive tabs load when first selected." paragraph.
- Introduction names the three sections, the arrow meaning (each arrow is an event that changes the state of one tab), the meaning of Active, Inactive and Error, and the end-marker meaning (close unmounts the explorer and releases its resources, the next tab at the closed index is selected, otherwise the preceding tab).
- States (5): Empty ("an empty tab"); Restored, label "Restored, not loaded" (not named in the text); Active; Inactive; Error.
- Transitions (13):
  1. [*] -> Empty: Plus adds and selects an empty tab, closing the last tab creates one, or there are no saved projects (Workspace and identity; Browser persistence)
  2. [*] -> Restored: reload restores a saved project path (Browser persistence)
  3. Empty -> Active: a successful open assigns the canonical path (Workspace and identity)
  4. Empty -> [*]: the open finds a duplicate canonical path, the existing tab is selected and this tab is removed (Workspace and identity)
  5. Restored -> Active: opens at once as the restored active tab, otherwise when first selected (Browser persistence)
  6. Restored -> Error: the project is missing or unreadable (Browser persistence)
  7. Active -> Inactive: another tab is selected, the event stream closes and reads are cancelled (Explorer isolation and lifecycle)
  8. Inactive -> Active: selected again, the overview reconciles and the selected detail reloads (Explorer isolation and lifecycle)
  9. to 13. Empty, Restored, Active, Inactive, Error -> [*]: close (Workspace and identity; Explorer isolation and lifecycle)
- Count check (scripted): 5 states, 13 transitions, 2 from the initial marker, 6 to the final marker, 0 semicolons in labels. Expected 5/13. Pass.
- Gaps in text (4): the state after retry or open in Error; whether an Empty tab becomes inactive when another tab is selected; an open failure from Empty; the meaning of "replaces the tab". The line before the list also says that the text does not name the state "Restored, not loaded".
- Code agreement: src/project-tabs.js `closeTab` returns `[empty]` when no tab remains and selects `remaining[Math.min(index, remaining.length-1)]`.
- Mermaid 11.17.2: parses and renders; SVG has title and desc. Pass.

### 6. ux-simplification.md — Contained source navigation — table

- Form: table, 13 rows x 3 columns, header `Link target | Rule | Outcome`. Rows as in the row specification.
- Mode: summarize. Placement: end of Contained source navigation, after the "Flow support rows resolve ..." paragraph, before "## Independent disclosure and explicit graph reveal".
- Source line, then the gap line of the row specification.
- Cells rechecked against paragraphs 1 to 4. The authority rule, the callback and map, DOMPurify, the secondary source selector and revision-bound review IDs stay in text only.

### Combined checks

- Headings: the heading lines of each file equal the lines before the edit (12, 9, 7, 7, 10 headings). Pass.
- Links: no link or anchor added; no heading added. Pass.
- No HTML in labels, no init directive, no click directive. Pass.
- validate-knowledge on the worktree: exit 0, 0 errors, 1 info diagnostic (retained-legacy-change, change-model-explanations), pre-existing. Pass.
