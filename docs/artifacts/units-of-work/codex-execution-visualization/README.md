---
unit_of_work: codex-execution-visualization
changes:
  - artifact: artifact-plane
    change: change-codex-execution
acceptance:
  - id: live-visibility
    criterion: Bound Codex attempts appear on task graphs with artifact identity, observed state, agent identity, and concurrent activity.
  - id: durable-history
    criterion: Execution context and observations remain inspectable after restart and implementation worktree removal.
  - id: integration
    criterion: Hook, storage, API, graph, browser, and read-only checks pass without changing ADD approval or establishment semantics.
    integration: true
  - id: visualization-clarity
    criterion: Unobserved completed tasks have honest labels and implementation canvases simplify redundant task edges without changing declared prerequisites or gates.
evidence:
  - criterion: live-visibility
    method: Run browser acceptance for artifact identity, state transitions, agents, concurrent branches, and reconnect behavior.
    result: passed
    source: docs/artifacts/artifact-plane/versions/1.7.0/tasks/24-runtime-graphs.md#evidence
  - criterion: durable-history
    method: Run restart and removed-worktree fixtures plus archived browser navigation.
    result: passed
    source: docs/artifacts/artifact-plane/versions/1.7.0/tasks/21-runtime-store.md#evidence
  - criterion: integration
    method: Run integrated Node, build, Chromium, repository fidelity, and installed hook discovery checks.
    result: passed
    source: docs/artifacts/units-of-work/codex-execution-visualization/README.md#combined-checks
  - criterion: visualization-clarity
    method: Run graph projection checks and screenshot-specific browser acceptance in both graph views.
    result: passed
    source: docs/artifacts/artifact-plane/versions/1.7.0/tasks/26-visualization-clarity.md#evidence
---

# Codex execution visualization

## Deliverable outcome

Artifact Plane visualizes observed Codex execution on implementation DAGs and retains its history.

## Included scope

Local hook adapter, explicit task binding, observation persistence, live browser updates, artifact labels, task state/agent display, concurrent branches, and archived graph context.

## Excluded scope

Agent launching/control, automatic approval/DoD verification/merge, remote multiuser hosting, arbitrary desktop-session attachment, transcript parsing, and legacy execution-history migration. Artifact lanes are optional; artifact labels and concurrent DAG branches are required.

## Member changes

Artifact Plane adds observation and visualization against established ADD contracts. No new upstream version is required.

## Validation evidence

Shared acceptance checks passed; detailed evidence lives in the proposed 1.7.0 snapshot. Member establishment still awaits required team merge.

## Combined checks

At apps/artifact-plane, npm test passed 103 Node tests, npm run build passed, and npm run test:browser passed all 15 Chromium cases. System Chromium was selected through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH; browser runtime state was isolated outside the fixtures. Root GOCACHE=/tmp/software-engineering-codex-go-cache go test ./... and go vet ./... passed.

The integrated fixture covers hook reporting, durable observation writes, SSE updates, concurrent nodes, permission waits, returned execution, explicit validation, interruption/failure/Unknown states, offline/online recovery, preserved graph selection/viewport, and archived graphs after worktree removal and reload. Repository fingerprints remain unchanged. Wide/narrow/archived screenshots were inspected and layout spacing was corrected.

Installed Codex 0.160.1 discovered all ten configured hooks with no warnings/errors in a disposable CODEX_HOME. Hooks remained untrusted; no live model turn ran. Actual activation requires the user's /hooks review and explicit task binding. No global configuration or trust settings changed.

Version 1.7.0 is user-confirmed and proposed on this branch. No establishment or completed outcome is claimed before all required merges.

## Review handoff

[PR #12](https://github.com/hieutran21198/software-engineering/pull/12) proposes Artifact Plane 1.7.0 with both knowledge and implementation in this repository. Shared checks are documented above. Team review and merge remain required; no unit completion or version establishment is asserted.

## Visualization correction checks

The user requested and approved the two screenshot corrections. 105 Node tests and the build passed. All 15 existing browser cases passed; the additional browser case verified both view toggles, exact inspector declarations, unobserved complete checklists, and read-only fingerprints. Its initial test-only ambiguous selector was corrected and the focused case passed. The proposed snapshot now includes task 26. No established snapshot or execution prerequisite was changed.
