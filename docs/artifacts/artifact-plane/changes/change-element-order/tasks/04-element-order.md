# Order and group knowledge elements

## Scope and ownership

Own ordering and display changes in `apps/artifact-plane/src/model.js`, shared element-ordering functions as needed, `src/canvas.js`, `src/main.jsx`, and `src/style.css`. Own the corresponding model/canvas regression checks, the shared B8 fixture, browser acceptance updates, and the ordering guidance in the app README. The coordinator owns artifact evidence and release preparation.

## Prerequisites and governing elements

User approval of this plan. Artifact Plane `1.0.0` is established through the merged initial PR. Governing elements are requirements 11–14 and B8–B9 in `requirements/explorer.md`, and Logical element ordering in `specifications/explorer.md` in this change.

## Definition of Done

- [ ] Write a failing B8 behavior regression before changing the ordering implementation.
- [ ] Return elements in type-first order, with current version, active change, and naturally ordered candidates inside each type.
- [ ] Order categories as Requirements, Specifications, Decisions, Tasks; place each direct category README first and sort other paths naturally.
- [ ] Show collapsible type groups with counts in both canvas and inspector; start them closed and omit empty types. Inside open types, show labeled source groups.
- [ ] Select a referenced or listed element by opening its owning artifact and type; preserve reference connections to hidden targets through artifact nodes.
- [ ] Reduce canvas record height to 52 pixels with 6-pixel vertical padding and 8-pixel gaps; verify readable labels and centered handles.
- [ ] Keep element IDs, reference endpoints, selection, collapse, and zoom behavior correct after layout changes.
- [ ] Run `npm test`, `npm run build`, and `npm run test:browser` on the combined result. Check ordered canvas positions and inspector entries against the shared fixture.
- [ ] Verify inspected repository files and Git state remain unchanged through the corrected views.
- [ ] Document the order and record actual results here. Check documentation links against the hierarchy.
Release preparation and combined validation follow in task 05.

## Evidence

No implementation or validation has run for this correction yet. Retained initial-release evidence does not prove B8 passes.
