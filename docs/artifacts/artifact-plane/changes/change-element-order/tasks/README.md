# Grouped records and resizable inspector plan

Correct knowledge reading order and record density, and make the right inspector resizable in `apps/artifact-plane` after approval of this plan. The established `1.0.0` snapshot supplies the baseline. There are no upstream artifact implementation prerequisites.

## Current work

1. [Order, group, and compact knowledge elements](04-element-order.md).
2. [Resize the inspector and validate the combined UI](05-resize-inspector.md).

Execute the two tasks sequentially because both touch the UI and styles. Use Contract-Driven Development for the ordering and resize rules, B8–B10 as the behavior examples, and TDD for meaningful regressions. Preserve plain module boundaries and run the existing CI checks. No new library or sorting configuration is needed.

## Historical tasks

These completed tasks explain the established implementation. Their evidence does not validate the new ordering behavior.

- [Initial reader and API](01-reader.md)
- [Initial interactive canvas](02-interface.md)
- [Initial integrated validation](03-validation.md)

## Governing elements

The current tasks implement requirements 11–15 and B8–B10 in `requirements/explorer.md`, and the logical element-ordering and resizable-inspector contracts in `specifications/explorer.md` in this change. Existing valid requirements, specifications, decisions, and historical task evidence are retained from `1.0.0`.

## Reviewable result

Expanded artifacts show up to four closed type groups instead of a long flat record list. Opening a type reveals current-version records followed by change records, in natural filename order. Open records are 52 pixels high instead of 70. The right panel has a pointer- and keyboard-operated divider; panel width and group expansion remain in browser memory.

## Self-check

The tasks cover type grouping, compact records, pointer/keyboard panel resizing, selection/reference preservation, and integrated validation. The user delegated source precedence; current-version-first within each type is the specified choice. The change preserves discovery and dependencies. KISS uses two small sequential tasks and existing libraries. STE checks keep the rules explicit. Implementation waits for explicit approval of this correction plan.
