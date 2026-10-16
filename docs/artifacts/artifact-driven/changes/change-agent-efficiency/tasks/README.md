---
self_check:
  result: passed
  source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/README.md#coverage-and-self-check
tasks:
  - 01-layout-guidance.md
  - 02-adoption-preflight.md
  - 03-json-cli.md
  - 04-migrate-repository.md
  - 05-measure-and-publish.md
---

# ADD agent efficiency and in-place layout implementation plan

## Approval and scope

This is a new plan awaiting explicit approval. No implementation has started. Suggested ADD 2.4.0 is a compatible minor release that adds the in-place layout and keeps legacy artifacts readable; select 3.0.0 instead if the guidance change counts as breaking. The two adoption tasks are retained unchanged from the earlier plan and have independent file scopes.

1. [Rewrite method and role guidance for the in-place layout](01-layout-guidance.md).
2. [Report safe adoption conflicts together](02-adoption-preflight.md).
3. [Expose adoption results as optional JSON](03-json-cli.md), after preflight.
4. [Migrate this repository's artifacts](04-migrate-repository.md), after guidance.
5. [Measure, validate and prepare ADD 2.4.0](05-measure-and-publish.md), after guidance, JSON and migration.

Tasks 01 and 02 can run concurrently in separate worktrees; the coordinator keeps knowledge updates central. Sequential execution is valid. No extra reviewer or role session is required. TL performed Specification and Plan in this session.

## Related Plane execution and PRs

The Plane's [active plan](../../../../artifact-plane/changes/change-evidence-and-usability/tasks/README.md) reads the in-place layout. Its reader tasks depend on this proposed contract. Two publication options exist; choose one with approval:

- One coordinated repository PR, as the execution guidance allows for one Git repository: ADD tasks complete and pass checks first, then Plane tasks are implemented on the same branch against the proposed contract and rechecked after merge. The Plane validates the migrated repository before review.
- Strict gating: open the ADD PR first; Plane implementation starts after it lands on main. Between the merges, the Plane on main reports the migrated artifacts as missing version knowledge, because it cannot read the new layout yet.

Either way, link merged upstream PR #28, keep the two unit briefs separate, and stop for team review and merge. Do not merge, deploy or claim establishment.

## Coverage and self-check

N1 to N9 and K1 to K5, K8 map to layout guidance and migration; N10 and K6, K7 map to migration and measurement; R1 to R2 and A1 to A2 map to the adoption tasks; R3 to R7 and A3 to A5 map to layout guidance. Task membership and IDs are explicit, four internal edges resolve, and the graph is acyclic. No upstream artifact edge changes. KISS reuses existing files, tests and scripts. STE keeps gate conditions and measurement limits explicit. Plan approval is the only unresolved user decision before implementation.
