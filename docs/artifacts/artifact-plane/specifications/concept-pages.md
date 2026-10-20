---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/concept-pages.md#specification-self-check
claims:
  - id: concept-query-operations
    kind: decision
    statement: The concept facts come from two new operations, concepts and
      concept, of POST /api/flows/query, and get_concept uses the concept
      operation.
    status: open
    basis: static
    rejected:
      - option: New GET routes /api/concepts and /api/concepts/:artifact/:model.
        reason: Every data route of the server is an allowlisted POST query
          (server/http.js); path routes would add a second API style.
      - option: A concepts array in the repository overview.
        reason: The overview reads no flow graph (server/repository-query.js),
          so it would need a second model parse.
    risk_if_wrong: The sidebar, the artifact page and document Properties wait
      for one more request before they show concepts.
    check: Run the concept operation tests and time the concepts operation on
      this repository.
  - id: one-node-per-concept
    kind: decision
    statement: buildFlowGraph adds one model node and one declares edge for
      each logical id of the selected knowledge, and the active-change
      declaration replaces the current-source one, as for flows.
    status: open
    basis: static
    rejected:
      - option: A separate model list next to the graph.
        reason: Impact, get_flow and the concept page would read two sources of
          the same facts.
      - option: A node for each declaring source.
        reason: The concept list and get_concept would show one concept twice
          in a legacy artifact whose change copies the declaring document.
    risk_if_wrong: A participant of a version-source flow keeps a link to
      another node, and the concept page misses that flow; or the revision of
      a repository with an unused model changes and the flow index rebuilds.
    check: Run the model graph tests with an unused model and with the legacy
      fixture whose change copies the declaration, and compare the revision of
      this repository before and after the change.
  - id: model-origin-is-entity
    kind: decision
    statement: An Impact model origin starts at the model entity, not at its
      declaring document.
    status: open
    basis: static
    rejected:
      - option: Keep the declaring document as the origin of a model.
        reason: Every model declared in the same document then shows as
          affected, so "What does Version affect?" names Artifact and Change.
    risk_if_wrong: An agent that used a model origin to find the dependents of
      the declaring document gets fewer items.
    check: Run the impact tests for a model origin with two models in one
      declaring document; only the origin model and its dependents are direct.
  - id: inferred-code-rule
    kind: decision
    statement: The code and tests of a concept are the implementation and test
      supports of the steps that have an interaction whose from or to is a
      participant of the concept.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/specifications/concept-pages.md#facts-observed-on-0eecce1
    rejected:
      - option: The supports of every step of each flow that uses the concept.
        reason: Repository snapshot would then list the code of steps where it
          takes no part, such as project selection.
    risk_if_wrong: The page lists code that does not implement the concept, or
      misses code that does.
    check: Compare the counts of the four models in this repository with the
      observed facts.
  - id: affect-action-ships
    kind: decision
    statement: Every concept page shows the action "What does <title> affect?",
      because the CPA13 test finds an Impact entity that the page does not
      list.
    status: open
    basis: inferred
    rejected:
      - option: Show the action only on concepts whose Impact adds an entity.
        reason: The page would compute Impact before it shows its header, and
          the action would appear and disappear between concepts.
    risk_if_wrong: On some concepts the action shows only potential items that
      come from word matching.
    check: Run the CPA13 fixture test after claim model-origin-is-entity is
      implemented, and run the same comparison on Version and Repository
      snapshot in this repository.
  - id: participation-diff
    kind: decision
    statement: A changed participation is a difference in the participants of a
      flow, or in the interactions that name one of its participants, between
      the base and the head of the change.
    status: open
    basis: static
    rejected:
      - option: Count any change of a step where the concept takes part.
        reason: Commit 89ed23a adds a support to such a step and changes no
          participation; the brief would name Version without reason.
    risk_if_wrong: A moved or renamed flow file shows as a removed and an added
      participation.
    check: Run the brief tests on the fixtures built from commits 89ed23a and
      3c47a48, and on a fixture that renames a participant.
  - id: sidebar-enter-unchanged
    kind: decision
    statement: Enter in the sidebar search keeps the 1.24.0 rule and opens the
      first matching row in tree order; concept rows come first under their
      artifact.
    status: open
    basis: static
    rejected:
      - option: Enter opens an exact title match first.
        reason: It changes the result of Enter for documents in repositories
          without models, which CP1 forbids.
    risk_if_wrong: The query change opens the first change in progress, because
      every change name starts with change-, not the concept Change.
    check: Run the S1 to S8 scenarios and the sidebar test with the queries
      version and change.
  - id: back-moves-active-tab
    kind: decision
    statement: Each browser Back press moves the active project tab one page
      back while its trail is not empty, and changes no page otherwise.
    status: open
    basis: static
    rejected:
      - option: URL routes for each page.
        reason: The owner excluded URL deep links from this change.
      - option: A history entry that names its tab and its trail index.
        reason: All tabs share one browser history, so entries of another tab,
          the trail cap of 50, Forward and a reload leave Back presses that do
          nothing.
    risk_if_wrong: After a tab switch, a Back press uses an entry of the other
      tab, so the browser leaves the workbench one press early or late.
    check: Run the Back tests with two project tabs, after a worktree switch,
      after 51 pages and after a reload.
  - id: golden-captures
    kind: decision
    statement: A script captures the text and control names of the 1.24.0 pages
      once from a 0eecce1 checkout and commits them as JSON; the CP1 test
      compares the new build with that JSON.
    status: open
    basis: static
    rejected:
      - option: Pixel screenshots.
        reason: Fonts and the browser version change pixels; CI and local
          browsers differ.
      - option: Build 0eecce1 inside the test.
        reason: CI checks out one commit only, and the test server serves one
          build.
    risk_if_wrong: A visual change without a text or control change passes the
      check.
    check: Change one label in a scratch build and confirm that the capture test
      fails.
