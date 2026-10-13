---
unit_of_work: unit-of-work-exploration
changes:
  - artifact: artifact-driven
    change: change-units-of-work
  - artifact: artifact-plane
    change: change-units-of-work
acceptance:
  - id: knowledge-contract
    criterion: ADD delivers the agreed outcome membership, provenance, and shared evidence contract without stored workflow state.
  - id: aggregate-exploration
    criterion: Artifact Plane exposes unit briefs and all three aggregate views with source navigation and honest diagnostics.
  - id: integration
    criterion: Shared fixtures pass reader, graph, browser, delivery, and read-only checks against the established ADD contract.
    integration: true
evidence:
  - criterion: knowledge-contract
    method: Review the delivered contract, validate YAML examples, and run full Go adoption/fidelity tests and the website build.
    result: passed
    source: docs/artifacts/artifact-driven/versions/1.2.0/tasks/18-unit-delivery-validation.md#evidence
  - criterion: aggregate-exploration
    method: Run unit canvas and browser checks for all three views, exact-source navigation, diagnostics, refresh, and responsive layouts.
    result: passed
    source: docs/artifacts/artifact-plane/versions/1.6.0/tasks/19-unit-interface.md#evidence
  - criterion: integration
    method: Run the complete Node and Chromium suites, production build, and repository adoption/fidelity checks.
    result: passed
    source: docs/artifacts/units-of-work/unit-of-work-exploration/README.md#combined-validation-evidence
---

# Unit-of-work grouping and exploration

## Purpose

Group changes around one deliverable outcome so Artifact Plane can visualize their workflow, artifact dependencies, and combined implementation graph.

## Scope

Include the ADD knowledge contract and delivered guidance, version provenance, shared validation evidence, and read-only Plane exploration. Exclude a workflow state database, execution engine, automatic merging, deployment, and legacy snapshot migration.

## Combined validation evidence

ADD delivery and project-adoption checks passed and ADD 1.2.0 established after PR #10. Plane integration passed 91 Node tests, 13 Chromium acceptance cases, the production build, and the repository Go adoption/fidelity suite. Commands: npm test, npm run build, npm run test:browser in apps/artifact-plane, and GOCACHE=/tmp/software-engineering-unit-go-cache go test ./... at the repository root. Installed system Chromium was selected through PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH after the downloaded browser lacked a system library.

Shared fixtures cover contract reading and all three views with external prerequisites and establishment gates. Historical-source, failure/unknown evidence, safe Markdown, refresh, worktree isolation, responsive layout, and read-only file/Git fingerprint checks passed. Member task evidence retains the detailed results. Plane 1.6.0 remains proposed until required team merge; no outcome completion is asserted here.

## Publication review

artifact-driven 1.2.0: All required knowledge and implementation changes have landed on main. The user reported PR #10 merged; Git verification found the complete delivered contract on origin/main and the local main reference was fast-forwarded to it. The recorded outcome membership remains unchanged.
