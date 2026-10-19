---
id: tier-check
depends_on: [record-checks]
---

# Tier check

## Scope and ownership

Implementer, `apps/artifact-plane/server/tier-check.js`. Return the tier object for one change with each criterion decided as the Tier check table states, using the impact service for impact-contained in the Plane services and `coordinator` in the standalone validator. Report `tier-mismatch`.

## Governing knowledge

specifications/delivery-support.md (Tier check); artifact-driven specifications/delivery-tiers.md (Small-tier criteria); requirements/delivery-improvements.md, PI5 and PA4.

## Prerequisites

Task record-checks.

## Definition of Done

- [x] Fixtures from the knowledge and code of #34 and #37 give allowed `small`; #36 gives `large` or `medium` with the failing criteria named.
- [x] Without an impact index, impact-contained is `unresolved` in the services and `coordinator` in the standalone validator, and no index is built by the validator.
- [x] `npm test` passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| #34, #37 and #36 | `test/fixtures/tier-cases.json` holds three cases taken from Git: the small-tier replay of #37 (ADD task small-replay), a small-tier replay of #34 written the same way (D3 of workbench-redesign.md amended in place instead of new IDs N1 to N5; 7 knowledge files, 127 knowledge lines, 45 code lines), and #36 as delivered. Knowledge keeps front matter, the first heading and requirement ID lines; code files keep their numbers of added and deleted lines. `test/tier-check.test.js` builds a repository for each case: #37 and #34 are allowed small with every criterion pass or coordinator (code-limit 57 and 45 lines); #36 is large, and its details name the artifact-driven files (one-artifact), the added flow, decision and requirement IDs (no-contract), and code-limit and patch-level fail | Passed |
| No index | With no impact service, impact-contained is unresolved and a declared small change gets `tier-mismatch`; with `standalone: true` it is coordinator and a spy impact service is called 0 times; a stub service decides pass (Plane entities only), fail (an artifact-driven flow) and unresolved (query error) | Passed |
| Suite | `npm test`: 392 tests, 391 passed, 0 failed, 1 skipped | Passed |

A configuration file with `max_code_lines: 50` turns code-limit to fail for the #37 replay, and the declared small tier then reports `tier-mismatch` (A7 of artifact-driven, automated). Ownership rule for code paths: an entity that the impact service reaches belongs to another artifact when it is a flow, step or model of that artifact or a path under its knowledge directory; a code file that supports another artifact's flow reaches that flow, so the rule also covers code.
