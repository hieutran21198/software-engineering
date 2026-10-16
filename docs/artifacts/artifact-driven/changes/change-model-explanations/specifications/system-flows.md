# System flow knowledge contract

Governs F1–F7 in requirements/flows.md. This retains the established step/support contract. The optional model and interaction extension is owned by specifications/model-explanations.md.

## Ownership and identity

A system flow describes a named behavior journey, not a unit of work or implementation schedule. Its authoritative document is specifications/flows/<id>.md in one owning artifact's change or version knowledge. It remains a specification element; a flow graph additionally projects its steps. Each snapshot has at most one flow with the same owner/id. Logical identity is <artifact>:<id>; step identity adds :<step>. IDs match [a-z0-9][a-z0-9-]* and remain stable across file renames. A reader includes repository, worktree and snapshot in concrete node identity to prevent mixing revisions. Flow ownership follows knowledge responsibility, not the number of participants.

## Document contract

Use Markdown with YAML front matter. The flow key is an object with id, artifact, title, trigger, outcome, entry_steps, steps, transitions and support. title, trigger and outcome are nonempty strings. artifact must match the owning directory. entry_steps is a nonempty list of unique declared step IDs. steps is a nonempty list; each step has unique id, nonempty title and supports (a list of unique declared support IDs). transitions is a list of from/to step IDs with optional nonempty condition text. Support-free steps are readable but produce an evidence-gap diagnostic unless their gap is explained. Optional gaps and exclusions are lists of nonempty strings. Markdown records purpose, branch explanations, coverage and evidence detail without duplicating a second authority.

A support record has unique id, kind, nonempty requires and basis. basis is documented, static, observed or inferred. It describes the evidence basis, not an approval or verified-execution state. observed requires nonempty evidence paths to recorded check/trace details. A test file's existence alone is static evidence. Inferred support remains visible as a candidate; it cannot prove compatibility or establishment.

- kind: element uses artifact and element (the existing safe knowledge element path); optional status and change follow the established/proposed reference contract. Same-owner references with no explicit selector resolve in the flow's own snapshot; cross-artifact references default to the current established snapshot. Explicit proposed references identify status: proposed and their supplying change. Do not pin an old version in an element path.
- kind: flow uses artifact and flow (the target's local flow ID), with the same source-selection rules. It links a named subjourney; it does not turn step transitions into execution prerequisites.
- kind: implementation or test uses a safe repository-relative path and optional symbol (a nonempty advisory location). Sources must be readable tracked files within the selected worktree; never follow escaping symlinks or permit .git, credential files or arbitrary file access. Renames preserve flow IDs but require source references to be updated. A symbol match alone does not prove runtime behavior.

Examples use YAML values literally. A flow document can contain:

~~~yaml
---
flow:
  id: adoption
  artifact: artifact-driven
  title: Adopt the ADD bundle
  trigger: A consumer requests ADD adoption.
  outcome: The selected workspace contains the complete ADD bundle or an explicit conflict diagnostic.
  entry_steps: [select]
  steps:
    - id: select
      title: Select the architecture and destination
      supports: [copy]
    - id: copy
      title: Preflight and copy the bundle
      supports: [copy]
  transitions:
    - from: select
      to: copy
      condition: The workspace and destination are valid.
  support:
    - id: copy
      kind: implementation
      path: internal/adopt/adopt.go
      symbol: Copy
      requires: Preflight conflicts and copy the selected bundle without overwriting consumer edits.
      basis: static
  gaps:
    - This documented journey is not a live runtime trace.
  exclusions:
    - Consumer harness installation and project artifact creation.
---
~~~

## Graph semantics and validation

Project artifact ownership, specification elements, flows, steps and supporting sources into a typed derived view. contains, supports, references-flow and transition edges have distinct meanings. One element can support several steps/flows; store its identity once within a snapshot. Group by artifact without converting participation into an artifact prerequisite or unit membership.

Allow step branches, joins, loops and disconnected records. Do not apply DAG validation or a topological-order claim to the runtime flow graph. Reject malformed YAML and duplicate keys, unsafe/duplicate IDs, owner mismatch, missing required fields, invalid basis/kind, invalid entry/transition/support endpoints and unsafe paths. Missing targets, evidence and ambiguous snapshot selectors are diagnostics, not invented connections. Keep safely readable records and do not present an invalid flow as a valid execution order. Optional models, participants and interactions follow specifications/model-explanations.md and preserve valid legacy steps when that semantic layer is invalid. Other unknown fields do not create new edges or workflow states.

## Unit flow impact

New unit briefs declare affected_flows, a list of unique {artifact, flow, effect} records, and flow_assessment, a nonempty explanation of discovery scope and gaps. effect is create, modify or remove. An explicit empty affected_flows list requires a reason in flow_assessment. Legacy briefs without these fields remain readable; do not infer their membership retroactively.

A created flow can be preparatory, so its absence before Specification is an unresolved discovery/authoring item, not an invalid unit-creation blocker. Modified flows resolve from member changes when supplied there, otherwise established knowledge; removed flows resolve from the delivered predecessor and remain in historical snapshots. Unknown owners, duplicate declarations and unsafe IDs are diagnostic failures. The assessment does not establish a version or prove every consumer was discovered.

The coordinator owns the assessment and links; detailed behavior stays in artifact specifications. Shared flow participation does not make every participant a member or add dependencies. Existing membership, approval, task DAG and upstream establishment gates remain unchanged.

## Maintenance and discovery

Requirement locates candidate journeys and owning elements from existing knowledge, entry points, contracts, implementation and tests before asking for discoverable facts. Specification assesses compatibility and updates affected flow steps, branches, support and gaps. Plan supplies fresh tasks and concrete flow checks. Implementation compares affected behavior with the prepared knowledge; new facts return to their owning phase. Version preparation checks final references and retains originating evidence. Use the existing self-checks, not a new state registry or review phase.

Keep source fingerprints in derived indexes, not in a second authoritative knowledge ledger. Changes to a supporting file invalidate affected derived evidence and request reassessment; changed bytes alone do not prove changed behavior. Readers distinguish structurally valid, fresh sources from independently verified claims. Coverage names investigated journeys, important branches, exclusions and gaps. Absence from an incomplete map cannot prove absence from the system.

## Compatibility and dependencies

This is an additive input contract. Existing artifacts, task DAGs, unit briefs and legacy snapshots remain valid. ADD owns the flow definition and reusable guidance. Plane owns readers, graph projections, indexing, visualization and agent adapters. Story-Driven owns its project flow inventory. No new artifact nodes or workflow registry are introduced. Plane retains its ADD dependency; Story-Driven proposes ADD as a knowledge prerequisite for its new flow-format delivery. Preparation may use this proposal, but dependent Implementation waits for establishment.

## Self-check

F1–F7 map to ownership, document fields, graph semantics, unit impact, phase checks, delivery and inventory. Same-snapshot and cross-artifact resolution are explicit; runtime loops do not alter execution DAGs. Existing legacy knowledge is preserved. KISS derives views instead of copying authority; STE distinguishes evidence and inference. No Specification blocker remains for Plan.
