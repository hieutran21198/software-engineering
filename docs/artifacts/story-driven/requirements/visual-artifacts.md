---
self_check:
  result: passed
  source: docs/artifacts/story-driven/requirements/visual-artifacts.md#requirement-self-check
---

# Visual representations in the Story-Driven knowledge

## Need and observed facts

On 18 October 2026 the user asked to improve the current artifacts with the representations that the ADD 2.7.0 visual representation guide selects. The shared outcome is in the [visual-artifacts unit](../../units-of-work/visual-artifacts/README.md); its [survey](../../units-of-work/visual-artifacts/survey.md) records the per-file decisions.

Observed facts at revision 89ed23a: the eight Story-Driven knowledge files have no diagram. specifications/framework.md lists the core domains and their applicability in prose, and its Dependency and change behavior section states which domain informs which. Some of these relationships are stated vaguely; the survey requires them to be drawn as gaps, not as edges.

## Requirements

- VS1 Representations. In specifications/framework.md, add a table of core domain, shared or conditional, and applies when, in the Knowledge contract section; and a directed graph from informing domain to informed domain in the Dependency and change behavior section. A relationship that the text does not state precisely is listed as a gap in the text and is not drawn.
- VS2 Guide conformance and preservation. Each representation follows the guide: an introduction, a source line, an accessible title and description for the diagram, and the facts in the body text. No Story-Driven rule changes and headings stay the same.

## Acceptance criteria

- AVS1: Both representations are present, and the graph's nodes and edges match a fact list taken from the section, with gaps listed.
- AVS2: No fact of the section is lost; links resolve; validate-knowledge reports no error.

## Requirement self-check

Facts come from the survey and framework.md at 89ed23a. No dependency changes. Suggested version: a patch release, because only presentation changes. KISS: one table and one graph. STE: one obligation per requirement. No Requirement blocker prevents Specification.
