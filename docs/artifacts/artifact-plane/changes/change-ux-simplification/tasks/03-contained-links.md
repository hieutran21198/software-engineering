---
id: contained-links
depends_on: [reading-layout]
---

# Open allowed knowledge sources directly

## Scope and ownership

Own optional source-aware Markdown navigation in src/Markdown.jsx, a small pure target-resolution helper if needed, Flows.jsx support actions and main reader integration. Use existing scoped markdown and registered flow/review source requests; server edits are limited to correcting existing boundary bugs exposed by tests, not expanding permitted source scope. Add meaningful resolver/sanitizer and browser navigation tests.

## Governing knowledge

UX3, UX11; specifications/ux-simplification.md Contained source navigation; decision 011; existing explorer/source-retrieval/review containment contracts.

## Prerequisites

Applicable DoD for reading-layout must pass first. Explicit approval of this concrete plan and recheck of established ADD 2.1.0 are required. Preserve the inherited presentation baseline; no task authorizes editing established snapshots.

## Definition of Done

- [x] Known relative current/change/root/evidence links resolve from the exact displayed source; safe normalized ../ links work only when their resolved known target is allowed.
- [x] Cross-artifact and exact-version destinations never substitute another snapshot; missing/unsupported/external/unsafe destinations stay inert with accessible reasons and working return.
- [x] Flow support rows directly open their registered source ID, while unresolved support remains explicit.
- [x] Hostile HTML, forged callback attributes, encoded traversal, schemes, symlink escapes, .git/credential and task-directory escapes cannot execute, fetch externally or bypass server scope.
- [x] Focused source/Markdown/browser tests pass with unchanged fixture bytes and Git state.

## Evidence

11 Node checks passed across knowledge-navigation, reader and scoped-query suites. Cases include exact allowlisted ../ resolution, Unicode/encoding boundaries, missing versions, unsafe schemes/traversal, registered roots, symlink and scope protection. Focused Chromium Markdown navigation passed: root → exact version requirement → sibling contract → prior document/graph, with no forged callback, script execution, page errors or fixture mutation. Production build passed. Markdown removes repository data attributes before inserting locally generated controls; server read authority is unchanged. Flow supporting-source rows bind returned registered IDs and preserve cursor access; integrated flow browser regressions remain in task 07.
