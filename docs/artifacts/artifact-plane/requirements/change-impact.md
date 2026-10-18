# Change impact intelligence requirements

## Outcome

A person in Artifact Plane or an agent through HTTP or MCP can select a change and read which knowledge, flows, steps, models, contracts, modules and tests it affects, in which tier, why, with what evidence, and what was not analyzed, in one bounded answer.

## Need

Measured on this repository on 18 October 2026 with the delivered 1.17.0 readers:

- The impact operation and the review packet return flows only. Code modules, tests and referencing elements are not output types. There is no Impact view; the unit page shows the declared affected flows and the packet export prints the flow candidates.
- Impact starts only from knowledge paths or IDs. A code change cannot seed it: the change to git-process.js, which gates every Git command, returned nothing and one unresolved ID.
- Propagation is file-level reachability. For the change to RuntimeStore, every importer of the file was a candidate, including modules that import only unrelated exports.
- The step that cites a changed element is not reported; the whole flow is. Results are ordered newest-first with no hop count, relationship kind or evidence.
- Semantic ranking returns all 17 flows for every query because every embedded chunk receives a score. For the query "review a change and assess its impact" the first result was the Story-Driven revision flow, which shares words and nothing else.
- Deterministic relationships exist but are unused: 413 ESM import edges with named specifiers across 148 modules, Go package imports and go:embed directives, 38 byte-identical mirror files between docs/artifact-driven and src/archs, and 432 commits of co-change history. One example: change-review.js and context-packet.js changed together in 5 of 10 commits and share no import.
- Every flow query reads the whole repository two or three times and runs embedding work for detail and source reads that never use it; a warm detail read takes about 1.3 seconds.

## Requirements

- I1: Seeds. Accept changed files, knowledge element paths, flow, step and model IDs, changed declarations, one commit or a commit range, and the working-branch difference against the protected ref. Resolve renamed and deleted paths through Git and report unknown inputs as unresolved with the reason.
- I2: Relations. Combine the declared relations of the existing readers (references, flow supports, models and participants, unit affected flows, artifact prerequisites) with derived relations: ESM imports with named specifiers and the in-file closure of top-level declarations, Go package imports, same-package tests and go:embed directives, and identical-content mirrors. Add no manual declaration.
- I3: Tiers and rules. Apply the ADD change-impact contract: changed, direct, transitive with a depth limit and a frontier count, potential from co-change history and shared contract vocabulary, and unresolved. Tests that support affected steps form a verification list. Transitions, artifact prerequisites and semantic similarity never propagate.
- I4: Explanation. Report for every entity its kind, tier, hops, evidence strength label, originating changes, typed path with per-edge evidence (reason text, imported symbols, co-change counts, shared terms, mirror state, embed pattern) and affected exports where known. Rank by tier, strength, hops and the number of originating changes; never by creation date.
- I5: Coverage. Every answer carries the relationship sources used, the sources not analyzed, the depth, the frontier count, the symbol level, the history window, freshness and completeness. An empty answer never claims absence.
- I6: Declared and computed. Show the owning unit's declared affected flows beside the computed flows and name declared flows that were not reached and reached flows that were not declared.
- I7: Interfaces. Add POST /api/impact/query and the MCP tool get_change_impact, which return the same facts as structured JSON and as compact text within a character budget. Add the impact result to the change context packet as an additive field. Keep the existing flow and review tools and their tests unchanged; the impact operation of the flow query delegates to the new service and keeps its result shape.
- I8: Impact view. Add an Impact page reachable from the change page, the document page, the flow page and the More menu. Group results by tier, then by artifact, flow with its affected steps, module and test. Offer tier and kind filters, expansion by one more hop with its count, selection that shows the path and evidence with links to the document, flow or source, and the flow diagram with affected steps highlighted. Do not render the whole graph by default.
- I9: Index. Keep the derived relations in a disposable index outside repositories and worktrees, updated incrementally from Git object identities and file hashes. On this repository, a full build takes at most 2 seconds, an incremental update after one file change at most 300 milliseconds, and a query at most 100 milliseconds. No query reads the whole repository more than once.
- I10: Discovery. Keep semantic ranking in Discover only, with a score cutoff so that a query returns the flows above it instead of every flow. Detail, source and impact operations never load the embedding model.
- I11: Flow reads. The flow diagram draws from the flow document in the page and does not wait for the detail request. The detail request answers within 300 milliseconds warm on this repository.
- I12: Validation. Keep the nine ground-truth cases as fixtures with their expected tiers, steps, negatives and unresolved items. The suite fails when direct precision or recall drops below 1.0 for a symbol-seeded case, when an expected step is missing, when a hard negative enters direct or transitive, when an expected unresolved item is missing, or when a potential list exceeds its cap.

## Local acceptance

Fixture repositories exercise seeds of every kind, renamed and deleted paths, symbol closure through a re-export, a Go package with an embedded file, a mirror that diverged, co-change above and below the thresholds, a flow whose test support is affected, an artifact prerequisite without references, stale input, and HTTP and MCP parity. Repository bytes stay unchanged. Existing Plane tests and builds pass.

## Affected artifacts and self-check

Consume the proposed artifact-driven change-impact-semantics, specifications/change-impact.md; the existing artifact-plane to artifact-driven dependency is unchanged, and dependent implementation waits for its establishment. The flows change-review, context-handoff and source-retrieval change; change-impact is new. Facts above come from the delivered readers, the repository and the prototype measurements of 18 October 2026, recorded in decisions/016-typed-impact-ledger.md. The owner confirmed at plan approval on 18 October 2026 that I10 keeps semantic search for Discover only and that I11 is in scope. KISS reuses the existing readers, SQLite index, HTTP handler, MCP server and graph panel. STE keeps limits explicit. No Requirement blocker remains for Specification.
