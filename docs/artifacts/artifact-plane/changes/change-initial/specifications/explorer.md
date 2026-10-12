# Explorer contract

## Runtime and opening

Use a Node.js process with a small HTTP server and static browser UI. Bind to `127.0.0.1`. A path input opens an absolute path on the server's computer. This is the proposed interaction pending plan approval. No repository picker service or installation into the inspected repository is required.

`POST /api/explore` accepts JSON `{ "path": "/absolute/repository" }`. Each request reads the working tree and returns a fresh in-memory snapshot. No selected-repository state is persisted. Reject non-JSON requests, foreign origins, and unexpected Host headers. Browser requests originate from the local application. Do not expose filesystem content through generic static routes.

Use Git read commands with argument arrays, no shell interpolation, and optional locks disabled. Verify the selected directory is a Git worktree root. Return branch, HEAD, and dirty status as context; the working tree supplies current file contents. Never run mutating Git commands.

Return 400 for invalid input, 404 for a missing repository or ADD directory, and 422 for an unreadable or invalid Git root. A readable but inconsistent ADD repository returns 200 with diagnostics. Unexpected failures return a sanitized 500 error.

## Implementation boundaries

Apply Ports and Adapters through plain modules and functions. The repository reader owns filesystem access and read-only Git commands. It produces source records with relative paths and contents. Parsing and graph functions consume those records to calculate metadata, edges, reference resolution, diagnostics, and reachability without filesystem, Git, HTTP, or browser calls. The HTTP handler validates requests and returns the calculated snapshot. The browser consumes that snapshot and owns selection, rendering, and explicit refresh.

Use ordinary objects and arrays for Artifact, Element, Reference, Edge, and Diagnostic records. Stable identifiers and explicit established/proposed status preserve domain meaning. Do not add aggregate classes, repository interfaces, dependency-injection containers, or alternative adapters without a demonstrated need. Test graph rules directly and test the real reader against temporary Git repositories.

Contract-driven checks cover supported input formats, producer response shape, UI consumption, and error behavior. Requirement examples B1–B6 govern shared fixtures. Use TDD for parsing, reference resolution, graph rules, and read-only guarantees after plan approval. Use ordinary test assertions; no BDD framework is required.

## Discovery and metadata rules

Discover immediate child directories of `docs/artifacts` that contain `README.md`. Directory names are stable artifact identifiers; display the first Markdown heading as the title. Preserve the README content for details.

Read YAML front matter keys `current_version` and `depends_on` when present. Also support Markdown sections `Current established version` or `Current version`, and `Established dependencies` or `Dependencies`. A version section accepts one semantic version, optionally in backticks or a link to that artifact's matching snapshot. `None` means no established version. A dependency section accepts `None` or a list of artifact identifiers, optionally links to artifact root READMEs. Conflicting declarations or unrecognized declarations yield diagnostics rather than invented metadata. Document these conventions with runnable fixtures.

Root README declarations are authoritative. Compare `dag.yaml` with discovered roots and report missing entries, unknown artifacts, and different dependencies. Do not replace root declarations with the index. No index is required to inspect valid root declarations.

An immediate `changes/change-*` directory identifies a candidate active change. Zero means no active change; one is active; multiple produce an ambiguity diagnostic and are shown as candidates. Do not select one by timestamp. Enumerate `.md` knowledge files recursively in `requirements`, `specifications`, `decisions`, and `tasks` in the declared current snapshot and candidate changes. Do not enumerate historical versions as current knowledge.

## Dependencies and resolution

Edges point upstream to downstream. Keep established edges and proposed additions/removals separate. Read proposals in the documented `dependencies.yaml` format (`artifact`, `add`, `remove`). Apply valid proposals to a separate planning view, retaining removal annotations in the established view. Diagnose malformed proposals, owner mismatches, absent endpoints, and cycles in each view.

Read `references` arrays from YAML front matter and fenced YAML blocks in knowledge Markdown. Each reference contains `artifact`, snapshot-relative `element`, and `requires`. Proposed references additionally use `status: proposed` and `change: change-<name>`. Resolve established targets against the target owner's declared version; proposed targets against the explicitly named change. Missing or ambiguous sources remain unresolved. Preserve the consuming element, target, reason, status, and resolution diagnostic. Do not turn element references into new artifact execution edges.

Reject absolute element paths, path traversal, and symlinks that escape the selected repository. Ignore `.git` contents during knowledge discovery. Reject unsafe paths before reading; use real paths to enforce containment. Unknown formats remain visible as Markdown and produce diagnostics where a declared reference cannot be parsed.

## Snapshot response and UI

The response contains `repository` context, `artifacts`, `edges`, `references`, and `diagnostics`. Artifact records contain identifier, title, README, currentVersion (nullable), activeChange (nullable), change candidates, and elements. Edges carry source, target, and status (`established`, `proposed-add`, `proposed-remove`). Element records carry artifact, relative path, snapshot source, and Markdown content. References carry consuming element, target artifact/path/source, reason, status, and whether resolution succeeded. Diagnostics carry code, source path, and message.

Use Mermaid for artifact layout and diagrams. Generate labels and identifiers from escaped data, never accept repository-supplied Mermaid code. Use strict rendering security. Clicking a node selects an artifact; a parallel artifact list provides keyboard selection. Show details, version, active change, and upstream/downstream lists. Compute direct and transitive reachability independently for established and planning graphs with visited sets, including when inputs contain cycles.

Expanding a selected artifact shows elements grouped by snapshot source and an element reference diagram plus a textual reference list. This is an explanatory graph, not a new execution DAG. Render Markdown with an existing parser and sanitizer; disable unsafe links and embedded HTML execution. Show empty states and diagnostics. Provide explicit Refresh and graph fit controls.

## Validation and impact

Fixture repositories cover established versions, initial artifacts, active proposals, element references, missing targets, cycles, index disagreement, metadata conflicts, multiple changes, malformed YAML, hostile Markdown, and escaping paths. Verify repository file bytes and Git status before and after exploration and refresh. Browser acceptance verifies opening, node selection, expansion, relationship lists, diagnostics, and read-only behavior. No upstream project contracts block implementation.

Add an independent Artifact Plane check job to the existing GitHub Actions workflow. Use Node.js 24 and the application's lockfile; run `npm ci`, `npm test`, and `npm run build` from `apps/artifact-plane`. These same commands must work locally. Validate the integrated code before PR handoff. This job checks the app and does not publish or deploy it.

## Self-check

The contract covers every requirement with one request-driven process. Libraries own YAML, Markdown, sanitization, and graph layout. KISS excludes persistence, plugin interfaces, and runtime coordination. STE checks preserve status distinctions and use explicit rules. Parser conventions are a documented compatibility boundary, not a claim to understand arbitrary prose.
