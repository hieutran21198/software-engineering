---
id: flow-view
depends_on: [flow-reader]
---

# Visualize flows and unit impact

## Scope and governing knowledge

Own project-scoped Flows view, step/support graph, artifact/element participation and unit affected-flow links. Reuse existing canvas/inspector/navigation conventions.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Browser fixtures expose shared sources, transitions, loops, provenance and flow impact.
- [x] Empty/invalid/legacy and narrow/keyboard states remain accessible.
- [x] Selections/refresh/tab lifecycles remain isolated.

## Evidence

The project-scoped Flows view displays triggers, outcomes, step transitions and expandable shared support with source publication, evidence basis, gaps and exclusions. Artifact/element inspectors find participation; units link create/modify/remove intent. Source excerpts paginate, refresh from the first page without losing valid selection, and clear deleted sources. Abort guards prevent old requests from replacing a changed project/context.

Final browser command: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/nix/store/h2vh7zdwwsgv6f5g68jjwxil0sxr6xb8-chromium-unwrapped-154.0.8037.97/libexec/chromium/chromium npm run test:browser. All 32 tests passed in 1.3 minutes. Five flow scenarios cover loops/shared support, escaped source content, narrow keyboard search, legacy/invalid states, unit links, source pagination/deletion, actual HTTP graph/source reads, artifact participation and unchanged repository bytes. Existing project tabs, cancellation/lazy races, worktrees and unit evidence scenarios also pass. The two flow-canvas Node tests pass; app build passes.

The browser trace exposed an existing unit canvas initialization failure after a sequence of views: valid fixed-size nodes remained visibility:hidden. Supplying their known initial dimensions resolved it. All four unit cases and the full suite passed after the fix. Toolbar overlap and refresh selection issues were also corrected. KISS reuses React Flow and existing project sessions; STE keeps participation separate from prerequisites and authorization.
