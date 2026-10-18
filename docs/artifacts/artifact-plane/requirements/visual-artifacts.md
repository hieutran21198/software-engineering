---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/visual-artifacts.md#requirement-self-check
---

# Visual representations and Mermaid rendering

## Need and observed facts

On 18 October 2026 the user asked to improve the current artifacts with the representations that the ADD 2.7.0 visual representation guide selects, and to make Artifact Plane show the diagrams. The shared outcome and acceptance criteria are in the [visual-artifacts unit](../../units-of-work/visual-artifacts/README.md); its [survey](../../units-of-work/visual-artifacts/survey.md) records the per-file decisions.

Observed facts at revision 3c47a48, rechecked at 89ed23a (main, Artifact Plane 1.18.0):

- The working knowledge of artifact-plane has no diagram. The survey read its 68 knowledge files and the 6 that the change-impact merge added or amended.
- 25 high- and medium-priority candidates are in 16 specifications: 20 tables or listings, 3 state diagrams, 1 sequence diagram and 1 sequence diagram in two parts.
- The survey verified 18 defects in artifact-plane knowledge. Most are text that the 1.17.0 workbench redesign made stale: the inspector panel, the Review tab, the view switcher and the Established and Planning controls.
- src/Markdown.jsx renders every fenced block through codePanelHTML as a highlighted text panel and sanitizes the result with DOMPurify, which forbids svg. A Mermaid block therefore shows as text. The component is used by the document, artifact, change review and source pages.
- The Plane runs on a loopback host and loads no external resource. Its dependencies are bundled with Vite.

## Requirements

- VP1 Representations. Add these representations, or reject one with its reason in the Specification self-check:

  | Element | Section | Representation | Priority |
  | --- | --- | --- | --- |
  | specifications/authoring-workbench.md | Layout | Table: region or element × desktop value × value at 800 px and below | high |
  | specifications/change-impact.md | Index | Table: table name, columns, source | medium |
  | specifications/change-impact.md | Query | Table: input, values, default, limit | high |
  | specifications/change-impact.md | Query | Tree listing of the response envelope and data sections | medium |
  | specifications/change-review.md | Query and source boundaries | Table: request field × required or optional × range or rule × default | medium |
  | specifications/codex-execution.md | Derived states | State-by-event table: state, entered by (hook event or explicit report), cleared or left by, display label and color | high |
  | specifications/codex-execution.md | Identity and retained graph context | Table: identity field × binding (task matching), capture, agent identity | high |
  | specifications/codex-execution.md | Local API and live browser updates | Sequence diagram, one diagram | medium |
  | specifications/compact-context.md | Request and compatibility; Response and byte accounting | Comparison table: attribute × default v1 packet × compact format | medium |
  | specifications/evidence-correctness.md | Flow ordering | Table: request kind (nonempty search, empty browse, impact) × first order key, next key, tie breaker, unknown dates, UI label | high |
  | specifications/explorer.md | Snapshot response and UI; Logical element ordering; Knowledge display | Tree listing of an expanded artifact group on the canvas: artifact group, type headings in order, source heading, records; Change histories, change entries, the four type groups | medium |
  | specifications/explorer.md | Snapshot response and UI; Read-only API extension | Tree listing of the POST /api/explore response: snapshot keys, record types and their fields, and the nested workflow data (worktrees, changes, steps, evidence, commits, tasks) | high |
  | specifications/explorer.md | Step evidence and commit association | Table: phase × associated paths × evidence for the current step × documented completion | high |
  | specifications/incremental-observation.md | Sampling and events | Table: bound, connected observation, degraded observation | medium |
  | specifications/knowledge-editing.md | Operation service (Templates paragraph) | Table: template, front matter, headings, fixed content | medium |
  | specifications/knowledge-editing.md | Operation service / Writer | Sequence diagram, segmented in two (plan-and-validate; apply), as in worked example E3 | high |
  | specifications/knowledge-layout-reading.md | Declared evidence instead of history | Table: displayed step, declared source field(s), value when absent | medium |
  | specifications/knowledge-layout-reading.md | Layout detection and records | Two-column comparison table: concern, in-place path, legacy path | high |
  | specifications/lazy-loading.md | Scoped API | Table: section × selector (worktree, unit, artifact, change, source, dependencyMode) with required / allowed / invalid cells | high |
  | specifications/live-reload.md | Browser behavior | State diagram: Updating, Current, Stale | medium |
  | specifications/project-tabs.md | Workspace and identity / Explorer isolation and lifecycle / Browser persistence | State diagram | high |
  | specifications/reading-controls.md | Left navigation resizing | Table: panel (left, center, right) × min, max, defaults, behavior at ≤800 px | medium |
  | specifications/search-label-usability.md | UI interaction | Comparison table: Unit named filter, Flow named filter (Title or ID), Flow Behavior discovery, Artifact list filter × scope, trigger (immediate / 250 ms debounce + Enter / Search action + Enter), order, embedding inference, match value, default | high |
  | specifications/ux-simplification.md | Contained source navigation | Table: link target kind, resolution rule, outcome (navigable / inert with reason / rejected), authority (client map / server) | high |
  | specifications/ux-simplification.md | Honest loading, completion and recovery | State diagram | high |

