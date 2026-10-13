---
id: codex-hooks
depends_on: ["runtime-store"]
---

# Report Codex lifecycle activity and document task binding

## Scope and location

Own the hook reporter, explicit bind/report CLI commands, example hook configuration, and setup documentation under apps/artifact-plane. Preserve existing user/project hook configuration; do not auto-install or trust hooks.

## Governing contracts

Artifact Plane elements requirements/codex-execution.md, specifications/codex-execution.md, and decisions/006-codex-observer.md in change-codex-execution. Existing knowledge contracts remain applicable. Consume established artifact-driven 1.2.0 task and unit contracts; no proposed upstream contract is required.

## Prerequisites

Explicit user approval of this plan; upstream contracts rechecked; internal dependencies above satisfy their applicable DoD.

## Definition of Done

- [ ] Fixture-driven hook checks cover main/subagent lifecycle, unknown events, missing bindings, allowed fields, and valid stdout JSON.
- [ ] Reporter failures/timeouts are nonblocking and sensitive payload fields never appear in the database, API, or diagnostics.
- [ ] An isolated Codex 0.160.1 smoke check verifies hook configuration/input/output when hook trust can be established; otherwise report the exact limitation, never claim live validation.
- [ ] Documentation provides configuration merge instructions, Codex /hooks trust, session identity discovery, bind/report examples, state-directory selection, and remaining-source history browsing.

## Evidence

No implementation or task validation has run.
