---
unit_of_work: concept-pages
changes:
  - artifact: artifact-plane
    change: change-concept-pages
affected_flows:
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
  - artifact: artifact-plane
    flow: change-impact
    effect: modify
  - artifact: artifact-plane
    flow: change-review
    effect: modify
  - artifact: artifact-plane
    flow: context-handoff
    effect: modify
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
flow_assessment: Discovery on 20 October 2026 read the model parser and flow
  graph, Impact, the change brief, the PR description, the context packet, the
  sidebar search, the flow index, the MCP tools, the page shell and the
  artifact, document, flow, Impact and Discover pages. Repository-exploration
  changes its overview and inspect steps (concepts in the overview, the concept
  page). Change-impact changes its propagate and act steps (a node for every
  declared model, the concept destination). Change-review changes its brief
  step (concept rows). Context-handoff changes its derive step (the packet
  copies the brief concepts). Source-retrieval changes its discover step (the
  concept filter and get_concept). Agent-session-guidance, knowledge-authoring,
  project-tabs, repository-refresh and execution-observation, and the ADD and
  Story-Driven flows, are not reached by the requirements.
acceptance:
  - id: concepts-readable
    criterion: A person reaches a declared concept from the artifact page,
      document Properties, the flow Model section, Impact and the sidebar
      search, and its page shows its meaning, documents, flows and the
      labelled inferred code and tests.
  - id: changes-name-concepts
    criterion: The change brief and the PR description name the concepts that a
      change reaches, with the declared reasons, and keep describing-document
      edits out of the summary and the PR text.
  - id: agent-parity
    criterion: get_concept and search_flows with the concept filter give the
      facts of the concept page in one call, and search_flows without the
      filter answers as in 1.24.0.
  - id: absent-not-empty
    criterion: A repository without models matches the 1.24.0 golden captures,
      except the named differences.
  - id: usability
    criterion: The owner accepts screenshots of the built pages at 1440 and 390
      px against the approved mockups, after each task wave.
  - id: integration
    criterion: The Node, browser and Go suites, the S1 to S8 limits, the
      executable smoke check and the validator pass on the integrated branch.
    integration: true
evidence: []
---

# Concept pages

## Purpose

People and agents reach the concepts that the records declare from the pages they already read, and a repository without models stays as it is.

## Included scope

The concept page, the concept links and lists on existing pages, concept rows in the change brief and the PR description, concept rows in the sidebar search, browser Back, and the MCP concept facts. The [change record](../../artifact-plane/changes/change-concept-pages/README.md) lists the details. The approved mockups are on the design canvas https://claude.ai/artifact/4wm7jTWNjRtefuwdUeniHk.

## Excluded scope

New record keys and ADD bundle changes, the Discover kind select, rules, interaction kinds, domains, a glossary page, embedding search for concepts, URL deep links and edit controls on the concept page.
