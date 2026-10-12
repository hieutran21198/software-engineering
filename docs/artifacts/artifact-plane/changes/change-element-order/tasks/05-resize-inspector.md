# Resize the inspector and validate the combined UI

## Scope and ownership

Own the inspector divider, panel-width state, responsive styles, browser resize checks, and corresponding app README usage instructions in `apps/artifact-plane`. The coordinator owns integrated evidence and version/PR preparation. Execute after task 04 to avoid overlapping UI edits.

## Prerequisites and governing elements

User approval of this revised plan and task 04 integrated on the change branch. Governing elements are requirement 15 and B10 in `requirements/explorer.md`, and Resizable inspector in `specifications/explorer.md` in this change. Integrated checks also cover B8–B9 and the preserved B1–B7 contracts.

## Definition of Done

- [x] Add a visible, draggable vertical divider and resize the panel in browser memory.
- [x] Default to 340 pixels, clamp to the specified width bounds, and retain a usable canvas after viewport changes.
- [x] Support Arrow keys in 20-pixel steps plus Home/End; expose separator role, orientation, value, and bounds.
- [x] Hide the divider in the stacked narrow layout and reflow Markdown within the panel.
- [x] Keep element selection and canvas pan, zoom, fit, and collapse behavior intact during resizing.
- [x] Run `npm test`, `npm run build`, and `npm run test:browser` on the combined grouping, density, and resizing implementation. Confirm B8–B10 and read-only repository behavior.
- [x] Inspect the grouped canvas and resized inspector visually, including long filenames and Markdown at minimum and wider panel widths.
- [x] Record actual validation results in current tasks and check documentation links against the hierarchy.
- [x] Suggest minor version `1.1.0` after validation because resizing and collapsible type groups add compatible UI capabilities. Obtain version confirmation before preparing the complete snapshot and consistent root/DAG.
- [ ] Publish a dedicated review PR, inspect integrated CI, and stop for team review and merge.

## Evidence

The B10 browser regression failed before the divider existed and passed after implementation. The combined `npm test` suite passed 16 checks, `npm run build` passed, and `npm run test:browser` passed all 4 Chromium checks. B10 verifies drag resizing, Arrow Left/Right, Home/End, the 240–640 pixel bounds, viewport clamping with a 300-pixel canvas, long filenames, Markdown reflow, selected-element preservation, and the stacked narrow layout.

Browser screenshots at minimum, wider, and stacked panel sizes were inspected. Visual QA exposed Fit scrolling the canvas toolbar away; a regression reproduced scrollTop 66 before the explicit viewport surface fix and scrollTop 0 afterward. Toolbar, legend, and controls now retain their own space. Shared grouping and resize fixtures verify inspected repository bytes are unchanged. No new library, persistence, or backend endpoint was added. KISS and STE checks preserve direct UI state and readable instructions.

The user confirmed compatible minor version 1.1.0. Snapshot and review PR preparation follow validation. The Vite client-directive and bundle-size warnings remain non-blocking; browser checks pass.
