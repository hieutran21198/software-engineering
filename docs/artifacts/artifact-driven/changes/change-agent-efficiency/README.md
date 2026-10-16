# Agent efficiency and in-place knowledge

## Reason

The repository investigation of 16 October 2026 found that most ADD effort for humans and agents comes from the knowledge layout, not from the method. Every change starts by copying the complete current version, and every version copies the change again. In this repository 72 percent of the 5.8 MB under docs/artifacts is byte-identical copies, each of 15 system flows exists about ten times, and the last ten merged PRs changed 60 to 254 files. Readers then recover facts that the copies hide: phase from commit history, publication from an English sentence pattern, identity from Markdown headings. Those readers report "unknown" for 19 of 21 changes and 11 of 15 units in this repository.

The earlier audit also found repeated context loading across roles, a first-conflict-only adoption preflight, and contradictory retention guidance. Those needs remain in this change.

## Scope

Start from the complete ADD 2.3.0 requirements, specifications and applicable decisions. Define an in-place knowledge layout: one working knowledge tree per artifact, a one-file version record, a change record with its retained plan, structural facts in YAML front matter only, and Git as the version store. Keep legacy snapshot-copy artifacts readable and unchanged. Migrate this repository's three artifacts. Keep the adoption diagnostics, progressive context and retention corrections from the earlier audit.

This change does not add a workflow database, a stored index, a new role, an approval field, automatic publication or a mandatory tool. It does not rewrite established snapshots, prune legacy directories, rename existing changes or units, or simplify the flow schema. Artifact Plane owns reading the new layout in its existing active change; that work waits for this contract to establish.

- [Knowledge layout requirements](../../requirements/knowledge-layout.md)
- [Agent efficiency requirements](../../requirements/agent-efficiency.md)
- [Baseline requirements](../../requirements/baseline.md)
- [In-place layout contract](../../specifications/knowledge-layout.md)
- [Knowledge contract](../../specifications/knowledge.md)
- [Efficiency contract](../../specifications/agent-efficiency.md)
- [Layout decision](../../decisions/011-in-place-knowledge-layout.md)
- [Implementation plan awaiting approval](tasks/README.md)

## Preparation limits

These files describe proposed knowledge in the current snapshot-copy layout, because the in-place layout is not established yet. Preparation does not authorize implementation or establish a version. The completed plan requires explicit user approval.
