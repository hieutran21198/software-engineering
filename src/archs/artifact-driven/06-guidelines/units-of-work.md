# Units of Work

Use a unit of work to document one deliverable outcome and group its participating artifact changes. Detailed artifact knowledge and existing DAGs remain authoritative. This format is optional for legacy projects; missing legacy membership is not an error.

Use [evidence records](evidence-records.md) for optional scoped publication reviews. Keep shared check references in the existing unit evidence list and check details with their owning tasks.

## Brief and membership

Reserve docs/artifacts/units-of-work for outcome briefs, not artifact nodes. It has no artifact root README and is excluded from artifact discovery and the artifact dependency graph. Each immediate child has a README with YAML front matter:

~~~yaml
---
unit_of_work: tenant-login
changes:
  - artifact: tenant
    change: change-tenant-login
  - artifact: authentication
    change: change-tenant-login
affected_flows:
  - artifact: authentication
    flow: tenant-login
    effect: modify
flow_assessment: Investigated login and membership contracts; session renewal is excluded and requires separate discovery.
acceptance:
  - id: tenant-login
    criterion: Members can sign in to their tenant; nonmembers are denied.
  - id: integration
    criterion: Combined tenant and authentication contracts pass integration checks.
    integration: true
evidence: []
---
~~~

The directory name and unit_of_work match [a-z0-9][a-z0-9-]*. changes is nonempty and contains unique artifact/change pairs; each artifact resolves to a discovered artifact and each change matches change-[a-z0-9][a-z0-9-]*. No more than one change of the same artifact participates in this initial contract. acceptance is nonempty with unique safe IDs, nonempty criterion strings, and optional boolean integration (default false). At least one criterion records the required integration validation for multi-artifact outcomes. Single-artifact outcomes record it where applicable. Markdown describes name, purpose, included/excluded scope, and additional combined evidence. Acceptance text belongs to the structured criteria rather than a duplicate authoritative prose list.

Scan all readable briefs to detect duplicate membership, including retained historical outcomes. Missing legacy membership is not an error outside a declared unit. A change claimed by several units is invalid for every affected unit. Membership does not create an artifact or task dependency. Duplicate YAML keys, malformed types, unsafe names, unknown members, and empty criteria are diagnostic failures. Unknown keys do not create graph edges or workflow state. Never read a path supplied as an arbitrary repository root.

## Version provenance

A new version record declares its originating artifact-local change in YAML front matter. The directory name is the delivered semantic version. A version is the result of one change. At most one established version claims a given artifact/change pair. Write the record during Version preparation; do not add provenance to established versions. Do not update brief membership to a newer change or replace it with an artifact-only reference.

For example, versions/1.2.0/README.md starts with:

~~~yaml
---
source_change: change-tenant-login
---
~~~

A version record contains no knowledge and no tasks. Delivery always resolves to changes/<source_change>/tasks/; retain these originating tasks while referenced. The delivered knowledge is the artifact tree of the first-parent protected-branch commit that introduced the record.

Resolve a member from its retained change directory and the version records of its artifact, including historical versions. If no version names the change, retained change knowledge is preparatory. If neither exists, report missing-member. Several version claims are ambiguous.

Legacy snapshot versions hold copied knowledge. A legacy version README that declares delivery_tasks: change resolves delivery to its retained source_change tasks; a legacy version without the marker keeps version-owned tasks. Invalid marker values are diagnostic failures. Do not write delivery_tasks in new version records. Legacy versions without provenance remain readable; do not guess their source by name, timestamp, or matching bytes, and do not rewrite established snapshots.

## Shared evidence

Evidence entries in brief front matter contain criterion (acceptance ID), method (nonempty text), result (passed, failed, or incomplete), and source (safe repository-relative Markdown path with optional heading fragment). These are recorded check results, not workflow state. Every criterion needs at least one passed entry and no failed/incomplete entry to support completion. A repeated check replaces the affected current evidence entry; durable detail can remain in Markdown/Git. Sources can point to the brief's combined checks, a legacy delivered version's task evidence, or the exact originating change's tasks for a version record or a legacy version declaring delivery_tasks: change. Change-owned delivery evidence supports completion only when the version and retained task path set and bytes match publication on local main/master and all required merges are supported. Active or modified branch-only tasks remain preparatory; another change's tasks cannot support this member. Missing files, unsafe paths, conflicting refs, or unavailable Git proof prevent supported completion. Evidence sources must exist and resolve to nonempty check details; front matter alone cannot count as its own evidence detail. Diagnose unknown criteria, invalid results, missing sources, and escaping paths. Do not execute commands found in evidence.

