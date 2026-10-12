# Element ordering correction plan

Correct knowledge reading order in `apps/artifact-plane` after approval of this plan. The established `1.0.0` snapshot supplies the baseline. There are no upstream artifact implementation prerequisites.

## Current work

1. [Order and group knowledge elements](04-element-order.md).

One sequential task is sufficient. Use Contract-Driven Development for the ordering rules, B8 as the behavior example, and TDD for the regression. Preserve plain module boundaries and run the existing CI checks. No new library or sorting configuration is needed.

## Historical tasks

These completed tasks explain the established implementation. Their evidence does not validate the new ordering behavior.

- [Initial reader and API](01-reader.md)
- [Initial interactive canvas](02-interface.md)
- [Initial integrated validation](03-validation.md)

## Governing elements

The current task implements the element reading-order requirements and B8 in `requirements/explorer.md`, and the logical element-ordering contract in `specifications/explorer.md` in this change. Existing valid requirements, specifications, decisions, and historical task evidence are retained from `1.0.0`.

## Self-check

The task covers snapshot ordering, both visual lists, selection/reference preservation, and integrated validation. The user delegated source precedence; current-version-first is the specified choice. The change preserves discovery and dependencies. KISS uses one small task and existing libraries. STE checks keep the rules explicit. Implementation waits for explicit approval of this correction plan.