---

# Concept pages contract

## Scope

This contract adds concept facts to the Plane. A concept is a model that a specification declares in its `models` front matter key. The UI word is concept; the record word stays model. The contract adds no record key, and unknown model keys stay ignored.

Wave 1 delivers the graph, the concept operations, the concept page, the links on existing pages, browser Back and the MCP facts. Wave 2 delivers the brief, the PR description and the sidebar search.

This change also edits two specifications in place: specifications/change-impact.md (model origins) and specifications/agent-integration.md (the server instructions and the additive tool results).

## Facts observed on 0eecce1

Method: a read-only Node script imported the 1.24.0 server modules, called readFlowRepository on this repository with knowledge planning, and called createImpactService with depth 2. Limits: one repository, one revision, and Impact as it is before claim model-origin-is-entity.

- 4 models: artifact-driven Artifact, Change and Version in specifications/domain-model.md, and artifact-plane Repository snapshot in specifications/domain-model.md. Every model is named by a participant, so every model has a graph node today.
- With the rule of claim inferred-code-rule: Version has 7 code files and 4 test files; Repository snapshot 10 and 7; Artifact 2 and 0; Change 5 and 4.
- Impact with the origins Version and its two describing documents names Artifact, Change, Version and 5 flows: change-delivery, unit-validation, version-publication, dependency-gates and repository-exploration. Artifact and Change come from the shared declaring document. The describing document knowledge.md also describes Artifact and Change.
- Impact with the origins Repository snapshot and its two describing documents names no declared entity that the concept page does not list. Its potential tier holds 10 items from word matching.
- Every Impact model item has the title null.

## Graph

- buildFlowGraph (server/flow-model.js) adds one model node for each logical id of the selected knowledge. The selection follows flows: the current source of the artifact and, in planning mode, its active change, whose declaration replaces the current one. With knowledge `all`, the same precedence picks one declaration for each logical id.
- A participant that resolves to another source of the same logical id links to the selected node.
- The node adds the field `missingSources`. The get_flow graph nodes and the records rows of the flow index show it.
- The declaring document gets an element node with the document title, and the graph gets the edge `declares` from the model to that element. flowImpact walks `declares` as it walks `describes`.
- The diagnostic `missing-model-source` adds the fields `model` (the logical id) and `file`. Only the declaration that the graph selects gives the diagnostic. Its message and code stay.