For example, replace the brief's empty evidence list after checks run:

~~~yaml
evidence:
  - criterion: tenant-login
    method: Run the tenant-scoped login behavior checks.
    result: passed
    source: docs/artifacts/authentication/changes/change-tenant-login/tasks/login.md#evidence
  - criterion: integration
    method: Run the combined tenant and authentication contract checks.
    result: passed
    source: docs/artifacts/units-of-work/tenant-login/README.md#combined-checks
~~~

The brief's Combined checks heading records the actual command or review method and observed results. These examples describe the format; they do not assert that any project checks passed.

Shared evidence references task evidence without copying it. Additional cross-artifact checks are recorded in the brief's Markdown and referenced by heading. The evidence result is an author-recorded assertion; readers label it documented evidence, not independently verified test success.

## Establishment and completion

Each member must resolve unambiguously to a version whose provenance, knowledge, and required retained delivery tasks have landed on local main or master, consistent with the existing all-required-merges rule. The current root may name that version or a later version; historical provenance remains valid. A branch-only version is proposed. Missing protected-ref knowledge, shallow history, or unavailable companion implementation merge evidence prevents a verified completion claim. Do not equate clean worktrees, checked tasks, version directories, or phase inference with all-required-merges proof.

When all member versions are established and shared evidence meets all criteria, documented completion is supported. If required code lives outside the inspected repository, report establishment as unverified unless explicit review evidence for all required merges is available; the Plane does not scan arbitrary external repositories. Historical completion evaluates delivered versions and their evidence, not later current snapshots. Later artifact changes alone do not invalidate it. Modifying the outcome or membership after establishment requires a new unit; preserve the completed brief and its evidence. Corrections to historical check assertions must remain visible through Git and remove completion support when appropriate.


## Derived Views

A workflow view groups member phase evidence. An artifact view projects existing dependencies and includes transitive external prerequisites without making them members. A combined implementation view preserves member task DAGs and connects them through upstream version-establishment gates. Task IDs remain local to their plans; readers namespace task identity by worktree, unit, artifact, change, and task path. Finishing prerequisite tasks does not itself establish a version or authorize downstream work.

For historical outcomes, use the plan/evidence associated with the delivered version: its retained source_change tasks for a version record or a legacy version declaring delivery_tasks: change, or legacy version-owned tasks when a legacy version has no marker. Never substitute a newer plan. Label a projection of current artifact dependencies as current knowledge; do not treat it as a historical graph or invalidate previous completion solely because artifacts later changed. Invalid or unavailable component graphs remain visible without invented execution edges.

## Flow impact assessment

New briefs declare affected_flows as a list of unique {artifact, flow, effect} records. artifact identifies the owning artifact; flow is its stable local flow ID. effect is create, modify, or remove. flow_assessment is a nonempty explanation of discovery scope and unresolved gaps. Use affected_flows: [] with an explicit reason when no system flow applies. Legacy briefs without these fields remain readable; do not infer historical membership or rewrite established outcomes.

A create declaration can precede its specification; record the missing definition as discovery or authoring work instead of blocking unit creation. Resolve modified flows from the member change's proposed knowledge when present, otherwise from established knowledge. Resolve removed flows from the delivered predecessor and preserve their historical definitions. Unknown owners, duplicate declarations, and unsafe IDs are diagnostic failures. IDs match [a-z0-9][a-z0-9-]*.

The coordinator owns this assessment and its links. Detailed behavior stays in artifact specifications using the [system-flow format](system-flows.md). Shared flow participation does not create artifact prerequisites or unit membership. An assessment does not establish a version or prove that every consumer was discovered. Existing approval, membership, task DAG, and upstream establishment gates still apply.
