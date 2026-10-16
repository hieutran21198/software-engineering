---
id: completion-feedback
depends_on: []
---

# Remove redundant completion status

## Scope and ownership

Own UnitsOfWork.jsx and focused completion presentation checks. Governs C3/C4. Preserve evidence derivation and distinct reasons. Preserve unrelated edits; other contributors can be present.

## Definition of Done

- [x] Unloaded feedback appears once; meaningful additional reasons, loading/errors and loaded evidence remain, with a visible action/status gap.

## Evidence

Three focused browser checks pass. The unloaded summary appears once; only an exact equivalent boilerplate reason, with optional final period, is omitted while derivation is not-loaded. A different reason containing the same phrase remains visible. The rendered failure/retry case preserves the error, then loads documented completion successfully. Wide/narrow screenshots and measured action/status gaps confirm spacing. Completion derivation, source evidence and backend logic are unchanged.
