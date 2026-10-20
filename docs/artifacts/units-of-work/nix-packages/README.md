---
unit_of_work: nix-packages
changes:
  - artifact: nix-packages
    change: change-initial
affected_flows: []
flow_assessment: Inspected se-adopt adoption and Artifact Plane CLI, HTTP assets and runtime state. Packaging adds an installation route and preserves these application journeys. No existing flow definition requires a behavior change. Installation validation belongs to the package contract. Model inference and macOS native execution require implementation checks.
acceptance:
  - id: packages
    criterion: Both commands are installable through the repository flake for the four agreed target systems.
  - id: integration
    criterion: Installed commands pass isolated adoption and Plane launch checks without writing to the Nix store.
    integration: true
evidence:
  - criterion: packages
    method: Evaluate all package outputs and inspect the native platform coverage record.
    result: incomplete
    source: docs/artifacts/nix-packages/changes/change-initial/tasks/04-integration.md#incomplete-native-checks
  - criterion: integration
    method: Run installed package integration and semantic runtime checks on the available Linux host.
    result: passed
    source: docs/artifacts/nix-packages/changes/change-initial/tasks/03-artifact-plane.md#evidence
---

# Nix application packages

Deliver the two repository applications through the existing Snowfall package layout.
Include package definitions, pinned inputs, package checks and usage documentation.
Exclude application features, system services, editor integration and external package publication.

## Combined checks

The originating tasks record the x86_64-linux build, adoption, native module, HTTP, MCP and semantic runtime results.
All four systems evaluate. Native checks on the other three systems remain incomplete, so this outcome has no prepared version record and is not complete or established.
