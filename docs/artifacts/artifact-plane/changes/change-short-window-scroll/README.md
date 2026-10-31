---
tier: small
---

# Keep the workbench window from scrolling in short windows

## Reason and scope

The owner reverted Plane 1.31.0 (agent sessions) to rethink that feature, and asked to keep its layout fix. In short windows, visually hidden text (`.sr-only`, `position: absolute`) in phase steps and review items had `.workspace` as its containing block, outside the `.page-area` scroll container. Below the fold it extended the document, so the window scrolled and the shell ended above the window bottom. This breaks D1 in requirements/workbench-redesign.md: one top bar, one sidebar and one content column that fill the window.

Included: make `.page-area` the containing block, so that it clips its absolute descendants, and a browser layout test. Excluded: agent sessions, which the revert removed.

## Plan

One task sets `position: relative` on `.page-area` and adds a layout test that measures the document height and the shell bottom on every page at 1200x600 and 2000x660 after a window scroll. The task covers D1 in requirements/workbench-redesign.md. Compatibility: patch.

## Tier decisions

One repository: the style sheet, the test and the knowledge are in this repository.

Impact: one style rule of the workbench shell. No flow record, decision, requirement ID or referenced element changes.

- [Task](tasks/01-deliver.md)
