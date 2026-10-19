# Validation

## Phase Self-Checks

The PO validates Requirement output. The TL validates Specification and Plan output in sequence. Each owner checks the phase completion criteria before committing and handing off. When the [validator](../06-guidelines/writing-artifacts.md#check-records-with-the-validator) is available, each self-check runs it with `--change` and records the command and `ok: true` in one line; the self-check then states only the checks that need judgment. The same self-check validates the tables and diagrams of the changed documents under the [visual representation guide](../06-guidelines/visual-representations.md#traceability-and-maintenance).

Discovery of a blocker returns the active change to the phase that owns the correction. The user must explicitly approve the completed implementation plan of a medium or large change. For a small change, the user's request is the approval. A new plan or material amendment requires renewed approval. No mandatory extra agent review is required.

## Task Validation

Each implementation task contains its DoD checklist. The assigned implementer verifies its code and tests against the referenced requirements, specifications, and applicable ADRs.

Record the checks performed, outcomes, and relevant code or test references in the task. Keep failed and incomplete checks visible. A checked box alone does not establish that the implementation satisfies the criterion.

Prefer executable tests and contract checks for repeatable criteria. Use explicit review or analysis for criteria that require judgment. Do not require frontier-model review of every task.

Optional [structured evidence records](../06-guidelines/evidence-records.md) make check and publication facts independent of exact prose. Keep their details with the owning task or phase. A document self-check does not complete other work. Invalid or conflicting explicit records cannot support favorable legacy fallback.

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

The plan proposes the compatibility level and explains its impact. The user confirms or overrides the level with the plan approval; for a small change, the level is patch and the user confirms it at merge. The coordinator asks again only when the level changes after approval. At Version, the coordinator computes the number from the level and `current_version` on the protected branch, and computes it again when that branch moves before merge ([change tiers](../06-guidelines/change-tiers.md#compatibility-level-and-version-number)). The initial established version is `1.0.0`.

When a medium or large change changes a user interface, its plan has a DoD item for an owner look at screenshots or at the running interface, recorded before Version. For a small change, the screenshot goes in the PR description. The owner look is a check record, not an approval.

Working knowledge on the change branch is the complete resulting knowledge. Remove or amend obsolete knowledge and repeat checks whose coverage is affected. Add the version record `versions/<version>/README.md` with `source_change`, the compatibility level with its reason, a summary of at most three sentences and a link to the originating change's retained plan. Add no knowledge or tasks to the version directory. Set `current_version` and any changed `depends_on` in the identity record on the same branch. Until merge, these describe proposed state. Push and open linked PRs for repositories with remotes, then stop for team review and merge. Ask the user how to finish when a remote is absent.

The version becomes established only when all required knowledge and implementation changes land on their repositories' `main` or `master` branches. A version record, local commit, or open PR alone does not establish it. Verify the required merges before releasing dependent Implementation. Git then holds the version snapshot as the tree of the first-parent commit that introduced the version record.

For an artifact in the [legacy layout](../01-foundation/artifact-model.md#legacy-layout-and-migration), the version directory holds a complete copy of the resulting knowledge, excluding tasks/, and declares `source_change` and `delivery_tasks: change`. Update the root README and regenerate `docs/artifacts/dag.yaml` together.

## Findings After Establishment

Address defects, missing tests, or missing required evidence through a new change. Keep established version records and legacy snapshots unchanged.

Preserve delivered versions and their referenced originating changes and evidence for historical outcomes. New changes create fresh plans without copying historical tasks. Retained criteria support later validation; historical results alone do not prove the current implementation still passes them.

## Flow validation

Apply the [system-flow checks](../06-guidelines/system-flows.md) during existing phase, task, integration, and Version checks. Check IDs, ownership, entry steps, transition and support endpoints, safe source references, evidence basis, and final knowledge resolution. Report missing targets, evidence gaps, and ambiguous selectors. Keep inferred connections explicit; a structurally valid record is not independently verified behavior.

Inspect relevant contracts and behavior when supporting sources change. Record coverage, important branches, exclusions, and gaps; a map cannot prove complete system coverage merely because its indexed records validate. Derived indexes retain source fingerprints without creating a second authoritative knowledge ledger.
