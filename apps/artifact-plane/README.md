# Artifact Plane

Explore a local Artifact-Driven Development repository on an interactive dependency canvas. The application reads Git and Markdown and calculates graphs in memory. It does not write to the repository you open.

## Run

Install Node.js 24 or later and Git. From this directory:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4310`. Enter the absolute path to a Git worktree root that contains `docs/artifacts`. The path refers to the computer running the server. To use a different port, set `PORT` before starting the app.

All browser assets are bundled locally. The application uses no database, account, AI service, background worker, or external runtime service.

## Explore

- Pan by dragging the canvas background. Use the controls to zoom and fit the graph.
- Select an artifact on the canvas or in the list to see its overview, declared version, change candidates, and upstream/downstream relationships.
- Expand an artifact with its `+` button to show collapsible Requirements, Specifications, Decisions, and Tasks groups with counts. Groups start closed. Open a type to show compact records; current-version records come before change records, each category README comes first, and other filenames use natural numeric order. Select an element to read its Markdown and references. Multiple artifacts and types can stay expanded.
- Arrows point from upstream knowledge to its consumer. Purple dotted lines show element references. Green dashed lines show proposed additions; red dashed lines mark proposed removals in the established view.
- Switch to Planning to see the graph after active dependency proposals are applied. Proposals do not change the established graph.
- Select a resolved reference in the inspector to open its target artifact and type. Missing targets appear as unresolved markers and diagnostics.
- Drag the divider at the left edge of the inspector to resize it. When the divider has keyboard focus, Arrow Left widens the panel, Arrow Right narrows it, and Home/End select its minimum/maximum width. On narrow screens, the inspector sits below the canvas.
- Use Refresh after external repository edits. Selection, type expansion, panel width, and canvas state remain in browser memory only; nothing is saved across page reloads.

## Implementation task graphs

In Dependencies, select an artifact, then a delivery change in the inspector, and choose View task graph. Arrows point from prerequisite tasks to dependent tasks. Select a task to read its source, scope, DoD, and documented evidence. Back to dependencies preserves the selected change and history expansion.

Current plan membership comes from the tasks list in YAML front matter in tasks/README.md. Each listed task declares id and depends_on. Unlisted files remain historical knowledge. A plan without a task list shows Task graph unavailable; an explicit empty list shows No planned tasks. Invalid declarations show diagnostics and no execution edges. Checklists are documented evidence; they do not verify completion, approval, or running agents. External artifact gates remain separate.

Refresh rereads the graph and clears task selection if its source disappears. Opening another worktree clears task context. The graph uses the same local read-only inputs as the other views.

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

Element references explain knowledge dependencies; they do not create artifact execution edges. Missing targets, cycles, malformed YAML, multiple change candidates, and inconsistent declarations remain visible as diagnostics. Files outside the selected repository are not read through knowledge symlinks or element paths. Markdown details have no executable HTML, external images, or navigation links; resolved references use the inspector buttons.

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

Select an artifact to inspect its **Delivery work**. Current changes are visible; delivery histories start closed and sort by bounded Git recency, newest first and unknown last. Select a change to inspect Requirement, Specification, Plan, Implementation, Validation, and Version preparation evidence. Select a phase for evidence and associated commits; expand a commit for its full ID. The inspector preserves evidence through history collapse and view switching. Steps can be unknown; commits, checklists, and retained sources do not prove approval, running agents, or independently verified completion. Squash and limited/shallow history retain uncertainty. At most 200 relevant commits per worktree are inspected. Use **Refresh** to read again.

## Units of work

Select **Units of work**, choose a local worktree, then select an outcome. Its detail panel shows the brief, participating changes, shared acceptance criteria, recorded check results, and completion reasons. Repositories without briefs retain dependency exploration and individual delivery evidence/task graphs.

Use **Workflow** for grouped member phase evidence, **Artifacts** for current established/planning dependencies, and **Implementation** for the combined task graph. External prerequisites are not members. Solid task arrows stay within their owning plan; dashed arrows represent version-establishment gates. Phase lines show sequence only. Selecting a node displays its exact knowledge source and evidence. Pan, zoom, and Fit View work in each view.

The reader discovers docs/artifacts/units-of-work/<name>/README.md as outcome knowledge, never as artifact nodes. Each brief has unit_of_work, changes, acceptance, and optional evidence metadata. A delivered version README uses source_change to preserve the originating change. New versions also declare delivery_tasks: change and contain no task copies. Their task graphs and DoD evidence resolve from that exact retained originating change. Versions without the marker retain legacy version-owned task semantics. Shared check sources reference safe Markdown paths and optional heading fragments. Invalid or missing knowledge stays visible through diagnostics.

Completion is supported by documented evidence only when every member has a matching complete delivered snapshot on local main/master, explicit all-required-merge review evidence, and passing shared acceptance/integration checks. A branch-only version is proposed; unavailable proof is unknown. Historical outcomes use exact delivered knowledge and delivery records even when current artifact versions advance. New-layout completion also requires the retained originating task path set and bytes to match protected-ref publication. Missing, modified, invalid, or branch-only sources cannot prove completion. Legacy version-owned evidence remains readable after its original change directory is removed. Check assertions are shown as recorded evidence; the explorer does not run them.

A scoped publication-review paragraph in the brief can name an artifact and delivered version, followed by an explicit assertion that all required knowledge and implementation changes have landed on main/master. This supplies review evidence without changing an established snapshot; it cannot replace protected-ref verification. No outcome status or aggregate DAG is written to disk.

## Codex execution observer

Implementation nodes show artifact/change ownership. An optional local Codex hook observer adds execution state, agents, elapsed time, and concurrent activity. See [observer setup and semantics](integration/README.md). Recorded execution history persists outside worktrees; current knowledge remains read-only. The observer does not launch agents, approve tasks, or establish versions.
