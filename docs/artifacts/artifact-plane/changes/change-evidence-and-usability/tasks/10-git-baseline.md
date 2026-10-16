---
id: git-baseline
depends_on: [layout-reader]
evidence_records:
  - id: dod
    method: npm test with review, publication and flow adapter cases recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-evidence-and-usability/tasks/10-git-baseline.md#evidence
---

# Resolve the baseline and compare through Git

## Scope and ownership

Own server/change-review.js (capture, recordsFor), server/flow-reader.js (established knowledge mode), server/units-of-work.js (versionClaims, publication for in-place members), server/flow-mcp.js descriptions, test/change-review.test.js, test/review-adapters.test.js, test/flow-adapters.test.js and test/publication-review.test.js.

## Governing knowledge

L2, L4 publication part, L7, M1, M2; specifications/knowledge-layout-reading.md; specifications/evidence-and-comparison.md in-place section.

## Prerequisites

Explicit approval and the layout-reader DoD; the ADD contract established and rechecked.

## Definition of Done

- [x] The established baseline resolves from refs/heads/main or master for both layouts, including the transition fixture where main holds versions/<current_version>/; missing refs, disagreement and shallow history keep the existing unknown diagnostics.
- [x] Records come from `git diff --name-status` against the baseline with blob reads for modified files; classification covers added, modified, removed and unchanged; the packet lists each file once; version and change selectors on in-place artifacts return 422.
- [x] Flow reader established mode reads in-place root knowledge from the protected ref; references and flow support are labeled proposed when the target differs from the baseline; cursors bind the baseline ref and revision.
- [x] Publication for in-place members compares the version record, identity record and retained tasks on the protected ref; prose publication-review parsing runs only for legacy members; publication_reviews works for both.
- [x] HTTP and MCP return the same facts; read-only containment and unchanged repository bytes are asserted.

## Evidence

Executed on 16 October 2026 after the layout-reader DoD.

- Baseline: server/knowledge-baseline.js resolves refs/heads/main and refs/heads/master, requires both to agree for the artifact, and reads the in-place root tree or, in a transition, versions/<current_version>/ of the legacy ref. Missing refs give missing-protected-ref, disagreement gives baseline-disagreement, and an invalid protected identity gives unavailable-baseline.
- Comparison: the reader classifies files by comparing working blob IDs with the protected `ls-tree` entries instead of `git diff --name-status`. The result is the same added, modified, unchanged and removed classification, and it also covers untracked new knowledge files, which `git diff <ref>` omits. Blob text is read only for modified and removed files.
- server/change-review.js: in-place capture uses baseline kind protected-ref with ref, revision, baselineLayout and version. Records list each path once: unchanged records have no baseline pointer, and baseline sources use `<branch>:<path>` keys. The baseline projection replaces proposed bytes with protected bytes. The revision hash includes the baseline, so cursors bind the ref and revision. The review API has no version or baseline-change selector; the change field is the review scope. So no in-place selector exists to reject with 422. This is a recorded deviation, not an omitted check.
- server/flow-reader.js: established mode replaces in-place working knowledge with the protected tree, through one cat-file batch session. server/flow-model.js selects working flows for in-place owners, and element support carries targetLabel proposed or established from the target's bytes.
- server/units-of-work.js: in-place delivery resolves to the retained change tasks. Publication compares the version record and retained tasks with the protected refs and adds the version snapshot commit. Structured publication_reviews are validated for both layouts, and an invalid list never falls back to prose. Prose publication review applies to legacy members only.
- server/flow-mcp.js: the get_change_review description names both baselines.
- Tests: test/change-review.test.js has in-place records, source paging of baseline text, a transition and a missing ref. test/publication-review.test.js has unverified, established with snapshot commit, invalid and unresolvable reviews, and a shallow clone. test/flow-adapters.test.js checks HTTP and MCP parity for established and planning in-place flows with targetLabel and unchanged repository bytes. The existing review-adapters parity tests pass.
- `npm test`: all tests pass except the unrelated test/code-highlight.test.js failure that also occurs on main.
