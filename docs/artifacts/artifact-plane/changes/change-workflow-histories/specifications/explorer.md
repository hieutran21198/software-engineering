# Explorer contract

## Runtime and opening

Use a Node.js process with a small HTTP server and static browser UI. Bind to `127.0.0.1`. A path input opens an absolute path on the server's computer. The approved interaction uses a repository path input. No repository picker service or installation into the inspected repository is required.

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

An immediate `changes/change-*` directory identifies retained change knowledge. Resolve active-change declarations under the Knowledge display contract below. Without a declaration, zero means no active change, one is selected, and multiple produce ambiguity. Do not select one by timestamp. Enumerate `.md` knowledge files recursively in `requirements`, `specifications`, `decisions`, and `tasks` in the declared current snapshot and candidate changes. Do not enumerate historical versions as current knowledge.

## Dependencies and resolution

Edges point upstream to downstream. Keep established edges and proposed additions/removals separate. Read proposals in the documented `dependencies.yaml` format (`artifact`, `add`, `remove`). Apply valid proposals to a separate planning view, retaining removal annotations in the established view. Diagnose malformed proposals, owner mismatches, absent endpoints, and cycles in each view.

Read `references` arrays from YAML front matter and fenced YAML blocks in knowledge Markdown. Each reference contains `artifact`, snapshot-relative `element`, and `requires`. Proposed references additionally use `status: proposed` and `change: change-<name>`. Resolve established targets against the target owner's declared version; proposed targets against the explicitly named change. Missing or ambiguous sources remain unresolved. Preserve the consuming element, target, reason, status, and resolution diagnostic. Do not turn element references into new artifact execution edges.

Reject absolute element paths, path traversal, and symlinks that escape the selected repository. Ignore `.git` contents during knowledge discovery. Reject unsafe paths before reading; use real paths to enforce containment. Unknown formats remain visible as Markdown and produce diagnostics where a declared reference cannot be parsed.

## Snapshot response and UI

The response contains `repository` context, `artifacts`, `edges`, `references`, `diagnostics`, and the additive `workflow` evidence defined below. Artifact records contain identifier, title, README, currentVersion (nullable), activeChange (nullable), change candidates, and elements. Edges carry source, target, and status (`established`, `proposed-add`, `proposed-remove`). Element records carry artifact, relative path, snapshot source, and Markdown content. References carry consuming element, target artifact/path/source, reason, status, and whether resolution succeeded. Diagnostics carry code, source path, and message.

Use React with React Flow (`@xyflow/react`) for the interactive graph canvas and Dagre (`@dagrejs/dagre`) for automatic artifact layout. Use built-in pan, zoom, fit-view controls, and node selection. Render labels as text, not repository-provided HTML. Clicking a node selects an artifact; a parallel artifact list provides keyboard selection. Show details, version, active change, and upstream/downstream lists in a details panel. Compute direct and transitive reachability independently for established and planning graphs with visited sets, including when inputs contain cycles.

Expanding an artifact turns its canvas node into a group containing collapsible type headings. Opening a primary type reveals current-version nodes. Change histories contains separately expandable changes and their type groups. Keep element positions in a simple local arrangement; Dagre lays out the outer artifact groups using their measured dimensions. Support multiple expanded artifacts. Draw element references between visible element nodes; for collapsed target artifacts, connect to the artifact node and retain the exact target in the reference list. Use a distinguishable unresolved target marker when the artifact or element is missing. Selecting an element opens its Markdown and reference details. Collapsing a group hides its element nodes and preserves artifact dependency edges. Element connections explain references and never alter the execution DAG.

Keep selected nodes, expanded artifact/type groups, viewport, and inspector width in browser memory only. Disable node dragging, connection creation, deletion, and graph editing; the canvas remains an explorer. Expansion recomputes layout without resetting zoom; fit-view is explicit after the initial load. Render Markdown with an existing parser and sanitizer; disable unsafe links and embedded HTML execution. Show empty states and diagnostics. Provide explicit Refresh and graph fit controls. No custom canvas rendering engine or paid example code is required.

## Validation and impact

Fixture repositories cover established versions, initial artifacts, active proposals, element references, missing targets, cycles, index disagreement, metadata conflicts, multiple changes, malformed YAML, hostile Markdown, and escaping paths. Verify repository file bytes and Git status before and after exploration and refresh. Browser acceptance verifies opening, node selection, expansion, relationship lists, diagnostics, and read-only behavior. No upstream project contracts block implementation.

