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

- [x] Fixture-driven hook checks cover main/subagent lifecycle, unknown events, missing bindings, allowed fields, and valid stdout JSON.
- [x] Reporter failures/timeouts are nonblocking and sensitive payload fields never appear in the database, API, or diagnostics.
- [x] An isolated Codex 0.160.1 smoke check verifies hook configuration/input/output when hook trust can be established; otherwise report the exact limitation, never claim live validation.
- [x] Documentation provides configuration merge instructions, Codex /hooks trust, session identity discovery, bind/report examples, state-directory selection, and remaining-source history browsing.

## Evidence

node --test test/runtime-hooks.test.js passed two CLI/hook fixtures. All configured main/subagent lifecycle forms returned valid nonblocking JSON; sensitive fields were excluded; explicit bind/report commands worked. Installed codex-cli 0.160.1 App Server initialized in a disposable CODEX_HOME and hooks/list discovered all ten handlers with no warnings/errors. All remained untrusted, as expected. No trust settings or global configuration were changed, and no live model turn was executed. Actual activation requires the user to review/trust hooks through /hooks. Setup, identity, binding, reporting, state directory and archived-history instructions are in apps/artifact-plane/integration/README.md. KISS/STE checks passed.
