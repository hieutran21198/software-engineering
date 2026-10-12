# Strategic Domain-Driven Design

## Purpose and Applicability

Strategic DDD identifies consistent domain language, model boundaries, and relationships between contexts. A bounded context is the scope in which a model and its terms apply consistently.

Use it when business responsibilities or terminology are unclear. Technical capabilities still need cohesive ownership, but do not need an invented business model.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Requirement | User needs, business rules, existing domain knowledge. | Clarified terms, acceptance outcomes, and potentially affected capabilities. |
| Specification | Completed requirements and current artifact knowledge. | Owned language/model, boundaries, integration contracts, and proposed dependencies. |

## Apply

- Ask domain experts what terms mean and which rules belong together.
- Group knowledge by responsibility and meaning; do not create one artifact per noun or database table.
- Default to one artifact for a bounded context. Let the user choose smaller boundaries if the artifact is too large.
- Record language and model in the owning artifact's specifications. Other artifacts reference them instead of copying definitions.
- Define contracts where capabilities interact. Different contexts can use different meanings, with translations made explicit.
- Use context relationships to investigate dependencies. Add an artifact DAG edge only for an actual execution prerequisite; a context map is not automatically an execution DAG.

## Validation

The PO checks that language captures the user's needs. The TL checks cohesive boundaries, ownership, contracts, and impact on affected artifacts. Record a necessary architectural choice in an ADR when alternatives require evaluation. No additional review phase is needed.

## Example

Tenant management owns tenant identity and isolation rules. Authentication owns sign-in behavior and references the tenant identity contract. If tenant and organization management share tightly connected rules, assess them together rather than assuming their names imply separate artifacts.

This example illustrates discovery, not a prescribed SaaS architecture.

## Research Basis

Eric Evans, *Domain-Driven Design Reference: Definitions and Pattern Summaries* (2015), describes bounded contexts, language, and context mapping. Artifact ownership and placement above are ADD-specific adaptations.
