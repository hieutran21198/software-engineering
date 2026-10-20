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
evidence: []
---

# Nix application packages

Deliver the two repository applications through the existing Snowfall package layout.
Include package definitions, pinned inputs, package checks and usage documentation.
Exclude application features, system services, editor integration and external package publication.

## Combined checks

Implementation has not started. Native build and smoke evidence will be linked from the originating tasks.
