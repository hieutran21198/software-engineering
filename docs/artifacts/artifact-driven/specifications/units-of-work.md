# Unit-of-work knowledge contract

Governs U1–U5 in requirements/units-of-work.md. This extension amends the copied knowledge contract's artifact-local description of coordinated work. A change is an artifact-local knowledge revision; a unit of work groups changes around one deliverable outcome. Existing artifact ownership, phase order, approval, task format, and establishment rules remain valid.

## Brief and membership

Reserve docs/artifacts/units-of-work for outcome briefs, not artifact nodes. It has no artifact root README and is excluded from artifact discovery and dag.yaml. Each immediate child has a README with YAML front matter:

~~~yaml
---
unit_of_work: tenant-login
changes:
  - artifact: tenant
    change: change-tenant-login
  - artifact: authentication
    change: change-tenant-login
acceptance:
  - id: tenant-login
    criterion: Members can sign in to their tenant; nonmembers are denied.
  - id: integration
    criterion: Combined tenant and authentication contracts pass integration checks.
    integration: true
---
~~~

The directory name and unit_of_work match [a-z0-9][a-z0-9-]*. changes is nonempty and contains unique artifact/change pairs; each artifact resolves to a discovered artifact and each change matches change-[a-z0-9][a-z0-9-]*. No more than one change of the same artifact participates in this initial contract. acceptance is nonempty with unique safe IDs, nonempty criterion strings, and optional boolean integration (default false). At least one criterion records the required integration validation for multi-artifact outcomes. Single-artifact outcomes record it where applicable. Markdown describes name, purpose, included/excluded scope, and additional combined evidence. Acceptance text belongs to the structured criteria rather than a duplicate authoritative prose list.

Scan all readable briefs to detect duplicate membership, including retained historical outcomes. Missing legacy membership is not an error outside a declared unit. A change claimed by several units is invalid for every affected unit. Membership does not create an artifact or task dependency. Duplicate YAML keys, malformed types, unsafe names, unknown members, and empty criteria are diagnostic failures. Unknown keys do not create graph edges or workflow state. Never read a path supplied as an arbitrary repository root.

## Version provenance

A newly prepared version record declares its originating artifact-local change with YAML front matter: source_change: change-tenant-login. In the in-place layout of knowledge-layout.md, delivery_tasks is not written, and delivery always resolves to changes/<source_change>/tasks/. In the legacy layout, a version prepared with provenance also declares delivery_tasks: change. The directory's semantic version identifies the delivered version. A version is the complete result of one change. At most one established version claims a given artifact/change pair. Write provenance during Version preparation, not into existing established snapshots. Do not update brief membership to a newer change or replace it with an artifact-only reference.

Resolve a member from its retained change directory and version provenance. Inspect safe immediate version directories' README metadata, including historical versions; read detailed knowledge for the resolved delivered versions and their retained originating plans.

The table gives the resolution result for each condition of a member's version provenance. A row that starts with "In-place layout" or "Legacy layout" applies only to a version in that layout. In the in-place layout, a version record has no delivery_tasks marker.

| Member condition | Resolution result |
| --- | --- |
| In-place layout: a version record names the change in source_change | Delivery resolves to `changes/<source_change>/tasks/` of the exact retained originating change |
| Legacy layout: the version declares delivery_tasks: change | Requires the exact retained originating change |
| Legacy layout: the version has no delivery_tasks marker | The legacy version-owned plan is preserved |
| Legacy layout: delivery_tasks has a value other than the literal change | Diagnosed as invalid |
| No originating version exists | Retained change knowledge is preparatory |
| Neither a version nor a retained change exists | Report missing-member |
| Several versions claim the change | Ambiguous |
| Legacy version without provenance | Readable; its source is not guessed by name, timestamp or matching bytes |

Source: artifact-driven:specifications/units-of-work.md, Version provenance paragraphs 1 and 2; derived one row per stated member condition; current snapshot.

Legacy versions without provenance remain readable; do not guess their source by name, timestamp, or matching bytes.

