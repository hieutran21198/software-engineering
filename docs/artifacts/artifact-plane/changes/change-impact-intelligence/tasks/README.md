---
tasks:
  - 01-impact-index.md
  - 02-impact-service.md
  - 03-interfaces.md
  - 04-impact-page.md
  - 05-entry-points.md
  - 06-flow-reads.md
  - 07-browser-suites.md
  - 08-integration-version.md
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/README.md#plan-self-check
---

# Change impact intelligence implementation plan

Eight fresh tasks implement the change impact service contract in apps/artifact-plane. The knowledge writer, Git actions and the existing readers' semantics do not change.

1. [Impact index](01-impact-index.md): the derived relations in impact-index.sqlite with incremental updates and the parsers.
2. [Impact service](02-impact-service.md): origin resolution, typed propagation, tiers, explanations, coverage, compact text, the rule tests and the nine-case benchmark.
3. [Interfaces](03-interfaces.md): POST /api/impact/query, the MCP tool, the delegating impact operation and tool, and the packet field.
4. [Impact page](04-impact-page.md): the Impact view with its sections, filters, expansion, detail panel and focused graph.
5. [Entry points](05-entry-points.md): the change, document, flow and More entry points and the flow diagram highlight.
6. [Flow reads](06-flow-reads.md): the discovery score cutoff, no embedding on detail, source and impact, the diagram from the document, one repository read per query.
7. [Browser suites](07-browser-suites.md): the Playwright suites and the screenshot script for the owner's review.
8. [Integration and version](08-integration-version.md): the owner's review, combined checks, benchmark evidence, flow records, documentation, unit evidence and the version record.

## Sequence and parallelism

Task 1 comes first; task 2 follows. Tasks 3 and 6 then run in parallel in separate worktrees; task 6 can start at any time because it touches flow-index.js, flow-reader.js and the flow page only. Task 4 follows task 3, task 5 follows task 4, task 7 joins tasks 5 and 6, and task 8 closes. The coordinator integrates the worker branches onto the change branch and keeps all knowledge updates.

Implementation of tasks 2 to 8 waits for artifact-driven 2.8.0 to establish, or merges in one pull request with it as earlier combined deliveries did. Task 4 includes a screenshot review against the research mockup at 1440 and 390 pixels before its DoD is checked.

## Plan self-check

- Coverage: I1 to I12 of requirements/change-impact.md and every section of specifications/change-impact.md map to a task: Index to task 1; Query to task 2; Interfaces to task 3; Impact view to tasks 4 and 5; Discovery and flow reads to task 6; Validation to tasks 2, 7 and 8. The unit criteria accuracy and performance resolve through the benchmark evidence of task 8; usability through the owner's review in task 8; interfaces through task 3; explanation through task 2; integration through task 8.
- The graph is valid: eight unique IDs, all prerequisites resolve, and there are no cycles.
- Each DoD item is observable by a test, a measurement, a screenshot or a command.
- KISS: one new index file, one service, two parser dependencies, reuse of the handler, the MCP server and the graph panel.
- STE: short imperative DoD items with named thresholds.
- Upstream: the artifact-driven contract is proposed on the same branch; its establishment is an Implementation gate, not a Plan blocker.
