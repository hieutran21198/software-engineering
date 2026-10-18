---
flow:
  id: change-impact
  artifact: artifact-plane
  title: Explain what a change affects
  trigger: A person or an agent selects a change, a document, a flow step, a
    commit or a branch difference and asks what it affects.
  outcome: A tiered, explained and bounded answer names the affected knowledge,
    flows and steps, modules and tests, the tests to run, the places to look,
    the unresolved relationships and the coverage of the analysis.
  entry_steps:
    - select
  steps:
    - id: select
      title: Select the origins from a change, document, flow, commit or branch difference
      supports:
        - contract
        - add-contract
    - id: resolve
      title: Resolve changed entities, declarations, sections, renames and deletions
      supports:
        - contract
        - add-contract
    - id: propagate
      title: Propagate through typed declared and derived relationships within the depth
      supports:
        - contract
        - add-contract
    - id: explain
      title: Rank the tiers and attach paths, evidence and the coverage statement
      supports:
        - contract
        - add-contract
    - id: act
      title: Read the answer, expand one hop, open sources and run the verification list
      supports:
        - contract
    - id: handoff
      title: Return the compact context through HTTP, MCP or the packet
      supports:
        - contract
  transitions:
    - from: select
      to: resolve
    - from: resolve
      to: propagate
    - from: propagate
      to: explain
    - from: explain
      to: act
      condition: A person reads the answer in the Impact view.
    - from: explain
      to: handoff
      condition: An agent or the packet requests the answer.
    - from: act
      to: propagate
      condition: The person expands the depth by one hop or changes a filter.
    - from: act
      to: select
      condition: The person opens another origin from a path or a source.
  support:
    - id: contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-impact.md
      requires: Define the index, the query, the interfaces, the Impact view and the validation of the answer.
      basis: documented
    - id: add-contract
      kind: element
      artifact: artifact-driven
      element: specifications/change-impact.md
      requires: Define the tiers, the propagation rule of each relationship type, the explanation record and the coverage statement.
      basis: documented
  gaps:
    - This record is prepared knowledge. Implementation and test supports are
      added when the service, the view and the benchmark exist.
    - The analysis never covers dynamic calls, injected functions or process
      boundaries; the coverage statement names them.
  exclusions:
    - Approval, establishment, repository writes and generated answers.
---

# Explain what a change affects

The journey starts from any origin a person or agent can name and ends with one bounded answer. Propagation follows the ADD change-impact contract; the Plane contract owns the index, the interfaces and the view. Expansion by one hop and origin changes loop back through propagation and selection, so a person explores progressively instead of reading the whole graph.

## Coverage and evidence

Prepared from the contracts and the research prototype of 18 October 2026. No implementation exists yet; the prototype measurements are recorded in decisions/016-typed-impact-ledger.md and are not delivery evidence.
