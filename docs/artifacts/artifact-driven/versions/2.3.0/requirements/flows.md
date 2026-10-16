# Flow knowledge requirements

## Outcome

Actors can discover relevant artifact knowledge through named system behavior flows, and maintain those flows through the existing ADD phases. Runtime behavior remains separate from delivery outcomes and execution prerequisites.

## Requirements

- F1: A flow has one artifact owner, stable identity, trigger, outcome, steps, transitions, and important branches. Shared elements can support several flows. Joins, loops, and disconnected records remain representable.
- F2: References identify supporting artifact elements, implementation, tests, and other flows. Record why the support matters and distinguish documented, statically detected, observed, and inferred relationships. Missing evidence remains explicit.
- F3: Flow definitions belong to artifact specifications and complete knowledge snapshots. Diagrams and retrieval indexes derive from those definitions. Preserve historical snapshots and change-owned delivery records.
- F4: Each new unit assesses flow impact. It can create, modify, or remove flows; an empty affected-flow list needs a reason. Missing flow knowledge creates discovery work, not a unit-creation blocker. Legacy briefs remain readable.
- F5: Existing phase self-checks cover affected flows, contract changes, validation, and reference freshness. No extra workflow state registry or approval gate is introduced.
- F6: Deliver the same flow contract, guidance, and role instructions in canonical and packaged bundles. Adoption creates no project flow records or indexes automatically.
- F7: Inventory ADD adoption, change delivery, dependency gates, unit validation, and version publication from repository evidence. Record coverage and exclusions rather than claiming every possible execution path.

## Local acceptance

Valid records cover shared support, branches, joins and loops; invalid identities and escaping references are diagnosed. Existing artifact/task DAG meanings and legacy unit/version behavior stay intact. A fresh adoption contains the flow guidance byte-for-byte. Baseline knowledge and referenced delivery evidence are preserved.

## Impact and self-check

Artifact Plane consumes the new input contract. Story-Driven uses it to document its existing journeys. Neither may begin dependent implementation until the required ADD version establishes and its prepared contract is rechecked. Requirements follow the approved scope and distinguish knowledge from execution state. KISS and STE checks passed; no Requirement blocker remains.
