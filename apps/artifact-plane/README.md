# Artifact Plane

Explore a local Artifact-Driven Development repository on an interactive dependency canvas. The application reads Git and Markdown. It derives dependency and behavior graphs and stores a rebuildable flow index outside inspected repositories. It does not write to the repository you open.

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

- Pan by dragging the canvas background. Use the controls to zoom and fit the graph.
- Select an artifact on the canvas or in the list to see its purpose first. Use Read overview for the full document. Version, delivery history and dependency details remain available below.
- Filter artifact list matches titles and IDs immediately. It filters the list while the graph stays available for context. Clear restores the list.
- Select a registered Worktree to switch all current knowledge in one step. The previous source stays usable if the target fails to load. Change repository opens the path form; Cancel returns to the compact source bar.
- Expand an artifact with its `+` button to show collapsible Requirements, Specifications, Decisions, and Tasks groups with counts. Groups start closed. Open a type to show compact records; current-version records come before change records, each category README comes first, and other filenames use natural numeric order. Select an element to open its document in the main reading area. Back to graph returns to the retained canvas position. Multiple artifacts and types can stay expanded. List and inspector disclosure are independent of canvas expansion.
- Arrows point from upstream knowledge to its consumer. Purple dotted lines show element references. Green dashed lines show proposed additions; red dashed lines mark proposed removals in the established view.
- Switch to Planning to see the graph after active dependency proposals are applied. Proposals do not change the established graph.
- Select a resolved reference in the inspector to open its target artifact and type. Missing targets appear as unresolved markers and diagnostics.
- Drag the divider at the left edge of the inspector to resize it. When the divider has keyboard focus, Arrow Left widens the panel, Arrow Right narrows it, and Home/End select its minimum/maximum width. On narrow screens, the inspector sits below the canvas.
- Repository edits update open views automatically. Use Refresh to retry or reconcile the current view. Selection, type expansion, panel width, and canvas state remain in browser memory only; nothing is saved across page reloads.

## Implementation task graphs

In Dependencies, select an artifact, then a delivery change in the inspector, and choose View task graph. Arrows point from prerequisite tasks to dependent tasks. Select a task, then Read task to read its source, scope, DoD, and documented evidence in the main area. Back to dependencies preserves the selected change and history expansion.

Current plan membership comes from the tasks list in YAML front matter in tasks/README.md. Each listed task declares id and depends_on. Unlisted files remain historical knowledge. A plan without a task list shows Task graph unavailable; an explicit empty list shows No planned tasks. Invalid declarations show diagnostics and no execution edges. Checklists are documented evidence; they do not verify completion, approval, or running agents. External artifact gates remain separate.

Automatic updates and Refresh reread the active graph and clear task selection only if its source disappears. Opening another worktree clears task context. The graph uses the same local read-only inputs as the other views.

## Project tabs

Use **+** above the explorer to open another project inside Artifact Plane. Select a project tab to switch, or use its close button. Opening the same canonical repository path selects its existing tab. Each tab keeps its navigation, selection, filter, worktree, and graph position during the page session. Equal project names include the shortest distinct parent-path suffix; the full path remains available in the tab tooltip.

Inactive tabs pause repository and runtime observation. Selecting a tab refreshes its repository evidence while retaining valid navigation. Closing the last project returns to an empty project tab.

The application saves successfully opened project paths, tab order, and the active project in browser-local storage. Refresh or restart restores these projects in the same browser profile and application origin. Inactive restored projects load when selected. A missing project keeps its path so you can retry or close it. Navigation details and graph data are not saved across page reloads. Separate browser windows do not synchronize their tabs. Changing the server port creates a different storage origin.

Storage errors leave current-session exploration available with a warning. Retained session memory grows with open projects; closing tabs releases their state and connections.

## Supported repository structure

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
    changes/change-initial/
      README.md
      tasks/README.md           # retained originating plan
      tasks/*.md
    changes/change-next/
      README.md
      dependencies.yaml
      requirements/*.md
      specifications/*.md
      decisions/*.md
      tasks/*.md
```

Legacy versions without delivery_tasks may retain their task directories; those records remain readable. New versions link their originating change tasks instead of copying them.

Knowledge directories can contain nested Markdown files. An artifact is an immediate child directory with a root README. Zero change directories means no active change; one is active; multiple are shown as ambiguous candidates. The application does not guess from timestamps or directory version order.

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

Use **Dependencies** for the artifact DAG and **Units of work** for grouped outcomes. The standalone Workflow tab has been removed; unit Workflow remains available. The shared sidebar lists registered worktrees with branch, path, HEAD, and unavailable/detached/locked/prunable details. **Open worktree** explicitly opens a readable source. Selecting a worktree alone does not switch Git branches.

Select an artifact to inspect its **Delivery work**. Current changes are visible; delivery histories start closed and sort by bounded Git recency, newest first and unknown last. Select a change to inspect Requirement, Specification, Plan, Implementation, Validation, and Version preparation evidence. Select a phase for evidence and associated commits; expand a commit for its full ID. The inspector preserves evidence through history collapse and view switching. Steps can be unknown; commits, checklists, and retained sources do not prove approval, running agents, or independently verified completion. Squash and limited/shallow history retain uncertainty. At most 200 relevant commits per worktree are inspected. History details load when opened. Automatic updates refresh the requested context; **Refresh** provides manual recovery.

## Units of work

Select **Units of work**, choose a local worktree, then select an outcome. Its detail panel leads with the purpose and Read brief, followed by participating changes and shared acceptance criteria. Completion evidence loads automatically for the selected unit. Loading, failed, incomplete and unknown evidence remain distinct; failed reads offer Retry completion evidence. Repositories without briefs retain dependency exploration and individual delivery evidence/task graphs.

The tabs are **Artifacts → Workflow → Implementation**. A newly selected unit starts with Artifacts. Use **Artifacts** for current established/planning dependencies, **Workflow** for grouped member phase evidence, and **Implementation** for the combined task graph. External prerequisites are not members. Solid task arrows stay within their owning plan; dashed arrows represent version-establishment gates. Phase lines show sequence only. Selecting a node displays its exact knowledge source and evidence. Pan, zoom, and Fit View work in each view.

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

Select **Flows** to browse named behavior journeys. Filter titles and IDs as you type, or choose Behavior discovery for a submitted purpose search. Select a flow to see its steps, and expand supporting relationships. Select a supporting source to read it directly. Routine IDs, dates and evidence details use secondary disclosures; invalid, stale and partial conditions stay visible. A shared source can participate in several flows. Artifact and element inspectors offer **Participating flows**. Unit inspectors show affected flows and their create, modify, or remove intent.

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

Repeat --repository for multiple roots; pass --state-dir for a private cache directory. With one configured root, tools can omit path. With several roots, select path explicitly. The existing flow tools are search_flows, get_flow, get_impact_context and read_flow_source. The same server also supplies get_change_review, get_change_context and read_change_context_source. They use the same query service as HTTP, carry read-only annotations, and write only protocol traffic to stdout. Diagnostics go to stderr. Client registration does not grant ADD approval, edit knowledge, launch agents or establish versions.

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

Select a delivery change and choose Review change. Purpose and changed records appear first. Complete sources show added and removed lines with text markers and three context lines; unchanged passages can expand. Partial sources require Load full comparison before alignment. Oversized comparisons retain raw source access and explain the limit. Source excerpts and technical evidence remain available in disclosures. Export context · Loaded records page contains copy and download actions with freshness and omission information. These controls preserve the captured context and do not approve or execute the change.