Add an independent Artifact Plane check job to the existing GitHub Actions workflow. Use Node.js 24 and the application's lockfile; run `npm ci`, `npm test`, and `npm run build` from `apps/artifact-plane`. These same commands must work locally. Validate the integrated code before PR handoff. This job checks the app and does not publish or deploy it.

## Self-check

The contract covers every requirement with one request-driven process. Libraries own YAML, Markdown, sanitization, and graph layout. KISS excludes persistence, plugin interfaces, and runtime coordination. STE checks preserve status distinctions and use explicit rules. Parser conventions are a documented compatibility boundary, not a claim to understand arbitrary prose.

## Logical element ordering

Use one shared ordering rule for the snapshot's elements and both UI views. Type order is Requirements, Specifications, Decisions, then Tasks. Within each type, source order is the declared current version, the uniquely identified active change, then other change candidates in natural name order. If active change detection is ambiguous, label the change sources as candidates rather than inventing an active source. The histories contract below defines source display and declaration discovery.

Within each type/source pair, place the direct category `README.md` first. Compare the remaining snapshot-relative paths with natural numeric, case-insensitive ordering and a case-sensitive tie-breaker. Keep stable source-specific element identifiers.

Render collapsible type headings with total record counts in expanded artifacts and the inspector Knowledge elements section. Type groups start closed. Use one browser-memory expansion set keyed by artifact, source, and type so the two views agree. Omit empty types. Within an open type, show its source heading and ordered records. Selecting an element from a reference or list opens its owning artifact and every required history/source/type container. Headings are controls and labels, not execution dependency nodes.

Size artifact groups from the same visible section data that positions their elements. Show element reference edges only when their consuming element is visible. Route references to hidden target elements through their owning artifact node and preserve the exact target in the inspector. Keep missing-target diagnostics visible. Type collapse hides its element nodes and reference edges without changing artifact dependencies or resetting zoom. Reference connections retain existing element IDs.

Reduce canvas record height from 70 to 52 CSS pixels, use 6-pixel vertical padding and an 8-pixel gap between records. Keep the source and filename on two readable lines with the full filename available in its title and inspector. Connection handles remain vertically centered.

Add a shared-fixture B8 regression with deliberately scrambled records, all four categories, category READMEs, nested paths, and task numbers 2 and 10. Check the ordering independently of input insertion order, and check canvas positions and inspector order in the browser. Re-run existing read-only, reference, and viewport checks on the integrated correction.

### Ordering specification self-check

The order follows ADD knowledge reading flow with an established baseline first. The ordering rule preserves element identifiers and dependency relationships. The histories and workflow extension below adds runtime API data while retaining the existing local-server decision. KISS keeps a shared plain-function ordering rule, and STE checks make the source and category labels explicit. B8 supplies the contract and validation boundary for the new task.

## Resizable inspector

In the desktop layout, provide a visible divider before the right details panel. Pointer dragging changes the panel width in browser memory. Use a 340-pixel default, a 240-pixel minimum, and a maximum of the smaller of 640 pixels or the workspace width remaining after the sidebar and a 300-pixel canvas. Clamp width after viewport changes. At widths where the existing layout stacks the inspector below the canvas, hide the divider and let the panel fill the available width.

Expose the divider as a focusable vertical separator with its current width and bounds. Arrow keys resize in 20-pixel steps; Home and End select the minimum and maximum. Capture pointer events during dragging and release them when the gesture ends. The Markdown reflows inside the resized panel. Keep selection, graph controls, and existing reference resolution intact. No panel library, persistence, or backend change is required.

## Revised validation

B8 checks type order, source-specific counts, default collapse, and natural filenames. B9 checks 52-pixel records and attached handles in an open group. B10 checks pointer and keyboard resizing, width bounds, Markdown reflow, and the stacked layout. Existing B1–B7 fixtures must open the required type before inspecting elements. Re-run the read-only and canvas tests against the combined UI changes. KISS reuses existing components and browser state; STE keeps labels and interactions explicit.

## Histories and worktree evidence contract

Existing element IDs and reference resolution remain stable.

### Knowledge display

Primary type groups filter to the declared current-version source. Change histories is a separate closed container. Its change entries are naturally sorted by name, closed by default, and contain the four existing type groups. Type counts count only the displayed source. Expansion keys include artifact, source, and type. Reference navigation opens every required container. Collapse retains selected details. Keep 52-pixel records and existing resize bounds. Do not place history elements among current-version elements.

