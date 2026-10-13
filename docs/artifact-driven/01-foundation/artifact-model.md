# Artifact Model

## Structure

The following layout illustrates a project using ADD. It describes project artifacts, not the directory structure of this knowledge repository.

```text
docs/artifacts/
├── dag.yaml
├── units-of-work/
│   └── <outcome>/
│       └── README.md
└── tenant/
    ├── README.md
    ├── changes/
    │   └── change-<name>/
    │       ├── README.md
    │       ├── dependencies.yaml
    │       ├── requirements/
    │       ├── specifications/
    │       ├── decisions/
    │       └── tasks/
    │           ├── README.md
    │           └── <task>.md
    └── versions/
        └── <major>.<minor>.<patch>/
            ├── README.md
            ├── requirements/
            ├── specifications/
            ├── decisions/
            └── tasks/
                ├── README.md
                └── <task>.md
```

Use `decisions/` when applicable ADRs exist. Use `dependencies.yaml` in an active change when it proposes dependency updates.

## Units of Work

A unit of work groups one or more artifact changes around one deliverable outcome. Each participating change belongs to one unit; the initial format permits one change per artifact in a unit. Shared scope and acceptance criteria belong in its brief. Detailed requirements, contracts, decisions, and tasks remain with the owning artifacts.

The reserved units-of-work directory contains outcome briefs, not artifact roots or DAG nodes. Membership creates no execution edge. Existing artifact and task DAGs remain authoritative. Workflow, dependency projections, implementation gates, and completion are derived views. See [unit-of-work format](../06-guidelines/units-of-work.md).

## Root README

An artifact's root `README.md` records its purpose, scope, boundaries, ownership, established dependencies, and current established version. It points readers to detailed knowledge without duplicating it.

Proposed identity or dependency updates belong in the active change's README and dependency proposal. Apply them to the root README only when the change becomes established. The root README and new version must agree.

## Changes and Versions

The first change, `change-initial`, establishes version `1.0.0`. Subsequent changes start as complete copies of the current version.

Within a change, retain valid information, amend affected information, remove obsolete information, and add new information. Carry forward applicable completed tasks as historical context. Add new tasks for new implementation work and required validation.

For each new or materially revised plan, list current task paths in YAML front matter in `tasks/README.md`. Each listed task declares a stable `id` and a `depends_on` list. These declarations define the change's implementation task DAG. Unlisted task files remain historical or contextual knowledge. Replace the copied plan's task list with the current change's work; do not include inherited tasks automatically. Preserve the task list and declarations in the complete version snapshot. See [task format](../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks).

A version contains the complete resulting requirements, specifications, applicable decisions, and implementation plan. Task files retain their DoD checklists and validation evidence. Code and executable tests remain in the relevant implementation locations, with references from tasks where needed.

A newly prepared version README declares source_change in YAML front matter, identifying its originating artifact-local change. One version results from one change; one established version can claim that change. Do not add provenance retroactively to an established snapshot or infer it for legacy knowledge.

A snapshot prepared on a change branch is proposed. It becomes established only after all required knowledge and implementation changes land on `main` or `master`. The coordinator opens the PRs and stops for team review and merge. With no remote, ask the user how to complete integration; do not assume a solo merge.

Versions participating in a retained unit of work preserve its delivered knowledge and evidence. Keep their provenance and referenced evidence readable for historical completion; removing them makes that evidence unavailable. Other old changes and versions serve review purposes only. The current baseline must remain usable if that history is removed. If the current implementation has a defect or lacks required code, tests, or evidence, address it through a new change.

## Five-Phase Flow

| Phase | Input | Output |
| --- | --- | --- |
| 1 — Requirement | The business or technical need, or reason for a change. | `changes/change-<name>/README.md` and new or amended requirements. |
| 2 — Specification | Requirements and the established knowledge baseline. | New or amended specifications and applicable ADRs in `decisions/`. |
| 3 — Plan | Requirements and specifications. | `tasks/README.md` and implementation task files with DoD checklists. |
| 4 — Implementation | Tasks and their governing contracts. | Code, tests, and validation evidence recorded with tasks. |
| 5 — Version | A change whose implementation satisfies all applicable DoD criteria and dependency validation. | A complete `versions/<version>/` snapshot, the updated root README, and a consistent established DAG. |

ADR work is part of Specification, not a sixth phase. Create an ADR only when a necessary architectural decision has multiple options to evaluate.

Dependency impact analysis runs throughout Requirement and Specification. Implementation findings can require revision of specifications, decisions, and tasks within the same change before work continues.

## Established Dependency DAG

Store the current DAG at `docs/artifacts/dag.yaml`. It is a generated index of established dependencies from artifact root READMEs, not a second authority.

```yaml
artifacts:
  tenant:
    path: tenant
    depends_on: []
  authentication:
    path: authentication
    depends_on:
      - tenant
```

In this example, authentication depends on tenant. Paths are relative to `docs/artifacts/`. Dependencies use the current established version; they do not pin older versions.

Each node is an artifact. Edges indicate Implementation prerequisites: required upstream changes complete and establish their versions before dependent Implementation proceeds. Requirement, Specification, and Plan can prepare against proposed contracts, then recheck them against the established contracts before Implementation. Detailed interface contracts remain in specifications.

## Proposed Dependencies

Store proposed edge updates in the dependent artifact's active change, for example `authentication/changes/change-tenant-login/dependencies.yaml`:

```yaml
artifact: authentication
add:
  - tenant
remove: []
```

Planning combines the established graph with active proposals to determine execution order. It keeps proposal status visible and checks the resulting graph for cycles. Proposed edges do not become established until their owning change is complete.

When establishing a version, update its root README's dependencies and regenerate the established DAG together. Validate that the graph and artifact READMEs agree.

## Semantic Versioning

Use `<major>.<minor>.<patch>`. Start with `1.0.0` and suggest the next version with a reason:

| Level | Use when |
| --- | --- |
| Major | The change breaks an established contract or required consumer behavior. |
| Minor | The change adds capability while preserving compatibility. |
| Patch | The change corrects a defect or clarifies knowledge without breaking compatibility. |

Assess all affected interfaces, including APIs, events, data formats, and operational contracts. Suggest the highest applicable change level. The user confirms or overrides the suggestion.
