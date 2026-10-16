---
id: upstream-validation
depends_on: [evidence-guidance, minimal-scaffold]
---

# Validate ADD and prepare upstream review

## Scope and ownership

Coordinator owns ADD artifact/flow updates, complete proposed version preparation and upstream PR. Validate canonical, packaged and adopted output.

## Governing knowledge

A1-A5; specifications/evidence-records.md; specifications/minimal-authoring.md.

## Prerequisites

Explicit approval of this concrete plan is required before implementation. No new artifact prerequisite is proposed. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [x] Run go test ./..., go vet ./..., complete bundle/adoption checks and the website production build; record actual results.
- [x] Validate affected ADD flow references, evidence examples and source safety. Reconcile stale active-change-specific wording in the new complete knowledge only.
- [x] Prepare suggested ADD 2.3.0 after user version confirmation: source_change, delivery_tasks: change, complete knowledge without tasks, consistent proposed root and DAG.
- [ ] Push the dedicated upstream branch and open its PR; attach it to this chat and stop for team merge. Do not include Plane implementation.


## Downstream release gate

Before releasing downstream work, verify all required upstream merges, exact protected contract/delivery contents and current required checks. Recheck the Plane plan; material changes require renewed approval. This remains an external publication gate after PR handoff; it is not a pre-merge implementation check.

## Evidence

Integrated upstream checks passed: GOCACHE=/tmp/add-plane-go-cache go test ./... and go vet ./...; npm ci --no-audit --no-fund and npm run build in website. Go includes full bundle fidelity, scaffold assembly and adoption containment/conflict checks. Docusaurus generated the production site successfully. The copied scaffold also passed the existing Plane YAML/unit/task readers without executing Plane implementation.

The new complete knowledge reconciles stale recovery-specific claims, current catalog evidence and old supplying-change wording. Prior snapshots and originating model-explanations records remain unchanged. KISS/STE self-check retains source ownership, the five phases and explicit approval/publication limits. The external downstream merge verification was separated from pre-merge DoD without changing its required evidence or timing. Snapshot and handoff checks are recorded below when complete.

## Snapshot validation

node /tmp/check-add-evidence.mjs passed: 32 complete knowledge files match the originating change; ten flow records across change/version validate with 52 support records; both plans contain ten tasks and 14 acyclic internal edges; two members each belong to exactly one unit; 141 Markdown targets/hierarchy links resolve. The 2.3.0 README declares source_change and delivery_tasks: change, and the snapshot contains no tasks. The artifact dependency index is unchanged because dependencies are unchanged. No Plane application implementation, prior change record or established snapshot differs from protected main. git diff --check passed.

The root declaration and snapshot describe proposed 2.3.0 until merge. Protected main continues to supply 2.2.0. Team review/merge and protected-ref contract recheck remain required before the unchanged approved Plane tasks execute.
