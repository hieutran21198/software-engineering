# Test-Driven Development

## Purpose and Applicability

TDD uses a short cycle: write a failing test for the next behavior, implement enough to pass it, then refactor while keeping tests passing. Use it when executable examples help implement domain rules, contracts, or defect fixes.

It operates within Implementation after plan approval. Writing a test does not authorize a new requirement or contract.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Plan | Completed behavior, contracts, and acceptance criteria. | Tasks with testable DoD checks. |
| Implementation | Approved tasks and governing knowledge. | Behavior tests, implementation, refactoring, and task evidence. |

## Apply

Choose a small behavior from the approved task. Write a test that fails because the behavior is missing, rather than because the test environment is broken. Implement the behavior, run the test, and improve the design without changing the specified outcome.

Repeat for relevant cases. Prefer assertions about observable behavior over assertions that merely mirror implementation structure. Use a regression test for a defect when it can demonstrate the failure meaningfully.

Apply TDD where it adds value. Do not force tests for trivial documentation changes or mechanically reproduce every line of implementation in a test.

## Validation

Run the task's applicable test suite after refactoring. Record relevant checks and final results with the task; no separate red/green history registry is needed. Unit test success does not replace required contract or integration checks.

## Example

For a confirmed rule that an organization must have an owner, first test that removing the final owner is rejected. Implement the rule and refactor. Add other cases when they verify distinct required behavior.

## Research Basis

Martin Fowler, *Test Driven Development*, describes the test-first and refactoring cycle. Phase approval, DoD placement, and evidence handling here are ADD adaptations.
