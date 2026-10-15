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

- [ ] Known relative current/change/root/evidence links resolve from the exact displayed source; safe normalized ../ links work only when their resolved known target is allowed.
- [ ] Cross-artifact and exact-version destinations never substitute another snapshot; missing/unsupported/external/unsafe destinations stay inert with accessible reasons and working return.
- [ ] Flow support rows directly open their registered source ID, while unresolved support remains explicit.
- [ ] Hostile HTML, forged callback attributes, encoded traversal, schemes, symlink escapes, .git/credential and task-directory escapes cannot execute, fetch externally or bypass server scope.
- [ ] Focused source/Markdown/browser tests pass with unchanged fixture bytes and Git state.

## Evidence

No implementation checks have run for this task. Record actual commands, observed results, source references and limitations here after approved execution.
