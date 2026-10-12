# Repository explorer requirements

## Need and scope

Provide a local web application that opens an ADD Git repository and explains its artifact dependencies. Git, Markdown, YAML dependency declarations, and the directory structure supply the data. Build graph views in memory.

The inspected repository must remain unchanged. This restriction includes Git metadata and untracked files. Creating this application's code and development artifacts in its own workspace is permitted.

## Acceptance criteria

1. A reader can open a local repository and explicitly refresh its contents. Invalid paths and missing ADD directories produce useful errors.
2. Discover artifacts under `docs/artifacts` from root READMEs. Show identity, details, declared current version, and active change. Show an initial artifact with no established version accurately.
3. Show the established artifact graph with arrows from prerequisite to dependent. Distinguish active dependency additions and removals from established edges.
4. Selecting an artifact shows its direct and transitive upstream and downstream dependencies, with established and proposed relationships distinguished.
5. Expanding an artifact shows knowledge elements and their dependency references, including the owning artifact, element path, reason, and established or proposed source.
6. Resolve established element references through the owner's declared current version. Do not substitute the newest version directory. Keep active change elements distinguishable from established elements.
7. Report missing targets, cycles, conflicting index data, ambiguous metadata, and multiple active changes. Keep valid portions inspectable without silently fixing repository data.
8. Display Markdown details safely. Repository content cannot execute browser scripts or cause reads outside the chosen repository through element paths or symlinks.
9. Opening, inspecting, and refreshing leave repository files and Git state unchanged.
10. Explore the graph on an interactive canvas: pan, zoom, fit the graph, select nodes, and expand or collapse an artifact to show its element dependencies in place. Canvas actions change only the browser view.

## Constraints

No database, authentication, AI agents, workflow engine, background workers, or persistent graph state. Prefer existing libraries. Keep the architecture simple and prioritize working behavior over extensibility.

## Behavior examples

These examples clarify the acceptance criteria and supply shared fixtures for implementation checks.

### B1 — Initial artifact

Given an artifact README declares no established version and one `change-initial` directory exists, when the repository opens, show no established version and show `change-initial` as the active change. Show its knowledge elements as proposed knowledge.

### B2 — Established dependency and reference

Given `authentication` depends on `tenant`, and an authentication element references `specifications/identity.md` in tenant, when tenant declares current version `1.0.0`, draw tenant → authentication and resolve the reference within tenant's `versions/1.0.0`. A newer version directory does not change resolution. Tenant is upstream of authentication; authentication is downstream of tenant.

### B3 — Proposed dependency removal

Given an established tenant → authentication edge and authentication's active proposal removes tenant, when the repository opens, retain the established edge with a proposed-removal annotation. Exclude it from the planning graph. The proposal does not change the established relationship.

### B4 — Missing referenced element

Given a valid artifact reference points to a missing element in the owner's current version, when the reader expands the consuming artifact, show the target and reason with an unresolved-reference diagnostic. Keep other artifacts and references inspectable.

### B5 — Proposed dependency addition

Given two artifacts with no established edge and an active proposal adds tenant as authentication's dependency, when the repository opens, show tenant → authentication as a proposed addition in the planning view. Do not present it as established.

### B6 — Read-only refresh

Given a repository with tracked and untracked files, when the reader opens, inspects, and refreshes it without external edits, all repository file contents and Git state remain unchanged. An explicit refresh after an external Markdown edit displays the updated working-tree content.

### B7 — Canvas exploration

Given a displayed artifact graph, when the reader pans, zooms, selects an artifact, and expands it, show that artifact's elements and reference connections on the same canvas. Selecting an element shows its details. Collapsing the artifact hides its element nodes while preserving artifact dependency edges. These actions do not change repository data.

## Input boundary

Support the canonical ADD layout and its documented YAML element references and dependency proposals. Root README conventions must be documented by the implementation. Unsupported or ambiguous conventions produce diagnostics. Arbitrary Markdown prose cannot reliably identify a dependency.

## Self-check

The scope covers the user's requested behavior and read-only constraint. No other project artifacts exist to change. KISS excludes unrelated runtime infrastructure. STE checks preserve the requirements and use direct acceptance criteria. The path-input interaction is part of the approved plan.

## Element reading order

11. Expanded artifacts and inspector lists present knowledge in ADD reading order: Requirements, Specifications, Decisions, then Tasks. Each source has a clear label so current-version elements and change elements are distinguishable.
12. Place a category's README before its other files. Order the remaining paths naturally, so `2-reader.md` precedes `10-validation.md`. Keep nested paths deterministic.
13. Preserve element identity, reference resolution, dependency relationships, selection, and read-only behavior when changing display order.

### B8 — Ordered artifact knowledge

Given an artifact has elements from its current version and a change, including requirements, specifications, decisions, and numbered task files, when the reader expands the artifact or opens its inspector list, show separate source groups. Within each source, show Requirements → Specifications → Decisions → Tasks. Within Tasks, show README.md, 2-reader.md, then 10-validation.md. Selecting a displayed element opens the same source-specific record as before.

### Ordering self-check

The correction addresses the reported screenshot without changing discovery or dependency contracts. Requirements define the reading order and observable grouping; the specification chooses source precedence. KISS adds no sorting settings or new dependencies. STE checks preserve existing requirements and state the order explicitly. Prior task evidence remains historical and does not prove this correction passes.
