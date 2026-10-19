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

In `changes/change-<name>/README.md`, explain the reason for the change and its scope in prose. The only front-matter key of the change record is the optional `tier`; see [change tiers](change-tiers.md). A small change README also holds its plan paragraph. Its `tasks/` directory holds the plan and evidence.

Write requirements under `requirements/`. The PO defines what is needed and why, required outcomes, constraints, acceptance criteria, and potentially affected artifacts. Distinguish confirmed facts from assumptions. Resolve material blockers before Specification.

For example, after stakeholder confirmation: “A user can sign in to a tenant only when the user has active membership in that tenant.” Include examples of accepted and denied behavior where useful. Do not invent protocol details to make the requirement appear complete.

### Requirement IDs

Give each requirement and each acceptance criterion an ID. Write it as the label of a list item: `- `, the ID, `:` and a space.

```text
- TL1: A user can sign in to a tenant only when the user has active membership in that tenant.
- TL2: A user without membership gets the error `membership-required`.
```

The ID matches `[A-Z][A-Z0-9]*[0-9]+` and is unique in its file. Older files can use a paragraph label instead: the line starts with the ID, `.` and a space, as in `R4. Group bursts …`. A paragraph label is also an ID, and `covers` can name it; changing it to a list item with the same ID adds no ID. Write new IDs in the list form. A requirement file that a change creates or edits should have at least one ID in the list form. A file without list-form IDs stays valid; the validator reports `requirement-ids-missing` as information. You do not have to add IDs to files that the change does not edit.

## Specifications and Decisions

Under `specifications/`, the TL defines precise behavior, owned domain terms/models, and all applicable interface contracts. Specify inputs, outputs, error behavior, and relevant lifecycle or consistency rules. Reference governing requirements.

Create an ADR in `decisions/` only for a necessary architectural choice involving multiple options. Record the context, alternatives, chosen option, reasoning, and consequences. Give one reason for each rejected alternative. A routine specification statement does not need an ADR.

