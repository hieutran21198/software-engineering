# Automatic updates and faster reloads

## Reason and scope

Update Artifact Plane as repository evidence changes, reduce reload cost through caching and lazy loading, and order unit views as Artifacts, Workflow, Implementation. Preserve the existing evidence interpretation, runtime observation, and read-only boundaries. Artifact Plane 1.8.0 knowledge and implementation landed on main in PR #14; this change starts from that complete snapshot without historical tasks or delivered provenance.

All required knowledge and implementation changes for this outcome reside in this repository. The existing artifact-driven dependency remains unchanged. No upstream contract change is required.

## Knowledge

- Automatic update requirements
- Explorer requirements
- Unit requirements

- Repository update contract
- Lazy exploration contract
- Update mechanism decision

- [Implementation plan](tasks/README.md)

The user approved the extended plan. Implementation and integrated validation are complete. The user confirmed proposed version 1.9.0; review and merge remain pending.

## Review handoff

[Review PR #15](https://github.com/hieutran21198/software-engineering/pull/15) proposes Artifact Plane 1.9.0 with implementation and validation evidence. The user confirmed the version and public repository publication. Establishment and unit completion require team review and merge on main. No merge or deployment occurred.

## Retained record

The knowledge copy of this delivered change was removed when the legacy records were converted. Git history of this directory keeps it; the plan and evidence remain in tasks.
