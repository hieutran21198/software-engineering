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

- [x] Integrated review maps every acceptance criterion to source review or passing current task evidence; no required failed/incomplete check is hidden.
- [x] Repository diff contains only new ADD project knowledge and the necessary parent navigation update. Existing method, implementation and Artifact Plane knowledge remain unchanged.
- [x] New documentation hierarchy and local links pass; repository parent navigation does not cause a child backlink. Rebuild docs after its navigation change if build coverage is affected.
- [x] The proposed root identity has one active change and no invented upstream edges; graph regeneration can preserve all existing entries and remain acyclic.
- [x] Complete snapshot content is ready without depending on old changes; historical uncertainty and absent capabilities stay explicit.
- [x] git diff --check and latest-main compatibility pass; final PR CI remains a publication check before handoff.
- [x] KISS/STE and combined contract/dependency reviews pass without redesign or new workflow state.

## Version handoff

Once the above checks pass, request confirmation of initial 1.0.0. Only then copy complete validated change knowledge and evidence into versions/1.0.0, prepare root README and DAG, check snapshot parity and references, and open the dedicated PR. Describe these updates as proposed until team merge. Do not copy Git hashes into knowledge, publish a binary tag, deploy, merge or amend established snapshots. PR/CI references can be reported in the handoff.

## Evidence

Combined acceptance review: A1 maps to the cohesive root/change boundary and ADR 001; A2 to the source inventory, byte parity and existing adoption checks; A3 to knowledge/delivery contracts; A4 to the three explicitly recovered ADRs; A5 to source/link reviews, passing Go tests/vet, six builds and the website build; A6 to the restricted repository diff; A7 to no established-version claim and planned complete-snapshot parity checks. No required baseline check failed or remains incomplete. Excluded capabilities and dependency audit findings remain visible.

Added one parent README navigation link to the artifact at its repository Git location. The website generator does not publish docs/artifacts, so a source-relative link would create a broken generated-site destination; the Git link preserves existing generation without implementation edits. It targets the proposed root that will exist on main after merge. The production build passed after this edit. No child backlink was added.

All 32 new local artifact links and hierarchy checks passed. git diff --check passed. origin/main is an ancestor of this branch; the fetched baseline remained unchanged. Diff inspection confirms only new artifact knowledge and the parent README link changed. Canonical guidance, packaged sources, code/tests, CI, harness and Artifact Plane snapshots remain byte-for-byte unchanged.

Existing root/index dependencies agree. Reviewed the prospective graph retaining Artifact Plane and adding artifact-driven with no edges: two valid nodes, no missing dependency or cycle. Established index remains unchanged until Version preparation. Empty artifact dependencies need no proposal file. No pending Artifact Plane release blocks recovery.

Knowledge is complete for the recovered baseline without replaying earlier changes. KISS/STE and combined contract/dependency checks passed. Snapshot/root/index publication checks and final branch CI will be performed after version confirmation, before PR handoff; merge remains the team gate.
