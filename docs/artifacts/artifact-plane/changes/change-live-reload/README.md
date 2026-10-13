# Automatic updates and faster reloads

## Reason and scope

Update Artifact Plane as repository evidence changes, reduce reload cost, and order unit views as Artifacts, Workflow, Implementation. Preserve the existing evidence interpretation, runtime observation, and read-only boundaries. Artifact Plane 1.8.0 knowledge and implementation landed on main in PR #14; this change starts from that complete snapshot without historical tasks or delivered provenance.

All required knowledge and implementation changes for this outcome reside in this repository. The existing artifact-driven dependency remains unchanged. No upstream contract change is required.

## Knowledge

- [Automatic update requirements](requirements/live-reload.md)
- [Explorer requirements](requirements/explorer.md)
- [Unit requirements](requirements/units-of-work.md)

- [Repository update contract](specifications/live-reload.md)
- [Update mechanism decision](decisions/007-repository-updates.md)

Implementation requires explicit approval of the completed plan.
