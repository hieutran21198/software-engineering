---
id: task-graph-validation
depends_on: [task-graph-interface]
---

# Integrated acceptance and publication

## Scope and governing references

Repository: software-engineering. Own integrated regression checks, browser fixtures/screenshots, and coordinator-managed task evidence and release preparation.

P1–P5; specifications/task-dag.md; all applicable retained read-only/explorer requirements.

## Prerequisites

Task task-graph-interface must pass; upstream ADD contract remains established. Explicit user approval of this plan is required.

## Definition of Done

- [x] Run npm test, npm run build, and npm run test:browser in apps/artifact-plane. No required test is skipped or failing.
- [x] Browser checks cover fork/join, task Markdown/evidence, legacy/invalid/empty states, distinct worktree/change identities, return context, refresh, and current dependency/workflow/history behaviors.
- [x] Inspect desktop/narrow screenshots and verify fingerprints of repository files and Git metadata before/after exploration. Resolve acceptance failures and record actual evidence.
- [x] Validate proposed artifact/task DAGs, full snapshot coverage, documentation hierarchy, and upstream contract compatibility. After user version confirmation, prepare the consistent proposed release and companion PR; stop for team merge.

## Evidence

Integrated npm test passed 60 Node tests, npm run build passed, and npm run test:browser passed all 10 Chromium acceptance cases using the installed Chromium via PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. All three new task graph cases and seven existing cases passed. Desktop/narrow screenshots were inspected; read-only fixture fingerprints, safe Markdown, worktree scope, refresh invalidation, return/history context, diagnostic states, and existing navigation/inspector behaviors passed. Six links in the complete Plane change resolve without ancestor references; the three current task IDs and prerequisites resolve and are acyclic, with tasks 01–13 excluded. The proposed artifact-plane dependency on artifact-driven is acyclic. Established ADD 1.1.0 matches the prepared task contract. The user confirmed Artifact Plane 1.5.0. The complete snapshot matches the change, all 20 root/change/version links resolve without ancestor references, and the generated artifact DAG matches root declarations with no cycle. PR https://github.com/hieutran21198/software-engineering/pull/8 was updated with the implementation, complete proposed release, and companion merged ADD #7 dependency, then marked ready for team review. No merge, deployment, or establishment is claimed. KISS reuses existing libraries and checks; STE preserves evidence limits.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
