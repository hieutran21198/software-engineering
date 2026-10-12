# Tactical Domain-Driven Design

## Purpose and Applicability

Tactical DDD expresses domain rules in implementation. Entities have identity; value objects describe values; aggregates define consistency boundaries. Domain services express operations that do not naturally belong to one entity or value object.

Use the patterns that clarify actual business rules. Simple data operations do not automatically need aggregates, repositories, or domain services.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Specification | Completed requirements, domain rules, and contracts. | Consistency rules and design constraints that implementation must satisfy; applicable ADRs. |
| Plan | Completed specifications and decisions. | Model implementation and validation tasks. |
| Implementation | Approved tasks and established upstream contracts. | Domain code, tests, and task evidence. |

## Apply

- Use the artifact's owned language in code and tests.
- Identify which rules must hold together and where they are enforced.
- Choose building blocks to protect those rules, rather than to match a checklist of DDD classes.
- Keep interface behavior consistent with the established specifications.
- If implementation reveals a missing rule or contract, return it to the responsible phase instead of silently changing the model.

## Validation

Task DoD checks should cover applicable invariants, invalid transitions, and contract behavior. Add integration checks when rules cross implementation components. An isolated model test does not prove an integrated workflow is correct.

## Example

Suppose the owning artifact requires every organization to have an owner. Implement and test the rule that removing the final owner is rejected. Choose the consistency boundary based on the actual storage and concurrency design; do not assume a class alone protects the invariant.

## Research Basis

Eric Evans, *Domain-Driven Design Reference: Definitions and Pattern Summaries* (2015), describes the tactical model building blocks. Phase placement, task evidence, and approval rules above are ADD-specific adaptations.
