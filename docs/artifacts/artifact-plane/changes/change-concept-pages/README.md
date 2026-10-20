---
tier: medium
---

# Show declared concepts where people already read

## Reason and scope

On 20 October 2026 the owner approved a research report on domain knowledge in ADD and the Plane. The report found that the Plane reads model declarations but shows them to nobody: no page, search result or brief row names a concept, and Impact rows of a model have no title and no destination. The owner then approved the UX mockups of this change and their recommended defaults.

The owner decided on 20 October 2026:

- Concepts show on the pages that people already read. The change adds one page kind, the concept page, and no sidebar entry, top-bar control or More entry.
- A repository with no models looks as it does in Artifact Plane 1.24.0.
- Concept search is literal; no embedding index is added.
- The work is one Plane change in two task waves: first the pages, then the brief and search. The owner reviews screenshots of the first wave before the second wave starts.
- The concept page action "What does <concept> affect?" ships only if Impact finds an entity that the concept page does not list.

Included:

- the concept page, the Concepts section of the artifact page, the Concepts property of documents, links from the flow Model section and the concept rows of Impact;
- concept rows in the change brief, the concept line of the PR description and the context packet;
- concept rows in the sidebar search, the `/` key and a link from the sidebar search to Discover;
- browser Back between pages;
- the MCP tool `get_concept`, the `kinds` filter of `search_flows` and the participant titles of `get_flow`.

Excluded: new record keys and ADD bundle changes (a later ADD 3.2.0), the Discover kind select, rules, interaction kinds, domains, a glossary page, embedding search for concepts, URL deep links and edit controls on the concept page.

Knowledge is edited in place on this branch. The unit brief is [Concept pages](../../../units-of-work/concept-pages/README.md).

- [Requirements: concept pages](../../requirements/concept-pages.md)
- [Specification: concept pages](../../specifications/concept-pages.md)
- [Plan](tasks/README.md)
