---
id: flow-readability
depends_on: []
---

# Present readable flow evidence

## Scope and governing knowledge

Repository: software-engineering. Locations: apps/artifact-plane/src/Flows.jsx, its existing stylesheet and browser flow tests. Governing elements: requirements/flow-readability.md, specifications/flow-readability.md and specifications/flows.md in this change. Consume unit acceptance from the flow-readability brief.

Implement compact deduplicated diagnostics, expandable exact details and shortened-source paths/counts. Fix spacing and inline checkbox alignment. Preserve retrieval and navigation contracts. Run this task sequentially; no additional worker is needed.

## Definition of Done

- [x] Missing-model fixtures show one plain-language notice; keyword/graph behavior remains usable and exact diagnostics are expandable.
- [x] Empty omissions are hidden; nonempty omissions show readable paths and counts without a default raw JSON block.
- [x] Wide and narrow screenshots show separated content and a checkbox beside its label; keyboard expansion and toggle work.
- [x] Focused flow browser tests and app build pass, including source pagination/navigation regressions.
- [x] Documentation links and task metadata validate; established snapshots and retained delivery evidence remain unchanged.

## Evidence

The user approved this plan before implementation. Flows.jsx now deduplicates search, detail and source diagnostics. The optional-model notice explains available fallback discovery; exact codes, messages and the manual install command remain expandable. Shortened sources show repository-relative paths and character counts. Empty omissions are hidden. Publication details use state/reason text. CSS adds spacing and aligns the checkbox inline.

Checks: npm run build passed with the existing React Flow directive and bundle-size warnings. The focused command PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/h2vh7zdwwsgv6f5g68jjwxil0sxr6xb8-chromium-unwrapped-154.0.8037.97/libexec/chromium/chromium npm run test:browser -- test/browser/flows.spec.js passed all six tests. Coverage includes keyboard diagnostic/omission expansion, readable paths/counts, deduplication, inline checkbox geometry at 1440 and 700 pixels, no horizontal overflow, source pagination and refresh, unit impact navigation, real HTTP discovery and escaped source text. Screenshots were reviewed at both widths.

The first new geometry assertion encountered a transient rerender between two bounding-box reads. Measuring the checkbox and label in one DOM evaluation with a retry, and retrying screenshot capture across repository refresh, resolved the test race. The final six-test run passed in 12.1 seconds. No backend or navigation contract changed. KISS uses native details controls and existing CSS; STE keeps technical facts accessible. Proposed patch 1.11.1 retains complete knowledge and links this fresh delivery plan. Documentation and historical-retention checks are recorded in the unit brief.
