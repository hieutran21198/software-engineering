---
references:
  - artifact: artifact-driven
    element: specifications/change-impact.md
    requires: Tiers, propagation rules, explanation record and coverage statement that the impact service implements.
---

# Change impact service contract

Governs I1–I12 in requirements/change-impact.md. Consumes the proposed artifact-driven change-impact contract that change-impact-semantics supplies on the same branch; dependent implementation waits for its establishment.

## Index

Keep a separate impact-index.sqlite in the private Plane state directory beside flow-index.sqlite, under the same directory guard: outside registered repositories and worktrees, private mode, disposable, never an authority. Tables: files (context, path, oid, hash), imports (context, from, to, names, locals, dynamic), declarations (context, file, name, exported, export_names, mentions), packages (context, dir, imports, test), embeds (context, file, pattern, target), mirrors (context, hash, path), history (context, head, a, b, support, total), vocabulary (context, file, identifiers) and contexts (context, repository, worktree, head, fingerprint, generation). A context is the canonical repository, worktree, HEAD and the worktree status fingerprint.

Update incrementally. File identities come from `git ls-files -s` blob IDs; dirty files from `git status --porcelain` are hashed. Only files whose identity changed are parsed again. History is recomputed when HEAD changes, over the last 500 non-merge commits reachable from local refs in date order, because the protected branch is squash-merged and HEAD alone hides most history; commits that touch more than 60 files are skipped. Parse JavaScript, JSX and ES modules with acorn and acorn-jsx: import and export specifiers, dynamic imports, top-level declarations and the identifiers each declaration mentions; a parse failure produces a diagnostic and file-level relations for that file. Read Go packages with `go list -json ./...` and go:embed directives when the go command is available; otherwise record Go in not_analyzed. Treat CSS imports at file level. Mirrors are tracked non-empty files with identical content in different top-level directories. Distinctive vocabulary identifiers are those present in at most 12 percent of source files.

Read declared knowledge relations through the existing flow reader once per request and cache the result in memory by the repository fingerprint. The end-of-request freshness check compares HEAD, the worktree status and the observation fingerprint instead of reading the repository again. Interrupted builds publish no generation.

## Query

Inputs: path, optional worktree, and one of origins (a list of {path | element | flow | step | model} with optional symbols, or {path, commit} to take that path's change from that commit), commit, range, or diff with base protected or a ref; depth from 1 to 4 (default 2); budget in characters for the compact text (default 8000, maximum 100000); format json or text; limit per section (default 25, maximum 200); optional unit. Validate selectors as the flow query does; reject unknown fields and unregistered worktrees.

Resolve origins as the ADD contract requires: tracked paths, IDs, changed declarations from a commit or diff, changed sections of documents, renames and deletions through `git log -M`. Propagate with the ADD rules, the in-module symbol closure, the test rule, the depth limit and the frontier count. Build Verify, Investigate, Potential (history support at least 2 and confidence at least 0.5, no document pairs, cap 10 per evidence kind) and Unresolved, including the artifact prerequisite check. When a unique unit owns the change of a changed artifact, or unit is given, compare its declared affected flows with the computed flows.

Response envelope: repository, worktree, context, revision, generation, freshness, completeness, data, diagnostics, omissions and metrics with the phase timings of the query. data has changed, direct, transitive, verify, investigate, potential, potential_total, unresolved, declared and coverage, with the explanation record and the coverage fields of the ADD contract. Sections longer than limit are cut with their total in omissions. The compact text has the sections Changed, Direct, Transitive, Verify, Potential (confirm before acting), Investigate, Unresolved and Coverage, one line per entity with its kind, strength, hops, path summary and evidence, cut to budget with a note.

## Interfaces

Add POST /api/impact/query to the loopback service with the existing host, origin and worktree checks. Add the MCP tool get_change_impact with read-only annotations and the same inputs; it returns structuredContent and the compact text. The flow query impact operation and the MCP tool get_impact_context delegate to the service at depth 4 and keep their result shape: the reached flows with impactPath built from the first path and its reasons, unresolved IDs, the existing ordering and cursors. Each tier is capped at 200 entities; a cut tier adds the diagnostic truncated-impact. The change context packet adds data.impact.tiers as an additive field: counts per tier, the first limit entities per tier with their paths, and the coverage statement under tiers.coverage, because data.impact.coverage already holds the v1 coverage text; the schema name stays artifact-plane.change-context.v1, and the Markdown export adds a Change impact section after Recorded flow impact. Existing tools, inputs and results are unchanged.

## Impact view

Add the page kind impact with a context of origins, a change, a document, a flow or a commit. Entry points: the change page action "What does this change affect?" (the branch difference against the protected ref), the document page action "Where is this used?", the flow page action on a step's sources, and the More menu entry Impact with a path or commit field.

The page shows the origins with their changed declarations or sections; a summary strip with the counts of direct, transitive, potential, verify and unresolved; and the sections Direct, Transitive, Potential and Unresolved as collapsible lists grouped by artifact, then flow with its affected steps, knowledge, module and test. A row shows the name, a kind chip, a strength chip, the hop count and the last relationship. Selecting a row opens a detail panel with every path as typed edges with their evidence, the affected exports, the reasons, and links to the document, flow or source page. Filters toggle tiers and kinds and, with several origins, one origin. "One more hop (N)" expands the depth and shows the frontier count. "Show as graph" renders a focused subgraph in the existing graph panel: origins, direct entities and the paths to the selected entity, at most 60 nodes, otherwise grouped by artifact. The whole graph is never rendered by default.

A flow page opened from the impact view highlights the affected steps and dims the others; selecting a step lists its affected supports. States: loading, stale with reload, partial with diagnostics, empty with the coverage statement ("No consumer found in the analyzed relationships"), and error. Keyboard operation and 390 pixel width follow the workbench contract.

## Discovery and flow reads

The semantic rank keeps only chunks whose cosine score reaches a cutoff measured on this repository's inventory, so that a query returns the flows above it instead of every flow while the expected flows of P9 stay in the top ten; a lexically and semantically close flow, such as the Story-Driven revision flow for a review query, remains a legitimate search result. Record the value and the measurement in the task evidence and the README. The detail, source and impact operations never initialize the embedder. The flow page renders the diagram from the document front matter; the detail request adds resolution and sources. A flow query reads the repository once; the freshness check compares fingerprints.

## Validation

Node tests on synthetic fixtures cover every rule row, the symbol closure through a re-export, renamed and deleted origins, a diverged mirror, an embedded file, an absent go command, history above and below the thresholds, the test rule, the prerequisite check, the declared comparison, stale input, budget and limit cuts, HTTP and MCP parity and packet additivity. The script scripts/impact-benchmark.mjs runs the nine ground-truth cases against this repository at the delivery revision and prints precision and recall per tier, the step checks, negatives, unresolved items, timings and output sizes; its output is task evidence for the unit accuracy and performance criteria. Browser tests cover each entry point, filters, expansion, the detail panel, the graph toggle, the diagram highlight, and the empty and stale states at 1440 and 390 pixels.

## Self-check

I1 and I3 to I6 map to Query, I2 and I9 to Index, I7 to Interfaces, I8 to Impact view, I10 and I11 to Discovery and flow reads, I12 to Validation. KISS: one new index file, one service, reuse of the readers, the HTTP handler, the MCP server and the graph panel; two small parser dependencies; no framework. STE: limits and thresholds are named once. No Specification blocker remains for Plan.
