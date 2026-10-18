# Change impact requirements

## Outcome

A reader of ADD knowledge can tell a person or an agent which entities a change affects, in which tier, through which relationships, with what evidence, and what it could not analyze.

## Need

ADD defines impact analysis as the assessment of affected knowledge, artifacts, contracts and tasks, and tells the Requirement and Specification phases to perform it. The method does not define the result. Measured on this repository on 18 October 2026:

- Every delivered impact result returns flows only. Affected elements, contracts, modules and tests are not output types.
- The facts the method asks for, such as potentially affected artifacts and coverage, are recorded in prose, which readers must ignore.
- References and flow supports name whole files. A one-line edit in a large contract makes every dependent of that file a candidate.
- Reachability over declared relationships is the only rule. A step supported by a changed test file counts the same as a step whose contract changed; an artifact prerequisite without any reference is silently absent.
- The declared graph is sparse: 9 element references exist, all from Artifact Plane to ADD; 1 of 73 element supports crosses artifacts; the parser of the flow contract is cited by no flow.
- Results are ordered newest-first. Hop distance, relationship kind and evidence are not visible.

## Requirements

- M1: Define the meaning of affected. A reader labels each reported entity with exactly one tier: changed, direct, transitive, potential or unresolved. Direct and transitive impact need a declared or derived relationship. Potential impact needs evidence without such a relationship and is never promoted by itself. Unresolved names an entity whose relationship to the change cannot be resolved, including an artifact prerequisite without any declared relationship to the changed element. Tests that support an affected step are verification work, not affected behavior.
- M2: Define a propagation rule for every relationship type: element reference, flow support by kind (element, flow, implementation, test), model declaration and participation, artifact prerequisite, unit affected flows, step transition, derived code relations (imports with named symbols, package imports, same-package tests, embedded files, identical-content mirrors), change history, shared contract vocabulary, and semantic similarity. A rule states whether the relationship propagates, at which tier, and what evidence it carries. Transitions and artifact prerequisites never propagate. Semantic similarity never contributes to impact.
- M3: Define the explanation record: the originating change, the affected entity and its kind, the tier, the hop count, the typed path with the evidence of each edge, the reason text where declared, the evidence strength as an ordered label, and affected symbols where known. Forbid numeric confidence values that are not calibrated against measured outcomes.
- M4: Define the coverage statement that every answer carries: the relationship sources used, the sources not analyzed, the depth limit and how many relationships lie beyond it, the symbol level, the history window, and freshness and completeness. An empty answer states that no consumer was found in the analyzed relationships, never that no impact exists.
- M5: Define how the phases use the result. Requirement uses the tiers to find candidate journeys and consumers. Specification assesses compatibility for direct and transitive items and records the decision for each potential item. The coordinator uses computed flows as input to the unit flow assessment and reconciles declared and computed flows; the assessment stays the declared authority.
- M6: Keep authoring cost flat. No new mandatory field. Guidance explains the optional symbol on implementation supports and cross-artifact references as the two declarations that improve precision; derived relations cover the rest.

## Acceptance criteria

- A1: The contract defines every tier and every rule of M1 and M2 in one specification element, with a table that a reader implementation can test against.
- A2: The explanation record and the coverage statement of M3 and M4 are defined as fields, not prose, and are reused by the Plane contract without copying.
- A3: The impact-analysis definition in the foundation and the end-user guideline describe the tiers and the phase use of M5, and both bundle copies are identical for the changed files.
- A4: Existing knowledge, flows and unit briefs remain valid without edits; validate-knowledge reports no new diagnostic.

## Affected artifacts and self-check

Artifact Plane consumes this contract and implements the reader; it changes in the same unit. Story-Driven depends on ADD and declares no reference to the affected elements; its knowledge does not change. The flows change-delivery and dependency-gates gain support on the new contract at their Requirement, Specification and recheck steps. Facts above come from the Plane readers and the repository on 18 October 2026; the ground-truth measurements that motivated M1 and M2 are recorded in the Plane decision record. KISS: one contract element, one guideline, one amended definition. STE: tiers and rules are named once. No Requirement blocker remains for Specification.
