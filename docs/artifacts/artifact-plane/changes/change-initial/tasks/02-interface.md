# Graph explorer interface

## Scope and ownership

Own static UI, locally bundled browser dependencies, styles, and UI checks under `apps/artifact-plane`. Use Mermaid for layout and existing Markdown sanitization. Governing elements are `requirements/explorer.md`, `specifications/explorer.md`, and `decisions/001-local-server.md` in this change.

## Prerequisites

User approval. The snapshot contract permits initial UI development with fixture data; integrated operation requires task 01.

## Definition of Done

- [ ] Consume the documented snapshot contract without filesystem/Git access or duplicated repository parsing in the browser.
- [ ] Check fixture snapshots from requirement examples B1–B5 render the specified statuses and relationships.

- [ ] Open a repository using a path input and refresh explicitly.
- [ ] Render artifact DAG edges with established/addition/removal distinctions and selectable nodes.
- [ ] Offer keyboard-accessible artifact selection, details, current version, and active change.
- [ ] Show direct and transitive upstream/downstream relationships for established and planning views.
- [ ] Expand knowledge elements and show their reference diagram, targets, reasons, statuses, and resolution errors.
- [ ] Render hostile Markdown and graph labels without script execution or unsafe navigation.
- [ ] Show loading, empty, error, and diagnostic states. All runtime assets load locally.

## Evidence

Record executed checks and results after implementation.
