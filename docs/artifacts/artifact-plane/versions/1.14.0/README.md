---
source_change: change-evidence-and-usability
---

# artifact-plane 1.14.0 — in-place reading, explanations and refresh

Compatible minor version. The Plane now reads the ADD in-place layout beside the legacy snapshot layout. Existing HTTP and MCP fields, legacy readers and their results are unchanged, and new fields are additive.

- In-place reading: per-artifact layout detection, identity and version records from front matter, protected-ref baselines with added, modified, removed and unchanged files, declared phase evidence without history replay, version snapshots from the introducing commit, and structured publication_reviews.
- Navigation: working and established-on-main views, delivery version records and declared phases, and the Git baseline with the remaining gate in reviews.
- Scripts: validate-knowledge, migrate-layout and layout-benchmark.
- Dependency and model explanations, incremental observation with bounded reconciliation, and the repaired width-851 layout and execution-history recovery checks.

This record holds no knowledge directories and no tasks. The originating plan and its evidence, including the unmet packet and idle-byte targets, are in the [retained change](../../changes/change-evidence-and-usability/tasks/README.md).
