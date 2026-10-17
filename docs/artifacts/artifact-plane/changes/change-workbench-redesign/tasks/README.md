---
tasks:
  - 01-read-titles.md
  - 02-style-and-shell.md
  - 03-work-page.md
  - 04-artifact-document-pages.md
  - 05-change-page.md
  - 06-unit-flow-pages.md
  - 07-browser-suites.md
  - 08-integration-version.md
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/README.md#plan-self-check
---

# Workbench redesign implementation plan

Eight fresh tasks rebuild the browser application of apps/artifact-plane to the authoring workbench contract and the approved mockups. The server operations, writer, Git actions and their tests do not change.

1. [Read titles](01-read-titles.md): optional element and change titles in the overview response.
2. [Style and shell](02-style-and-shell.md): one stylesheet with bundled fonts, the top bar, the sidebar, the page header, inline forms and the graph panel; removal of the source bar, tree, footer and old style sheets.
3. [Work page](03-work-page.md): open change cards, Start a change, New unit, uncommitted knowledge with commit, dependencies.
4. [Artifact and document pages](04-artifact-document-pages.md): artifact purpose, knowledge sections, versions, dependencies and migration; document text, properties and editing.
5. [Change page](05-change-page.md): phase steps, the plan table with inline task detail, changed knowledge, readiness, version preparation and publication review.
6. [Unit and flow pages](06-unit-flow-pages.md): unit changes, criteria and evidence, affected flows; flow trigger, outcome, steps, supports, gaps; the More menu pages.
7. [Browser suites](07-browser-suites.md): rewritten suites, the layout suite, the scenarios with 1.16.0 limits, keyboard and width checks, and the screenshot script.
8. [Integration and version](08-integration-version.md): the owner's screenshot review, combined checks, documentation, flow records, unit evidence and version preparation.

## Sequence and parallelism

Task 1 comes first because the shell and pages show titles. Task 2 follows. Tasks 3, 4, 5 and 6 then run in parallel in separate worktrees and branches; each owns its page files only. Task 7 joins them, and task 8 closes. The coordinator integrates the worker branches onto the change branch and keeps all knowledge updates.

Each page task includes a screenshot review against its mockup at 1440 and 390 pixels before its DoD is checked. Tests passing is not enough.

## Plan self-check

- Coverage: D1–D11 and B1–B8 of requirements/workbench-redesign.md, and every section of specifications/authoring-workbench.md, map to a task:
  - layout, top bar, sidebar, graph panel, visual style and labels → task 2;
  - read data additions → task 1;
  - the pages → tasks 3–6;
  - browser tests → task 7;
  - affected flows and version → task 8.
- The graph is valid: eight unique IDs, all prerequisites resolve, and there are no cycles.
- Each DoD item is observable by a test, a screenshot or a command.
- KISS: no server operation changes, one stylesheet, and no new framework.
- STE: short imperative DoD items.
- No blocker prevents implementation after approval.
