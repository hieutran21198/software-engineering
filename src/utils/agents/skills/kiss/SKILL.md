---
name: kiss
description: Apply Keep It Simple principles to software requirements, designs, plans, implementation, and reviews. Use when choosing a solution or removing unnecessary complexity while preserving required behavior, contracts, and validation.
---

# Keep It Simple

Choose the simplest solution that meets the current requirements and constraints. Evaluate simplicity through the effort needed to understand, use, test, change, and operate the solution, rather than line count alone.

## Choose and Build

- Reuse existing knowledge, contracts, and project conventions before adding another mechanism.
- Implement the approved need. Add extension points, configuration, abstractions, dependencies, or infrastructure only when a present requirement justifies them.
- Prefer a direct implementation with clear responsibilities. Introduce an abstraction when it removes demonstrated duplication or isolates a real source of variation.
- Keep one authoritative source for each fact. Derive indexes and views instead of maintaining parallel copies of state.
- Use explicit data flow and interfaces. Avoid hidden behavior that makes dependencies or failures hard to understand.
- Scale checks and coordination to the change. Use existing validation and evidence instead of adding repetitive reviews or a second tracking system.

## Simplify Existing Work

Identify the concrete cost of the complexity before changing it. Remove unused paths, redundant layers, or duplicate sources when the change is within scope. Preserve required behavior, interface compatibility, domain rules, error handling, security constraints, and validation evidence.

Do not rewrite working code solely to match a preferred style, replace an established architecture without a demonstrated need, or delete necessary detail to make a solution look shorter. A larger solution can be simpler when requirements justify its structure.

## Check the Result

Ask whether each new mechanism serves a current requirement, whether a maintainer can follow the behavior, and whether the governing contracts still hold. Run checks appropriate to the changed behavior. Explain material tradeoffs briefly; do not add a separate simplicity report unless requested.
