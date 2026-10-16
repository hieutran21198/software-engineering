---
id: git-baseline
depends_on: [layout-reader]
evidence_records: []
---

# Resolve the baseline and compare through Git

## Scope and ownership

Own server/change-review.js (capture, recordsFor), server/flow-reader.js (established knowledge mode), server/units-of-work.js (versionClaims, publication for in-place members), server/flow-mcp.js descriptions, test/change-review.test.js, test/review-adapters.test.js, test/flow-adapters.test.js and test/publication-review.test.js.

## Governing knowledge

L2, L4 publication part, L7, M1, M2; specifications/knowledge-layout-reading.md; specifications/evidence-and-comparison.md in-place section.

## Prerequisites

Explicit approval and the layout-reader DoD; the ADD contract established and rechecked.

## Definition of Done

- [ ] The established baseline resolves from refs/heads/main or master for both layouts, including the transition fixture where main holds versions/<current_version>/; missing refs, disagreement and shallow history keep the existing unknown diagnostics.
- [ ] Records come from `git diff --name-status` against the baseline with blob reads for modified files; classification covers added, modified, removed and unchanged; the packet lists each file once; version and change selectors on in-place artifacts return 422.
- [ ] Flow reader established mode reads in-place root knowledge from the protected ref; references and flow support are labeled proposed when the target differs from the baseline; cursors bind the baseline ref and revision.
- [ ] Publication for in-place members compares the version record, identity record and retained tasks on the protected ref; prose publication-review parsing runs only for legacy members; publication_reviews works for both.
- [ ] HTTP and MCP return the same facts; read-only containment and unchanged repository bytes are asserted.

## Evidence

Implementation has not started. Record executed commands, outcomes, sources and limitations here after approval.
