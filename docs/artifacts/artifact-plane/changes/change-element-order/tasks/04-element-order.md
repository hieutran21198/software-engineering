# Order and group knowledge elements

## Scope and ownership

Own ordering and display changes in `apps/artifact-plane/src/model.js`, shared element-ordering functions as needed, `src/canvas.js`, `src/main.jsx`, and `src/style.css`. Own the corresponding model/canvas regression checks, the shared B8 fixture, browser acceptance updates, and the ordering guidance in the app README. The coordinator owns artifact evidence and release preparation.

## Prerequisites and governing elements

User approval of this plan. Artifact Plane `1.0.0` is established through the merged initial PR. Governing elements are requirements 11–13 and B8 in `requirements/explorer.md`, and Logical element ordering in `specifications/explorer.md` in this change.

## Definition of Done

- [ ] Write a failing B8 behavior regression before changing the ordering implementation.
- [ ] Return elements in current-version-first source order, then active change, then naturally ordered candidates.
- [ ] Order categories as Requirements, Specifications, Decisions, Tasks; place each direct category README first and sort other paths naturally.
- [ ] Show source and category headings consistently on the expanded canvas and in the inspector; omit empty categories.
- [ ] Keep element IDs, reference endpoints, selection, collapse, and zoom behavior correct after layout changes.
- [ ] Run `npm test`, `npm run build`, and `npm run test:browser` on the combined result. Check ordered canvas positions and inspector entries against the shared fixture.
- [ ] Verify inspected repository files and Git state remain unchanged through the corrected views.
- [ ] Document the order and record actual results here. Check documentation links against the hierarchy.
- [ ] Suggest patch version `1.0.1` after validation; obtain version confirmation before preparing its full snapshot and consistent root/DAG.
- [ ] Publish a dedicated review PR and inspect CI results. Stop for team review and merge.

## Evidence

No implementation or validation has run for this correction yet. Retained initial-release evidence does not prove B8 passes.
