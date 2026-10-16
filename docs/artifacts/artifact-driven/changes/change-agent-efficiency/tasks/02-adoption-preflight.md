---
id: adoption-preflight
depends_on: []
evidence_records: []
---

# Collect adoption conflicts in one safe preflight

## Scope and ownership

Implementer owns internal/adopt/adopt.go and adopt_test.go. Keep existing Copy
callers and copy/write behavior source-compatible.

## Governing knowledge and prerequisites

R1-R2/A1-A2/A6; specifications/agent-efficiency.md adoption diagnostics.
Explicit approval; no new upstream artifact prerequisite.

## Definition of Done

- [ ] Return stable typed aggregate diagnostics for multiple independent content/type conflicts; deduplicate blocked parents without reading unsafe descendants.
- [ ] Test missing/identical/differing files, blocked parent, symlinks, fatal unreadable/invalid bundle input and incomplete inventory; preserve all consumer bytes and create no files on any preflight error.
- [ ] Existing dry-run/repeat/architecture, exclusive-create and failure-safety regressions pass; no stronger transaction guarantee is claimed.
- [ ] Add reproducible Go benchmarks for 1,10,100 conflicts with ReportAllocs. Assert one inventory call reports N independent conflicts. Compare repair/discovery attempts with the first-conflict baseline; report time without a speed threshold.

## Evidence

Not executed. Record methods, results, source references and limitations here.
