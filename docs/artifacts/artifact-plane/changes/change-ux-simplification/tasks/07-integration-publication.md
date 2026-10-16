---
id: integration-publication
depends_on: [focused-review]
---

# Validate the integrated outcome and prepare review handoff

## Scope and ownership

Coordinator owns final artifact/UoW knowledge and delivery evidence; implementation owner covers integrated apps/artifact-plane code, tests and README. Reconcile the inherited pending presentation proposal with current protected-branch and PR evidence before publication. Prepare a complete proposed version after checks and user version confirmation, retaining this change's fresh tasks; open a linked PR and stop for team review.

## Governing knowledge

UX1–UX11; all ux-simplification contracts, the eight affected flow specifications, unit shared acceptance and existing ADD publication rules.

## Prerequisites

Applicable DoD for focused-review must pass first. Explicit approval of this concrete plan and recheck of established ADD 2.1.0 are required. Preserve the inherited presentation baseline; no task authorizes editing established snapshots.

## Definition of Done

- [x] Integrated Node suite, complete Chromium suite and app production build pass on the combined revision; root Go tests/vet and website build pass for knowledge integration.
- [x] Actual screenshots and geometry at 390/700/851/1440 plus keyboard/resized-inspector checks verify first-screen hierarchy, source switching, reading/return, no overflow and all ten audit corrections.
- [x] Read-only fixture fingerprints, existing graph/runtime/review/flow/tab/update regressions and new delayed/malicious/partial/large-source cases pass; no history is removed or lifecycle inferred.
- [x] Knowledge checks verify the complete baseline, amended contracts, eight valid updated flows, one unit membership, acyclic fresh task DAG and safe links without ancestor destinations.
- [x] Record current commands/results and any failures in originating tasks and combined unit checks. Choose a user-confirmed compatible version (proposed 1.13.0); snapshot all resulting knowledge excluding tasks, with source_change: change-ux-simplification and delivery_tasks: change.
- [x] Check inherited 1.12.2 proposal/merge status, preserve its provenance and evidence, prepare consistent proposed root/DAG/package metadata, push the dedicated branch, create/attach the PR with base relationship explained, and stop without merge/deployment or establishment claims.

## Evidence

Validated on 2026-10-16 after the user approved the plan and compatible 1.13.0 proposal:

- `FLOW_MODEL_STATE=/tmp/plane-flow-model-state npm test` in apps/artifact-plane: 266 passed, zero failed or skipped, including installed-model inference.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/0fxasn1rwqc65s8y14ip1ym4hk2rxjwx-playwright-chromium/chrome-linux64/chrome npm run test:browser`: the full 69-case Chromium suite passed with default deadlines and no retries. Actual HTTP, multi-worktree, refresh, runtime, flow, review, project-tab and malicious-source fixtures retain their file/Git fingerprints.
- `npm run build` in apps/artifact-plane passed. Root `GOCACHE=/tmp/plane-ux-go-cache go test ./...` and `go vet ./...` passed. Website `npm run build` passed after a clean local dependency install.
- The nine new UX cases exercise source switching/failure/supersession, independent list disclosure and viewport return, contained links/forged callbacks, automatic completion failure/retry, compact setup/filtering, full/partial review and initial graph framing. Existing browser cases cover each preserved journey. Execution-history recovery has an additional failed-read → empty → recording case.
- Reader screenshots and no-overflow geometry cover widths 390, 700, 851 and 1440. Loaded document text is awaited before capture. Resize checks cover pointer/keyboard widths 240–640 and stacked layout. Reader opening focuses its navigation; return restores the originating row even when selection reconstructed that row. Generated screenshots were inspected as rendered files. Browser-tool policy denied manual localhost tab access after reboot; automated browser evidence does not imply a new manual usability study.
- Integration corrected non-Markdown source rendering, source removal/selection resets, initial graph framing, comparison source identity and a no-op comparison action before readiness. The task graph intermittently hid nodes/arrows before measurement; supplying its existing fixed layout dimensions at initialization uses the same mechanism as the unit graph. All three task-graph cases passed five consecutive repetitions (15 checks). Duplicate inactive flow source state/rendering was removed after reading moved to the main reader.
- Earlier failures included assertions for the removed worktree action/setup form/sidebar document body, a short-purpose resize fixture, a restored-project form race and an execution context ID/title mismatch. Tests now exercise the intended user journeys and preserve security assertions. Initial website failure came from symlinked dependency resolution; a clean install/build passed. Initial fixture fingerprint drift came from Git auto-maintenance; fixture commands disable automatic maintenance instead of weakening fingerprint checks.
- The audit's prolonged review Loading state was not reproduced on the clean server. Its original cause remains unproven. Current reads have cancellation, timeout and local retry; successful current and delayed/failure fixtures do not establish a cause for the earlier observation.
- Knowledge checks validate seven unique tasks, six acyclic edges, eight valid flow records, exact single-unit ownership, complete category snapshots with no copied tasks, safe existing links and no ancestor-page destinations. The release check found 47 byte-identical knowledge files, zero copied tasks, zero historical snapshot changes and 38 valid release links; the change check also resolves its 12 local links. No artifact edge changed; root declarations and dag.yaml still declare Artifact Plane → artifact-driven.
- Refreshed origin/main and all PRs: search/readability PR #25 is merged; the inherited presentation branch has no PR. This delivery includes its pending 1.12.2 commits and retained evidence against main. No established snapshot is rewritten. ADD 2.1.0 remains the established supplier. Root current_version remains 1.11.0 as approved; historical preparation text is retained. The 1.13.0 snapshot is a complete compatible proposal with source_change and delivery_tasks provenance.

KISS check: existing source services, React Flow and evidence derivations remain authoritative; obsolete duplicate source state is removed. STE check: source scope, partial comparison, unknown evidence and publication limits stay explicit. The dedicated branch is pushed and [PR #26](https://github.com/hieutran21198/software-engineering/pull/26) targets main with the inherited presentation base explained. The PR is attached to this chat. Team review and merge remain required. Checks, PR creation and a prepared version do not establish this outcome.
