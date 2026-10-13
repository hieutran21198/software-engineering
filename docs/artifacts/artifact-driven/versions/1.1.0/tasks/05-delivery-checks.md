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

- [x] Run go test ./... and go vet ./...; run npm run build in website. Investigate failures and record results.
- [x] Check canonical/packaged byte parity for affected guidance, all plan IDs/prerequisites, required skills, and relative-link destinations. No task graph cycle or missing prerequisite remains.
- [x] Read the integrated delivered guidance against D1–D7, including explicit empty/legacy plans and invalid-plan handling. Record current evidence.
- [x] After user version confirmation, prepare a complete proposed ADD snapshot/root/index and review PR. Keep the Plane preparation isolated from the upstream release; stop for team merge.

## Evidence

go test ./... passed all existing Go packages; go vet ./... passed. npm run build in website generated the production site successfully. Docusaurus reported only an optional update-check permission warning after the successful build. All 32 canonical/package Markdown files match; all 57 bundle links resolve without ancestor references. The current plan contains only task-contract -> delivery-checks; copied tasks 01–03 remain excluded. Manual integrated review confirms D1–D7, full required skills, valid examples, and unchanged adoption behavior. The user confirmed ADD 1.1.0. Its complete snapshot matches the change; 63 artifact links resolve without ancestor references, and the two-task DAG is acyclic. Established artifact dependencies remain empty and the DAG index is unchanged and consistent. Branch add-task-dag-contract was pushed and review PR https://github.com/hieutran21198/software-engineering/pull/7 opened. Artifact Plane preparation remains separate. No upstream version is claimed established; team merge remains required.

## Self-check

Scope and DoD cover the governing requirements. KISS reuses existing assets and checks. STE keeps gates and evidence explicit.