- VP2 Guide conformance. Each representation follows the guide: an introduction, a source line, an accessible title and description for a diagram, and the facts in the body text. A table can replace the prose that it restates only when every fact, condition, limit and exception of that prose is in the table or in the remaining text. Otherwise the prose stays.
- VP3 Corrections. Specification checks each VP1 row against the current workbench contract. Correct each verified defect in a passage that a VP1 representation draws from before the representation is drawn; reject a row whose subject no longer exists. Leave the other defects recorded in the survey.
- VP4 Mermaid rendering. A page that renders knowledge Markdown shows a fenced block labelled `mermaid` as a diagram:
  - with code that the Plane bundles, and without a network request;
  - loading the diagram code only when the page contains such a block;
  - through a sanitizing step that removes scripts, event handlers, foreign objects, links and external references from the produced SVG, and keeps its accessible title and description;
  - with the existing source panel and a short message when a block does not render;
  - inside the content column, with horizontal scrolling inside the diagram when it is wider than the column, so that the page has no horizontal scroll at 390 pixels.
- VP5 Preservation. Other code blocks, the Markdown sanitizing policy for other content, knowledge navigation links, the HTTP and MCP interfaces and the packet schemas do not change. Change no Plane contract value or flow behavior except through VP3 and VP4. Keep headings, so that existing links and anchors resolve.

## Scope

Included: the 16 specifications of VP1 and the passages of VP3; Mermaid rendering in the shared Markdown component; the support records of the affected flows; the change record, specification, plan, tasks and version record of change-visual-artifacts.

Excluded: low-priority candidates; defects outside VP3; Plane directions R2 to R8 of the visual knowledge contract, including a text and diagram switch and diagram editing; image files.

## Local acceptance

- AVP1: Each VP1 row is present in its section or rejected with a reason, and has a recorded check that compares the facts of the replaced or summarized prose with the representation.
- AVP2: A comparison with the previous text finds no lost fact, condition or limit; the only contract changes are the recorded VP3 corrections and the VP4 rendering.
- AVP3: Browser tests at 1440 and 390 pixels show each new diagram of the Plane knowledge as an SVG with title and description, show the source panel for an invalid block, record no network request for diagram code from another origin, and show a page without Mermaid that loads no diagram code.
- AVP4: The Plane test suite and build pass; validate-knowledge reports no error.

## Requirement self-check

Facts are taken from the survey, the Markdown component and the files at 89ed23a. Assumption: rows drawn from pre-redesign passages need VP3 corrections or rejection; Specification decides per row. Affected flows: repository-exploration (inspect); Specification confirms source-retrieval and change-review, which show documents through the same component. No artifact dependency changes. Suggested version: a minor release, because the reader gains diagram rendering. KISS: one renderer in one component, no new page or control. STE: one obligation per item. No Requirement blocker prevents Specification.