Recognize an explicit Active change section in an artifact root README when it has exactly one safe local link to an existing changes/change-name/README.md. Ignore code examples. Accept only the owning artifact's change directory; reject traversal outside it and contradictory declarations. A valid declaration takes precedence over retained directory count. Without it, retain the single-directory fallback; multiple candidates remain ambiguous. This selects a declared change, not proof that it is running. Existing proposals use only this selected source. History retains every discovered change.

### Read-only API extension

POST /api/explore keeps its input and existing snapshot fields. Add workflow = {worktrees, diagnostics, historyLimit: 200}. Each worktree has path, branch (nullable), head (nullable), selected, detached, locked, prunable, availability (readable, unavailable, non-add), changes, and diagnostics. Each change has artifact, name, declaredActive, currentStep (nullable), inferenceReason, steps, and tasks. Each step has name, state (observed, inferred, documented-complete, unknown), evidence[], commits[], and completionCommit (nullable). A commit contains full id and subject. Evidence contains a kind, relative file, and short explanation. Tasks include path and checked/unchecked counts from actual Markdown checkboxes, with malformed/empty checklists marked unknown. These additive fields are bounded runtime data, never stored in inspected files.

Enumerate registered worktrees using git worktree list --porcelain -z. Preserve spaces and non-ASCII paths. Read only those roots; apply the existing containment and symlink protections separately in each. Do not follow arbitrary paths from Markdown. No recursive workflow scans: one enumeration and one bounded evidence read per registered worktree. Reuse plain scanner functions and the safe Git subprocess wrapper. Unavailable entries receive diagnostics rather than failing the selected snapshot. Opening a worktree calls the existing API with its root. Refresh performs a fresh read; no watchers or polling.

### Step evidence and commit association

Read at most the latest 200 commits reachable from each worktree HEAD that touch docs/artifacts. Include changed paths and subjects with delimiter-safe Git output. Associate Requirement with requirements/, Specification with specifications/ and decisions/, Plan with tasks/README.md and task definitions, Implementation with task checklist/evidence changes, Validation with task evidence describing check results, and Version preparation with versions/ changes and artifact root version changes. Associate by changed file content and paths, never by commit subject alone. Show all associated commits within the bound, newest first. Disclose truncation and shallow history. A squash can belong to several steps. Do not resolve unregistered branches or fetch remote history.

For copied change baselines, compare against the declared current snapshot and the change's introduction commit; unchanged inherited files/checklists do not prove new progress. If the current snapshot contains the same change knowledge, report no distinguishable ongoing change rather than a running workflow. Root declarations can be stale after merge. Multiple distinguishable changes remain separate, with no guessed global active step.

Current step prioritizes relevant uncommitted file changes, then the latest distinguishable committed evidence. Requirement/specification edits identify observed work. Task definition edits identify Plan work; unchecked current tasks with implementation evidence indicate Implementation. Validation is supported only by explicit current-task validation evidence, and Version preparation by distinguishable snapshot preparation. Missing or conflicting evidence yields unknown with a reason. A higher phase never automatically completes preceding phases. Documented completion requires explicit self-check/completion text or checked current-task criteria plus evidence; label it as documented, not independently verified. Approval is not inferable from Git; the explorer does not display an Approval phase. completionCommit stays null unless history shows the introduction of explicit completion evidence; otherwise show associated commits and 'Exact completion commit unknown'.

### UI and failures

Add a Workflow view beside the dependency canvas. Group worktrees and their changes on the interactive canvas, with a selected-worktree indicator. Node selection shows inferred step, evidence reasons, tasks, expandable phase commits, and the explicit Open action in the inspector. Full IDs and subjects are plain text. Keep canvas selection and inspector width during view switching. Empty, unreadable, shallow, ambiguous, and history-limited states must remain visible. Worktree metadata failure does not remove the existing artifact graph.

### Validation and impact self-check

B11–B14 govern new behavior. Add Git fixtures for two worktrees, uncommitted phase edits, inherited completed tasks, distinct phase commits, squash commits, declared versus stale active changes, detached/unavailable worktrees, and history limits. Fingerprint all inspected files and Git metadata before/after. Retain existing API protections and DAG/reference checks. Only Artifact Plane changes; no new artifact dependency. Contract-Driven Development supplies the additive API and evidence rules, BDD supplies examples, and existing CI supplies integrated validation. KISS uses plain functions and existing libraries; STE separates evidence from claims.

## Workflow canvas contract

Replace the Workflow card list with React Flow using the existing library. Consume snapshot.workflow unchanged. No server or inference contract changes. Derive nodes and positions in memory using plain functions.