## Impact

- server/impact.js keeps the title of a model node when a participant creates the node first.
- A model origin accepts the forms `artifact:model` and `model:artifact:model`. It starts at the model entity (claim model-origin-is-entity). specifications/change-impact.md states this rule.
- The UI path labels `declares model` and `describes model` stay; a path step to a model shows its title.

## Concept operations

POST /api/flows/query takes two new operations. They read `record.graph` and `record.snapshot`. The flow reader adds `baselines` to its record, so the operations can read protected blobs.

`concepts` takes `artifact` (optional) and returns `concepts`, sorted by artifact and title. Each item has:

| Field | Value |
| --- | --- |
| `logicalId` | `artifact:model` |
| `entity` | `model:artifact:model` |
| `title`, `description`, `artifact` | From the declaration. |
| `declaredIn` | `{path, title}` of the declaring document; the title comes from the snapshot element. |
| `sources` | `[{path, title, missing}]` of the describing documents. |
| `declaration` | `new`, `changed`, `removed` or null. |

The declaration base is the merge base of the protected ref and HEAD of the selected worktree. On the protected branch, and for an artifact without a baseline, `declaration` is null. An entry differs when its title, description or sources differ. `removed` items come from the base blobs of the declaring documents; they have no flows and no page.

`concept` takes `concept`: an identity, an entity or an exact title, case-insensitive. It returns the item of `concepts` plus:

| Field | Value |
| --- | --- |
| `flows` | `[{flow, title, artifact, participant, requires, interactions[{step, stepTitle, from, to, action}]}]`; from and to are model titles when the participant resolves. |
| `implementation` | `{basis: 'static', inferred: 'in the steps of these flows', groups[{flow, flowId, steps[{step, stepTitle}], artifact, code[{path, sourceId}], tests[{path, sourceId}]}]}` by the rule of claim inferred-code-rule. Steps of one flow with the same files form one group. |
| `branchChanged` | `[{path, title}]` of the declaring and describing documents that differ from the declaration base. |
| `changes` | `{open[{artifact, change, title}]}` of the owning artifact, from the snapshot. |
| `diagnostics` | The graph diagnostics whose `model` and `file` are those of the concept. |

An unknown concept gives the diagnostic `concept-unknown` with the message `No concept <query> is declared in the selected knowledge.` Several title matches give `concept-ambiguous` with `candidates`. Both have severity info, and they stay out of the graph diagnostics.

## Concept page

The page kind is `concept`: `{kind: 'concept', artifact, model, focus?}`. `focus` is `flow:<logicalId>`; that flow row opens on arrival. `model` joins the keys of samePage (src/work-model.js) and pageKey (src/main.jsx).

The page column is 880 px. Top to bottom:

1. Eyebrow: the artifact title as a link, then ` / Concept`.
2. H1: the title. The DiffBadge `New` follows when `declaration` is `new`.
3. Header action, quiet: `What does <title> affect?`. It opens Impact with the origins `{model}` and the describing documents, and the context title `<title>`.
4. Lead: the description.
5. Meta line, muted: `Described in <document> · <document>`, as document links.
6. A Notice of tone error for each diagnostic of the concept, with the link `Fix in <declaring document>`.
7. Branch line, muted, when `branchChanged` is not empty: `Changed on this branch: <document>, <document>.`, then `Open change in <artifact>: <change title>` for each open change of the artifact.
8. Section `Flows N` when the concept has flows. Each row is a toggle button with aria-expanded: the flow title, the muted artifact title when it is another artifact, and a second line with `requires`. One row opens at a time. An open row shows `Role: <participant> · Open flow`, where Open flow is a link, and one line for each interaction: the step title as a link to the flow page, then `— <from> → <to>: <action>`.
9. Without flows: the muted line `No flow uses <title> yet.` in place of items 8 and 10.
10. A closed details element with the summary `Code and tests in the steps of these flows · N code files, M test files` and the KindTag `static`. `no test file` and `no code file` replace a zero count. It opens to the groups of `implementation`: a heading with the step links, the muted `<flow title> · <artifact>`, and Code and Tests lists of links to the source page through that flow. The footnote reads `Inferred from the steps where <title> takes part. Not declared on the concept.`
11. Closing line, muted: `Declared as a model in <declaring document>.` It is absent when item 6 shows.

