---
tasks:
  - 14-task-graph-reader.md
  - 15-task-graph-interface.md
  - 16-task-graph-validation.md
---

# Task graph exploration plan

Baseline: established 1.4.0. Tasks 01–13 remain historical evidence and are excluded. The format is proposed by artifact-driven/change-implementation-task-dag, element specifications/task-dag.md.

## Execution

1. [Read and validate task graphs](14-task-graph-reader.md).
2. [Display task graphs and details](15-task-graph-interface.md), after task-graph-reader.
3. [Integrated acceptance and publication](16-task-graph-validation.md), after task-graph-interface.

Execute sequentially in the current capable session or assigned implementer sessions. UI work consumes the additive reader response, and browser checks consume the integrated UI. Coordinator retains ownership of artifact updates. This chain does not justify parallel worktrees.

## External gate

All Plane implementation waits for the ADD task contract to establish on main. Resolve the current upstream version, compare its specifications/task-dag.md with the proposed contract used here, and repeat affected self-checks before execution. A material contract or plan amendment requires renewed approval. dependencies.yaml proposes the required artifact dependency; established roots and dag.yaml remain unchanged during preparation.

## Coverage and publication

Reader covers P2/P4/P5 and all metadata fixtures. Interface covers P1–P5. Integrated validation covers navigation, refresh, scope/DoD/evidence rendering, graph diagnostics, existing behaviors, safety, and responsive layouts. Run npm test, npm run build, and npm run test:browser in apps/artifact-plane. Required capabilities include Chromium; report an unavailable browser instead of claiming acceptance passed.

After passing DoD, propose Plane 1.5.0 for user confirmation because the read-only explorer adds a view and additive response fields. Prepare the full snapshot, package version, established dependency declarations and generated index consistently on its branch. Open the companion PR linking the merged ADD contract. Stop for team merge; no deployment or auto-merge.

## Plan self-check

All P requirements have concrete tasks and checks. Graph: task-graph-reader -> task-graph-interface -> task-graph-validation. IDs and paths resolve, no cycle exists, and copied tasks are excluded. Proposed artifact-plane depends on artifact-driven; no reverse edge or cycle exists. KISS reuses YAML, dagre, React Flow, Markdown sanitization, and existing tests. STE preserves uncertainty and gates. Plan is complete and awaits explicit user approval.

## Preparation checks

A local Node check verified declared task paths, unique IDs, resolved prerequisites, acyclicity, and exclusion of historical tasks for both plans. All 31 Markdown links in the two complete change snapshots resolve and do not link to ancestors. git diff --check passed. Implementation checks have not run.

## Integrated result

ADD 1.1.0 is established and the upstream contract recheck passed. Implementation passed 60 Node tests, the production build, and all 10 Chromium acceptance cases. Desktop/narrow screenshots and repository/Git fingerprints passed review. The user confirmed Artifact Plane 1.5.0. The complete snapshot and dependency declarations on this branch prepare the release; it remains proposed until team merge.
