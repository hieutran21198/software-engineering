---
id: add-model-validation
depends_on: [add-model-inventory]
---

# Validate and prepare upstream publication

## Scope and ownership

Own ADD task evidence, complete proposed version, artifact root/DAG consistency and upstream PR handoff. Coordinator owns shared unit evidence. Exclude tasks from the snapshot and retain source_change/delivery_tasks provenance.

## Governing knowledge

M1-M4; specifications/model-explanations.md; existing delivery contract.

## Prerequisites

Explicit concrete-plan approval and listed prerequisite DoD are required. No new upstream artifact dependency is required. Implement and validate ADD first, then stop for team review and merge before Plane consumes the new contract.

## Definition of Done

Run root Go tests/vet, bundle/adoption and website build plus Markdown hierarchy/link checks. Confirm old snapshots and originating tasks unchanged. Propose compatible 2.2.0 for user confirmation with this plan. Create a focused upstream PR without downstream code, stop for team review/merge, and verify protected-ref publication before allowing Plane implementation.

## Evidence

Upstream validation passed: GOCACHE=/tmp/plane-domain-go-cache go test ./... and go vet ./...; npm run build in website; node /tmp/check-plane-domain.mjs; git diff --check. Go coverage includes adoption, conflict/containment and canonical bundle fidelity. The website produced a successful static build. Authoring validation checked three model declarations, three participant roles, six interactions, five legacy-compatible ADD flows, 19 support targets, three guidance examples and six negative cases. Original dependency-gates entries, step IDs and transitions are unchanged. Logs are /tmp/plane-domain-go-test.log, /tmp/plane-domain-go-vet.log and /tmp/plane-domain-website.log.

The user confirmed proposed 2.2.0 with plan approval. A complete snapshot is prepared with source_change: change-model-explanations and delivery_tasks: change, no copied tasks, and matching change-owned knowledge. The root current-version declaration is explicitly proposed branch state; protected main remains 2.1.0. The derived artifact dependency index is unchanged because no dependency names changed. Historical snapshots and previous originating tasks are unchanged.

Publication review is still required. The focused upstream review is stacked on PR #26 because the approved planning baseline includes its pending reading/navigation work; no downstream model UI or parser implementation is included. Merge PR #26 first, retarget this review to main and review/merge the ADD delivery. Plane implementation remains unauthorized to bypass the required publication gate. These checks do not establish 2.2.0 or complete the shared outcome. KISS and STE self-check passed.

## Review handoff

[Upstream review PR #27](https://github.com/hieutran21198/software-engineering/pull/27) is open against codex/plane-ux-simplification. Its merge depends on [PR #26](https://github.com/hieutran21198/software-engineering/pull/26); retarget the upstream review to main after the predecessor lands. Local snapshot fidelity checked all 28 knowledge files, seven task declarations and five internal edges, 18 unique outcome member pairs and root/DAG consistency. Zero established snapshot, previous originating-task or downstream application paths changed relative to the approved preparation baseline. CI was queued/running at handoff; no remote pass is asserted. Publication proof remains pending.
