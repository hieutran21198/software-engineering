# Ports and Adapters

## Purpose and Applicability

Ports and Adapters, also called Hexagonal Architecture, separates application behavior from external technologies. Ports express interactions; adapters connect those interactions to concrete transports, storage, or services.

Use it when external dependencies obscure domain rules, make tests fragile, or need alternative implementations. Avoid adding layers when a simple implementation already has clear boundaries.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Specification | Requirements, domain model, and interface contracts. | Application boundaries, required port behavior, and applicable ADRs. |
| Plan | Completed design and contracts. | Core, adapter, and integration tasks with DoD checks. |
| Implementation | Approved tasks. | Application code, adapters, boundary tests, and evidence. |

## Apply

The TL defines what the application needs from external systems and what it offers to callers. Keep domain rules in the application rather than embedding them in transport handlers or database adapters.

Define ports around purposeful interactions. Choose language-native abstractions; not every port needs an interface class. Use adapters for the external details that matter to the change. In-memory adapters can support isolated tests, but do not prove that production adapters behave correctly.

An application port is not automatically an artifact boundary or a network API. Record artifact dependencies only when they represent actual knowledge or execution prerequisites. Record necessary architectural choices in ADRs when alternatives require evaluation.

## Validation

Test application rules without requiring production infrastructure where practical. Check adapters against their port contracts and verify actual integration behavior, including relevant failures. Record results in implementation tasks.

## Example

Tenant provisioning needs to create a workspace. The application defines the required provisioning interaction. A production adapter calls the external platform; a test adapter supplies controlled outcomes. Tests check the application response to success and failure, while integration checks validate the production adapter separately.

## Research Basis

Alistair Cockburn, *Hexagonal Architecture* (2005), describes isolating application behavior through ports and technology-specific adapters. Artifact boundaries and phase placement above are ADD adaptations.
