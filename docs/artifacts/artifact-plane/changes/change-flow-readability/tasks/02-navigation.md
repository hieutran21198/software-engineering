---
id: flow-navigation
depends_on: [flow-readability]
---

# Make flow navigation consistent

## Scope and governing knowledge

Own apps/artifact-plane/src/main.jsx, Flows.jsx, existing CSS, server/flow-reader.js, server/flow-index.js and focused Node/browser tests. Apply requirements/flow-readability.md and specifications/flow-readability.md in this change. The first task passed its checks; preserve its readable evidence presentation.

1. Apply the common active view styling and toolbar knowledge controls. Share Established/Planning state per project while retaining the flow-only All snapshots option.
2. Preserve flow context across view switches with project-session state. Cancel stale requests and reset incompatible selections when knowledge or worktree changes.
3. Place the flow list on the left, selected graph in the center and matching evidence/source inspector on the right. Preserve participation links and dependency/unit selections when returning to their views.
4. Add Git creation metadata and newest-first ordering before existing cursor pagination. Load the flow list lazily in 20-record pages, with one scroll-triggered request at a time and accessible Load more/retry controls.
5. Validate selection synchronization, controls and isolation, then update the proposed 1.11.1 snapshot and open PR #23 with new evidence.

## Definition of Done

- [x] Active styling and aria-pressed agree in all three explorer views.
- [x] Established/Planning controls look consistent and send the selected context; the flow-only All snapshots behavior is explicit.
- [x] Dependencies → Flows → Units → Flows retains valid flow/search/source context and prior selections in other views.
- [x] Left flow selections and center graph-node clicks update the right inspector without hidden artifact-selection side effects.
- [x] Project-tab/worktree changes remain isolated; old responses cannot overwrite the new context.
- [x] Wide/narrow screenshots, keyboard checks, focused flow and project-tab browser tests and app build pass.
- [x] Proposed snapshot matches final change knowledge and historical snapshots/evidence remain unchanged.

- [x] More than two pages append without duplicates or missing records; detail/source reads are lazy and hidden views issue no retrieval requests.
- [x] Creation dates descend across page boundaries; equal dates use stable IDs and unverified dates show unknown and sort last.
- [x] Query/context/revision changes reset pages and reject stale responses/cursors while preserving valid selection.
- [x] Additive creation metadata and sort order match over HTTP/MCP; targeted Node checks confirm safe, read-only history access.

## Evidence

The user explicitly approved the navigation and lazy-pagination amendment before implementation. The project session retains the mounted flow controller across explorer-view switches. Shared Established/Planning controls and the common active class agree with aria-pressed; All snapshots remains flow-only. The sidebar owns the paginated list, the center owns the graph and the right inspector owns the selected flow/step/source evidence. Proposed participation links select Planning when their originating knowledge is a change.

Pages request 20 records, append by opaque identity and allow only the current cursor request. A scroll sentinel and keyboard Load more control share the same loader. Hidden project/views abort pending requests and issue no flow reads. Unchanged-revision refresh retains loaded pages; new contexts or stale cursors restart from the first page. Valid detail/source selections survive view switches and refresh, while incompatible worktree/knowledge selections clear. A canvas ResizeObserver refits the graph on width changes.

The reader derives createdAt from bounded, path-scoped Git addition history. It caches at most 16 revision/path contexts, invalidates on shallow-history changes, and includes dates in the derived revision. Shallow, missing, uncommitted or capped histories yield null instead of filesystem-time guesses. The shared service orders candidates by date descending, then stable ID, before cursor paging; unknown dates sort last. The additive field appears identically over HTTP/MCP.

Validation commands from apps/artifact-plane:

- npm run build: passed; existing directive and bundle-size warnings only.
- FLOW_MODEL_STATE=/tmp/plane-flow-model-state npm test: 181 passed, zero skipped, in the final 6.0-second run. Includes actual offline model execution, all adapter parity/read-only checks, 45-record ordering across three pages, and original Git addition versus edits/uncommitted/shallow history.
- PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/h2vh7zdwwsgv6f5g68jjwxil0sxr6xb8-chromium-unwrapped-154.0.8037.97/libexec/chromium/chromium npm run test:browser: 35 passed in 1.4 minutes. Covers existing units, task/recorded views, lazy loading, worktrees, project tabs and observer behavior.
- After final participation-link context handling and a new registered-worktree case, the same browser command with test/browser/flows.spec.js: all nine passed in 10.9 seconds. The build passed again. The final changes after the integrated browser run were participation-link context handling, explicit unknown-date comparison at the Unix epoch boundary and the new worktree case. The final 181-test Node run and nine flow browser checks cover these changes.

Reviewed screenshots at 1440 and 700 pixels. The selected sidebar record, center graph and inspector agree; only one knowledge control is active, and graph nodes fit within the narrow canvas. The new project-tab test preserves independent flow/search state and rejects a delayed old knowledge response. The worktree test clears old source/detail state and selects the new worktree flow. An initial checkbox measurement race and an overstrict request count during active repository refresh were corrected in tests. Visual review identified narrow sidebar shrink and graph clipping; the implementation now keeps the list scrollable and refits the graph.

Documentation, complete-snapshot, task-DAG and historical-retention checks are recorded in the unit brief. KISS reuses existing project sessions, cursor transport, native details and React Flow; STE keeps creation-date and snapshot limits explicit. Version 1.11.1 remains proposed until review and merge.