`Loading concept…` shows while the operation runs. An unknown concept shows its diagnostic text and the eyebrow link only.

## Existing pages

| Page | Change |
| --- | --- |
| Artifact | A section `Concepts N` after Flows and before Versions, only when `concepts` for the artifact is not empty and not only removed. Rows use the doc-list with a title and a muted detail: the first sentence of the description, on one line at 1440 px. `Show all N concepts` shows above 5 rows. The section has no New action. |
| Document | A Prop `Concepts` after Kind, only for a declaring or describing document: `Declares <names>` and `Describes <names>`. Each name links to its concept page. A `new`, `changed` or `removed` declaration adds its DiffBadge. A removed name is plain text. |
| Flow | In the Model section, the model title of a resolved participant is a link to its concept page with the aria-label `Open concept <title>`. The line order, the heading and the text of an unresolved participant stay. |
| Impact | KIND_NAMES gives `concept` for a model. entityLabel uses the title. pageFor gives the concept page. The detail shows the link `Open concept` and no entity path line. |

## Browser Back

- go() calls history.pushState when it pushes a trail entry, with the state `{plane: true}`. go() pushes a returnFocus entry only when it pushes a trail entry. A replacement in place calls history.replaceState.
- The active ProjectExplorer handles popstate: when its trail is not empty, it runs back(); otherwise it changes no page. A Forward press changes no page.
- When leave() refuses, the handler pushes `{plane: true}` again, so the browser position stays.
- resetRoute() writes no history entry.
- Discover writes its submitted query into its page object (`query`) with go() in place. DiscoverPage searches again when `page.query` is a nonempty string that differs from its current search. `query` stays out of pageKey, so a submit keeps focus and the TopBar entry keeps the results.
- The change page writes its open brief rows into its page object as `brief`, the list of open questions; an absent `brief` means the 1.24.0 default.
- No Back control is added.

## Change brief

The brief adds `concepts` to the brief object; the schema name change-brief.v1 stays. For the origin `delivery-commit`, the head is the delivery commit and the base is its first parent. For `protected-diff`, the head is the selected worktree with its uncommitted bytes and the base is the merge base, or the protected tip when Git gives no merge base. The concepts come from these two reads, so they exist when the Impact answer is unavailable.

Each item of `concepts` is `{concept, title, reason, document, flow?}`. The answer items of "What is affected?" add `{concept, document, flow?}` to the item shape. The reasons:

| Reason | When | Row text | Reason words |
| --- | --- | --- | --- |
| `declaration-new` | A model entry exists at the head and not at the base. | `<title> — new declaration in <document>` | `new declaration` |
| `declaration-changed` | Title, description or sources differ. | `<title> — declaration changed in <document>` | `declaration changed` |
| `declaration-removed` | A model entry exists at the base and not at the head. | `<title> — declaration removed in <document>` | `declaration removed` |
| `participation-changed` | Claim participation-diff. | `<title> — participation changed in <flow title>` | `participation changed in <flow title>` |
| `describing-document-changed` | A describing document differs and the declaration does not. | `<title> — describing document changed: <document>` | — |

A changed declaring document with equal entries gives no row. The rows come first in the items, with the step `Fact from Git`. The UI links the concept, except a removed one, and the document. Concept rows never enter the attention list.

The summary of "What is affected?" starts with a prefix for the first four reasons, in this order: `New concept: <titles>.`, `Changed declaration: <titles>.`, `Removed concept: <titles>.`, `Participation changed: <titles>.` Each part takes the plural form for more than one title and lists at most 3 titles, then `and N more`. Without Impact data, the summary is the prefix alone.

The PR description (server/change-description.js) Impact section starts with the line `Concepts declared or changed: <title> (<reason words>); …` when a row of the first four reasons exists. The flow sentence without the prefix follows, then a blank line and the Coverage line, as in 1.24.0. Without Impact data, the concept line precedes the 1.24.0 fallback text. Describing-document rows give no line. The context packet copies the brief, so its brief holds `concepts`.

