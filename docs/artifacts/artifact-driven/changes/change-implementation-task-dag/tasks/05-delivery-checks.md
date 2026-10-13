---
id: delivery-checks
depends_on: [task-contract]
---

# Validate bundle delivery and prepare publication

## Scope and governing references

Repository: software-engineering. Own integrated validation and coordinator-managed ADD task evidence/version preparation. Reuse existing Go and website checks; only add a meaningful bundle assertion if existing delivery tests do not cover the new format.

D1–D7; specifications/task-dag.md and specifications/delivery.md.

## Prerequisites

Task task-contract must pass. Explicit user approval of this plan is required.

## Definition of Done

- [ ] Run go test ./... and go vet ./...; run npm run build in website. Investigate failures and record results.
- [ ] Check canonical/packaged byte parity for affected guidance, all plan IDs/prerequisites, required skills, and relative-link destinations. No task graph cycle or missing prerequisite remains.
- [ ] Read the integrated delivered guidance against D1–D7, including explicit empty/legacy plans and invalid-plan handling. Record current evidence.
- [ ] After user version confirmation, prepare a complete proposed ADD snapshot/root/index and review PR. Keep the Plane preparation isolated from the upstream release; stop for team merge.

## Evidence

Implementation has not started. Record actual commands, results, and source/test references after execution.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
