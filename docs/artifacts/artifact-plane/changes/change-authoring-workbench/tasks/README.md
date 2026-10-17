---
tasks:
  - 01-knowledge-writer.md
  - 02-artifact-change-operations.md
  - 03-plan-unit-version-operations.md
  - 04-flow-operations.md
  - 05-git-lifecycle.md
  - 06-edit-interfaces.md
  - 07-workbench-shell.md
  - 08-document-editing.md
  - 09-change-unit-pages.md
  - 10-flow-page.md
  - 11-scenario-benchmarks.md
  - 12-integration-publication.md
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/changes/change-authoring-workbench/tasks/README.md#plan-self-check
---

# Authoring workbench implementation plan

Twelve fresh tasks deliver the knowledge editing contract and the authoring workbench contract in apps/artifact-plane. The server tasks and the shell task are independent and can run in parallel in separate worktrees; the page tasks need the interfaces and the shell; the scenario and integration tasks join everything.

1. [Knowledge writer](01-knowledge-writer.md): contained, atomic, digest-checked writes with front-matter and section editing, journal and undo.
2. [Artifact, change and document operations](02-artifact-change-operations.md): create artifact, set dependencies, start change, add, save, delete and configure documents, references and self-checks.
3. [Plan, unit and version operations](03-plan-unit-version-operations.md): tasks, DoD items, evidence, plan self-check, units, version preparation, publication review, migration and undo.
4. [Flow operations](04-flow-operations.md): create flows and edit steps, transitions, support, gaps and exclusions.
5. [Git lifecycle](05-git-lifecycle.md): status, branch creation, knowledge commits and discard with protection rules.
6. [Edit interfaces](06-edit-interfaces.md): HTTP routes, opt-in MCP write tools and parity tests.
7. [Workbench shell](07-workbench-shell.md): source bar with branch control, navigation tree, page router, work page, graph page and responsive layout.
8. [Document editing](08-document-editing.md): document page with editor, properties, references, self-check, conflict handling and undo.
9. [Artifact, change and unit pages](09-change-unit-pages.md): artifact actions, change tabs with plan editing, review, commit, version preparation and publication review, and the unit page.
10. [Flow page](10-flow-page.md): structured flow editing with the graph toggle and the advanced front-matter editor.
11. [Scenario benchmarks](11-scenario-benchmarks.md): S1–S8 browser scenarios with action counts, round-trip and validation checks, keyboard and width coverage, label corrections.
12. [Integration and publication](12-integration-publication.md): combined suites, documentation, flow record evidence, measurements and the 1.16.0 version preparation.

## Sequence and parallelism

Tasks 1, 5 and 7 start together. Tasks 2, 3 and 4 follow task 1 and can run in parallel. Task 6 joins 2–5. Tasks 8, 9 and 10 follow 6 and 7 and can run in parallel; task 10 also needs task 4. Task 11 joins 8–10, and task 12 closes. A usable MVP exists after tasks 1–9 and 11, covering scenarios S1–S3 and S5–S8; task 10 completes S4. Parallel implementers use separate worktrees and branches; the coordinator integrates onto the change branch and records evidence.

## Coverage

| Requirement | Tasks |
| --- | --- |
| W1 shell and navigation | 7 |
| W2 unified read and edit | 8 |
| W3 operations | 2, 3, 4 |
| W4 write safety | 1 |
| W5 validation before writing | 1, 2, 3, 4 |
| W6 Git lifecycle | 5, 9 |
| W7 review and readiness | 9 |
| W8 agent parity | 6 |
| W9 compatibility | 1, 6, 12 |
| W10 honest labels | 7, 9, 11 |
| W11 responsive and keyboard | 7, 8, 11 |
| W12 measurement | 11, 12 |

## Approval and prerequisites

Present this concrete plan for explicit user approval before implementation. Artifact-driven 2.5.0 supplies every referenced contract and is established on main, so no upstream version gates implementation. A material amendment requires renewed approval. The suggested version after validation is 1.16.0, a compatible minor version: editing is additive and the read interfaces do not change; the user confirms or overrides.

## Plan self-check

Twelve listed tasks with unique IDs and explicit prerequisites form an acyclic graph with two joins. Every requirement and acceptance criterion maps to at least one task with a concrete DoD. KISS keeps one writer, one service and page components over reused modules. STE keeps each DoD observable. No blocker prevents the approval request.
