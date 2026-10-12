# Resize the inspector and validate the combined UI

## Scope and ownership

Own the inspector divider, panel-width state, responsive styles, browser resize checks, and corresponding app README usage instructions in `apps/artifact-plane`. The coordinator owns integrated evidence and version/PR preparation. Execute after task 04 to avoid overlapping UI edits.

## Prerequisites and governing elements

User approval of this revised plan and task 04 integrated on the change branch. Governing elements are requirement 15 and B10 in `requirements/explorer.md`, and Resizable inspector in `specifications/explorer.md` in this change. Integrated checks also cover B8–B9 and the preserved B1–B7 contracts.

## Definition of Done

- [ ] Add a visible, draggable vertical divider and resize the panel in browser memory.
- [ ] Default to 340 pixels, clamp to the specified width bounds, and retain a usable canvas after viewport changes.
- [ ] Support Arrow keys in 20-pixel steps plus Home/End; expose separator role, orientation, value, and bounds.
- [ ] Hide the divider in the stacked narrow layout and reflow Markdown within the panel.
- [ ] Keep element selection and canvas pan, zoom, fit, and collapse behavior intact during resizing.
- [ ] Run `npm test`, `npm run build`, and `npm run test:browser` on the combined grouping, density, and resizing implementation. Confirm B8–B10 and read-only repository behavior.
- [ ] Inspect the grouped canvas and resized inspector visually, including long filenames and Markdown at minimum and wider panel widths.
- [ ] Record actual validation results in current tasks and check documentation links against the hierarchy.
- [ ] Suggest minor version `1.1.0` after validation because resizing and collapsible type groups add compatible UI capabilities. Obtain version confirmation before preparing the complete snapshot and consistent root/DAG.
- [ ] Publish a dedicated review PR, inspect integrated CI, and stop for team review and merge.

## Evidence

No implementation or validation has run for this revised plan yet.
