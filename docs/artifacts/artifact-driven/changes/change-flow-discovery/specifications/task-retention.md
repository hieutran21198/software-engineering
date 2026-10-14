# Change-owned delivery contract

Governs R1–R5 in requirements/task-retention.md. This contract replaces copied task lifecycle statements in knowledge.md, task-dag.md, and units-of-work.md for future deliveries.

## Knowledge and delivery layout

New versions contain README.md, requirements/, specifications/, and applicable decisions/. Do not copy tasks/ into a new version. A complete knowledge snapshot explains the artifact without replaying old changes; delivery evidence is a separate retained record.

The new version README front matter declares source_change: change-<name> and delivery_tasks: change. The latter is a literal enum value identifying the new layout, not an arbitrary path. Resolve tasks at docs/artifacts/<owner>/changes/<source_change>/tasks/. Add a relative link from the version README to that plan. The destination is a sibling change, not an ancestor document. Version provenance remains one change to one delivered version.

A new change copies the complete version knowledge, excludes any legacy tasks directory, removes delivered provenance from its change README, and creates a fresh plan in Plan. Do not copy previous task files into the new plan. Historical evidence stays in its original owner. Retain the delivered change directory and its tasks for as long as any delivered version or outcome references them. Correct delivery work in a new change; do not overwrite established delivery records. A correction to a historical evidence assertion must remain visible in Git and remove affected completion support until revalidated.

## Publication and evidence

Establishment for a new-layout delivery requires matching version knowledge and the retained originating tasks on local main/master, plus the existing all-required-knowledge-and-implementation-merges obligation. Compare safe task paths, plan membership, metadata, and content; branch copies, unchecked criteria, clean status, and source_change alone prove neither publication nor completion.

Unit evidence may reference the exact member's changes/<source_change>/tasks/<file>.md with an optional heading. Accept it as delivered evidence only for a uniquely resolved version declaring delivery_tasks: change and only when that retained task set matches the applicable protected-ref publication. Absent files, unsafe sources, mismatches, conflicting protected refs, and unavailable Git evidence yield diagnostics and incomplete/unknown completion. Active-change checks remain preparatory. Evidence in another change never supports this member. Shared brief evidence retains existing checks.

## Legacy compatibility and delivery

Versions without delivery_tasks keep the existing version-owned task resolution and evidence semantics; no guessed new layout or retroactive metadata. Invalid delivery_tasks values are diagnosed. Preserve all established snapshots and referenced legacy evidence. New-layout versions require the retained change; a missing change does not fall back to a later plan.

Update canonical docs/artifact-driven and corresponding src/archs/artifact-driven files, applicable skills/role profiles/project guidance and delivered examples. Locate all maintained snapshot/task rules, including CI evidence guidance. Keep unrelated bundle files and KISS/STE intact. Adoption and publishing checks verify fidelity. No new artifact edge, task registry, or workflow engine is needed.

## Impact and self-check

Artifact Plane consumes this proposed contract from artifact-driven/change-task-retention. Its implementation waits for ADD establishment. KISS uses existing provenance with one explicit layout marker; STE separates complete knowledge from delivery proof. All R1–R5 are covered; no Specification blocker remains.
