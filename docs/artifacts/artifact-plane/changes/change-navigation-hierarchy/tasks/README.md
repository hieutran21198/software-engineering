---
tasks:
  - 01-tree-style.md
  - 02-validation.md
---

# Navigation hierarchy plan

1. [Style the tree hierarchy and test it](01-tree-style.md)
2. [Validate and get owner acceptance](02-validation.md), after task tree-style

## Approval and prerequisites

Present this plan for explicit user approval before implementation. The owner approved it on 18 October 2026. ADD 2.6.0 is established on main; no ADD contract is required beyond it. A material change to the tree presentation rules requires renewed approval.

After both tasks pass, the coordinator suggests the version (the owner confirmed 1.17.1 on 18 October 2026), adds the version record and the unit evidence, and opens one PR.

## Plan self-check

Task tree-style covers N1–N4 and the Tree presentation rules; task validation covers N5 and NA1–NA6 on the combined result, including the owner's screenshot acceptance. The graph has two listed tasks, unique IDs and one edge (tree-style → validation); it has no cycle. No artifact edge changes. KISS: CSS rules on existing classes and one browser test; no tree logic or component change. STE: each DoD item names one observable check.
