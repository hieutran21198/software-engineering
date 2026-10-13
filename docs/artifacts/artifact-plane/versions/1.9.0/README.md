---
source_change: change-live-reload
delivery_tasks: change
---

# Artifact Plane 1.9.0 — automatic updates and faster reloads

## Knowledge and delivery

The user confirmed proposed version 1.9.0. This version consumes established ADD 2.0.0 and adds automatic repository updates, bounded immutable history reuse, lazy section loading, and unit tabs ordered Artifacts, Workflow, Implementation.

The snapshot contains complete requirements, specifications, and applicable decisions without tasks. Actual delivery tasks and evidence remain in the originating change.

- [Automatic update requirements](requirements/live-reload.md)
- [Automatic update contract](specifications/live-reload.md)
- [Lazy loading contract](specifications/lazy-loading.md)
- [Repository update decision](decisions/007-repository-updates.md)
- [Implementation plan and evidence](../../changes/change-live-reload/tasks/README.md)

## Publication boundary

All required knowledge and implementation changes are in this repository. Version 1.9.0 remains proposed until team review and required merge on main establish it. No completed shared outcome is asserted before merge.
