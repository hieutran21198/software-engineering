# Workflow history controls and toolbar

## Scope and contracts

Repository: this repository. Location: apps/artifact-plane/src/workflow-canvas.js, src/Workflow.jsx, src/main.jsx, and src/style.css. Requirements 24–27 and B17–B18 in requirements/explorer.md, and Workflow history and navigation contract in specifications/explorer.md govern this task.

## Prerequisites

Task 11. User-approved plan.

## Work

Add closed history groups and closed individual changes, sort by commit recency, keep selection independent of visibility, rename the switcher, and center it consistently.

## Definition of Done

- [ ] Histories expand and collapse independently; newest timestamps sort first, nulls last, ties deterministic; hidden selection preserves its evidence; six-phase connections remain correct; Dependencies / Workflow stays centered at fixed desktop width and usable at narrow width.

## Self-check

Scope and checks cover the governing contract. KISS retains existing tools. STE preserves evidence limits. Implementation evidence is pending.
