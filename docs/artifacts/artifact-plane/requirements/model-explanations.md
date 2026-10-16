# Understand relationships and behavior

## Need and scope

The dependency graph exposes supplier/consumer names and status without a reason. Flow support exposes knowledge or source paths instead of the domain models those files describe. Readers cannot easily explain why artifacts depend on one another or imagine their interactions.

## Acceptance criteria

- P1: Selecting a dependency explains which consumer depends on which supplier, its declaration/status, recorded consumption reasons and their exact source. Missing reasons are labelled Reason not documented.
- P2: Direct edges and transitive paths remain distinct. No reason, direction, execution or establishment claim is inferred from proximity, names or semantic similarity.
- P3: A model-aware flow shows named models grouped by artifact, meaningful actions and outcomes, and the existing branch/loop conditions. Source documents and code remain secondary evidence.
- P4: Selecting a model reveals its purpose, owner, selected snapshot, evidence and other known participating flows without losing the selected journey.
- P5: Legacy flows use their current step view with an explicit model-information gap. Partial, invalid and unresolved metadata do not hide readable knowledge or invent relationships.
- P6: One existing cross-artifact journey demonstrates the result using verified contracts. Keyboard operation, responsive layout, worktree/project isolation, read-only access and HTTP/MCP parity remain intact.

## Discovery and self-check

The inspected overview returns dependency source/target/status and zero structured element references. The model parser already retains reference requires as reason when available. Existing flow support kinds resolve documents, flows, implementation and tests. Zero references does not prove absence of reasons in prose. The first pilot uses ADD artifact/change/version knowledge and Plane repository exploration; Story-Driven concepts informed discovery but are excluded from this outcome to avoid an unneeded third member. KISS reuses readers, selectors, evidence and graph controls; STE separates documented explanation from unknowns. No Requirement blocker remains.
