# Contract-Driven Development

## Purpose and Applicability

Define interfaces before dependent implementations so that contributors work from shared expectations. In ADD, this applies to all interfaces relevant to a change: APIs, events, data formats, errors, and operational interactions.

This practice is broader than consumer-driven contract testing. That testing technique checks consumer expectations against providers; it is one possible validation method.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Specification | Requirements, domain knowledge, participating consumers/providers. | Interface contracts and relevant element references. |
| Plan | Completed contracts. | Provider, consumer, and integration tasks with contract checks in their DoD. |
| Implementation | Approved tasks and required established upstream contracts. | Conforming implementations, executable checks, and task evidence. |

## Apply

The TL records each interface under its owning artifact. Specify inputs, outputs, meanings, applicable validation rules, failure behavior, and compatibility expectations. Include lifecycle, ordering, or retry behavior when the interface requires it.

Choose a representation suited to the interface and existing tools. A schema or API description can capture structure, but also document behavior that it cannot express. Do not require one format or framework for every contract.

Consumers reference the owning artifact and relevant element. Use current established versions for implementation. Preparation can use proposed contracts with explicit status; recheck them after upstream establishment.

Independent implementations within an approved change can run in parallel against the completed contracts. If a contract needs material revision, return to Specification, analyze impact, update Plan, and obtain renewed user approval.

## Validation

Check producer output and consumer expectations against the contract. Validate failure cases and behavior as well as structure. Record provider/consumer checks and integrated acceptance results with tasks; passing schema checks alone does not prove behavior.

## Example

A tenant identity contract defines identifier format and lifecycle rules. Authentication references that contract when specifying login behavior. Its tasks verify accepted tenant identifiers and the specified behavior for unknown or inactive tenants. Actual responses are chosen in Specification, not invented by this pattern.

## Research Basis

Pact documentation, *How Pact works*, describes consumer expectations and provider verification. The broader interface-first workflow and artifact placement here are ADD conventions, not a requirement to install Pact.