Record a consequential decision, assumption, hypothesis or root cause as an optional [claim](evidence-records.md#claims) in the front matter of the document that owns it. Keep the check detail in that document's body.

## Representations

Write the knowledge as text first. Add a table, listing or diagram only when the [visual representation guide](visual-representations.md) selects one for the structure of the information. Requirements use example scenarios, comparisons and measurement tables. Specifications use contract tables and sequence, state, containment and flow diagrams. Decisions use an alternatives table. Plans rely on the task graph that readers derive from the task list. Tasks record evidence tables. Each semantic diagram has an introduction, an accessible title and description, and a source line, and the owning self-check validates it.

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

Use `tasks/README.md` to organize tasks and their dependencies. Each task states its scope, repository or location, the requirement IDs that it covers, and a concrete DoD checklist. `depends_on` is the only prerequisite record of a task: a task has no Prerequisites section and does not restate the plan approval. Include integration work needed to validate parallel implementations.

The plan front matter can declare `compatibility` (`patch`, `minor` or `major`). The plan does not state a version number; the coordinator computes it at Version ([change tiers](change-tiers.md#compatibility-level-and-version-number)).

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

A task declares the requirement IDs that it covers in `covers`. It replaces a prose list of governing requirements:

```yaml
---
id: api
depends_on: []
covers:
  - element: requirements/tenant-login.md
    ids: [TL1, TL2]
  - artifact: tenant
    element: requirements/membership.md
    ids: [M3]
---
```

`element` is a path under `requirements/`. `artifact` is optional and defaults to the artifact of the task. `ids` is a nonempty list of IDs of that file. An ID that the file does not define is the error `covers-unknown-id`. An ID that the change adds or changes, and that no task of the plan covers, is the warning `requirement-uncovered`. The plan needs no prose coverage paragraph.

In this example, task `api` and task `interface` each declare `depends_on: []`. Task `integration` depends on both. Task `validation` declares `depends_on: [integration]`. The derived graph has four nodes and three edges, with arrows from prerequisite to dependent.

A one-task plan lists only that task, whose `depends_on` is empty. An explicit `tasks: []` is a valid empty plan. Create a fresh plan for each new change without copying completed tasks. Existing legacy unlisted tasks, such as `old-validation.md`, remain excluded. If current work reuses earlier behavior, define its current task and verify the applicable DoD again; earlier checks alone do not validate changed work.

### Validate the Task Graph

Validate membership first, resolve task prerequisites, then check for cycles. Reject malformed YAML or declarations, duplicate YAML mapping keys, wrong field types, missing listed files or metadata, duplicate task paths or IDs, duplicate prerequisites, absent prerequisite IDs, self-dependencies, and cycles. An invalid plan is not executable. Do not guess dependencies from prose, filenames, or Git order. Graph readers retain safely readable records and diagnostics without displaying invalid edges as execution order.

A legacy plan without a `tasks` declaration remains readable historical knowledge; its task graph is unavailable. A malformed declaration is invalid, not legacy unavailability. The [validator](#check-records-with-the-validator) checks these rules; it is not required, but use it when it is available. Without it, authors and coordinators apply these rules in existing phase self-checks, and graph readers report diagnostics.

### External Gates and Evidence

Keep external artifact references and their reasons in specifications. Do not put cross-artifact task IDs in `depends_on`. Required upstream established versions and plan approval still gate implementation: explicit approval for a medium or large change, and the owner's request for a small change. A task with no internal prerequisite can remain blocked by those gates. Preserve membership and task metadata in the retained originating change, not the version record.

Record commands or review methods, results, and relevant code/test references with tasks. Keep failed and incomplete checks visible. Retain delivered task evidence while any version or outcome references it. Do not overwrite a delivered plan for later work. Correct changed behavior in a new change and recheck its evidence. Historical evidence corrections remain visible in Git and remove affected completion support until revalidated.

Optional [evidence records](evidence-records.md) store explicit check facts and publication reviews in existing files. A source reference points to the owning check detail; avoid repeating results across records. Structured fields do not authorize work or prove execution.

### Single-source records

Write each fact once and link to it from other records:

- A task does not restate its `depends_on` or the plan approval.
- A task `evidence_records` entry can omit `source`. Its source is then the `#evidence` heading of the same task file. A phase document still declares the `source` of its `self_check`.
- A unit brief evidence entry has `criterion`, a one-line `method`, `result` and `source`. The brief does not copy task evidence text, test counts or acceptance text of requirement files.
- Write a numeric result, such as a test count, in the task that produced it. Other records link to it.
- A version record states the compatibility level, its reason and a summary of at most three sentences.

## Check records with the validator

The bundle directory `tools/` can contain the validator `add-validate.mjs`. It runs with Node.js 24 or later and needs no other package. It is not required, but use it when it is available:

```sh
node docs/artifact-driven/tools/add-validate.mjs --change <artifact>/<change>
```

Without `--change`, it checks all knowledge of the repository. `--repository <path>` selects another repository root. It writes one JSON object with the schema `add-validate.result.v1`: `ok`, sorted `diagnostics` with `code`, `severity`, `path` and `message`, and, with `--change`, the `tier` object of [change tiers](change-tiers.md#check-the-tier). Exit status 0 means no error, 1 means at least one error, 2 means invalid arguments or a repository that it cannot read. The validator never writes files, runs commands found in records, fetches or pushes.

| Code | Severity | Rule |
| --- | --- | --- |
| reader codes | as defined | The structural rules of records, task graphs, unit briefs, flows and claims in these guides. |
| `source-unresolved` | error | A `self_check`, `evidence_records` or unit evidence source does not resolve to a nonempty section. |
| `link-broken` | error | A relative Markdown link in `docs/artifacts/**` does not resolve to a file. External links, the fragment, and links in code spans and fenced code are not checked. |
| `placeholder-text` | error | A record contains placeholder text of the scaffold. |
| `version-identity-mismatch` | error | The identity `current_version` has no version record, or a version record has no `source_change` directory. |
| `version-number-invalid` | error | A version record that is not on the protected branch is not the number computed from the plan level and the protected `current_version`. |
| `upstream-unestablished` | warning | A `depends_on` target has no established version on the protected branch. |
| `requirement-id-duplicate` | error | An ID occurs twice in one requirement file, in either form. |
| `requirement-ids-missing` | info | A requirement file that the change edits has no ID in the list form. |
| `covers-unknown-id` | error | A `covers` ID that its element does not define. |
| `requirement-uncovered` | warning | An added or changed requirement ID that no task of the plan covers. |
| `tier-mismatch` | error | The declared tier is `small` and a criterion fails or is unresolved. |
| `open-change-conflict` | warning | Another local or remote-tracking branch has an open change on the same artifact, or edits the same knowledge file. |
| `config-invalid` | error | `docs/artifacts/add.config.yaml` has an unknown key or a wrong type. |

When the validator is available, a phase self-check runs it with `--change` and records one line in the `self_check` source section: the command and `ok: true`. The section then states only the checks that need judgment: meaning, KISS, STE, claims and representations. Without the validator, apply the rules of this table by hand.

## Unit-of-Work Brief

Use the [unit-of-work format](units-of-work.md) for outcome scope, structured membership, shared acceptance criteria, and combined evidence. Do not copy task plans or dependency graphs into the brief. Keep each fact under its owning artifact or outcome.

## Version Record

After validation, add `versions/<version>/README.md`. The directory name is the version:

```yaml
---
source_change: change-tenant-login
---
```

The directory name is the number that the coordinator computes from the confirmed compatibility level and `current_version` on the protected branch ([change tiers](change-tiers.md#compatibility-level-and-version-number)). The body states the compatibility level with its reason and a summary of at most three sentences, and links to the originating plan. Do not add knowledge directories, tasks or `delivery_tasks`. In the same branch, set `current_version` and any changed `depends_on` in the identity record. Retain the originating change while any version or outcome references it. The version establishes when all required knowledge and code land on `main` or `master`. Handle later defects or missing evidence with a new change, not with edits to an established version.

## Legacy Snapshot Layout

Readers still accept the snapshot-copy layout of older artifacts. Do not edit established legacy snapshots; a conversion can delete them because Git keeps them. To move an artifact to the in-place layout, follow the [migration procedure](../01-foundation/artifact-model.md#legacy-layout-and-migration).

## System-flow specifications

Write named behavior journeys under specifications/flows/<id>.md using the [system-flow format](system-flows.md). Flow records remain specification elements. Preserve stable IDs when paths change; update supporting source references. Do not copy flow authority into a unit brief, graph, or retrieval index.
