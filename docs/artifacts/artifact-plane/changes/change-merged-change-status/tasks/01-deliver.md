---
id: deliver
depends_on: []
covers:
  - element: requirements/knowledge-layout.md
    ids: [L3]
  - element: requirements/delivery-improvements.md
    ids: [PI5]
  - element: requirements/authoring-workbench.md
    ids: [W10]
---

# Deliver the merged change status

## Scope and location

apps/artifact-plane/server/knowledge-baseline.js, server/workflow.js, server/tier-check.js, src/pages/ChangePageReview.jsx and their Node tests.

## Definition of Done

- [x] The protected baseline lists `changeRecords`, the change names whose README is on the protected tree.
- [x] A change whose README is on the protected branch reads Requirement and Specification from the self_check records of every working requirement, specification and decision document of the artifact, and carries `merged: true`.
- [x] For such a change without a file of its artifact in the difference, the tier check reports one-artifact, no-contract, code-limit and impact-contained as unresolved with the specified detail; the standalone validator keeps coordinator for impact-contained.
- [x] code-limit counts no Markdown file.
- [x] Changed knowledge of a merged change without differing knowledge says "The knowledge of this change is already on main."
- [x] Node tests show each rule on a fixture where the change is merged to main, and the existing tier cases keep their results.
- [x] npm test passes, and the validator reports ok true for this change.
- [x] On this repository, get_change_status for nix-packages/change-initial on main names Implementation, and a screenshot of its change page shows the met self-check item, the unresolved criteria and the new Changed knowledge text.

## Evidence

Implementation commit ce95c03: 53 changed code and test lines.

Ran node --test test/tier-check.test.js test/workflow.test.js test/change-status.test.js: 24 passed. The new tests "a change merged to main: the criteria that use the difference are unresolved, and no impact query runs", "code-limit counts no Markdown file" and "L3: a change whose README is on main reads the self-checks of its committed documents" pass. The existing tier cases keep their results. HG4-HG6 covers a branch that continues a change whose README is on main with knowledge edits: its difference criteria stay decided.

Ran npm test: 516 tests, 515 passed, 0 failed, 1 skipped.

Ran node scripts/validate-knowledge.mjs --repository ../.. --change artifact-plane/change-merged-change-status: ok true, allowed tier small, two open-change-conflict warnings for the local branches claude/plane-ci-browser and claude/plane-delivery-support. On the whole repository: ok true, zero errors.

Live check on this repository at main 03b2984 with the code of this branch: the declared evidence of nix-packages/change-initial has merged true, Requirement, Specification and Plan documented-complete, current step Implementation, and the status "Implementation: Complete the Definition of Done items and record evidence." The validator for nix-packages/change-initial reports one-artifact, no-contract and code-limit unresolved with the merged detail; before the change it reported one-artifact pass, no-contract pass and code-limit fail with 908 lines.

Version preparation: package.json and package-lock.json give 1.26.1, and nix/lib/npm-deps.nix has the new npm dependency hash. Ran nix build .#checks.x86_64-linux.packages: package-smoke passed (adoption, embedded validator, CLI, native modules, HTTP assets and MCP handshake); the built artifact-plane --version printed 1.26.1.

Screenshots at 1440 pixels of the change page of nix-packages/change-initial on main, served by this branch: the stepper marks Requirement, Specification and Plan done and Implementation current; Changed knowledge says "The knowledge of this change is already on main."; Ready for a version marks the self-check item met and keeps the open DoD item and the protected branch item; the PR description table shows one-artifact, no-contract, code-limit and impact-contained unresolved with the merged detail.
