# Continuous Integration

## Purpose and Applicability

Continuous Integration combines frequent integration with automated checks to find incompatible changes early. A CI service supports this practice; running tests on a long-lived branch alone does not provide frequent integration.

Use it to make ADD validation repeatable on change branches and PRs. It does not authorize automatic merging or deployment.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Specification | Required quality checks and integration contracts. | Validation expectations and relevant CI capability contracts. |
| Plan | Completed expectations and existing repository tooling. | Tasks for check configuration or gaps in validation. |
| Implementation | Code, tests, and approved tasks. | Automated check results and recorded task evidence. |
| Version preparation | Combined implementation and required repository results. | Verified checks on the proposed changes before PR handoff. |

## Apply

Reuse the repository's existing check commands and CI platform. Map automated jobs to actual DoD criteria. Include build, behavior, contract, integration, or policy checks only where required by the change. Keep local execution available where practical.

Integrate parallel workers onto the coordinated change branch frequently and rerun affected checks on the combined code. Validate current PR revisions and their target-branch compatibility; earlier passing runs do not cover later changes automatically.

For separate knowledge and implementation repositories, validate the required companion changes together where feasible. A passing job in one repository does not prove that another required repository is ready.

Treat logs and reports as check evidence and summarize or reference them in tasks. Keep executable criteria and durable results in the retained originating change, linked from its version knowledge; do not rely solely on expiring CI logs.

## Validation

Confirm required jobs ran against the intended code and configuration and that no required check was skipped or failed. Investigate flaky or environmental failures rather than treating retries as proof of correctness. Preserve the user plan gate and stop for team review and merge.

## Example

A login PR runs its behavior and contract tests. After integration with the tenant changes, combined checks verify tenant-scoped login. Even when all jobs pass, the coordinator opens the companion PRs and stops. The artifact version establishes only after all required merges land.

## Research Basis

Martin Fowler, *Continuous Integration*, describes frequent mainline integration supported by automated verification. Dedicated branches, team merge handoff, and artifact establishment here follow ADD's execution rules.
