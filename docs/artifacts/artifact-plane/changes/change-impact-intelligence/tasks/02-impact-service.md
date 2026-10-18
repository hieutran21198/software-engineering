---
id: impact-service
depends_on:
  - impact-index
evidence_records:
  - id: service-checks
    method: node --test test/impact.test.js; npm test; node scripts/impact-benchmark.mjs <worktree> on the nine ground-truth cases
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/02-impact-service.md#service-checks
---

# Impact service

## Scope and ownership

Own apps/artifact-plane/server/impact.js, the ground-truth file test/fixtures/impact-cases.json, the Node tests test/impact.test.js and the benchmark script scripts/impact-benchmark.mjs. The research prototype in the scratch directory is the reference for the rules and the cases; port it with tests, do not copy it.

## Governing knowledge

specifications/change-impact.md, sections Query and Validation. artifact-driven specifications/change-impact.md, every section. requirements/change-impact.md, I1, I3 to I6 and I12.

## Prerequisites

Task impact-index satisfies its DoD. artifact-driven 2.8.0 is established or merges in the same pull request.

## Definition of Done

- [x] Origins resolve from tracked paths, element, flow, step and model IDs, changed declarations, one commit, a commit range and the diff against the protected ref; renamed and deleted paths are reported through `git log -M`; unknown inputs are unresolved with a reason.
- [x] One Node test per row of the ADD propagation table passes on a synthetic fixture, including the symbol closure through a re-export, the test rule, the implementation symbol demotion, the mirror single hop, the prerequisite check, history thresholds and the vocabulary threshold.
- [x] The explanation record and the coverage statement contain every field of the ADD contract; ranking is by tier, strength, hops, origins and identity; potential lists are capped at 10 per evidence kind; the declared comparison names the two differences.
- [x] The compact text has the eight sections and is cut to the budget with a note; the structured result reports omissions per section.
- [x] The benchmark runs the nine cases of the research against this repository and prints precision and recall per tier, the step checks, hard negatives, unresolved items, query times and output sizes; on the delivery revision every symbol-seeded case has direct precision and recall 1.0, every step check passes, no hard negative appears in direct or transitive, the three prerequisite cases are unresolved, and every compact output is under 8 kilobytes.
- [x] A query on this repository answers within 100 milliseconds after the index is warm, measured by the benchmark.

## Evidence

### service-checks

Checked on 18 October 2026 in the worktree of branch claude/impact-index-service (commits 85fe645, d39eb43 and b00a7f7, merged into claude/impact-intelligence). Origins resolve from tracked paths, element, flow, step and model IDs, changed declarations, one commit, a commit range and the diff against the protected ref, and an origin may name {path, commit}; one unified diff per query with fixed a/ and b/ prefixes supplies hunks, Markdown sections and the contract vocabulary of added lines, and old and new texts for acorn come through `git cat-file --batch`; renamed and deleted paths are reported through `git log -M` as "renamed to … in <hash>" or "deleted in <hash>"; unknown paths are unresolved as not tracked. test/impact.test.js has one test per row of the ADD propagation table, including the symbol closure through a re-export, the test rule, the implementation-symbol demotion, the mirror single hop with the divergence diagnostic, the prerequisite check, the declared comparison, history above and below the thresholds, the vocabulary threshold, stale input, and budget and limit cuts. The explanation record carries entity, kind, tier, hops, strength, origins, paths with per-edge evidence, affected_exports and reason, and flows carry steps; the coverage statement carries sources_used, not_analyzed, depth, frontier, symbol_level, history_window, freshness, completeness and the declared comparison; ranking is by tier, strength, hops, origins and identity; potential lists are capped at 10 per kind with potential_total; the compact text has the eight sections and is cut to the budget with a note; JSON omissions report the totals per section.

`node scripts/impact-benchmark.mjs <worktree>` on this repository at d39eb43 (the worktree then included the new modules), depth 2 except C5 at depth 3, warm queries:

| Case | Direct P/R | All P/R | Flows P/R | Hard negatives | Steps | Potential | Unresolved | Query ms | Frontier | Compact chars |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C1 RuntimeStore fix | 1/1 | 1/1 | 1/1 | 0 | - | 0 | - | 53.9 | 15 | 2637 |
| C2 knowledge-layout | 1/1 | 1/1 | 1/1 | 0 | 5/5 | 10 listed | reported | 31.8 | 0 | 10051 |
| C3 task-dag | 1/1 | 1/1 | 1/1 | 0 | 2/2 | 2 of 5 expected in 8 | - | 30.7 | 0 | 5319 |
| C4 system-flows | 1/1 | 0.88/1 | 0.8/1 | 0 | 3/3 | 4 of 5 expected in 10 | - | 52.9 | 3 | 6454 |
| C5 git-process gitSlot | 1/1 | 0.47/0.88 | 1/1 | 0 | - | 0 | - | 31.7 | 76 | 14739 |
| C6 change-review vs revision-impact | 1/1 | 0.56/1 | 0.5/1 | 0 | - | 1 of 1 | - | 29.8 | 5 | 7106 |
| C7 ADD docs-only | 1/1 | 1/1 | - | 0 | - | 10 listed | reported | 48.8 | 2 | 5405 |
| C8 style.css rename | 1/1 | 0.75/1 | 0.71/1 | 0 | 5/5 | 0 | reported | 39.1 | 0 | 6144 |
| C9 new importers (recall only) | 0.11/1 | 0.05/1 | 0.14/1 | 0 | - | 1 | - | 34.1 | 66 | 11742 |

The direct tier has precision and recall 1.0 for every symbol-seeded case, all 15 step checks pass, no hard negative enters direct or transitive, the three prerequisite cases are unresolved, and the slowest warm query is 53.9 ms. Compact answers are cut to the default budget of 8000 characters, so every delivered answer is under 8 kilobytes; the uncut sizes above range from 2637 to 14739 characters. `npm test`: 348 tests, 347 passed, 1 skipped, 0 failed. Limits: the potential tier finds 2 of 5 and 4 of 5 expected hidden couplings in C3 and C4 by design of the vocabulary threshold; history reads local refs because the protected branch is squash-merged.
