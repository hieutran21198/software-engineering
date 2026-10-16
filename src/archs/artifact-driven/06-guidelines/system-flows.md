# System Flows

Use flow knowledge to describe named system behavior and find its supporting artifacts and elements. Store authoritative records with their owning specifications. Readers derive diagrams and retrieval indexes from these records.

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

## Models inside artifacts

A model is a named business or technical concept owned by an artifact. A knowledge element is a document that defines or supports that concept. One document can define several models, and one model can have several supporting documents. Do not use a document path as a model identity or generate model declarations from filenames.

A specification document may declare a top-level `models` list in YAML front matter. Each record has:

- `id`: a stable local ID using the flow-ID syntax, unique across the artifact snapshot.
- `title` and `description`: nonempty text that names the concept and explains its purpose.
- `sources`: a nonempty list of unique, safe knowledge-element paths in the owning snapshot. Each path must resolve to readable knowledge. These are evidence locations, not additional model identities.

Logical identity is `<artifact>:<model-id>`. Concrete identity also includes repository, worktree and snapshot, with a model namespace separate from document and flow nodes. Declare a model once per snapshot and reuse it in multiple flows. Do not require entity, service, event or other DDD categories for every model.

Duplicate model identities, invalid fields and unsafe or missing sources produce model diagnostics. A reader must not choose an arbitrary duplicate. Keep safely readable knowledge available when model information is incomplete.

## Model participation and interactions

A flow may add a `participants` list. Each record has a unique flow-local `id`, an owning `artifact`, a `model` ID and nonempty `requires` text explaining its role in this journey. IDs use the existing safe-ID syntax. Optional `status` and `change` follow the same established/proposed rules as knowledge support. An implicit same-owner selector uses the flow snapshot. An implicit cross-artifact selector uses the owner's current established version. An explicit proposed selector identifies its supplying change. Never merge models from different concrete snapshots merely because their logical IDs match.

A step may add an `interactions` list. Each record has `from`, `to`, `action`, `outcome` and `supports`. Endpoints identify declared participants. Action and outcome are nonempty text; supports is a nonempty list of unique declared flow-support IDs. Self-interactions are allowed. Evidence basis and observed evidence come from those support records. An action label alone does not prove runtime execution.

The existing step and transition records remain the journey context. Preserve branch conditions, joins and loops. Model interactions describe behavior between concepts; they never create artifact prerequisites, task dependencies or unit membership.

Missing or ambiguous model targets stay unresolved with their requested selector. Invalid participant or interaction metadata produces a semantic-layer diagnostic without invalidating otherwise valid legacy steps and transitions. A flow without model declarations remains readable in its step view with the information gap `Model information not documented`.

### Example: reuse a model across journeys

The following illustrative `tenant` specification declares two models. The source paths stand for existing specification documents in the same owning snapshot; consumers must supply those documents.

~~~yaml
---
models:
  - id: tenant
    title: Tenant
    description: Owns the identity and active membership boundary for a customer workspace.
    sources: [specifications/identity.md]
  - id: membership
    title: Membership
    description: Records a person's authorized participation in a tenant.
    sources: [specifications/membership.md]
---
~~~

Both a sign-in flow and a membership-review flow can refer to `tenant:membership`. Each flow declares its own participant role; neither copies the model definition. For example, a proposed authentication flow can contain these additions alongside its existing required fields and support records:

~~~yaml
participants:
  - id: workspace
    artifact: tenant
    model: tenant
    requires: Supply the customer workspace whose membership is checked.
    status: proposed
    change: change-membership
  - id: membership
    artifact: tenant
    model: membership
    requires: Determine whether the person can access that workspace.
    status: proposed
    change: change-membership
steps:
  - id: check
    title: Check workspace membership
    supports: [membership-contract]
    interactions:
      - from: workspace
        to: membership
        action: Check whether the person has an active membership
        outcome: Access is allowed or denied according to the membership contract.
        supports: [membership-contract]
transitions:
  - from: check
    to: check
    condition: The user chooses to retry after membership changes.
support:
  - id: membership-contract
    kind: element
    artifact: tenant
    element: specifications/membership.md
    requires: Define active membership and the access decision.
    basis: documented
    status: proposed
    change: change-membership
~~~

These are partial examples, not observed execution or a new dependency declaration. If a selected snapshot lacks the model or its sources, show that gap rather than substituting the specification file as the model node. Runtime loops remain valid even though artifact prerequisites must be acyclic.

## Graph semantics and validation

Project artifact ownership, declared models, specification elements, flows, steps and supporting sources into a typed derived view. Model participation and interaction edges preserve the owning flow, step, action, outcome, supporting evidence and requested snapshot. contains, supports, references-flow and transition edges have distinct meanings. One element can support several steps/flows; store its identity once within a snapshot. Group by artifact without converting participation into an artifact prerequisite or unit membership.

Allow step branches, joins, loops and disconnected records. Do not apply DAG validation or a topological-order claim to the runtime flow graph. Reject malformed YAML and duplicate keys, unsafe/duplicate IDs, owner mismatch, missing required fields, invalid basis/kind, invalid entry/transition/support endpoints and unsafe paths. Missing targets, evidence and ambiguous snapshot selectors are diagnostics, not invented connections. Keep safely readable records and do not present an invalid flow as a valid execution order. The optional model, participant and interaction fields follow the semantic-layer validation rules above. Other unknown fields do not create new edges or workflow states.

## Unit flow impact

New unit briefs declare affected_flows, a list of unique {artifact, flow, effect} records, and flow_assessment, a nonempty explanation of discovery scope and gaps. effect is create, modify or remove. An explicit empty affected_flows list requires a reason in flow_assessment. Legacy briefs without these fields remain readable; do not infer their membership retroactively.

A created flow can be preparatory, so its absence before Specification is an unresolved discovery/authoring item, not an invalid unit-creation blocker. Modified flows resolve from member changes when supplied there, otherwise established knowledge; removed flows resolve from the delivered predecessor and remain in historical snapshots. Unknown owners, duplicate declarations and unsafe IDs are diagnostic failures. The assessment does not establish a version or prove every consumer was discovered.

The coordinator owns the assessment and links; detailed behavior stays in artifact specifications. Shared flow participation does not make every participant a member or add dependencies. Existing membership, approval, task DAG and upstream establishment gates remain unchanged.

## Maintenance and discovery

Requirement locates candidate journeys and owning elements from existing knowledge, entry points, contracts, implementation and tests before asking for discoverable facts. Specification assesses compatibility and updates affected flow steps, branches, support and gaps. Plan supplies fresh tasks and concrete flow checks. Implementation compares affected behavior with the prepared knowledge; new facts return to their owning phase. Version preparation checks final references and retains originating evidence. Use the existing self-checks, not a new state registry or review phase.

Keep source fingerprints in derived indexes, not in a second authoritative knowledge ledger. Changes to a supporting file invalidate affected derived evidence and request reassessment; changed bytes alone do not prove changed behavior. Readers distinguish structurally valid, fresh sources from independently verified claims. Coverage names investigated journeys, important branches, exclusions and gaps. Absence from an incomplete map cannot prove absence from the system.

## Compatibility

Existing artifact and implementation task DAGs remain authoritative for execution prerequisites. Existing artifacts, legacy unit briefs, and established snapshots remain readable without flow metadata. Do not rewrite historical snapshots to add flows or infer historical participation.
