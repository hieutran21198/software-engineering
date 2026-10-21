---
tasks:
  - 01-golden-captures.md
  - 02-concept-graph.md
  - 03-concept-mcp.md
  - 04-browser-back.md
  - 05-concept-page.md
  - 06-page-links.md
  - 07-wave-1-review.md
  - 08-brief-concepts.md
  - 09-sidebar-search.md
  - 10-validation.md
compatibility: minor
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/README.md#plan-self-check
---

# Concept pages plan

Wave 1, the pages:

1. [Golden captures](01-golden-captures.md): the 1.24.0 captures of a fixture without models and their comparison test.
2. [Concept graph](02-concept-graph.md): one model node per concept, model origins, the concept query operations and their server tests.
3. [Concept MCP](03-concept-mcp.md): `get_concept`, the `kinds` input of `search_flows`, the participant concepts of `get_flow` and the instructions.
4. [Browser Back](04-browser-back.md): history entries for the trail, the Discover query and the open brief rows in the page object.
5. [Concept page](05-concept-page.md): the concept page, the Impact concept rows and the parity test.
6. [Page links](06-page-links.md): the artifact Concepts section, the document Concepts property and the flow participant links.
7. [Wave 1 review](07-wave-1-review.md): the integrated suites, the golden comparison and the owner's screenshot review.

Wave 2, the brief and search:

8. [Brief concepts](08-brief-concepts.md): concept reasons in the brief, the PR concept line and the brief row links.
9. [Sidebar search](09-sidebar-search.md): concept rows, the Discover link and the `/` key.
10. [Validation](10-validation.md): the flow records, the guides, the scenarios, the claims, the owner's review, the unit evidence and the version.

Tasks 01, 02 and 04 have no dependency and can run in parallel worktrees. Tasks 03 and 06 depend on 02 and can run in parallel. Task 05 depends on 02 and 04, because both change src/main.jsx and src/work-model.js. Task 07 joins wave 1. Tasks 08 and 09 depend on 07, so wave 2 starts only after the owner accepts the wave 1 screenshots; they can run in parallel. Task 10 depends on 08 and 09. The coordinator keeps the knowledge edits and tasks 07 and 10.

## Plan self-check

Every ID of requirements/concept-pages.md is in the `covers` of a task. The graph has ten tasks, no cycle and one end. Each DoD item names an observable check. Compatibility is minor: the change adds a page kind, two query operations, one MCP tool, one optional MCP input, additive result fields and one Impact origin rule; no existing route, tool input or record format is removed. The change of the model origin (claim model-origin-is-entity) narrows a result that only agents could request; specifications/change-impact.md states it. Two claims are supported and seven are open; tasks 01 to 10 check each. The validator reports open-change-conflict: branch feat/antigravity-support has the open change change-antigravity-support on artifact-plane, and the owner decided that this change merges first; change-antigravity-support renumbers its version. KISS: no record key, store, index or route style; one new page kind. STE: one check in each DoD item.
