# Getting Started

## Choose Where Knowledge Lives

Use a dedicated knowledge repository with separate implementation repositories, or one repository containing knowledge and multiple apps/services. Choose the knowledge workspace explicitly.

Adopt the ADD bundle there with `se-adopt --arch artifact-driven --project /path/to/knowledge-workspace`. The command supplies guidance and skills; it does not create project artifacts, register agents, or publish changes. Refer to the adoption guide supplied with the bundle for binary download and checksum instructions.

## Start with One Capability

Choose a cohesive business or technical capability, such as tenant management or deployment infrastructure. Identify its purpose, boundaries, owner, and known dependencies. For business capabilities, use strategic DDD to investigate the boundary rather than splitting by table or endpoint.

Create a dedicated branch for the work. Do not commit directly to `main` or `master`. For a new artifact, create `docs/artifacts/<artifact>/README.md` as a proposed identity and start `changes/change-initial/`. State that no established version exists yet; do not claim `1.0.0` before implementation, validation, and merge.

For an existing artifact, resolve its current version from the root README and copy its complete knowledge into the single active change, excluding legacy tasks and delivered provenance metadata. Retain valid knowledge, amend affected items, remove obsolete items, and create a fresh plan in Plan. Previous tasks stay with their originating changes.

## Group the Outcome

For work that spans artifact changes, write a [unit-of-work brief](units-of-work.md). Identify one deliverable outcome, included/excluded scope, participating changes, and shared acceptance criteria. A unit can have one member. Each participating change belongs to one unit, and each artifact retains its existing ownership and single-active-change rule. Existing projects can continue without briefs; do not invent legacy membership.

## Complete the Change

1. The PO interviews stakeholders, writes requirements, self-checks, and commits the completed phase.
2. The TL writes specifications and necessary ADRs, performs impact analysis, self-checks, and commits.
3. The TL writes the implementation plan in the same working session. Declare current task paths in `tasks/README.md` and stable `id` and `depends_on` fields in each listed task. Check membership, prerequisite resolution, and acyclicity, then commit the completed Plan.
4. The user reviews and explicitly approves the plan before implementation.
5. Implementers complete tasks and record DoD evidence. The coordinator integrates results and validates the combined change.
6. Record shared integration evidence where applicable. Prepare complete version knowledge without tasks. Declare source_change and delivery_tasks: change, link to the retained originating plan, and prepare root README and DAG updates. Open the required PRs and stop for team review and merge.

The first version is `1.0.0`. Later versions use semantic versioning with a suggested compatibility level confirmed by the user. A version establishes only when all required knowledge and implementation changes land on `main` or `master`.

## Handle Dependencies and Corrections

Preparation can use clearly identified proposed upstream contracts. Dependent Implementation waits for required upstream versions to establish, then rechecks the prepared work against them.

The task DAG orders implementation within the change; it does not replace the artifact DAG. List only current work, including needed integration and validation. Do not copy historical tasks into new changes. Legacy unlisted tasks remain excluded from their plan graphs. Legacy plans without declarations remain readable with an unavailable task graph. See [task format](writing-artifacts.md#implementation-plan-and-tasks).

Return blockers to the owning phase. A new plan or material change requires renewed user approval. Do not create another active change to bypass a blocker in the current one.

With no remote, ask how the user wants to finish rather than assuming a local merge. One person can perform multiple roles, but still follows the phase checks and explicitly decides the integration path.