## Shared evidence

Evidence entries in brief front matter contain criterion (acceptance ID), method (nonempty text), result (passed, failed, or incomplete), and source (safe repository-relative Markdown path with optional heading fragment). These are recorded check results, not workflow state. Every criterion needs at least one passed entry and no failed/incomplete entry to support completion. A repeated check replaces the affected current evidence entry; durable detail can remain in Markdown/Git. Sources can point to the brief's combined checks, a legacy delivered version's task evidence, or the exact retained originating change's task evidence for a version whose delivery resolves to that change: an in-place version record, or a legacy version declaring delivery_tasks: change. Completion requires publication of version knowledge and an identical protected-ref retained task set, plus all-required-merges proof. Missing, modified, ambiguous, unsafe, unavailable, or branch-only task sources cannot support historical completion. Another change's tasks cannot support this member. Evidence sources must exist and resolve to nonempty check details; front matter alone cannot count as its own evidence detail. Diagnose unknown criteria, invalid results, missing sources, and escaping paths. Do not execute commands found in evidence.

Shared evidence references task evidence without copying it. Additional cross-artifact checks are recorded in the brief's Markdown and referenced by heading. The evidence result is an author-recorded assertion; readers label it documented evidence, not independently verified test success.

## Establishment and completion

Each member must resolve unambiguously to a version whose provenance, complete knowledge snapshot, and required retained delivery tasks have landed on local main or master, consistent with the existing all-required-merges rule. The current root may name that version or a later version; historical provenance remains valid. A branch-only snapshot is proposed. Missing protected-ref knowledge, shallow history, or unavailable companion implementation merge evidence prevents a verified completion claim. Do not equate clean worktrees, checked tasks, version directories, or phase inference with all-required-merges proof.

When all member versions are established and shared evidence meets all criteria, documented completion is supported. If required code lives outside the inspected repository, report establishment as unverified unless explicit review evidence for all required merges is available; the Plane does not scan arbitrary external repositories. Historical completion evaluates delivered versions and their evidence, not later current snapshots. Later artifact changes alone do not invalidate it. Modifying the outcome or membership after establishment requires a new unit; preserve the completed brief and its evidence. Corrections to historical check assertions must remain visible through Git and remove completion support when appropriate.

## Guidance and delivery

Update definitions, artifact model, author/getting-started guidance, and coordinator/PO/TL/implementer guidance in the canonical bundle and matching packaged sources. A coordinator records cross-artifact scope in a brief; roles keep detailed knowledge under its owner. Add source_change during new version preparation. In the in-place layout, do not write delivery_tasks; add delivery_tasks: change only to a new version of an artifact that uses the legacy layout. Snapshot layout changes for new deliveries; legacy knowledge remains readable without migration. Avoid a required migration or second DAG store.

## Impact and self-check

ADD has no upstream artifact prerequisite. Plane consumes established unit semantics. The optional publication review extension is defined in evidence-records.md and requires its own publication before dependent implementation. Preserve documentation waterfall links, full required skills, bundle/adoption fidelity, and existing task DAG semantics. U1–U5 map to membership, provenance, evidence, compatibility, and diagnostics. KISS uses two small metadata extensions and references; STE distinguishes recorded evidence from verified establishment. No blocker remains for Plan.

## Project adoption extension

Apply U6 through the repository AGENTS.md: new project ADD outcomes use a unit brief, including single-member outcomes, except that a single-member outcome whose tier is not in `unit_brief.required_for` of [delivery-tiers.md](delivery-tiers.md) (default: small) needs no brief. A brief evidence entry keeps a one-line method and does not copy task evidence text ([record-checks.md](record-checks.md#single-source-records)). The coordinator owns membership/shared evidence. Existing task, approval, and upstream gates remain valid. The current brief groups artifact-driven/change-units-of-work and artifact-plane/change-units-of-work. The user directly authorized this adoption during implementation; it adds project instructions and no new implementation dependency.
