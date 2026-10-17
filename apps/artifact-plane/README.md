# Artifact Plane

Explore and author a local Artifact-Driven Development repository. The application reads Git and Markdown, derives dependency and behavior graphs and stores a rebuildable flow index outside inspected repositories. Opening, reading and refreshing change nothing. Explicit edit operations write ADD records in `docs/artifacts` of a worktree with a non-protected branch; see [Edit knowledge](#edit-knowledge).

## Run

Install Node.js 24 or later and Git. From this directory:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4310`. Enter the absolute path to a Git worktree root that contains `docs/artifacts`. The path refers to the computer running the server. To use a different port, set `PORT` before starting the app.

All browser assets are bundled locally. Knowledge exploration needs no account, AI service, or external runtime service. Repository observation runs in the local server.

## Explore

After a repository opens, the **work page** shows the branch, the open changes with their current step and next-step hint, the units of work, and the uncommitted knowledge files with a commit form.

- **Source bar**: the project name, the **Worktree** control (every registered worktree with its branch; selecting one switches all pages in one step), the edit state (Clean, unsaved and uncommitted counts), Refresh and Change repository. On `main`, `master` or a detached HEAD a banner explains that knowledge cannot change there and offers **Create branch**.
- **Navigation tree** (left): one search field filters every group by title and ID. **Current work** lists open changes and their units, with Start a change and New unit. **Artifacts** expands to Overview, Requirements, Specifications, Decisions, Flows and Delivery history; documents show new, changed or removed since main. **Units of work** lists every brief. Arrow keys, Home and End move through the tree; expansion is kept per project for the session. Below 800 pixels the tree is a drawer that **Navigation** opens.
- **Pages**: work, artifact, document, change (Overview, Plan, Review), unit, flow and graph. Each page has a breadcrumb, a title, a status line and its actions. Reading and editing happen on the same page.
- **Graph page**: the dependency canvas with Established and Planning, element expansion and a details rail. Arrows point from upstream knowledge to its consumer. Purple dotted lines show element references; green dashed lines show proposed additions and red dashed lines proposed removals. The canvas keeps its viewport while other pages show.
- Drag the dividers to resize the tree and the details rail; Arrow keys and Home/End do the same with keyboard focus. Repository edits update open pages automatically. Unsaved editor text survives a refresh; the document is then marked as changed on disk.

## Implementation task graphs

Open a change and select **Plan**. The task table shows sequence, ID, title, prerequisites, DoD progress and evidence count. **Graph** shows the task canvas, with arrows from prerequisite tasks to dependent tasks. Select a task to read its scope, DoD and evidence in the details rail, check DoD items, record evidence or edit the task.

Current plan membership comes from the tasks list in YAML front matter in tasks/README.md. Each listed task declares id and depends_on. Unlisted files remain historical knowledge. A plan without a task list shows Task graph unavailable; an explicit empty list shows No planned tasks. Invalid declarations show diagnostics and no execution edges. Checklists are documented evidence; they do not verify completion, approval, or running agents. External artifact gates remain separate.

## Project tabs

Use **+** above the explorer to open another project inside Artifact Plane. Select a project tab to switch, or use its close button. Opening the same canonical repository path selects its existing tab. Each tab keeps its navigation, selection, filter, worktree, and graph position during the page session. Equal project names include the shortest distinct parent-path suffix; the full path remains available in the tab tooltip.

Inactive tabs pause repository and runtime observation. Selecting a tab refreshes its repository evidence while retaining valid navigation. Closing the last project returns to an empty project tab.

The application saves successfully opened project paths, tab order, and the active project in browser-local storage. Refresh or restart restores these projects in the same browser profile and application origin. Inactive restored projects load when selected. A missing project keeps its path so you can retry or close it. Navigation details and graph data are not saved across page reloads. Separate browser windows do not synchronize their tabs. Changing the server port creates a different storage origin.

Storage errors leave current-session exploration available with a warning. Retained session memory grows with open projects; closing tabs releases their state and connections.

## Edit knowledge

In the browser, every page offers its edits in place: Start a change and New unit on the work page; Add document, Add flow, Add dependency and Migrate on the artifact page; Edit, Record self-check, references and Advanced front matter on the document page (Ctrl+S saves); tasks, DoD checkboxes, evidence, readiness, Commit, Prepare version and Record publication review on the change page; members, criteria, evidence and affected flows on the unit page; steps, transitions, support, gaps and exclusions on the flow page. The status line names the written files and offers **Undo**. A save that meets newer bytes on disk shows both versions with **Reload** and **Overwrite**. Leaving unsaved text asks first.

Edits use domain operations. An operation names domain objects, such as an artifact, a change, a task or a flow step. The server derives every path, identifier and source fragment, builds the changed files, validates the result with the same readers that the explorer uses and then writes. Git stays the only store; the Plane keeps no workflow state, approval or index.

Rules:

- Writes stay inside `docs/artifacts` of the selected registered worktree. Paths with `..`, `.git`, backslashes, NUL, symbolic links, non-Markdown files, files over 1 MiB and invalid UTF-8 are refused.
- A worktree with `main`, `master` or a detached HEAD accepts no write. Create a branch first.
- Version records are created once and never changed, except for the Publication review section of an unestablished record. Tasks of a change that a version record names cannot change. Legacy artifacts accept only `artifact.migrate`.
- Front-matter edits replace only the YAML nodes that the operation changes. Comments, unknown keys, key order and other nodes keep their bytes. Body edits replace one section or, for a document save, the whole body; the front matter stays.
- An operation that adds an error diagnostic is refused with status 422 and the diagnostics. Existing diagnostics elsewhere do not block it.
- A preview (`dryRun: true`) writes nothing and returns the files and their SHA-256 digests. An apply that changes or deletes a file needs those digests in `expected`. A file that changed since then returns status 409 with its current text.
- Files are written to temporary files and renamed. If a rename fails, the files already replaced are restored.
- The server keeps the last 50 operations per worktree in memory. `undo` restores one operation while its files still have the bytes that it wrote. A restart clears the journal; Git keeps the history.

Operations: `artifact.create`, `artifact.dependencies.set`, `change.start`, `document.add`, `document.save`, `document.delete`, `document.properties.set`, `reference.add`, `reference.remove`, `selfcheck.record`, `task.add`, `task.update`, `task.remove`, `task.checklist.set`, `evidence.record`, `plan.selfcheck.record`, `unit.create`, `unit.member.add`, `unit.member.remove`, `unit.acceptance.set`, `unit.evidence.record`, `unit.flows.set`, `flow.create`, `flow.step.add`, `flow.step.update`, `flow.step.move`, `flow.step.remove`, `flow.transition.set`, `flow.transition.remove`, `flow.support.add`, `flow.support.update`, `flow.support.remove`, `flow.meta.set`, `version.prepare`, `publication.record`, `artifact.migrate` and `undo`. The [knowledge editing specification](../../docs/artifacts/artifact-plane/specifications/knowledge-editing.md) lists their inputs and the files that each one writes.

Git actions: `status`, `branch.create`, `commit` and `discard`. A commit stages and commits only the selected `docs/artifacts` paths with the configured author; other staged or changed files stay as they are. Discard restores a tracked knowledge file from HEAD or deletes an untracked one. The Plane never pushes, fetches, merges, rebases, resets, tags, stashes or cleans. Approval and publication happen outside the Plane.

HTTP: `POST /api/knowledge/edit` takes `{path, worktree?, operation, input, expected?, dryRun?}`. `POST /api/knowledge/git` takes `{path, worktree?, operation, input}`. Both routes use the loopback host and origin checks and accept JSON bodies up to 2 MiB. Errors use 400 (malformed request), 403 (protected branch or unconfigured root), 404 (missing repository, worktree or record), 409 (changed file or undo conflict), 422 (validation or unsafe path) and 500, with `error` and, where available, `code`, `field`, `diagnostics` and `current` file contents.

MCP: start the stdio server with `--allow-writes` to add `preview_knowledge_operation` and `apply_knowledge_operation`. Without the flag, only the read tools exist. Git actions are not exposed to agents. An agent can pass the fingerprints of `read_change_context_source` as expected digests.

## Supported repository structure

The reader detects the layout per artifact. An artifact with `requirements/`, `specifications/` or `decisions/` directly under its directory uses the in-place layout:

```text
docs/artifacts/
  tenant/
    README.md                   # identity record: current_version, depends_on
    requirements/*.md           # working knowledge
    specifications/*.md
    decisions/*.md
    changes/change-next/
      README.md                 # change record
      tasks/README.md           # plan
      tasks/*.md
    versions/1.0.0/
      README.md                 # version record: source_change
```

Established knowledge is the artifact tree on local `main` or `master`. Working files that differ from it are proposed; the review lists each file once as added, modified, removed or unchanged. An open change is a change record that no version record names and that holds no knowledge directories. Phases come from `self_check`, `evidence_records`, checklists and version records, without history replay. A version snapshot is the first-parent protected commit that introduced its version record. A missing protected ref, disagreeing refs or shallow history are diagnostics.

Artifacts without root knowledge directories use the legacy snapshot layout:

```text
docs/artifacts/
  dag.yaml
  tenant/
    README.md
    versions/1.0.0/
      README.md                 # source_change and delivery_tasks: change
      requirements/*.md
      specifications/*.md
      decisions/*.md
    changes/change-next/
      README.md
      dependencies.yaml
      requirements/*.md
      specifications/*.md
      decisions/*.md
      tasks/*.md
```

Legacy versions without delivery_tasks may retain their task directories; those records remain readable. For in-place artifacts, `dag.yaml`, `dependencies.yaml`, Markdown declaration sections and fenced reference blocks are legacy-only and are ignored with an informational diagnostic.

Knowledge directories can contain nested Markdown files. An artifact is an immediate child directory with a root README. In the legacy layout, zero change directories means no active change; one is active; multiple are shown as ambiguous candidates. The application does not guess from timestamps or directory version order.

## Root README conventions

The directory name supplies the artifact identifier. The first level-one heading supplies its display title. Declare the current version and established dependencies in YAML front matter:

```markdown
---
current_version: 1.0.0
depends_on: [tenant]
---
# Authentication

Authentication behavior and contracts.
```

Use `current_version: null` for an initial artifact and `depends_on: []` for no dependencies. Alternatively, use Markdown sections:

```markdown
# Authentication

## Current established version

1.0.0

## Established dependencies

- tenant
```

`Current version` and `Dependencies` are accepted heading aliases. Versions can be in backticks or links such as `[1.0.0](versions/1.0.0/)`. Dependencies can be plain identifiers, backticked identifiers, or links such as `[Tenant](../tenant/README.md)`. Use `None` for an empty declaration. Multiple declarations must agree. Unsupported prose and conflicts produce diagnostics; the app does not infer a version or dependency from arbitrary text.

Root READMEs are authoritative. The optional `dag.yaml` is checked against them:

```yaml
artifacts:
  tenant:
    path: tenant
    depends_on: []
  authentication:
    path: authentication
    depends_on: [tenant]
```

Paths in this index are relative to `docs/artifacts`. The app supports one immediate directory per artifact. An index disagreement is reported without replacing README declarations.

## Dependency proposals and element references

An active change can contain `dependencies.yaml`:

```yaml
artifact: authentication
add: [tenant]
remove: []
```

Knowledge Markdown can declare element references in YAML front matter or fenced `yaml` / `yml` blocks:

```yaml
references:
  - artifact: tenant
    element: specifications/identity.md
    requires: tenant identifier format
```

An established reference resolves through the target artifact's declared current version. A proposed reference must identify its source explicitly:

```yaml
references:
  - artifact: tenant
    element: specifications/identity.md
    requires: proposed identifier format
    status: proposed
    change: change-next
```

Element references explain knowledge dependencies; they do not create artifact execution edges. Missing targets, cycles, malformed YAML, multiple change candidates, and inconsistent declarations remain visible as diagnostics. Files outside the selected repository are not read through knowledge symlinks or element paths. Markdown has no executable HTML or external images. Supported links open only already registered knowledge sources through the existing contained source services. Unsupported, external and unsafe destinations remain labeled as unavailable. Source details retain the exact path and worktree. Resolved references also use inspector buttons.

## Checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The tests build temporary Git fixtures and check supported formats, graph rules, API validation, and unchanged repository bytes and Git state. Browser checks cover canvas controls, expansion, details, proposals, sanitization, diagnostics, and refresh. On systems with an existing Chromium executable, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its absolute path.

### Change histories and workflows

Primary type groups contain the current version. Open **Change histories**, a change name, and a type to inspect retained change records. Reference selection opens the correct source automatically.

The **Worktree** control lists registered worktrees with their branches and unavailable, detached, locked or prunable states. Selecting a readable worktree opens it; selecting a worktree does not switch Git branches.

Open an artifact's **Delivery history** to inspect delivery work. Current changes are visible; delivery histories start closed and sort by bounded Git recency, newest first and unknown last. Select a change to inspect Requirement, Specification, Plan, Implementation, Validation, and Version preparation evidence. Select a phase for evidence and associated commits; expand a commit for its full ID. The page preserves evidence through history collapse and page changes. Steps can be unknown; commits, checklists, and retained sources do not prove approval, running agents, or independently verified completion. Squash and limited/shallow history retain uncertainty. At most 200 relevant commits per worktree are inspected. History details load when opened. Automatic updates refresh the requested context; **Refresh** provides manual recovery.

## Knowledge scripts

Two optional scripts reuse the readers without the server or browser. ADD remains usable without them.

```sh
node scripts/validate-knowledge.mjs /path/to/repository
node scripts/migrate-layout.mjs /path/to/repository [--artifact <id>] [--version <v>] [--write]
node scripts/migrate-layout.mjs /path/to/repository --convert-history [--artifact <id>] [--write]
node scripts/layout-benchmark.mjs /path/to/repository <legacy-rev> <migrated-rev> [--worktrees <n>]
```

`validate-knowledge` prints scanner, snapshot, task, unit and flow diagnostics as JSON and exits 1 when any diagnostic is an error. `migrate-layout` applies the ADD migration procedure to legacy artifacts. It is a dry run unless `--write` is given, refuses ambiguous or outdated version declarations (confirm with `--version`), writes only inside `docs/artifacts`, never overwrites, and reports the files it creates, changes and deletes with byte equivalence. Review the remaining README prose by hand. With `--convert-history` it converts retained legacy records of in-place artifacts: it deletes copied knowledge in version and change directories, version-owned tasks that are byte-identical to the originating change's tasks, delivered `dependencies.yaml` files and `delivery_tasks` markers. It refuses files that differ from HEAD, keeps unmatched task sets, and lists links into removed files for you to fix. Git keeps every removed snapshot. `layout-benchmark` compares packet bytes and explore git commands for two revisions.

## Units of work

Select a unit in the **Units of work** group of the tree. The unit page leads with the purpose and the brief, followed by participating changes and shared acceptance criteria. Completion evidence loads automatically for the selected unit. Loading, failed, incomplete and unknown evidence remain distinct; failed reads offer Retry completion evidence. Repositories without briefs retain dependency exploration and individual delivery evidence/task graphs.

The unit page views are **Artifacts → Workflow → Implementation**. A newly selected unit starts with Artifacts. Use **Artifacts** for current established/planning dependencies, **Workflow** for grouped member phase evidence, and **Implementation** for the combined task graph. External prerequisites are not members. Solid task arrows stay within their owning plan; dashed arrows represent version-establishment gates. Phase lines show sequence only. Selecting a node displays its exact knowledge source and evidence. Pan, zoom, and Fit View work in each view.

The reader discovers docs/artifacts/units-of-work/<name>/README.md as outcome knowledge, never as artifact nodes. Each brief has unit_of_work, changes, acceptance, and optional evidence metadata. A delivered version README uses source_change to preserve the originating change. New versions also declare delivery_tasks: change and contain no task copies. Their task graphs and DoD evidence resolve from that exact retained originating change. Versions without the marker retain legacy version-owned task semantics. Shared check sources reference safe Markdown paths and optional heading fragments. Invalid or missing knowledge stays visible through diagnostics.

Completion is supported by documented evidence only when every member has a matching complete delivered snapshot on local main/master, explicit all-required-merge review evidence, and passing shared acceptance/integration checks. A branch-only version is proposed; unavailable proof is unknown. Historical outcomes use exact delivered knowledge and delivery records even when current artifact versions advance. New-layout completion also requires the retained originating task path set and bytes to match protected-ref publication. Missing, modified, invalid, or branch-only sources cannot prove completion. Legacy version-owned evidence remains readable after its original change directory is removed. Check assertions are shown as recorded evidence; the explorer does not run them.

A scoped publication-review paragraph in the brief can name an artifact and delivered version, followed by an explicit assertion that all required knowledge and implementation changes have landed on main/master. This supplies review evidence without changing an established snapshot; it cannot replace protected-ref verification. No outcome status or aggregate DAG is written to disk.

## Codex execution observer

Implementation nodes show artifact/change ownership. An optional local Codex hook observer adds execution state, agents, elapsed time, and concurrent activity. See [observer setup and semantics](integration/README.md). Recorded execution history persists outside worktrees; current knowledge remains read-only. The observer does not launch agents, approve tasks, or establish versions.

## Automatic updates and lazy loading

The overview loads first. Unit views, Markdown and history load on demand. Selecting a worktree loads its full overview; selecting a unit automatically checks its completion evidence. Pending reads show loading feedback, and failures provide a local retry. Updates preserve the active view, valid selection, expansion, filters, inspector width, pan, and zoom. Removing a selected source clears that selection. Inactive detail is released instead of retaining every visited unit.

The footer shows **Updating**, **Current**, or **Stale**. Current means the latest requested reads succeeded and repository observation is connected. On a connection or read failure, the previous view remains usable. Reconnecting or focusing the browser reconciles current inputs. Refresh remains available for recovery. These states describe loaded knowledge, not approval or live agent activity.

The server samples relevant knowledge bytes, refs, status, and registered worktrees, then waits two seconds before the next sample. Unchanged samples skip history and publication derivation. Full-content polling has a cost: a measured ten-worktree corpus with about 100,000 sampled files took about 4.4 seconds per scan, so very large repositories can update less frequently and use substantial idle I/O/CPU. The interval starts after a scan completes; scans do not overlap.

Historical file bytes are reused in server memory by repository identity and immutable commit ID. The cache has a process-wide 32 MiB byte budget and a 4,096-entry limit. Other memory includes overview metadata, active detail, Git buffers, and browser graphs; total application memory is not capped at 32 MiB. A new browser session can reuse cached bytes while the server stays running. Restarting the server clears this cache. Current files, status, refs, and publication conclusions are read again. No exploration cache or workflow registry is written to the inspected repository.

For repeatable measurements, run `node scripts/reload-benchmark.js` for equal-work full reload comparisons, `node --expose-gc scripts/lazy-benchmark.js` for payload/server memory, `node --expose-gc scripts/request-memory-benchmark.js` for sampled request peaks, and `node scripts/observation-benchmark.js` for a 60-second large-corpus idle sample. They create and remove temporary fixture repositories outside the inspected project. The scoped query API preserves the complete explore endpoint for existing consumers; the browser uses scoped reads.

## System flows and agent retrieval

Select **System flows** in the tree, or a flow in an artifact's Flows group, to browse named behavior journeys. Filter titles and IDs as you type, or choose Behavior discovery for a submitted purpose search. Select a flow to see its steps, and expand supporting relationships. Select a supporting source to read it directly. Routine IDs, dates and evidence details use secondary disclosures; invalid, stale and partial conditions stay visible. A shared source can participate in several flows. Artifact and document pages offer **Participating flows**. Unit pages show affected flows and their create, modify, or remove intent.

Planning uses current changes; Established resolves the protected main/master version declaration. Source publication labels compare source bytes with protected refs. They do not independently establish an artifact version. Gaps and diagnostics describe missing coverage. An empty impact result proves only that no consumers were found in the fresh, explicitly recorded relationships.

Flow discovery combines exact IDs, SQLite FTS5 and optional local semantic similarity. Impact follows reverse relationships independently of search page limits. The private index is flow-index.sqlite under ARTIFACT_PLANE_STATE_DIR (normally the user's local state directory), outside repositories and registered worktrees. Normal retrieval never downloads a model or sends repository content to a hosted service. Missing or corrupt model assets leave keyword and graph retrieval available with a diagnostic.

Install the pinned quantized model explicitly:

```sh
npm run flow:model-install
```

The installer downloads public assets for Xenova/paraphrase-multilingual-MiniLM-L12-v2 at revision 2c4055b12046f11709e9df2c122e59ffbdc2f900 and verifies their SHA256 hashes. Set ARTIFACT_PLANE_STATE_DIR to use a different private state directory. The model uses local CPU inference. Indexing long supporting documents can take longer than subsequent queries.

POST /api/flows/query accepts path, optional worktree and knowledge (planning, established, all), and operation (search, detail, impact, source). Search takes query; detail takes flow; impact takes ids; source takes flow and a source ID returned by detail. limit is 1–100, budget is 0–100000 characters, and cursor continues a page. Response fields include context, revision, generation, freshness, completeness, diagnostics, pagination and omissions. Source selectors never accept arbitrary file paths. Refresh invalidates stale cursors. Repository observation also checks explicitly registered supporting source bytes, including repeated edits to an already dirty file.

Search also accepts optional match (title or discovery). Omission preserves ranked discovery. Title mode trims the query, normalizes Unicode NFC and case, and filters titles and IDs by literal substring before paging. Exact titles and unambiguous exact IDs sort first; other matches use natural title order. An empty query retains newest-first browsing. Title mode does not initialize or run the embedding model.

Search and impact accept optional artifact, a safe artifact ID in the selected snapshot. The scope includes owned flows and flows owned elsewhere that participate through recorded relationships. Apply this complete eligibility set before ranking or paging. Impact with ids intersects both sets and retains the requested impact reasons. Responses add data.artifactOptions with id/title summaries, including artifacts with no flows. These options do not prove participation. Unknown artifacts and selectors on other operations are rejected. Cursors bind the normalized query, match, artifact, worktree, knowledge and revision; start a new query when any selector changes. search_flows and get_impact_context expose the same optional selectors through MCP.


Use stdio MCP from an explicitly configured client. Example registration (replace both absolute paths):

```json
{
  "mcpServers": {
    "artifact-plane-flows": {
      "command": "node",
      "args": [
        "/absolute/software-engineering/apps/artifact-plane/server/flow-mcp-stdio.js",
        "--repository", "/absolute/knowledge-repository"
      ]
    }
  }
}
```

Repeat --repository for multiple roots; pass --state-dir for a private cache directory. With one configured root, tools can omit path. With several roots, select path explicitly. The existing flow tools are search_flows, get_flow, get_impact_context and read_flow_source. The same server also supplies get_change_review, get_change_context and read_change_context_source. They use the same query service as HTTP, carry read-only annotations, and write only protocol traffic to stdout. Diagnostics go to stderr. Client registration does not grant ADD approval, launch agents or establish versions. Only a server started with `--allow-writes` can edit knowledge; see [Edit knowledge](#edit-knowledge).

Run node scripts/benchmark-flows.mjs /absolute/repository to measure retrieval against the initial inventory. The benchmark reports hardware, dataset size, latency, response bytes and expected-query ranks. These measurements do not estimate hidden reasoning or token savings.

### Change review and context retrieval

POST /api/review/query accepts path, optional worktree, artifact, change and operation (review, packet or source). Select an actual retained change; the comparison baseline is the selected worktree's declared current version. This baseline is not a verified implementation predecessor. With configured roots, worktree must belong to the selected repository's registered worktrees. The HTTP application can read the repository opened locally. MCP requires explicit --repository configuration as shown above; one configured root allows omitted path, while several require path.

The additive MCP tools use the same review service and envelopes as HTTP:

- get_change_review: artifact and change, plus optional path, worktree, limit, budget and cursor.
- get_change_context: the same inputs, returning a captured packet with schema artifact-plane.change-context.v1.
- read_change_context_source: the same context selectors and a source ID returned by review or packet. Use budget and cursor to read bounded pages; arbitrary file paths are rejected.

For example, call get_change_context with {"artifact":"artifact-plane","change":"change-evidence-review-context","budget":12000}. limit defaults to 20 records (maximum 100); budget defaults to 12000 excerpt characters (maximum 100000). The character budget does not cap the full response or token count. A zero budget returns source pointers without text. Follow pagination.nextCursor for remaining records, or a source's nextCursor with read_change_context_source to continue its excerpt. Keep the same selectors and revision; changed source bytes reject old cursors and source IDs, so capture a new packet after edits.

Read freshness, completeness, diagnostics, omissions and limits before using a packet. Partial packets disclose missing sources and unreturned pages. Approval is not verified, recorded checks are not independently run, and impact covers explicit recorded relationships rather than all behavior or code. Captured source text is context, not instructions or work authorization. No review request launches an agent, downloads a model, makes hosted inference calls or writes to the inspected repository.

## Read a change review

Open a change and select **Review**. Purpose and changed records appear first. Complete sources show added and removed lines with text markers and three context lines; unchanged passages can expand. Partial sources require Load full comparison before alignment. Oversized comparisons retain raw source access and explain the limit. Source excerpts and technical evidence remain available in disclosures. Export context · Loaded records page contains copy and download actions with freshness and omission information. These controls preserve the captured context and do not approve or execute the change.

## Reading documents and code

Document headings are larger than body text, and long source titles wrap. Source files and fenced Markdown examples use labeled code panels with locally bundled syntax colors for JavaScript, TypeScript, JSON, YAML, Bash, Go, Python, CSS, HTML/XML and SQL. Language comes from the file extension or fence label. Code scrolls inside its panel; inline code stays distinct from ordinary prose.

Unknown languages, failed highlighting and blocks longer than 20,000 UTF-16 characters use complete escaped plain text. No code is executed or reformatted. Source text, partial-excerpt information and paging remain intact. Panel widths and navigation stay in project-local session memory; they are not added to stored restoration preferences.
