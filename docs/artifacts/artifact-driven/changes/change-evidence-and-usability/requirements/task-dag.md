# Implementation task DAG requirements

## Need and scope

Authors need an explicit implementation graph for each new or materially revised change plan. Coordinators need to identify independent work and integration prerequisites. Artifact Plane must visualize the graph.

## Required outcomes

D1. The plan explicitly identifies current implementation tasks. Create fresh plans for new changes. Existing legacy unlisted tasks remain excluded.
D2. Current tasks have stable identifiers and explicit prerequisites. Arrows run from prerequisite to dependent. Integration and validation can be tasks. A one-task plan has one node.
D3. Task prerequisites form an acyclic graph within the change. Duplicate IDs, self-dependencies, absent prerequisites, malformed declarations, and cycles prevent treating the plan as executable.
D4. Task files own dependencies. Graphs are derived. Do not maintain a separate task DAG or status database.
D5. Artifact dependencies continue to gate required upstream established versions. Task nodes do not replace artifact nodes in the repository DAG.
D6. Existing plans without metadata remain readable historical knowledge. Readers report graph unavailable and do not infer edges from filenames, prose, or Git order.
D7. Canonical documentation, packaged adoption assets, and applicable role guidance describe the same contract. Preserve the full bundle and required skills.

## Acceptance

Two independent tasks feeding integration, followed by validation, produce four nodes and three edges. A new plan contains no historical task copies; existing legacy unlisted records are excluded. Invalid references and cycles are diagnosed. Legacy plans remain readable without invented edges. Required upstream establishment still gates dependent implementation.

## Impact and self-check

Artifact Plane consumes the established task and retention formats. ADD has no dependency on its visualizer. Scope follows the accepted discussion. KISS retains task files as the dependency source. STE preserves gates and uncertainty. No Requirement blocker remains.
