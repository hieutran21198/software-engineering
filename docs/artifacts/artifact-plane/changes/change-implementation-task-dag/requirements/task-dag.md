# Task graph exploration requirements

## Need and scope

Users need to inspect implementation order and independent work inside an ADD change. ADD owns the format. This change consumes the proposed task contract from artifact-driven/change-implementation-task-dag.

## Required outcomes

P1. Selecting a change in Workflow provides an explicit action to inspect its task graph. Returning preserves change context.
P2. Show current plan tasks and prerequisite-to-dependent arrows, including disconnected and single-task graphs. Include historical tasks only when explicitly selected by the plan.
P3. Selecting a task shows its source, scope, prerequisites, DoD, and documented evidence. Evidence does not prove independent verification, approval, or running agents.
P4. Show malformed metadata, duplicate IDs, missing tasks or prerequisites, self-dependencies, and cycles. Invalid graphs never suggest valid execution order. Legacy plans show graph unavailable; empty plans show no planned tasks.
P5. Graphs remain local, read-only, and derived on refresh. Preserve worktree selection, histories, navigation, dependency views, evidence inspection, and narrow-layout usability.

## Acceptance

A fork/join plan shows independent nodes leading to integration and validation. Selecting a task exposes its Markdown and evidence. Returning preserves change context. Legacy, empty, partially invalid, cyclic, and duplicate-ID plans remain inspectable with diagnostics. Identical IDs in separate changes or worktrees do not collide. Repository and Git fingerprints remain unchanged.

## Impact and self-check

ADD supplies the upstream proposed contract. Implementation waits for establishment. KISS reuses local reading and graph libraries. STE separates task prerequisites, phase order, and evidence. No Requirement blocker remains.
