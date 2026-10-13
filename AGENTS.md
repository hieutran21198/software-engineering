# Repository Instructions

## Documentation Flow

Documentation follows a waterfall flow from parent pages to child pages. Parent pages may link to child documentation. Child pages must not reference or link back to parent or ancestor documentation, including the repository overview.

When adding or moving documentation, check links against this hierarchy. A relative path containing `../` is not necessarily a parent reference; resolve its destination before deciding whether it violates the rule.

## Artifact-Driven Development

Use `docs/artifact-driven` as the canonical ADD bundle. This Git repository contains both the knowledge workspace and the implementation workspace (`cmd/`, `internal/`, `src/`, and `website/`). Project artifacts belong in `docs/artifacts`; do not treat the reusable bundle as project artifacts. Inspect the actual repository layout when a change involves other workspaces.

For ADD changes, use the `add-coordinator` skill to interview the user and drive the workflow. The `add-product-owner` role owns Requirement. The `add-technical-lead` role completes Specification and Plan sequentially in the same capable session. The `add-implementer` role executes approved tasks. Codex discovers the six bundled skills through `.agents/skills`; project role profiles live in `.codex/agents`. Resolve skill references from their canonical directories under `docs/artifact-driven`.

Every ADD role must read and apply `docs/artifact-driven/required-skills/kiss/SKILL.md` and `docs/artifact-driven/required-skills/asd-ste-100/SKILL.md` during existing self-checks. Preserve the full bundle and its references. Report missing capabilities and use sequential execution when parallel agents are unavailable. Inherit the current model and permissions; report if the available model cannot meet the TL's needs.

Complete Requirement, Specification, and Plan with self-checks and separate phase commits on a dedicated branch. Present the plan and wait for explicit user approval before implementation. A new plan or material change requires renewed approval. Dependent implementation waits for required upstream established versions. Use separate Git worktrees and branches for independent parallel implementers; keep artifact updates under the coordinator's control.

Validate task DoD and the integrated change. Prepare proposed versions and linked PRs for changed repositories, then stop for team review and merge. Never commit directly to `main`, `master`, or another protected branch. A version becomes established only after all required knowledge and code land on `main` or `master`. If a repository has no remote, ask the user how to finish. Derive progress from artifacts, task evidence, Git, and available user approval; do not add a workflow state database.

## Project Units of Work

Use a unit of work for each new ADD outcome in this project, including outcomes with one artifact change. Follow the [unit-of-work format](docs/artifact-driven/06-guidelines/units-of-work.md). Store briefs at docs/artifacts/units-of-work/<name>/README.md with one deliverable outcome, included/excluded scope, structured member changes, shared acceptance criteria, and validation evidence. Each participating change belongs to exactly one unit. The directory contains outcome knowledge, not artifact nodes or a workflow state registry.

The coordinator owns membership and shared evidence. Keep artifact-local requirements, specifications, decisions, and tasks with their owners. Use the existing artifact and implementation task DAGs; membership creates no dependency and does not bypass plan approval or upstream establishment. Derive workflow and completion from knowledge, evidence, Git, and available approvals.

Prepare source_change provenance and delivery_tasks: change in each new version README. Keep tasks and DoD evidence in their originating changes, link new versions to those plans, and exclude tasks from new snapshots. New changes create fresh plans without historical task copies. Retain delivered changes while referenced. Preserve delivered versions and referenced evidence for historical outcomes; do not rewrite established legacy snapshots or invent their membership. Record combined checks in the brief and reference delivered task evidence where sufficient. Completion requires all member versions to establish and all shared acceptance/integration criteria to have supporting evidence.

The [current unit of work](docs/artifacts/units-of-work/task-retention-and-navigation/README.md) groups the ADD and Artifact Plane changes for task retention and navigation simplification.

Harness setup alone does not authorize a domain change, implementation, commits, pushes, or merges. Preserve existing edits and unrelated instructions.
