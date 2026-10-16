# Writing Artifacts

## Layout and Identity Record

Keep one working knowledge tree per artifact and edit it in place on a change branch. Do not copy knowledge into a change or a version. The [artifact model](../01-foundation/artifact-model.md#records) defines the layout, records and derived facts.

Write structural facts only in YAML front matter. Readers ignore prose, headings, links, fenced code blocks and commit messages for these facts. Write each fact once and explain it in the Markdown body.

The front matter of the artifact root README is the identity record:

```yaml
---
current_version: 1.2.0
depends_on: [tenant]
---
```

Use `current_version: null` before the first established version and `depends_on: []` when there is no dependency. `publication_reviews` is optional; see [evidence records](evidence-records.md). The body records purpose, scope, boundaries, and ownership. Do not write sections for the current version, dependencies, active change or workflow status, and do not add copied commit hashes or an approval registry. On a change branch, the identity record describes the proposed post-merge state.

## Change Record and Requirements

In `changes/change-<name>/README.md`, explain the reason for the change and its scope in prose. The change record needs no front matter. Its `tasks/` directory holds the plan and evidence.

Write requirements under `requirements/`. The PO defines what is needed and why, required outcomes, constraints, acceptance criteria, and potentially affected artifacts. Distinguish confirmed facts from assumptions. Resolve material blockers before Specification.

For example, after stakeholder confirmation: “A user can sign in to a tenant only when the user has active membership in that tenant.” Include examples of accepted and denied behavior where useful. Do not invent protocol details to make the requirement appear complete.

## Specifications and Decisions

Under `specifications/`, the TL defines precise behavior, owned domain terms/models, and all applicable interface contracts. Specify inputs, outputs, error behavior, and relevant lifecycle or consistency rules. Reference governing requirements.

Create an ADR in `decisions/` only for a necessary architectural choice involving multiple options. Record the context, alternatives, chosen option, reasoning, and consequences. A routine specification statement does not need an ADR.

## References and Dependencies

Declare detailed references in the front matter of the referring document. Each reference names the owning artifact, the element path relative to that artifact directory, and the reason:

```text
references:
  - artifact: tenant
    element: specifications/tenant-identity.md
    requires: tenant identifier format and lifecycle rules
```

A reference resolves in the same checked-out tree; readers label it proposed when the target differs from the protected branch. A supplier's proposal on another branch stays unresolved until it merges, and dependent Implementation waits for the supplier's version in any case.

Change artifact-level edges in `depends_on` of the identity record on the change branch. Keep the artifact DAG acyclic; runtime event flows are a different graph. Diagram arrows point from upstream prerequisite to dependent artifact.

## Implementation Plan and Tasks

Use `tasks/README.md` to organize tasks and their dependencies. Each task states its scope, repository or location, governing references, prerequisites, and concrete DoD checklist. Include integration work needed to validate parallel implementations.

For example, a task to implement tenant-scoped login might check that allowed login succeeds, login without membership is denied, and the defined response contract is satisfied. Choose exact checks from the confirmed requirements and specifications.

### Task Membership and Dependencies

For each new or materially revised plan, declare current task paths in YAML front matter in `tasks/README.md`:

```yaml
---
tasks:
  - 01-api.md
  - 02-interface.md
  - 03-integration.md
  - 04-validation.md
---
```

Paths are unique strings relative to `tasks/`, use forward slashes, and end in `.md`. Nested task paths are allowed. Each listed path must identify a readable Markdown task file inside the change's task directory. Reject `README.md` as a task, absolute paths, dot segments, backslashes, NUL, and paths that leave that directory. Unlisted files remain historical or contextual knowledge and do not enter the current graph.

Each listed task has YAML front matter with a stable ID and explicit internal prerequisites. For example, `03-integration.md` declares:

```yaml
---
id: integration
depends_on: [api, interface]
---
```

An ID is a nonempty string matching `[a-z0-9][a-z0-9-]*`. IDs are unique within the plan and remain stable when a task file is renamed. `depends_on` is a required list of unique task ID strings. Each prerequisite must resolve to a listed task in the same change. Use `depends_on: []` when there is no internal prerequisite. Unknown metadata keys do not define edges.

In this example, task `api` and task `interface` each declare `depends_on: []`. Task `integration` depends on both. Task `validation` declares `depends_on: [integration]`. The derived graph has four nodes and three edges, with arrows from prerequisite to dependent.

A one-task plan lists only that task, whose `depends_on` is empty. An explicit `tasks: []` is a valid empty plan. Create a fresh plan for each new change without copying completed tasks. Existing legacy unlisted tasks, such as `old-validation.md`, remain excluded. If current work reuses earlier behavior, define its current task and verify the applicable DoD again; earlier checks alone do not validate changed work.

### Validate the Task Graph

Validate membership first, resolve task prerequisites, then check for cycles. Reject malformed YAML or declarations, duplicate YAML mapping keys, wrong field types, missing listed files or metadata, duplicate task paths or IDs, duplicate prerequisites, absent prerequisite IDs, self-dependencies, and cycles. An invalid plan is not executable. Do not guess dependencies from prose, filenames, or Git order. Graph readers retain safely readable records and diagnostics without displaying invalid edges as execution order.

A legacy plan without a `tasks` declaration remains readable historical knowledge; its task graph is unavailable. A malformed declaration is invalid, not legacy unavailability. No standalone runner or CLI validator is required: authors and coordinators apply these rules in existing phase self-checks, and graph readers report diagnostics.

### External Gates and Evidence

Keep external artifact references and their reasons in specifications and task prerequisites. Do not put cross-artifact task IDs in `depends_on`. Required upstream established versions and explicit user approval still gate implementation. A task with no internal prerequisite can remain blocked by those gates. Preserve membership and task metadata in the retained originating change, not the version record.

Record commands or review methods, results, and relevant code/test references with tasks. Keep failed and incomplete checks visible. Retain delivered task evidence while any version or outcome references it. Do not overwrite a delivered plan for later work. Correct changed behavior in a new change and recheck its evidence. Historical evidence corrections remain visible in Git and remove affected completion support until revalidated.

Optional [evidence records](evidence-records.md) store explicit check facts and publication reviews in existing files. A source reference points to the owning check detail; avoid repeating results across records. Structured fields do not authorize work or prove execution.

## Unit-of-Work Brief

Use the [unit-of-work format](units-of-work.md) for outcome scope, structured membership, shared acceptance criteria, and combined evidence. Do not copy task plans or dependency graphs into the brief. Keep each fact under its owning artifact or outcome.

## Version Record

After validation, add `versions/<version>/README.md`. The directory name is the version:

```yaml
---
source_change: change-tenant-login
---
```

The body states the compatibility level with its reason, summarizes the resulting knowledge and links to the originating plan. Do not add knowledge directories, tasks or `delivery_tasks`. In the same branch, set `current_version` and any changed `depends_on` in the identity record. Retain the originating change while any version or outcome references it. The version establishes when all required knowledge and code land on `main` or `master`. Handle later defects or missing evidence with a new change, not with edits to an established version.

## Legacy Snapshot Layout

Readers still accept the snapshot-copy layout of older artifacts. Do not rewrite established legacy snapshots. To move an artifact to the in-place layout, follow the [migration procedure](../01-foundation/artifact-model.md#legacy-layout-and-migration).

## System-flow specifications

Write named behavior journeys under specifications/flows/<id>.md using the [system-flow format](system-flows.md). Flow records remain specification elements. Preserve stable IDs when paths change; update supporting source references. Do not copy flow authority into a unit brief, graph, or retrieval index.
