---
unit_of_work: search-label-usability
changes:
  - artifact: artifact-plane
    change: change-search-label-usability
affected_flows:
  - artifact: artifact-plane
    flow: source-retrieval
    effect: modify
  - artifact: artifact-plane
    flow: unit-inspection
    effect: modify
  - artifact: artifact-plane
    flow: repository-exploration
    effect: modify
flow_assessment: Inspected actual title/index/adapter and shared browser search
  paths, explicit participation closure, graph edge rendering and measured label
  fixtures. Source retrieval, unit inspection and repository exploration have
  tracked support. Unlabelled task/unit graphs retain their existing semantics.
  Coverage remains explicit recorded relationships, not exhaustive system or
  code-impact discovery.
acceptance:
  - id: named-search
    criterion: Title and ID filtering updates visible matching results in both
      views, including flows outside the first browsing page.
  - id: artifact-scope
    criterion: Flow search scopes complete recorded participation to a visible
      Artifact selection, and Artifact details preselects the clicked artifact.
  - id: readable-labels
    criterion: Edge labels remain readable without covering node content or blocking
      controls in representative graph fixtures.
  - id: integration
    criterion: Discovery compatibility, async isolation, read-only behavior and
      previous flows pass integrated checks.
    integration: true
evidence:
  - criterion: named-search
    method: Run integrated Node, Chromium, installed-model, source fingerprint and
      complete knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/search-label-usability/README.md#combined-checks
  - criterion: artifact-scope
    method: Run integrated Node, Chromium, installed-model, source fingerprint and
      complete knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/search-label-usability/README.md#combined-checks
  - criterion: readable-labels
    method: Run integrated Node, Chromium, installed-model, source fingerprint and
      complete knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/search-label-usability/README.md#combined-checks
  - criterion: integration
    method: Run integrated Node, Chromium, installed-model, source fingerprint and
      complete knowledge checks.
    result: passed
    source: docs/artifacts/units-of-work/search-label-usability/README.md#combined-checks
---

# Consistent named search and readable graph relationships

## Outcome and membership

Readers can find named units/flows predictably and read graph relationships. The sole member is artifact-plane/change-search-label-usability. It belongs to no other unit. Membership adds no dependency; the existing ADD 2.1.0 supplier remains required.

## Scope

Include title/ID search, explicit behavior discovery, Artifact filtering and contextual navigation, search feedback/races and labelled flow/dependency graph presentation. Exclude global search, new inference, graph semantics changes, task history deletion and lifecycle repair.

## Validation evidence

Requirement, Specification and Plan completed with separate phase commits and explicit user approval. Task evidence remains in the sole member change. Proposed 1.12.1 has not established; shared check assertions do not imply unit completion.

## Combined checks

- `FLOW_MODEL_STATE=/tmp/plane-flow-model-state npm test`: 258 passed, zero failed or skipped.
- Production app build and complete Chromium browser suite: 56 passed, including eight new search cases, measured edge geometry at 1440/700, and retained project/flow/unit/task/review/runtime regressions. Wide and narrow screenshots were inspected.
- Installed-model benchmark: all six expected flows ranked first with semantic retrieval enabled, fresh complete responses and both explicit adoption consumers retained.
- Self-host title/Artifact query: eight matching snapshot records, three Artifact options, zero false no-match results and zero encoder calls. Tracked bytes, HEAD and Git status were identical before and after reads. Fixture checks also preserve inspected sources.
- Go tests/vet and website documentation build passed.
- Knowledge checks: four-task/three-edge DAG, eight valid flow records, sole membership, 42 byte-identical complete snapshot files, no copied tasks, 34 release links and nine change links with no ancestor destination. Historical snapshots, other outcomes and upstream knowledge were unchanged.

## Limits and publication

Artifact scope follows explicit recorded participation across owners; it does not prove global code impact. Long expanded labels can need Fit View or zoom. Behavior discovery uses existing local model availability and explicit submission. Version 1.12.1 and this outcome await required review and merge; the root still declares 1.11.0. No automatic merge, lifecycle repair or established completion is claimed.

## Review handoff

[PR #25](https://github.com/hieutran21198/software-engineering/pull/25) is proposed for team review and merge. Its local validation evidence is recorded above. Completion remains unsupported until the member version and required implementation establish on main.
