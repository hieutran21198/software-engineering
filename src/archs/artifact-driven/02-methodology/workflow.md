# Workflow

A unit of work groups artifact changes around one deliverable outcome. Each artifact retains one active change. The coordinator records shared scope, participating changes, acceptance criteria, and combined validation evidence in a unit brief; owning artifacts retain their detailed knowledge. Each phase finishes and validates its output before the next phase consumes it. Corrections remain in the same change.

## Roles and Phase Gates

| Phase | Owner | Complete when |
| --- | --- | --- |
| Requirement | Product Owner (PO) | The need, scope, acceptance criteria, and potentially affected artifacts are clear. No unresolved blockers prevent Specification. |
| Specification | Technical Lead (TL) | Behavior and all applicable interface contracts are defined. Necessary ADRs are recorded, dependency impact analysis is complete, and no blockers prevent Plan. |
| Plan | Technical Lead | Tasks cover the required work, reference governing knowledge, identify dependencies and parallel implementation opportunities, and contain concrete DoD checks. No blockers prevent Implementation planning. |
| Implementation | Assigned implementers, coordinated by one implementation coordinator | Required tasks satisfy their DoD and combined implementation passes integration and dependency validation. |
| Version | Implementation coordinator prepares; team reviews and merges | Checks pass, the version is selected, and the version record and identity record agree. Establishment requires all required changes to land on `main` or `master`. |

The coordinator can be the TL or a designated implementer. This is an assigned responsibility; it does not require another agent session.

## Change Lifecycle

1. Start the change on a dedicated branch. Add `changes/<change>/README.md`. Copy nothing. Edit working knowledge in place: retain, amend, remove and add.
2. Complete Requirement, Specification and Plan with their self-checks and commits. Record `self_check` where readers need it.
3. Present the plan and wait for explicit approval. Implementation records evidence in tasks.
4. Prepare the version: add `versions/<version>/README.md` with `source_change`, set `current_version` and any changed `depends_on` in the identity record, and open the PR.
5. The version is established when the PR lands on the protected branch. The change directory remains as the retained delivery record.

The [artifact model](../01-foundation/artifact-model.md#records) defines the records. For an artifact in the legacy layout, the change starts from a copy of the current version knowledge and the version is a complete copy of the resulting knowledge.

## Requirement

The PO authors and validates the requirements, then performs a self-check before handing them to the TL. No separate reviewer or approval step is required.

Record the reason and scope of the change in its change record. Edit requirements in place: retain applicable requirements and add, amend, or remove requirements as needed. Identify potentially affected artifacts for dependency impact analysis.

## Specification and Plan

The TL defines precise behavior and contracts from the completed requirements. Requirements own the need and desired outcomes; specifications own detailed behavior and interfaces; ADRs own architectural choices and their reasons.

Cover all applicable interfaces, including APIs, events, data formats, error behavior, and operational interactions. Create an ADR only for a necessary architectural decision with multiple options. Complete impact analysis throughout Requirement and Specification.

For AI-assisted work, use a frontier model for Specification and then Plan in the same session. Self-check each phase before advancing. Preserve the phase gates even when one actor performs both roles. A separate planning agent or fresh-session review is not mandatory.

The plan produces `tasks/README.md` and task files. Each task records its scope, implementation location, governing references, dependencies, and DoD checks. Identify which tasks can run in parallel across applications, services, or repositories. Present the completed plan and wait for explicit user approval before Implementation. A new plan or material change requires renewed approval.

## Implementation

Each assigned developer or AI agent implements a task, adds or updates tests, runs its DoD checks, and records evidence in the task. Parallel tasks must respect their dependencies and established contracts.

The coordinator validates the combined implementation and handles failures across task boundaries. Dependent Implementation begins only after required upstream changes establish their versions and the prepared specifications and plan are rechecked against them.

## Shared Outcome Validation

Validate each member's task DoD and the combined outcome. Completion requires all participating changes to produce established versions, evidence supporting every shared acceptance criterion, and passing required integration checks. Record combined checks in the unit brief; reference delivered task evidence where sufficient. Checked tasks and phase inference alone do not prove establishment or approval.

Dependent implementation still waits for required upstream establishment, even when both artifacts belong to the same unit. Preparing a unit does not bypass the plan approval or team merge gates. Historical completion uses delivered versions and their linked originating delivery records rather than later current versions. New version records name `source_change` and contain no tasks; retain the originating change and verify publication before using its evidence. Missing knowledge or merge evidence remains unresolved.

Use [evidence records and reconciliation](../06-guidelines/evidence-records.md) within these existing checks. Reconcile a stale declaration from required merge and protected-ref evidence; keep failed validation distinct from merged publication.

## Corrections

| Problem | Return to |
| --- | --- |
| Requirement ambiguity or missing business rule | Requirement; the PO revises, self-checks, and commits the output before handoff. |
| Contract or architectural gap | Specification; the TL revises the design and impact analysis, then updates Plan. |
| Missing or incorrect implementation task | Plan; the TL amends and self-checks the plan. |
| Code or test defect | Implementation; the implementer fixes and repeats relevant checks. |

Pause affected downstream work while its governing input is corrected. Repeat affected phase checks before resuming; retain unaffected work that remains valid.

## Commits and Team Review

Each completed phase produces a commit containing its output. Corrections also produce commits. In projects spanning repositories, commit the relevant outputs in their owning repositories.

Commit each phase on a dedicated branch. Never commit directly to protected branches such as `main` or `master`. When remotes exist, push change branches and open one PR per changed repository, cross-linking companion PRs. Always stop for the team to review and merge. If no remote exists, ask the user how to finish; do not assume remote creation or local integration.

Plan approval is a required user gate before Implementation. Team PR review and merge establish the version after validation. Neither requires redundant agent reviews; phase self-checks and implementation validation remain required.

## Flow maintenance in existing phases

Use the [system-flow format](../06-guidelines/system-flows.md) within existing phase self-checks. Requirement investigates candidate journeys, owners, and supporting elements before asking for discoverable facts. Specification updates affected steps, branches, contracts, support records, and gaps, and checks compatibility. Plan supplies fresh implementation tasks and concrete flow validation. Implementation compares behavior with the prepared flow knowledge; new requirement or contract facts return to their owning phase. Version preparation checks final references and retains originating evidence.

The coordinator records affected-flow declarations and discovery scope in the unit brief. A flow can be new or not yet documented; its absence does not prevent unit creation. Do not add a review phase, approval shortcut, or workflow state registry.
