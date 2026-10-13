# Integrated recovery and publication readiness

## Scope and location

Integrate validated knowledge in docs/artifacts/artifact-driven. Add one parent navigation link in repository README.md to the artifact root so maintainers can find its current baseline. Preserve existing adoption instructions. Validate consistency before proposed version preparation.

## Governing knowledge

- [Requirements](../requirements/baseline.md): all acceptance criteria, especially A5–A7.
- [Knowledge contract](../specifications/knowledge.md).
- [Delivery contract](../specifications/delivery.md).
- [Boundary decision](../decisions/001-knowledge-and-boundary.md).

## Prerequisites

[Source fidelity](01-source-fidelity.md) and [delivery validation](02-delivery-validation.md) pass. No external artifact contract is required. User confirmation of 1.0.0 is a separate Version-phase gate after validation.

## Definition of Done

- [ ] Integrated review maps every acceptance criterion to source review or passing current task evidence; no required failed/incomplete check is hidden.
- [ ] Repository diff contains only new ADD project knowledge and the necessary parent navigation update. Existing method, implementation and Artifact Plane knowledge remain unchanged.
- [ ] New documentation hierarchy and local links pass; repository parent navigation does not cause a child backlink. Rebuild docs after its navigation change if build coverage is affected.
- [ ] The proposed root identity has one active change and no invented upstream edges; graph regeneration can preserve all existing entries and remain acyclic.
- [ ] Complete snapshot content is ready without depending on old changes; historical uncertainty and absent capabilities stay explicit.
- [ ] git diff --check passes; latest-main compatibility and applicable existing CI results are checked before final PR handoff.
- [ ] KISS/STE and combined contract/dependency reviews pass without redesign or new workflow state.

## Version handoff

Once the above checks pass, request confirmation of initial 1.0.0. Only then copy complete validated change knowledge and evidence into versions/1.0.0, prepare root README and DAG, check snapshot parity and references, and open the dedicated PR. Describe these updates as proposed until team merge. Do not copy Git hashes into knowledge, publish a binary tag, deploy, merge or amend established snapshots. PR/CI references can be reported in the handoff.

## Evidence

Not executed. Record integrated check outcomes after approval; version readiness is not establishment.
