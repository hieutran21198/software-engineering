# Validation

## Phase Self-Checks

The PO validates Requirement output. The TL validates Specification and Plan output in sequence. Each owner checks the phase completion criteria before committing and handing off.

Discovery of a blocker returns the active change to the phase that owns the correction. The user must approve the completed implementation plan. A new plan or material amendment requires renewed approval. No mandatory extra agent review is required.

## Task Validation

Each implementation task contains its DoD checklist. The assigned implementer verifies its code and tests against the referenced requirements, specifications, and applicable ADRs.

Record the checks performed, outcomes, and relevant code or test references in the task. Keep failed and incomplete checks visible. A checked box alone does not establish that the implementation satisfies the criterion.

Prefer executable tests and contract checks for repeatable criteria. Use explicit review or analysis for criteria that require judgment. Do not require frontier-model review of every task.

## Integration Validation

One implementation coordinator checks the combined results after related implementations are available. Confirm that:

- Required tasks satisfy their DoD.
- Integrated behavior satisfies acceptance criteria.
- Applicable interfaces satisfy their contracts.
- Artifact and task dependencies are respected.
- Required upstream knowledge is established and detailed references resolve.

Passing isolated task checks does not replace integration validation. Record integration checks and results in the relevant implementation tasks, including a coordination task when the plan needs one.

## Establishing a Version

Do not establish a version while applicable DoD criteria or integration and dependency checks fail or remain incomplete.

The coordinator suggests a semantic version and explains the compatibility impact. The user confirms or overrides the suggestion. The initial established version is `1.0.0`.

Preserve the complete resulting requirements, specifications, applicable decisions, and implementation plan in the new version. Retain valid completed tasks and evidence as historical context. Remove or amend obsolete content and repeat checks whose coverage is affected.

Prepare root README updates and refresh the DAG consistently on the change branch. Until merge, these describe proposed state. Push and open linked PRs for repositories with remotes, then stop for team review and merge. Ask the user how to finish when a remote is absent.

The version becomes established only when all required knowledge and implementation changes land on their repositories' `main` or `master` branches. A snapshot, local commit, or open PR alone does not establish it. Verify the required merges before releasing dependent Implementation.

## Findings After Establishment

Address defects, missing tests, or missing required evidence through a new change. Keep established snapshots unchanged.

Old versions and changes can be removed because the current snapshot contains the full valid knowledge state and implementation plan. Retained criteria support later validation; historical results alone do not prove the current implementation still passes them.
