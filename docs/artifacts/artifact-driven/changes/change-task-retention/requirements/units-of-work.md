# Unit-of-work requirements

## Confirmed need and rules

U1. A unit of work represents one deliverable outcome and groups one or more artifact changes. Each participating change belongs to exactly one unit of work. Artifacts retain knowledge ownership and the single-active-change rule. Membership creates no dependencies.

U2. A brief at docs/artifacts/units-of-work/<name>/README.md records name/purpose, included and excluded scope, structured participating changes, and shared observable acceptance criteria. Store no workflow status, copied task list, or duplicate dependency graph.

U3. An explicit change-to-version relationship preserves membership after establishment. Historical completion remains evaluable without replaying changes or editing previously established snapshots.

U4. Completion requires all participating changes to produce established versions, evidence supporting every shared acceptance criterion, and passing required integration checks. Reference task evidence where sufficient; record additional combined checks with the unit. Missing or failed evidence prevents completion. Later artifact changes do not automatically invalidate historical completion.

U5. Preserve repositories without unit documents. Diagnose invalid, ambiguous, missing, and unsafe references. Do not invent membership, approval, execution order, or completion.

## Acceptance examples

A tenant login outcome groups tenant, authentication, and audit changes without creating edges. Two briefs claiming the same change produce a membership diagnostic. A version with explicit change provenance keeps the outcome traceable after its original change directory is removed. A later artifact version does not replace the delivered version in historical evidence.

## Scope and impact

ADD owns definitions, brief/provenance contracts, author and role guidance, and matching packaged delivery. Artifact Plane consumes those contracts. No workflow state database, deployment, or automatic merge is required.

## Requirement self-check

The user confirmed scopes 1–5. Outcome, cardinality, ownership, evidence, and compatibility are explicit. KISS retains a single authority per fact; STE checks preserve obligations and observable examples. Schema choices belong to Specification. No unresolved requirement blocker remains.

## Project adoption

U6. During approved implementation the user explicitly requested adoption in this project as well. Apply the new convention to future project ADD outcomes, create the current shared brief, and preserve established legacy snapshots without retroactive membership or provenance edits.

## Applicability in this change

For future versions, specifications/task-retention.md replaces requirements to copy or inherit tasks and version-specific task evidence. Existing delivered records remain unchanged.
