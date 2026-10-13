# Recover the existing ADD baseline

## Reason

ADD is implemented and documented in this repository, but has no project artifact that governs its own future changes. Recover its existing contracts and evidence so later work can use its established five-phase workflow.

## Scope

Create initial knowledge under docs/artifacts/artifact-driven. Reuse the canonical local bundle at docs/artifact-driven and inspect its packaged sources, adoption implementation, harness configuration, website, and CI. Do not modify implementation code, redesign the method, rewrite the reusable bundle, or change Artifact Plane.

## Proposed identity and boundary

Artifact ID: artifact-driven. Owner: repository maintainers responsible for ADD. Purpose: supply and maintain the ADD method, executable adoption bundle, role guidance, and documentation delivery.

Foundation, methodology, execution, patterns, adoption, and guidelines are responsibilities within this artifact, not six artifact nodes. Utility skills are reused supporting assets. Artifact Plane owns exploration and visualization in its existing artifact; its open release is outside this change.

No new artifact dependency is proposed. Internal packaging relationships belong in specifications, not self-edges in the DAG. No required contract from the pending Artifact Plane PR is consumed.

## Recovered knowledge

- [Requirements](requirements/baseline.md)
- [Source inventory](requirements/evidence.md)

The source inventory distinguishes existing implementation, documented human procedures, unverified evidence, and absent capabilities. Recovery does not certify autonomous workflow enforcement or claim that current checks have passed.
