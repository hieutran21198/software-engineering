# Author ADD knowledge in Artifact Plane

## Reason and scope

Artifact Plane reads ADD repositories well but writes nothing. Every ADD action today is manual: a person creates directories, writes YAML front matter with identifiers, paths and heading fragments, keeps cross-file invariants by hand, and runs Git commands. The Plane only reports the mistakes afterwards. This change adds safe, deterministic editing over the existing readers and reorganizes the application around a person's current work, so that ordinary ADD authoring needs no knowledge of the storage layout.

Included: the work-centered shell, editable document pages with structured properties, the knowledge operation service and its HTTP route, Git branch, commit and discard actions, review and readiness views, version preparation and publication review recording, opt-in MCP write tools, benchmark scenarios and corrected state labels.

Excluded: ADD contract changes, AI inference in the Plane, push or merge, edits to established versions or delivered evidence, writes to legacy artifacts other than migration, document renames, a drag-and-drop flow editor and the model layer of flows.

## Baseline and ownership

Artifact Plane owns this change. The established baseline is Artifact Plane 1.15.0 on main. ADD 2.5.0 supplies the in-place layout, task, unit, flow and evidence contracts; none of them changes. Knowledge is edited in place on branch claude/plane-authoring-workbench. This change belongs to the plane-authoring-workbench unit.

- [Requirements](../../requirements/authoring-workbench.md)
- [Workbench contract](../../specifications/authoring-workbench.md)
- [Knowledge editing contract](../../specifications/knowledge-editing.md)
- [Editing decision](../../decisions/013-operation-based-knowledge-editing.md) and [navigation decision](../../decisions/014-work-centered-navigation.md)
- [Plan](tasks/README.md)
