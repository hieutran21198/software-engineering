# Reusable Patterns

This library contains built-in practices that can be applied within ADD's existing phases. A pattern describes when to use it, the inputs it needs, the knowledge it produces, and how to validate the result.

Patterns do not add phases, parallel changes within one artifact, approval gates, or workflow state. Apply the relevant guidance to the active change rather than creating a second source of project knowledge. Built-in means available in this library; it does not imply installed tools or automatic enforcement.

## Built-In Patterns

| Pattern | Use when | Primary phases |
| --- | --- | --- |
| [Strategic Domain-Driven Design](strategic-domain-driven-design.md) | Business concepts and responsibility boundaries need clarification. | Requirement and Specification. |
| [Tactical Domain-Driven Design](tactical-domain-driven-design.md) | Domain rules require a structured implementation model. | Specification where design affects contracts; Implementation. |
| [Contract-Driven Development](contract-driven-development.md) | Implementations interact through interfaces. | Specification, Plan, and Implementation. |
| [Behavior-Driven Development](behavior-driven-development.md) | Concrete examples can clarify expected outcomes and acceptance criteria. | Requirement, Specification, and Implementation. |
| [Event-Driven Development](event-driven-development.md) | Asynchronous reactions or independent consumers serve the requirements. | Requirement, Specification, Plan, and Implementation. |
| [Test-Driven Development](test-driven-development.md) | Test-first implementation clarifies behavior or demonstrates a defect. | Plan and Implementation. |
| [Ports and Adapters](ports-and-adapters.md) | Domain behavior needs isolation from external technologies. | Specification, Plan, and Implementation. |
| [Continuous Integration](continuous-integration.md) | Repeatable checks and frequent integration reveal incompatible changes early. | Implementation and Version preparation; earlier phases define checks. |
| [Policy as Code](policy-as-code.md) | Authorization or infrastructure rules need repeatable enforcement and tests. | Requirement, Specification, Plan, and Implementation. |

## Apply a Pattern

1. Select guidance that addresses the actual problem. Read only the relevant pattern.
2. Use the active change's existing requirements, specifications, decisions, and tasks as inputs.
3. Record the pattern's outputs in those same locations. Keep definitions under their owning artifact.
4. Add applicable checks to task DoD and record evidence with tasks.

Strategic DDD guides business boundaries by default, and contract-driven Specification governs applicable interfaces. Tactical DDD, BDD, and event-driven development are applied when useful; they do not require a particular framework.

TDD and CI support executable evidence. Ports and Adapters supports isolated domain behavior and explicit integration checks. Policy as Code supports governed access or infrastructure rules. Select them according to the change; no project must adopt every pattern.

The patterns compose: clarify domain boundaries, express behavior through examples, define interface contracts, then implement the model and validate it. Follow the existing phase gates and user plan approval. A material change or new plan still requires renewed approval.

## Adding Patterns

Give each new pattern a focused document with its purpose, applicability, phase inputs and outputs, application guidance, validation criteria, and a small example. Distinguish the underlying practice from ADD-specific choices. Keep required knowledge inside this library and avoid making external tools mandatory without a demonstrated need.