## Sidebar search

- ProjectExplorer loads `concepts` when the sidebar filter first has text, and keeps them for its worktree path and shell epoch.
- While the filter has text, matching concepts are level-1 rows under their artifact, before its kind rows, with the detail `Concept`. They match the title, the model id and the logical id. A row opens the concept page.
- After the tree, while the filter has text, the link `Find “<query>” in Discover behavior` opens `{kind: 'discover', query}`. It is outside the tree and a Tab stop. Enter in the search box does not choose it, and the text `Nothing matches this title or ID.` still shows above it.
- The input gets the title `Search or jump to… (/)` and aria-keyshortcuts `/`.
- The `/` key focuses the input of the active tab when focus is not in an input, a textarea, a select, an editable element or an open form. At 800 px or less it opens the drawer first.
- Enter keeps the rule of claim sidebar-enter-unchanged. No other key changes.

## MCP

- New read-only tool `get_concept`, registered on its own with `{path, worktree, knowledge, concept}`. It returns the concept operation answer with freshness and completeness. The default tool count goes from 12 to 13.
- `search_flows` takes `kinds`, a list of `flow` and `concept`. Without `kinds`, the data and pagination are the 1.24.0 ones; `kinds` enters the cursor selector digest only when it is present. With `concept` in `kinds`, `data.concepts` holds all matching concept items, not paged, ranked by exact identity, then exact title, then a title substring, then a description substring; an empty query lists all concepts, and `data.totals.concepts` gives their count. With `kinds` that omit `flow`, `data.flows` is empty and `total` is 0.
- `get_flow` participants add `concept` (the logical id) and `title` when they resolve.
- The server instructions add the line `Concepts: get_concept; search_flows with kinds.`; specifications/agent-integration.md shows the block.

## Wording

The strings that this change adds say concept for people and model for records. A model is declared in one document and described in its sources. New strings never say defined, definition or related. The basis of an inference shows once on its group, never on each row.

## Validation

- CP1: a script builds 0eecce1 from a checkout outside the worktree, serves it with its own server, and captures a fixture without models at 1440 and 390 px. It records the main text, the sidebar and the top bar, with an empty filter and with the filter `sign`, and the visible control names. The fixture has a fixed root name and fixed Git dates. The script commits the JSON. The test captures the new build the same way and compares; the allowed differences are the input title, aria-keyshortcuts and the Discover link while the filter has text.
- The brief tests use fixture repositories built after commits 89ed23a and 3c47a48: a support added to a step where a concept takes part, and an edit of a describing document. A run on this repository is task evidence, because CI has no history.
- Layout tests on the new and changed pages: one h1, unique accessible names, no interactive content in a summary or a button, and no horizontal scroll at 390 px.
- A parity test renders the Version concept page of a fixture and maps each visible fact to a `concept` answer field.
- The reading scenarios S-A to S-F of the approved design are measured with test/browser/measure.js as a new baseline. S1 to S8 keep their limits.

## Specification self-check

Each requirement has a section: CP1 Validation; CP2 to CP5 Concept page and Concept operations; CP6 Graph (diagnostic fields) and Concept page item 6; CP7 to CP9 Existing pages; CP10 Graph, Impact and Existing pages; CP11 and CP12 Change brief; CP13 and CP14 Sidebar search; CP15 Browser Back; CP16 to CP18 Concept operations and MCP, including the get_flow participant concepts; CP19 claim affect-action-ships; CP20 the unchanged behavior rules in each section. A check of this contract against the code found 30 problems; this version resolves them. Changes from the approved design: the flow Model line keeps its order and heading, because browser tests assert them; the Concepts section sits before Versions, which is always last; Enter keeps its rule; the H1 marks only a new declaration. Nine claims: two are supported by the observed facts, seven are open, and the Plan checks each. KISS: no record key, store, index or route style; two operations reuse the flow service. STE: one rule in each item or row. No blocker prevents Plan.
