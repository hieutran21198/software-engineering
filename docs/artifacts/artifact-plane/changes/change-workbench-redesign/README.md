# Redesign the authoring workbench

## Reason and scope

Artifact Plane 1.16.0 makes every ADD authoring action possible, but its owner opened the merged result and found it unusable. The new pages wrap the 1.15.0 views instead of replacing them. Most pages therefore show two navigations, repeat their titles, duplicate actions and stack many small forms. This change redesigns the browser application around writing and changing knowledge, in a light, document-first style. Static mockups of the main pages are approved before implementation.

Included: the application shell, the sidebar, the work, artifact, document, change, unit, flow and graph pages, inline editing of lists and properties, the visual style, the placement of Codex execution views and behavior discovery, and the browser tests.

Excluded: the knowledge operation service, the knowledge writer, Git actions, HTTP and MCP interfaces, the readers, ADD contracts and the safety rules. These stay as delivered in 1.16.0.

## Baseline and ownership

Artifact Plane owns this change. The established baseline is Artifact Plane 1.16.0 on main. ADD 2.5.0 supplies the in-place layout, task, unit, flow and evidence contracts; none of them changes. Knowledge is edited in place on branch claude/plane-workbench-redesign. This change belongs to the plane-workbench-redesign unit.

- [Requirements](../../requirements/workbench-redesign.md)
