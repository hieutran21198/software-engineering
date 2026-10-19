# Artifact Model

## Structure

The following layout illustrates a project using ADD. It describes project artifacts, not the directory structure of this knowledge repository. New and migrated artifacts use this in-place layout.

```text
docs/artifacts/
├── units-of-work/
│   └── <outcome>/
│       └── README.md
└── tenant/
    ├── README.md               identity record, purpose, scope, ownership
    ├── requirements/           working knowledge
    ├── specifications/
    ├── decisions/
    ├── changes/
    │   └── change-<name>/
    │       ├── README.md       change record: reason and scope
    │       └── tasks/
    │           ├── README.md
    │           └── <task>.md
    └── versions/
        └── <major>.<minor>.<patch>/
            └── README.md       version record
```

Working knowledge is in `requirements/`, `specifications/` and `decisions/` directly under the artifact; nested directories are allowed and system flows stay under `specifications/flows/`. An artifact with at least one of these directories uses the in-place layout; otherwise it uses the [legacy layout](#legacy-layout-and-migration). Readers detect the layout per artifact.

## Units of Work

A unit of work groups one or more artifact changes around one deliverable outcome. Each participating change belongs to one unit; the initial format permits one change per artifact in a unit. Shared scope and acceptance criteria belong in its brief. Detailed requirements, contracts, decisions, and tasks remain with the owning artifacts.

The reserved units-of-work directory contains outcome briefs, not artifact roots or DAG nodes. Membership creates no execution edge. Existing artifact and task DAGs remain authoritative. Workflow, dependency projections, implementation gates, and completion are derived views. See [unit-of-work format](../06-guidelines/units-of-work.md).

## Records

Readers interpret structural facts only from YAML front matter, never from prose, headings, links, fenced code blocks or commit messages. Unknown keys create no relationship.

The front matter of the artifact root `README.md` is the identity record:

```yaml
---
current_version: 1.2.0
depends_on: [tenant]
---
```

`current_version` is a semantic version, or null before the first established version. `depends_on` lists upstream artifact IDs and can be empty. `publication_reviews` is optional; see [publication reviews](../06-guidelines/evidence-records.md#publication-reviews). The body records purpose, scope, boundaries and ownership. Readers derive the active change; do not write sections for it, the version or the dependencies.

The change record `changes/<change>/README.md` states the reason and scope in prose. Its `tasks/` directory holds the plan, DoD checklists and evidence. A change copies no knowledge.

The version record is `versions/<version>/README.md`:

```yaml
---
source_change: change-tenant-login
---
```

The directory name is the version. The body states the compatibility level with its reason and summarizes the result. A version record has no knowledge directories, tasks or `delivery_tasks`; delivery evidence is always in `changes/<source_change>/tasks/`. One version names one change, and one change produces at most one version.

## Identities

Logical identities stay stable across versions, branches and renames of other elements:

| Entity | Logical identity | Example |
| --- | --- | --- |
| Artifact | directory name | `tenant` |
| Element | `<artifact>:<path>`, relative to the artifact directory | `tenant:specifications/identity.md` |
| Flow and step | `<artifact>:<flow id>` and `:<step id>` | `tenant:tenant-login:verify` |
| Model | `<artifact>:<model id>` | `tenant:tenant` |
| Change | `<artifact>/<change>` | `tenant/change-tenant-login` |
| Task | `<artifact>/<change>/<task id>` | `tenant/change-tenant-login/api` |
| Version | `<artifact>@<version>` | `tenant@1.2.0` |
| Unit | directory name | `tenant-login` |

A reader adds the repository, worktree and Git revision to make a concrete identity.

## Git as the Version Store

Readers derive these facts; no file stores them:

| Fact | Derivation |
| --- | --- |
| Established knowledge | The artifact directory on `main` or `master`. |
| Proposed knowledge | Checked-out files that differ from established knowledge, including additions and removals. |
| Open change | A change directory that no version record names in `source_change` and that contains no knowledge directories. |
| Established version | `current_version` in the identity record on the protected branch, when its version record exists there. |
| Version snapshot | The tree of the first-parent protected-branch commit that introduced `versions/<version>/README.md`. A tag `<artifact>/<version>` on that commit is optional. |
| Proposed edges | The difference between the checked-out and protected `depends_on` lists. |
| Phase evidence | `self_check` in requirement, specification and plan documents; `evidence_records` and checklists in tasks; the version record. |
| Claims | Optional `claims` in requirement, specification, decision, plan, task and unit-brief front matter. A claim status describes evidence; it is not approval. See [claims](../06-guidelines/evidence-records.md#claims). |
| Approval | Not a file fact. Authorization comes from the user. |

A shallow clone, a missing protected ref or a version record without an introducing commit is a diagnostic. Readers never guess a baseline from names, timestamps or the largest version.

## Changes and Versions

The first change, `change-initial`, establishes version `1.0.0`. Each change starts on a dedicated branch, adds its change record and edits working knowledge in place: retain, amend, remove and add. It creates a fresh plan. List current task paths in the front matter of `tasks/README.md`; each listed task declares a stable `id` and a `depends_on` list, which define the task DAG. Unlisted task files are historical or contextual. See [task format](../06-guidelines/writing-artifacts.md#implementation-plan-and-tasks). Code and tests stay in implementation locations.

To prepare a version, add its version record, set `current_version` and any changed `depends_on`, and open the PR. The version establishes only after all required knowledge and implementation land on `main` or `master`. The coordinator stops for team review and merge; with no remote, ask the user how to finish.

Retain delivered changes while any version or outcome references them, and do not overwrite their plans. One active change per artifact remains a rule; two branches that edit the same knowledge conflict at merge. Address defects in the current implementation through a new change.

## Five-Phase Flow

| Phase | Input | Output |
| --- | --- | --- |
| 1 — Requirement | The business or technical need, or reason for a change. | `changes/change-<name>/README.md` and new or amended requirements in place. |
| 2 — Specification | Requirements and the established knowledge baseline. | New or amended specifications and applicable ADRs in `decisions/`. |
| 3 — Plan | Requirements and specifications. | `tasks/README.md` and implementation task files with DoD checklists. |
| 4 — Implementation | Tasks and their governing contracts. | Code, tests, and validation evidence recorded with tasks. |
| 5 — Version | A change whose implementation satisfies all applicable DoD criteria and dependency validation. | `versions/<version>/README.md` with `source_change` and the updated identity record. |

ADR work is part of Specification, not a sixth phase. Create an ADR only when a necessary architectural decision has multiple options to evaluate.

Dependency impact analysis runs throughout Requirement and Specification. Implementation findings can require revision of specifications, decisions, and tasks within the same change before work continues.

## Dependency Graph

The `depends_on` lists of the identity records define the graph; a change proposes edges by editing its own list. Readers check the established and proposed views for cycles. Dependencies use the current established version and do not pin older versions.

Each node is an artifact. Edges indicate Implementation prerequisites: required upstream changes complete and establish their versions before dependent Implementation proceeds. Requirement, Specification, and Plan can prepare against proposed contracts, then recheck them against the established contracts before Implementation. Detailed interface contracts remain in specifications.

## Explain dependency relationships

An artifact edge records a supplier-to-consumer implementation prerequisite. Its declaration alone does not explain which capability the consumer needs. Record that explanation in the consuming knowledge element's `references` front matter: owning artifact, supplying element and nonempty requires reason.

Readers can collect those reasons for the selected consumer knowledge and the actual supplier edge. Keep established and proposed relationships distinct. Missing or unresolved references remain information gaps; graph reachability and model participation do not prove a dependency reason or compatibility. Transitive paths contain several direct relationships and need an explanation for each edge.

Models inside artifacts and their flow interactions describe domain meaning. They are separate from artifact prerequisites and source documents. See [model and flow guidance](../06-guidelines/system-flows.md#models-inside-artifacts).

## Semantic Versioning

Use `<major>.<minor>.<patch>`. Start with `1.0.0` and suggest the next version with a reason:

| Level | Use when |
| --- | --- |
| Major | The change breaks an established contract or required consumer behavior. |
| Minor | The change adds capability while preserving compatibility. |
| Patch | The change corrects a defect or clarifies knowledge without breaking compatibility. |

Assess all affected interfaces, including APIs, events, data formats, and operational contracts. Suggest the highest applicable change level. The user confirms or overrides the suggestion.

## Legacy Layout and Migration

Older artifacts can use the snapshot-copy layout. Readers still accept it. In the legacy layout:

- The root README declares the current established version and the established dependencies in Markdown sections. `docs/artifacts/dag.yaml` indexes the established dependencies.
- A change copies the complete current version knowledge into `changes/<change>/requirements/`, `specifications/` and `decisions/`. It proposes edge updates in `changes/<change>/dependencies.yaml` with `add` and `remove` lists.
- A version directory holds a complete copy of the resulting knowledge. Versions prepared with provenance declare `source_change` and `delivery_tasks: change`. Versions without `delivery_tasks` keep version-owned task semantics. An invalid marker value is a diagnostic failure.
- References can carry `status` and `change` selectors and can appear in fenced YAML blocks.

Do not edit the knowledge of an established legacy snapshot, and do not add or infer provenance for it. You can delete it in a conversion (step 5), because Git keeps it. A change directory with copied knowledge directories is a retained legacy record, never an open in-place change. For in-place artifacts, readers ignore `dag.yaml` and `dependencies.yaml` and report them as unused. Selectors have no effect on in-place artifacts.

Migrate one artifact at a time on a change branch. Do the steps by hand or with a migration tool:

1. Verify the declared current version against the protected branch with the [reconciliation procedure](../06-guidelines/evidence-records.md#reconcile-a-version-declaration). Stop on ambiguity.
2. Copy `versions/<current_version>/requirements`, `specifications` and `decisions` to the artifact directory. If an open change carries copied knowledge, copy that knowledge instead, because it already contains the proposal. Then delete the copied knowledge directories from the change; the change keeps `README.md` and `tasks/`.
3. Replace the Markdown declarations in the artifact README with the identity record. Remove prose that describes proposed or established state; readers now derive that state.
4. Apply the edges of the open change's `dependencies.yaml` to `depends_on`, then delete the file. Delete `docs/artifacts/dag.yaml` when no legacy artifact remains.
5. Optionally convert the retained legacy records. Delete the knowledge directories of `versions/<version>/` and the copied knowledge and `dependencies.yaml` of delivered changes. Delete version-owned tasks that are byte-identical to the originating change's tasks; keep task sets without such a copy, and keep the copied knowledge of a change that no version names. Remove `delivery_tasks` markers, point evidence and links at the retained change tasks, and restate affirmative prose publication reviews as `publication_reviews` after you verify the merged PRs. The knowledge of a converted version is `versions/<version>/` in the tree of the commit that introduced its README. Without conversion, leave these directories unchanged.
6. Verify byte equality between the new working knowledge and its source, an unchanged dependency graph, resolved flows and units, and the layout detection.

A migration that changes no knowledge bytes keeps the current version number and adds no version record. A migration inside a change that also changes knowledge follows the normal version rule.
