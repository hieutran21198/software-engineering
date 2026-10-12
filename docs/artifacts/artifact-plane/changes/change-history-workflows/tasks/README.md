# Change histories and workflow evidence plan

The complete 1.1.0 snapshot is the baseline. Implement in apps/artifact-plane after explicit approval. No upstream artifact implementation prerequisite exists.

## Current tasks

1. [Separate current knowledge and change histories](06-change-histories.md).
2. [Read local worktree and workflow evidence](07-worktree-evidence.md).
3. [Display workflow evidence and validate integration](08-workflow-view.md).

Execute sequentially in the current session. Tasks share reader/model/UI contracts; extra branches or abstractions would add coordination cost. Coordinator owns artifact changes. Task 08 depends on tasks 06 and 07. No background agent is part of the application.

## Governing elements

Requirements 16–20 and B11–B14 in requirements/explorer.md, Histories and worktree evidence contract in specifications/explorer.md, and decision 002-derived-workflow.md in this change govern the work. Contract-Driven Development fixes the API first; BDD supplies behavior examples; targeted regression tests and existing CI validate the result.

## Historical tasks

- [Initial reader](01-reader.md)
- [Initial canvas](02-interface.md)
- [Initial validation](03-validation.md)
- [Grouped records](04-element-order.md)
- [Inspector sizing](05-resize-inspector.md)

Their copied evidence does not validate this change. Preserve valid records; do not copy Git hashes into knowledge files.

## Integration and delivery

Run Node tests, production build, and Chromium browser tests. Inspect history and workflow views visually. Verify inspected worktrees remain unchanged. Check documentation hierarchy. After DoD passes, propose a compatible minor version and request confirmation. Prepare a full snapshot, root README, and DAG; push the dedicated branch and open a review PR. Stop for team merge.

## Plan self-check

Tasks cover grouping, active declarations, worktree enumeration, bounded commit provenance, baseline comparison, uncertainty, UI, and read-only checks. No new database, framework, dependency, execution control, or persistent state is required. KISS retains plain functions and existing tools. STE names concrete evidence and failures. Implementation awaits user approval.
