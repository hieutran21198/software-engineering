---
source_change: change-agent-efficiency
---

# artifact-driven 2.4.0 — in-place knowledge layout

Compatible minor version. It adds the in-place layout as the default for new and migrated artifacts and keeps the snapshot-copy layout readable for existing artifacts. Established legacy snapshots, adoption defaults and existing records keep working, so no consumer must change.

- Knowledge layout: one working knowledge tree per artifact, identity records in README front matter, change records with retained plans, one-file version records, structural facts in front matter only, and Git as the version store. The migration procedure moves an artifact without changing knowledge bytes.
- Guidance: the bundle, role skills and the minimal scaffold edit knowledge in place and copy nothing. Roles reuse loaded context in one session and reload after context loss or source change.
- Adoption: one preflight reports every safe destination conflict, and `se-adopt --json` returns one structured result.

This record holds no knowledge directories and no tasks. The originating plan and its evidence are in the [retained change](../../changes/change-agent-efficiency/tasks/README.md).
