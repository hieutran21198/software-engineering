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

- [ ] Run go test ./..., go vet ./..., complete bundle/adoption checks and the website production build; record actual results.
- [ ] Validate affected ADD flow references, evidence examples and source safety. Reconcile stale active-change-specific wording in the new complete knowledge only.
- [ ] Prepare suggested ADD 2.3.0 after user version confirmation: source_change, delivery_tasks: change, complete knowledge without tasks, consistent proposed root and DAG.
- [ ] Push the dedicated upstream branch and open its PR; attach it to this chat and stop for team merge. Do not include Plane implementation.
- [ ] Before releasing downstream work, verify all required upstream merges, exact protected contract/delivery contents and current required checks. Recheck the Plane plan; material changes require renewed approval.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
