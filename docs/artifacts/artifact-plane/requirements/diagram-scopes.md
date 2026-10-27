---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/diagram-scopes.md#requirement-self-check
---

# System and artifact diagrams in the Plane

## Need and observed facts

[Issue 60](https://github.com/hieutran21198/software-engineering/issues/60) asks for a reading experience for diagrams at two scopes: the whole system and one artifact. The ADD member of the [diagram-scopes unit](../../units-of-work/diagram-scopes/README.md) defines the scopes, the system owner, the discovery rule and the supported icons. This member makes the Plane show them. On 27 October 2026 the owner selected two Plane surfaces: a system entry on the home page and a diagram list on the artifact page. The owner also selected a curated icon set that the Plane bundles.

Observed facts at revision b67824e (main, Artifact Plane 1.27.1):

- The home page is Current work. Its only picture of the whole repository is the artifact dependency graph. No page has a system scope.
- The artifact page has these sections: the header with dependencies, the purpose, the open change, Requirements, Specifications, Decisions, Flows, Concepts and Versions. No page lists diagrams.
- The [diagram rendering contract](../specifications/diagram-rendering.md) renders a fenced Mermaid block with Mermaid 11.17.2, which the Plane bundles and loads on demand. The renderer registers no icon pack. Mermaid draws its unknown-icon mark for an icon name that no registered pack supplies. Its built-in pack has five icons: cloud, database, disk, internet and server.
- The SVG sanitizer removes scripts, foreign objects, links, `image` elements, event handlers and references that do not start with `#`. The Content-Security-Policy keeps scripts and connections on the Plane origin.
- The browser tests render flowchart, sequence and state diagrams from a fixture document. No test covers an icon, an architecture diagram or an ER diagram.
- The repository has 17 Mermaid blocks. Nine are in two bundle pages and eight are in seven files under docs/artifacts. Of these eight, five are in working knowledge: four in three specifications of artifact-plane and one in a specification of story-driven. No block uses an icon.

## Requirements

- DP1: System entry. When the knowledge of the selected worktree declares system views under the ADD discovery rule, the home page shows an entry that opens them. When it declares none, the entry is absent.
- DP2: System navigation. From a system view, the reader can open the owning artifact of the view and each artifact that the view links to.
- DP3: Artifact diagram list. The artifact page lists the diagrams of the artifact's working knowledge. Each item shows the diagram type, the document and heading where the diagram is, and its source line or illustrative label. An item shows a stale mark when the knowledge marks the diagram stale.
- DP4: Diagram location. An item of the diagram list opens the document at its diagram.
- DP5: Back to the system. When the repository declares system views, the artifact page links to them.
- DP6: Absent sections. An artifact without diagrams shows no diagram section. Other pages do not change.
- DP7: Bundled icons. The renderer draws the icons of the curated set that ADD names, from assets that the Plane bundles, without a network request. A page without icons does not load the icon assets.
- DP8: Missing icons. An icon name outside the set shows Mermaid's unknown-icon mark and keeps its label.
- DP9: Safe icons. Sanitizing keeps the icon shapes and still removes scripts, links, foreign objects, images, event handlers and external references.
- DP10: Diagram types. The renderer renders each notation that the ADD matrix recommends. A block that it cannot render keeps the existing code panel and note.
- DP11: Readable layout. Long labels stay readable, and the page has no horizontal scroll at 390 pixels.
- DP12: Preservation. Other code blocks, the Markdown sanitizing for other content, knowledge links, the HTTP and MCP interfaces, the packet schemas and the pages of artifacts without diagrams do not change, except where the Specification states a change.

## Scope

Included: the home page system entry, the artifact page diagram list, icon rendering in the diagram renderer, a fixture repository that mirrors the AWS example of the ADD member, the affected flow supports, and this artifact's requirement, specification, decision, plan, change and version records. The Specification includes mockups of the changed pages, and the plan approval covers them.

Excluded: the ADD guidance, which the ADD member owns; a system overview for this repository; icon registration on the documentation website; validator diagram checks; diagram editing and a text and diagram switch; navigation from a diagram node, which needs click directives; MCP tools for diagrams; remote icon loading; image files.

## Local acceptance

- ADP1: Browser tests on the fixture repository at 1440 and 390 pixels show the system entry on the home page. They open the system views and follow the links to the owning artifacts.
- ADP2: Browser tests show the diagram list of a fixture artifact with type, location, source line and stale mark. They open a diagram from the list and return to the system views from the artifact page.
- ADP3: Browser tests show supported icons as sanitized SVG shapes and a missing icon as the unknown-icon mark with its label. They record no request to another origin, no icon asset request on a page without icons, and no horizontal page scroll at 390 pixels.
- ADP4: On this repository, the home page shows no system entry, the artifact pages with diagrams list them, and an artifact without diagrams shows no diagram section.
- ADP5: The owner looks at screenshots of the changed pages, and the Version task records the result.
- ADP6: The Plane test suite and build pass, validate-knowledge reports no error, and task evidence records the sizes of the renderer and icon chunks.

## Affected artifacts and flows

artifact-plane changes. It consumes the ADD diagram scope contract, so its implementation waits until the ADD member establishes. The repository-exploration flow is a candidate for modification, because its overview and inspect steps show the home and artifact pages. The source-retrieval flow reads documents through the same renderer. Specification confirms the support records. No artifact dependency changes.

## Requirement self-check

The need comes from issue 60 and the owner's decisions of 27 October 2026. The facts come from the Plane sources, the diagram rendering contract and the browser tests at b67824e. DP1 to DP12 each state one need, and ADP1 to ADP6 are observable. KISS: two page sections and one renderer extension, and no new page kind unless the Specification proves that it needs one. STE: the terms system entry, system view, diagram list and icon have one meaning each. Suggested compatibility: minor, because the reader gains new sections and icon rendering. No Requirement blocker prevents Specification.