Each registered worktree is a labeled group with branch, path, short HEAD, availability, and selected marker. Each change occupies a row inside its worktree. Show change identity and the existing inferred step or Historical/Unknown label. Phase nodes follow source steps in order: Requirement, Specification, Plan, Implementation, Validation, Version preparation. Display evidence state and highlight the current inferred phase. Use distinct text as well as color. Connecting lines indicate phase order only; they do not assert completed prerequisites or artifact dependencies. Show a legend for this meaning.

Use deterministic positions and group dimensions derived from row counts. Keep nodes fixed in layout; allow pan, zoom, fit, and selection. No new graph layout dependency. Empty or unavailable groups remain visible with diagnostics. Fit initially and provide a manual fit control; do not reset the viewport on each selection.

Node IDs encode worktree path, artifact, change, and phase using structured string tuples. Keep selection separate from artifact canvas selection. Switching views preserves each selection. Refresh resolves workflow selection by ID against the new snapshot; missing IDs clear selection. Opening another repository clears workflow selection. Inspector width uses the existing shared resize control.

Worktree inspector shows branch, path, full HEAD, availability, diagnostics, and explicit Open worktree action when readable and not selected. Change inspector shows inference reason, declared-active caveat, and task evidence. Phase inspector shows state, evidence, associated commits and exact completion commit or unknown. Preserve full IDs and messages, safely rendered as text. At narrow widths use the existing stacked inspector behavior. No polling, persistent browser storage, Git mutations, or background work.

### Canvas specification self-check

Requirements 21–23 and B15–B16 map to layout, selection, evidence inspection, and source safety. No API, artifact DAG, upstream dependency, or inference change is needed. Existing ADRs remain valid. KISS reuses React Flow and plain functions. STE distinguishes sequence lines from dependency or completion claims. No blockers remain for Plan.

## Workflow history and navigation contract

Phase records and canvas nodes contain six phases: Requirement, Specification, Plan, Implementation, Validation, Version preparation. Remove the synthetic Approval record and its node. This does not infer actual approval. Preserve existing evidence inference and commit associations for the remaining phases.

Add runtime change fields history (boolean), historyReason (text), and lastCommitAt (nullable integer Unix seconds). A change belongs to history when a valid active declaration names a different change, or when its category knowledge matches the current snapshot under the existing comparison. The first case describes retained source, not verified completion. The second describes no distinguishable ongoing work. A declared change differing from the current snapshot stays primary. Without a valid active declaration, unmatched candidates stay primary with existing uncertainty reasons. Do not infer lifecycle from branch names, clean status, directory names, or commit subjects.

Read committer timestamps with the existing bounded Git log. lastCommitAt is the maximum valid timestamp among inspected reachable commits touching files in that change directory. Version-only, unrelated root, and unrelated artifact commits do not reorder histories. Unknown or unavailable timestamps remain null and sort last. Sort equal timestamps by artifact identifier and natural change name. Preserve the existing 200-commit cap, shallow-history diagnostics, and read-only Git environment. Do not scan additional repositories or store timestamps in Markdown.

Each worktree has primary change rows followed by a Change histories toggle showing the retained count. Histories start closed. Opening the group shows retained change headings ordered by lastCommitAt descending. Each retained change starts closed; opening it reveals its phase row. Expansion keys include worktree path, artifact, and change. Keep independent expansion in browser memory; do not write it to disk. Recalculate group height and row positions from visible records. Use the existing React Flow and fixed layout functions. Sequence edges connect only visible phases in one change. Phase order does not imply completion or dependency edges.

Resolve selected evidence from the complete payload, independently of canvas visibility. Collapse preserves details; refresh clears a missing source. Reopening another repository resets history expansion. Switching views preserves viewport, expansion, selection, and inspector width. The inspector describes retained-history reasons and timestamp limits without calling all history records finished.

Use a stable toolbar layout with the Dependencies / Workflow switcher horizontally centered in the canvas area. Reserve left and right regions in both views; hiding Established / Planning does not move the switcher. At narrow widths use a centered separate row when space is insufficient. Existing keyboard controls, canvas actions, and read-only behavior remain valid.

### History specification self-check

Requirements 24–27 and B17–B18 map to phase removal, runtime lifecycle/recency fields, collapsed history controls, and stable toolbar layout. No artifact dependency or new architectural decision is required. KISS adds only derived fields and view state. STE keeps uncertainty and commit-time meaning explicit. No blocker remains for Plan.
