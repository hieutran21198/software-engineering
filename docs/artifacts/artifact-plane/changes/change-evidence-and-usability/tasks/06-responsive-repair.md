---
id: responsive-repair
depends_on: [incremental-refresh]
evidence_records:
  - id: dod
    method: Reproduction probes, focused and full browser runs recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/06-responsive-repair.md#evidence
---

# Resolve the merged browser regressions

## Scope and ownership

Own src/panel-layout.js, relevant scoped styles/layout consumers and reading-controls/browser checks, plus the execution-history recovery fixture and affected recovery consumers if a product defect is reproduced. Diagnose before changing assertions.

## Governing knowledge

P6, P7; specifications/reading-controls.md; specifications/codex-execution.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [x] Reproduce or explain the PR #26 width-851 overflow failure with measured element bounds and trace evidence; inspect PR #27 failed-job details too.
- [x] At 851 pixels document width fits while canvas remains at least 300 pixels and panel content stays accessible; at 390/700 narrow controls work; at 1440 preferences restore.
- [x] Pointer/keyboard resize, reader alignment, long content and refresh preserve geometry. Do not hide inaccessible overflow or delete the meaningful assertion.
- [x] Reproduce PR #27 execution-history retry detachment. Validate automatic recovery and manual retry separately, hide empty history and restore navigation for new recordings; fix fixture synchronization or the evidenced product defect without arbitrary waits.
- [x] Run focused reading-controls, runtime recovery, resize and changed review/model browser checks; record remaining environmental limitations instead of claiming a pass.

## Evidence

Implemented on 16 October 2026 in a separate worktree by an implementer session (branch plane-responsive-repair from d09963e) and integrated by cherry-pick as "fix(artifact-plane): resolve merged responsive and recovery browser regressions". Files: src/style.css, test/browser/reading-controls.spec.js, test/browser/runtime.spec.js.

- Width-851 overflow (PR #26 and #27 CI) is a product defect. Measured right after a resize from 1440 to 851 pixels, the grid sometimes stayed at 400px 300px 640px (scrollWidth 1340 against innerWidth 851) until the script measured the workspace again. The canvas poll (at least 300 px) passed at once because of the column minimum, so the fit check raced the re-render. Forcing a different font gave the same result. The fix is CSS: above 800 px the grid columns, the reader offset and both dividers use the same limits as panelLayout. In 8 of 8 probe runs the first sample was scrollWidth 851 with columns 311/300/240. The fit assertion is kept, and a new check asserts that the details panel is at least 240 px wide and inside the viewport at 851. The 390/700 narrow checks and the 1440 restore check pass.
- Retry detachment (PR #27 CI) is a test synchronization defect, not a product defect. After `fail=false`, an automatic refresh (event stream message or online event) recovered first and loaded an empty history, which hides the picker and its retry button. Firing one online event before the click reproduces the timeout every time. The test is split. Manual retry holds the event stream in a network error, clicks retry, checks the hidden empty history, then releases the stream and checks navigation for the new recording. Automatic recovery checks restoration without a click. No fixed waits are added. Both passed 4 of 4 repeats.
- Checks in the worktree, with the Nix Chromium on port 4311:
  - `npm run build` and `npm test` pass.
  - The focused reading-controls, resize, runtime, ux-simplification and presentation suites pass 44 of 44, twice.
  - The full suite passed 73 of 74, then 72 of 74. ux-simplification.spec.js:113 and visualization-clarity.spec.js:5 fail intermittently under full-suite load and also fail with the base CSS, so they are not caused by this change.
  - CI uses Ubuntu with the headless shell, so the CI result is not confirmed until the PR runs.
