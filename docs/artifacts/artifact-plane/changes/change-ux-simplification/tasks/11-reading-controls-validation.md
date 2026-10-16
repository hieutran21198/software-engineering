---
id: reading-controls-validation
depends_on: [highlighted-code]
---

# Validate the requested controls and reconcile the proposal

## Scope and ownership

Sequential implementation owner covers Coordinator-owned change/unit/version knowledge, apps/artifact-plane README and integrated checks. These tasks extend the current unmerged outcome; do not reopen, copy or change earlier completed task evidence.

## Governing knowledge

UX12–UX14 plus existing UX1–UX11; specifications/reading-controls.md; shared unit acceptance.

## Prerequisites

The listed prerequisite must satisfy its applicable DoD. The original seven-task approval covers its original scope only. Obtain explicit approval of this concrete reading-control amendment before any new application/dependency changes. The established ADD 2.1.0 supplier and existing source/evidence boundaries remain unchanged; no new artifact dependency is introduced.

## Definition of Done

- [x] Run the full Node and Chromium suites plus app build, root Go tests/vet and website build on the integrated change. Inspect loaded wide/narrow screenshots and geometry; preserve all existing read-only, graph, source, runtime and tab regressions.
- [ ] Record fresh task and reading-controls shared evidence, update documented flow support only from actual checks, reconcile complete proposed 1.13.0 knowledge without task copies, retain source_change/delivery_tasks provenance, and update attached PR #26 for review without merge or establishment claims.
- [x] Focused affected checks pass and their actual commands, results and limitations are recorded here. KISS/STE self-check confirms no extra controls, settings store or semantic changes.

## Evidence

Validated on 2026-10-16 after explicit user approval of tasks 08–11.

- `FLOW_MODEL_STATE=/tmp/plane-flow-model-state npm test` in apps/artifact-plane: 269 passed, zero failed or skipped, including local installed-model inference. The new pure checks cover panel feasibility across widths/preferences and bounded, exact syntax rendering.
- Chromium with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/0fxasn1rwqc65s8y14ip1ym4hk2rxjwx-playwright-chromium/chrome-linux64/chrome npm run test:browser`: all 73 cases passed at default deadlines without retries. Four new cases cover h1–h6 hierarchy/long titles, pointer/keyboard dual-panel sizing and reader alignment, project-local widths, and inert fenced/inline/prose rendering across 390/700/851/1440.
- Existing actual HTTP flow source checks assert syntax tokens and exact CRLF text. Source pagination, removal, stale/superseded context, project tabs, runtime, review and unchanged fixture bytes/Git fingerprints all pass. The first integration run passed 72 cases; its new screenshot case queried a footer status hidden by the existing mobile layout. Selecting that status in the DOM fixed the test; the complete suite then passed. Each code screenshot now waits for loaded panels after viewport changes.
- `npm run build` passed with locally bundled selected grammars; JavaScript is 704.28 kB / 223.50 kB gzip. Root `GOCACHE=/tmp/plane-ux-go-cache go test ./...` and `go vet ./...` passed. Website `npm run build` passed after proposal reconciliation.
- Loaded code screenshots at 390/700/851/1440 were inspected. Headings are larger than body text; code stays inside its panel with syntax colors and horizontal scrolling. Geometry checks verify both panel minima, a 300px desktop center, narrow hidden handles, pointer capture, Arrow/Home/End behavior, reader offset and retained project preferences. A long source title wraps without page overflow. Browser-tool manual access remains unavailable from the earlier policy rejection; these are rendered automated-fixture checks, not a separate manual usability study.
- Knowledge validation checks eleven unique tasks/ten acyclic edges, eight valid flows, exactly one unit owner, 48 byte-identical proposed knowledge files, zero task copies, zero historical snapshot changes, 39 release links and 17 change links with safe documentation hierarchy. Version 1.13.0 remains a proposal; its source_change and delivery_tasks provenance still resolves the retained originating plan.

KISS/STE self-check passed: reuse the resize pattern, derive geometry from existing project-local preferences, and use one local bounded highlighting boundary. No new persistent settings, source APIs, hosted rendering, execution or formatting controls were added. The original checkout has no tracked changes; its ignored dependencies were restored after the inherited symlink install issue described in task 10. PR #26 will be updated with this extension and current validation; review and merge remain required.
