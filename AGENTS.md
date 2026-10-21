# Repository Instructions

## Documentation Flow

Documentation follows a waterfall flow from parent pages to child pages. Parent pages may link to child documentation. Child pages must not reference or link back to parent or ancestor documentation, including the repository overview.

When adding or moving documentation, check links against this hierarchy. A relative path containing `../` is not necessarily a parent reference; resolve its destination before deciding whether it violates the rule.

## Artifact-Driven Development

Use `docs/artifact-driven` as the canonical ADD bundle. This Git repository contains both the knowledge workspace and the implementation workspace (`cmd/`, `internal/`, `src/`, and `website/`). Project artifacts belong in `docs/artifacts`; do not treat the reusable bundle as project artifacts. Inspect the actual repository layout when a change involves other workspaces.

For ADD changes, use the `add-coordinator` skill to interview the user and drive the workflow. The `add-product-owner` role owns Requirement. The `add-technical-lead` role completes Specification and Plan sequentially in the same capable session. The `add-implementer` role executes approved tasks. Antigravity and Codex discover the six bundled skills through `.agents/skills`; project role profiles for Codex live in `.codex/agents`. Claude Code discovers the same skills through `.claude/skills`. Resolve skill references from their canonical directories under `docs/artifact-driven`.

Every ADD role applies the KISS and STE checklist of its skill core during existing self-checks, and reads the full `docs/artifact-driven/required-skills/kiss/SKILL.md` and `docs/artifact-driven/required-skills/asd-ste-100/SKILL.md` when the checklist is not enough. Preserve the full bundle and its references. Report missing capabilities and use sequential execution when parallel agents are unavailable. Inherit the current model and permissions; report if the available model cannot meet the TL's needs.

Assign each change a [tier](docs/artifact-driven/06-guidelines/change-tiers.md). For a medium or large change, complete Requirement, Specification, and Plan with self-checks and separate phase commits on a dedicated branch, then present the plan and wait for explicit user approval before implementation. A small change follows the small-tier path: the three phases in one knowledge commit, and the user's request as its plan approval. A new plan or material change requires renewed approval. Dependent implementation waits for required upstream established versions. Use separate Git worktrees and branches for independent parallel implementers; keep artifact updates under the coordinator's control.

Validate task DoD and the integrated change. Prepare proposed versions and linked PRs for changed repositories, then stop for team review and merge. Never commit directly to `main`, `master`, or another protected branch. A version becomes established only after all required knowledge and code land on `main` or `master`. If a repository has no remote, ask the user how to finish. Derive progress from artifacts, task evidence, Git, and available user approval; do not add a workflow state database.

## Project Units of Work

Use a unit of work for each new medium or large ADD outcome in this project, including outcomes with one artifact change. A small outcome with one change needs no unit brief. Follow the [unit-of-work format](docs/artifact-driven/06-guidelines/units-of-work.md). Store briefs at docs/artifacts/units-of-work/<name>/README.md with one deliverable outcome, included/excluded scope, structured member changes, shared acceptance criteria, and validation evidence. Each participating change belongs to exactly one unit. The directory contains outcome knowledge, not artifact nodes or a workflow state registry.

The coordinator owns membership and shared evidence. Keep artifact-local requirements, specifications, decisions, and tasks with their owners. Use the existing artifact and implementation task DAGs; membership creates no dependency and does not bypass plan approval or upstream establishment. Derive workflow and completion from knowledge, evidence, Git, and available approvals.

Project artifacts use the in-place layout: edit requirements, specifications and decisions directly under the artifact on the change branch, and copy nothing into changes or versions. Each new version is a version record README with source_change only; set current_version and depends_on in the artifact README front matter. Keep tasks and DoD evidence in their originating changes; new changes create fresh plans without historical task copies. Retain delivered changes while referenced. Preserve delivered versions and referenced evidence for historical outcomes; do not edit established legacy snapshots or invent their membership. This repository's legacy records are converted to version records; their knowledge stays in the Git commits that introduced them. Record combined checks in the brief and reference delivered task evidence where sufficient. Completion requires all member versions to establish and all shared acceptance/integration criteria to have supporting evidence.

The [current unit of work](docs/artifacts/units-of-work/legacy-conversion/README.md) converts this repository's retained legacy records to version and change records.

Harness setup alone does not authorize a domain change, implementation, commits, pushes, or merges. Preserve existing edits and unrelated instructions.
