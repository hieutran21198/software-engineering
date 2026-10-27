---
id: example
depends_on: [guide]
covers:
  - element: requirements/diagram-scopes.md
    ids: [DS16, ADS4]
---

# AWS example page

## Scope and ownership

Implementer. Create docs/artifact-driven/06-guidelines/diagram-scopes-example.md as the [AWS example](../../../specifications/diagram-scopes.md#aws-example) of the contract states. The coordinator's render drafts for the mockups can seed the diagrams; the facts come first, as stated sentences, tables and lists on the page.

## Definition of Done

- [ ] The page is invented and self-contained. It names no file, account or person of this repository.
- [ ] It states the facts of the four invented artifacts and of the flow `ordering:place-order`, and the system view document declares `system_view: true` in its described front matter.
- [ ] It has the seven views of the contract table. Each view has an introduction with its arrow meaning, `accTitle`, `accDescr` and a source line, or the `Illustrative:` label for the fallback sample.
- [ ] Each system view has its owner table. The artifact views link to the system view document and to the flow record.
- [ ] The system context is the overview and the logical architecture is its detail; the text and the source lines say so.
- [ ] The views use only icons of the set, except one name outside the set in the fallback sample. The fallback sample has one label longer than 40 characters.
- [ ] A recorded check compares the nodes and edges of each view with its fact list or owner table and finds no extra, missing or reversed element.
- [ ] Every view renders with Mermaid 11.17.2 under the Plane configuration, with and without the icon packs. Screenshots are recorded.

## Evidence

Pending.
