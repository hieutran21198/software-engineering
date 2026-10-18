---
id: integration-version
depends_on:
  - browser-suites
  - interfaces
evidence_records:
  - id: combined-checks
    method: npm test, npm run build, two full Playwright runs, the impact benchmark, go test and go vet, the website build, validate-knowledge and a bundle mirror comparison on the integrated branch
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-impact-intelligence/tasks/08-integration-version.md#combined-checks
---

# Integration and version

## Scope and ownership

Own the combined checks, the owner's review, the flow records of this change, the README documentation, the unit evidence and the version record docs/artifacts/artifact-plane/versions/1.18.0/README.md with the identity record update.

## Governing knowledge

The unit brief docs/artifacts/units-of-work/change-impact-intelligence/README.md, every criterion. specifications/change-impact.md, Validation. specifications/flows/change-impact.md.

## Prerequisites

Tasks browser-suites and interfaces satisfy their DoD. artifact-driven 2.8.0 is established or merges in the same pull request.

## Definition of Done

- [ ] The owner opens the Impact page on a real change of this repository at 1440 and 390 pixels and accepts it; the acceptance is recorded in the unit evidence.
- [x] Combined checks pass on the integrated branch: `npm test`, `npm run build`, the browser suites, `go test ./...`, `go vet ./...`, the website build and validate-knowledge with no error.
- [x] The benchmark output on the delivery revision is recorded as evidence for the accuracy and performance criteria.
- [x] The change-impact flow gains implementation and test supports for the service, the route, the tool, the page and the suites; the amended flows resolve their supports; the unit's declared flows match the computed flows or the differences are explained in the flow assessment.
- [x] The version record 1.18.0 names source_change change-impact-intelligence, states the minor compatibility level with its reason, and current_version in the identity record is 1.18.0.

## Evidence

### combined-checks

Checked on 18 October 2026 on branch claude/impact-intelligence at 19b5677 and 6970400 (all task branches and main at 3c47a48 merged). `npm test`: 364 tests, 363 passed, 1 skipped, 0 failed. `npm run build` passed. `npx playwright test` with the Nix Chromium: 100 passed in 3.8 minutes, then 100 passed in 3.7 minutes. `go test ./...` passed and `go vet ./...` was clean. The website build first failed for every ADD page with "Cannot read properties of undefined (reading 'id')"; origin/main at 3c47a48 failed the same way locally while its CI docs job passed; the cause was a stale webpack cache in the shared website/node_modules/.cache, and after removing it the website built for main and for this branch. validate-knowledge: 0 errors, 18 flows. The bundle files changed against main are identical in docs/artifact-driven and src/archs/artifact-driven.

Benchmark on this repository at 6970400 (`node scripts/impact-benchmark.mjs <worktree> --measure-incremental`): full index 1017 to 1044 ms (160 modules, 448 history commits), no-change update 58 to 62 ms, one changed file 35.1 ms. Direct precision and recall are 1.0 for all eight symbol-seeded cases, all 15 step checks pass, no hard negative appears, the expected unresolved items are reported, the slowest warm query is 56.1 ms, and compact answers stay within the 8000-character default budget (uncut 2637 to 15515 characters). Case C6 first showed direct precision 0.88: the change-impact flow added in this change cites change-review.js at its handoff step, a true consumer, so the fixture now expects it.

Flow records: the change-impact flow has 18 resolved supports, including implementation supports for the index, service, route, MCP tool, packet, page, subgraph and highlight, and observed test supports that point to the task evidence. The amended flows resolve their impact-contract supports. The impact service on the branch difference against main reached the six declared flows and six more; the unit flow assessment explains each of the six. The version record versions/1.18.0/README.md names source_change change-impact-intelligence and states the minor level; the identity record declares current_version 1.18.0 and package.json declares 1.18.0. Open: the owner's review of the Impact page.
