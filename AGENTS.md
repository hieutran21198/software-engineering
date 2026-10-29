# Repository Instructions

## Documentation Flow

Documentation follows a waterfall flow from parent pages to child pages. Parent pages may link to child documentation. Child pages must not reference or link back to parent or ancestor documentation, including the repository overview.

When adding or moving documentation, check links against this hierarchy. A relative path containing `../` is not necessarily a parent reference; resolve its destination before deciding whether it violates the rule.

## Artifact-Driven Development

Use `docs/artifact-driven` as the canonical ADD bundle. This Git repository contains both the knowledge workspace and the implementation workspace (`cmd/`, `internal/`, `src/`, and `website/`). Project artifacts belong in `docs/artifacts`; do not treat the reusable bundle as project artifacts. Inspect the actual repository layout when a change involves other workspaces.

For ADD changes, load the canonical `add-coordinator` skill and the current role core. The PO owns Requirement; the TL completes Specification and Plan sequentially in the same capable session; implementers execute approved tasks. Follow the role cores and their conditional reference tables. Apply KISS/STE checklists; read full required skills when the checklist does not settle a case. Keep the full bundle and references available. Inherit the current model and permissions and report capability limits.

Antigravity, Codex, OpenCode V2 and Command Code discover the six skill links in `.agents/skills`; Claude Code uses `.claude/skills`. Codex profiles live in `.codex/agents`, OpenCode profiles in `.opencode/agents`, and the Command Code implementer in `.commandcode/agents`. Reuse these registrations. Command Code coordinating roles run in the main session because its subagent cannot interview the user.

Use brief-first selective retrieval when available and bounded files/Git otherwise, following `docs/artifact-driven/06-guidelines/working-with-ai.md`. Preserve governing references, evidence limits and uncertainty. Do not infer approval or completion from Plane.

Assign a change tier using `docs/artifact-driven/06-guidelines/change-tiers.md`. Medium/large changes need Requirement, Specification and Plan self-checks, separate phase commits on a dedicated branch and explicit plan approval before implementation. Small changes use one knowledge commit and the user's request as approval. Material plan changes need renewed approval. Dependent implementation waits for required upstream versions to establish. Independent parallel implementers use separate branches/worktrees; the coordinator owns knowledge edits.

Validate task DoD and integrated behavior. Prepare proposed versions and linked PRs, then stop for team review and merge. Never commit directly to protected branches or merge automatically. A version establishes only after all required knowledge and code land on main/master. Ask how to finish if no remote exists. Derive progress from artifacts, Git and available approval; add no workflow state database.

## Project Units of Work

Use a unit of work for each new medium or large ADD outcome in this project, including outcomes with one artifact change. A small outcome with one change needs no unit brief. Follow the [unit-of-work format](docs/artifact-driven/06-guidelines/units-of-work.md). Store briefs at docs/artifacts/units-of-work/<name>/README.md with one deliverable outcome, included/excluded scope, structured member changes, shared acceptance criteria, and validation evidence. Each participating change belongs to exactly one unit. The directory contains outcome knowledge, not artifact nodes or a workflow state registry.

The coordinator owns membership and shared evidence. Keep artifact-local requirements, specifications, decisions, and tasks with their owners. Use the existing artifact and implementation task DAGs; membership creates no dependency and does not bypass plan approval or upstream establishment. Derive workflow and completion from knowledge, evidence, Git, and available approvals.

Project artifacts use the in-place layout: edit requirements, specifications and decisions directly under the artifact on the change branch, and copy nothing into changes or versions. Each new version is a version record README with source_change only; set current_version and depends_on in the artifact README front matter. Keep tasks and DoD evidence in their originating changes; new changes create fresh plans without historical task copies. Retain delivered changes while referenced. Preserve delivered versions and referenced evidence for historical outcomes; do not edit established legacy snapshots or invent their membership. This repository's legacy records are converted to version records; their knowledge stays in the Git commits that introduced them. Record combined checks in the brief and reference delivered task evidence where sufficient. Completion requires all member versions to establish and all shared acceptance/integration criteria to have supporting evidence.

The [current unit of work](docs/artifacts/units-of-work/legacy-conversion/README.md) converts this repository's retained legacy records to version and change records.

Harness setup alone does not authorize a domain change, implementation, commits, pushes, or merges. Preserve existing edits and unrelated instructions.
