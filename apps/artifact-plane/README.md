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
- Expand an artifact with its `+` button to show knowledge elements in place. Select an element to read its Markdown and references. Multiple artifacts can stay expanded.
- Arrows point from upstream knowledge to its consumer. Purple dotted lines show element references. Green dashed lines show proposed additions; red dashed lines mark proposed removals in the established view.
- Switch to Planning to see the graph after active dependency proposals are applied. Proposals do not change the established graph.
- Select a resolved reference in the inspector to open its target. Missing targets appear as unresolved markers and diagnostics.
- Use Refresh after external repository edits. Selection and canvas state remain in browser memory only; nothing is saved across page reloads.

## Supported repository structure

```text
docs/artifacts/
  dag.yaml
  tenant/
    README.md
    versions/1.0.0/
      requirements/*.md
      specifications/*.md
      decisions/*.md
      tasks/*.md
    changes/change-next/
      README.md
      dependencies.yaml
      requirements/*.md
      specifications/*.md
      decisions/*.md
      tasks/*.md
```

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
