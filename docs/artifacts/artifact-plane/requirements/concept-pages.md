---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/concept-pages.md#requirement-self-check
---

# Concept pages

## Outcome

A person who reads a document, a flow, an Impact answer or a change brief reaches the concepts that the records declare, and learns what each concept means, where it is described, which flows use it and which code and tests are in those flows. An agent gets the same facts in one call. A repository that declares no model looks and behaves as in Artifact Plane 1.24.0.

## Need

Facts on 20 October 2026, Artifact Plane 1.24.0 at 0eecce1:

- A specification can declare models in its `models` front matter key: `id`, `title`, `description` and `sources`. Flow participants name a model. This repository declares 4 models in 2 files; 2 of 19 flows name participants.
- The flow graph has a model node only when a flow participant names the model (server/flow-model.js). A model that no flow uses is absent from the graph and from Impact.
- No page shows a model declaration. The document page shows model front matter only as raw YAML in the front matter editor. The flow page lists participants as plain text in its Model section.
- Impact rows of a model have no title and no destination: the server loses the title (server/impact.js), the row reads `Model <id>` and the detail has no Open link (src/impact-model.js).
- The change brief keeps only flow items in "What is affected?" and drops model items (server/change-brief.js). The PR description and the context packet copy the brief.
- The sidebar search matches titles and paths of changes, artifacts, documents and flows, not models. `search_flows` returns flows only. No MCP tool returns a model with its flows, code and tests.
- The workbench keeps a page trail but writes no browser history entry, so the browser Back button does not return to the previous page.
- The owner approved the research report, the UX mockups and the decisions in the change README on 20 October 2026.

## Requirements

- CP1: A repository with no declared model shows the same pages, controls and text as Artifact Plane 1.24.0, except the `/` key and the link from a sidebar search to Discover.
- CP2: Each declared model of the selected knowledge has one concept page. The page shows the title, the description, the documents that describe the concept, the document that declares it and the flows that use it.
- CP3: The concept page shows each flow with what the concept supplies in it. One action on a flow shows the interactions that name the concept, with links to their steps.
- CP4: The concept page shows the code and tests in the steps where the concept takes part only after one action. It labels them as inferred, not declared, and groups them by step and flow.
- CP5: On a branch, the concept page tells when the declaring or a describing document differs from the protected branch, and names the document. It never says that the meaning of the concept changed.
- CP6: When a model has a record problem, such as a missing source, the concept page shows the problem and the document to fix.
- CP7: The artifact page lists the concepts of the artifact with the first sentence of each description. An artifact without models shows no concept list.
- CP8: A document page tells which concepts the document declares or describes. On a branch, it marks a declaration that is new, changed or removed against the protected branch.
- CP9: The flow page links each resolved participant of its Model section to the concept page.
- CP10: Impact names a model row by its title and opens its concept page. A model that no flow uses is an Impact entity too.
- CP11: The change brief names the concepts that a change reaches, with the reason: a new, changed or removed declaration, a changed participation in a flow, or a changed describing document.
- CP12: The brief summary and the PR description name only declaration and participation changes. A changed describing document shows only in the expanded brief row.
- CP13: The sidebar search finds a concept by its title or identity and opens its concept page.
- CP14: While the sidebar search has text, a link opens Discover with the same query. The `/` key focuses the sidebar search.
- CP15: Browser Back returns to the previous page of the active project tab. The Discover query and the expanded brief row are kept.
- CP16: An agent gets one concept with its declaration, sources, flows, interactions, inferred code and tests, record problems and open changes in one MCP call, by identity or by exact title. `get_flow` names the concept of each resolved participant.
- CP17: An agent can ask `search_flows` for concepts. Without the new filter, `search_flows` answers as in 1.24.0.
- CP18: Each fact on the concept page has the same wording basis in the MCP answer.
- CP19: The concept page action "What does <concept> affect?" ships only if Impact for a concept and its describing documents holds an entity that the concept page does not list.
- CP20: The existing pages, MCP tools, HTTP interface, authoring scenario limits and record checks keep their behavior, except where CP1 to CP19 change them.

## Acceptance criteria

- CPA1: Golden text and control captures of the work, artifact, document, flow, change, Discover and Impact pages from a 1.24.0 build of a fixture with no model match the new build, except the differences that CP1 names.
- CPA2: A browser test opens the concept page of a fixture model: title, description, describing documents, declaring document and flows show; a flow row expands to its interactions with step links; Code and tests is closed and opens to groups by step and flow with the inferred label.
- CPA3: A browser test of a model that no flow uses shows the concept page with the line that no flow uses it, and no Code and tests section.
- CPA4: A browser test on a branch shows the changed describing document on the concept page, and a New mark on a new declaration in document Properties.
- CPA5: A browser test with a missing model source shows the problem on the concept page with the document to fix.
- CPA6: Browser tests show the artifact page Concepts list, the document Concepts property and the flow participant links; an artifact and a document without models show none of them.
- CPA7: A server test gives model Impact items a title, resolves a model that no flow uses as an origin, and a browser test opens the concept page from an Impact row.
- CPA8: Server tests of the brief give the reasons new, changed and removed declaration, changed participation and changed describing document. Commit 89ed23a gives no concept row; commit 3c47a48 gives describing rows only, and no PR concept line.
- CPA9: A browser test filters the sidebar with a concept title, sees the concept row, opens the concept page, and follows the Discover link with the same query. The `/` key focuses the search.
- CPA10: Browser tests return with browser Back from the concept page to Discover with its results, and to the change page with the expanded brief row.
- CPA11: An MCP test calls `get_concept` by identity and by exact title and gets the CP16 facts; an ambiguous title gives candidates. A parity test maps each concept page string to an answer field.
- CPA12: Server tests show that `search_flows` with the concept filter returns concepts, and that its data and pagination without the filter equal the 1.24.0 answer.
- CPA13: A server test compares the Impact entities of a fixture concept and its describing documents with the concept page facts and finds an entity that the page does not list. The action ships only while this test passes.
- CPA14: The existing Node, browser and Go suites, the authoring scenario limits S1 to S8, the executable smoke check and the knowledge validator pass.

## Affected artifacts and flows

Artifact Plane only. Flows: repository-exploration (overview and inspect: concepts in the overview and the concept page), change-impact (propagate and act: model entities and their destination), change-review (brief: concept rows), context-handoff (derive: concepts in the packet) and source-retrieval (discover: the concept filter and `get_concept`). The ADD bundle and the record formats are not changed.

## Requirement self-check

Each fact comes from the code at 0eecce1, the repository records or the owner's approvals in the change README. Each requirement states one need and is testable through CPA1 to CPA14. The page layout, the reason codes, the data API, the history handling, the search order and the ship rule of CP19 belong to Specification. KISS: one new page kind, no new record key, store or index; CP1 keeps a repository without models unchanged. STE: one rule in each item. No blocker prevents Specification.
