---
id: record-checks
depends_on: [readers]
---

# Record checks

## Scope and ownership

Implementer, `apps/artifact-plane/server/record-checks.js`. Implement source-unresolved, link-broken (ignoring code spans and fences), placeholder-text, version-identity-mismatch, version-number-invalid, upstream-unestablished, requirement-ids-missing, covers-unknown-id, requirement-uncovered and open-change-conflict, using local Git refs only. Readers, the validator entry point and the review service call this module.

## Governing knowledge

specifications/delivery-support.md (Shared checks); artifact-driven specifications/record-checks.md (Checks); requirements/delivery-improvements.md, PI2 and PA1.

## Prerequisites

Task readers.

## Definition of Done

- [ ] A fixture repository has one seeded defect for each code of the Checks table and a clean variant; tests assert the code, severity and path of each diagnostic and no diagnostic on the clean variant.
- [ ] The diagnostics appear in the knowledge views where readers show diagnostics today.
- [ ] `npm test` passes, and existing tests pass without edits.

## Evidence

Not recorded.
