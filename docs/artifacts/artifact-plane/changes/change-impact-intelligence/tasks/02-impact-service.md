---
id: impact-service
depends_on:
  - impact-index
---

# Impact service

## Scope and ownership

Own apps/artifact-plane/server/impact.js, the ground-truth file test/fixtures/impact-cases.json, the Node tests test/impact.test.js and the benchmark script scripts/impact-benchmark.mjs. The research prototype in the scratch directory is the reference for the rules and the cases; port it with tests, do not copy it.

## Governing knowledge

specifications/change-impact.md, sections Query and Validation. artifact-driven specifications/change-impact.md, every section. requirements/change-impact.md, I1, I3 to I6 and I12.

## Prerequisites

Task impact-index satisfies its DoD. artifact-driven 2.7.0 is established or merges in the same pull request.

## Definition of Done

- [ ] Origins resolve from tracked paths, element, flow, step and model IDs, changed declarations, one commit, a commit range and the diff against the protected ref; renamed and deleted paths are reported through `git log -M`; unknown inputs are unresolved with a reason.
- [ ] One Node test per row of the ADD propagation table passes on a synthetic fixture, including the symbol closure through a re-export, the test rule, the implementation symbol demotion, the mirror single hop, the prerequisite check, history thresholds and the vocabulary threshold.
- [ ] The explanation record and the coverage statement contain every field of the ADD contract; ranking is by tier, strength, hops, origins and identity; potential lists are capped at 10 per evidence kind; the declared comparison names the two differences.
- [ ] The compact text has the eight sections and is cut to the budget with a note; the structured result reports omissions per section.
- [ ] The benchmark runs the nine cases of the research against this repository and prints precision and recall per tier, the step checks, hard negatives, unresolved items, query times and output sizes; on the delivery revision every symbol-seeded case has direct precision and recall 1.0, every step check passes, no hard negative appears in direct or transitive, the three prerequisite cases are unresolved, and every compact output is under 8 kilobytes.
- [ ] A query on this repository answers within 100 milliseconds after the index is warm, measured by the benchmark.

## Evidence

No checks have run.
