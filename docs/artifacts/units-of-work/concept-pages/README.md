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
evidence:
  - criterion: concepts-readable
    method: Browser tests of the concept page, the artifact Concepts section, the document Concepts property, the flow participant links, the Impact concept rows and the sidebar concept rows at 1440 and 390 px, and the reading scenarios S-A and S-C.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/05-concept-page.md#evidence
  - criterion: changes-name-concepts
    method: Brief and PR description tests on fixtures built after 89ed23a and 3c47a48 and on a renamed participant, and a local run of the brief of change-visual-knowledge.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/08-brief-concepts.md#evidence
  - criterion: agent-parity
    method: HTTP and MCP parity tests of get_concept, search_flows with kinds, and a comparison of search_flows without kinds with the 0eecce1 service on the same fixtures.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/03-concept-mcp.md#evidence
  - criterion: absent-not-empty
    method: golden.spec.js compares the build with the 1.24.0 captures of a repository without models on CI Chrome 156 and Nix Chromium 149.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/01-golden-captures.md#evidence
  - criterion: usability
    method: Owner review of screenshots of the built pages at 1440 and 390 px against the approved mockups, after wave 1 and after wave 2.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/10-validation.md#evidence
  - criterion: integration
    method: npm test, npm run build, the full browser suite on CI Chrome 156 and Nix Chromium 149, go test and go vet, the executable smoke check, the S1 to S8 limits and the validator on the integrated branch.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/10-validation.md#evidence
---

# Concept pages

## Purpose

People and agents reach the concepts that the records declare from the pages they already read, and a repository without models stays as it is.

## Included scope

The concept page, the concept links and lists on existing pages, concept rows in the change brief and the PR description, concept rows in the sidebar search, browser Back, and the MCP concept facts. The [change record](../../artifact-plane/changes/change-concept-pages/README.md) lists the details. The approved mockups are on the design canvas https://claude.ai/artifact/4wm7jTWNjRtefuwdUeniHk.

## Excluded scope

New record keys and ADD bundle changes, the Discover kind select, rules, interaction kinds, domains, a glossary page, embedding search for concepts, URL deep links and edit controls on the concept page.
