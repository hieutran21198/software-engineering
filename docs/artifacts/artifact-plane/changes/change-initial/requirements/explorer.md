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

## Constraints

No database, authentication, AI agents, workflow engine, background workers, or persistent graph state. Prefer existing libraries. Keep the architecture simple and prioritize working behavior over extensibility.

## Input boundary

Support the canonical ADD layout and its documented YAML element references and dependency proposals. Root README conventions must be documented by the implementation. Unsupported or ambiguous conventions produce diagnostics. Arbitrary Markdown prose cannot reliably identify a dependency.

## Self-check

The scope covers the user's requested behavior and read-only constraint. No other project artifacts exist to change. KISS excludes unrelated runtime infrastructure. STE checks preserve the requirements and use direct acceptance criteria. The proposed path-input interaction is subject to explicit plan approval.
