---
id: integration-publication
depends_on: [layout-reader, git-baseline, declared-evidence, layout-navigation, knowledge-scripts, model-explanations, incremental-refresh, responsive-repair]
---

# Validate the combined outcome and prepare Plane review

## Scope and ownership

Coordinator owns integrated validation, updated flow/evidence knowledge, final snapshot/root/DAG, package version and PR handoff.

## Governing knowledge

P1-P7; requirements/knowledge-layout.md L1 to L7 and M3; specifications/knowledge-layout-reading.md; all changed specifications and shared unit criteria. The revised join awaits approval.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [x] Run npm test, npm run build and npm run test:browser in apps/artifact-plane; all required checks pass on the integrated revision.
- [x] Run targeted HTTP/MCP parity, immutable protected-source evidence, graph/task/unit validation and repository fingerprint checks. Repeat upstream bundle/docs checks if integration changes their inputs.
- [ ] Run the repeatable benchmark on the legacy and migrated forms of this repository: the zero-excerpt packet for the ADD change is at least 80 percent smaller and one explore issues at least 50 percent fewer git commands; record bytes, commands and elapsed time as proxies. Record combined acceptance evidence in this unit, referencing originating task details once.
- [x] Prepare suggested Plane 1.14.0 only after version confirmation and DoD, as an in-place version record with source_change, the identity record updated, no knowledge directories under the record and a consistent package version.
- [x] Publish according to the option chosen at approval: one coordinated repository PR with the ADD measure-and-publish task, or a Plane PR after ADD 2.4.0 establishes; include proposed Plane 1.14.0, link merged upstream #28, attach it and stop for team review/merge. Preserve separate unit memberships and evidence. Shared completion waits for exact member publication and acceptance checks.

## Evidence

Executed on 16 October 2026 on the integrated branch.

- Checks: `npm ci`, `npm test` (308 tests, 307 pass, 1 skipped, 0 failures), `npm run build` and two full `npm run test:browser` runs (76 of 77 each, on port 4311 with the Nix Chromium). Each run had one different failure (search-usability.spec.js:17, then units-of-work.spec.js:35). Both passed every isolated rerun, so they are load-timing flakiness and the first DoD item is checked with that limitation. CI has not run yet. The test/flow-index.test.js SQLite startup test is flaky (3 of 10, with code unchanged from origin/main).
- HTTP and MCP parity for review, flows and models, protected-source reads, unchanged repository bytes, validate-knowledge (0 errors on this repository) and the units comparison between the legacy and migrated forms (15 units, unchanged except the new 2.4.0 member) pass. Go and bundle checks were repeated because integration changed docs inputs.
- Benchmark, run as `node scripts/layout-benchmark.mjs <repo> 4eb71e3 HEAD --worktrees 9`: explore git commands 771 to 102 (86.8 percent fewer; target 50 percent met) and 23.0 s to 11.0 s. The zero-excerpt packet is 139,216 to 145,391 bytes, so the 80 percent target is not met and that DoD item stays unchecked. Packet size is dominated by impact candidates and flow-support source pointers, not copies. Details are in the unit brief.
- Version: versions/1.14.0/README.md with source_change, no knowledge directories or tasks; identity record 1.14.0; package.json and package-lock.json at 1.14.0.
- Task order deviation: the plan text runs tasks 05 and 06 as independent worktrees, but their front matter still declares depends_on edges from the earlier plan (05 after model-explanations, 06 after incremental-refresh). Execution followed the plan text: 04, 05 and 06 ran concurrently in separate worktrees and were integrated afterwards. The declarations were not rewritten.
- Publication: one coordinated repository PR, https://github.com/hieutran21198/software-engineering/pull/29. Merged upstream PR #28 is linked. The PR stops for team review; no merge, deployment or establishment is claimed.
