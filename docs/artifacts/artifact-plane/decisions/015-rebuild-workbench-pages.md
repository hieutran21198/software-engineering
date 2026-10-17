# Rebuild the workbench pages instead of wrapping the earlier views

## Context

Artifact Plane 1.16.0 added a navigation tree and content pages, but the pages wrap the 1.15.0 flow, unit and dependency views with their own lists, inspectors and mode controls. The owner found the result unusable. The findings in requirements/workbench-redesign.md trace the problems to this wrapping, to duplicated action placement and to three unrelated style sheets. The server operations, writer and Git actions work and are tested.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Polish 1.16.0 in place | Hide some controls, restyle, and remove duplicated buttons. | Keeps the wrapped views, their state and their inspectors. Each fix fights the old structure. Rejected. |
| B. Rebuild the pages over the same data layer | Keep loading, editing, canvas builders and readers. Write a new shell, sidebar and pages to the approved mockups, with one stylesheet. | Removes the cause of G1–G9. Needs rewritten browser suites. The server and its tests do not change. Selected. |
| C. Restore the 1.15.0 interface | Bring back the explorer and offer editing only through HTTP and MCP. | Loses the authoring path that the owner needs as the main job. Rejected. |

## Decision

Adopt option B as specified in specifications/authoring-workbench.md. Decision 014 stays for its main choice, a work-centered application. Its tree, details rail and source bar are replaced by the sidebar, the inline graph panel and the top bar.

## Consequences

The browser application gets new page components and one stylesheet. The views that only served removed controls are deleted. Browser suites are rewritten. The overview response gains optional element and change titles. The fonts become bundled dependencies.
