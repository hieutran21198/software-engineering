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

- [x] Return stable typed aggregate diagnostics for multiple independent content/type conflicts; deduplicate blocked parents without reading unsafe descendants.
- [x] Test missing/identical/differing files, blocked parent, symlinks, fatal unreadable/invalid bundle input and incomplete inventory; preserve all consumer bytes and create no files on any preflight error.
- [x] Existing dry-run/repeat/architecture, exclusive-create and failure-safety regressions pass; no stronger transaction guarantee is claimed.
- [x] Add reproducible Go benchmarks for 1,10,100 conflicts with ReportAllocs. Assert one inventory call reports N independent conflicts. Compare repair/discovery attempts with the first-conflict baseline; report time without a speed threshold.

## Evidence

Implemented on 16 October 2026 in a separate worktree by an implementer session and integrated as commit "feat(adopt): report adoption conflicts together and add --json results".

- internal/adopt/adopt.go: Result gains Diagnostics (sorted by path, then code) and Complete. Diagnostic{Code, Path, Message, Action} uses the codes content-conflict, destination-type and parent-type; ConflictError lists all conflicts of one complete preflight; ErrWrite marks write-phase failures only. Parents are checked from the workspace root down and the walk stops at the first missing or non-directory entry, so it never resolves through a file or symlink; a blocked parent is reported once and its descendants are not read. Fatal bundle or read errors return the collected diagnostics with Complete false and write nothing. Copy keeps its signature, exclusive creation and rollback.
- internal/adopt/adopt_test.go: two conflicts in a repeatable order with unchanged workspace bytes; a blocked parent with three descendants plus a directory-as-file and a content conflict; symlinked parent and file with an unchanged target; invalid bundle entry, unreadable bundle input and unreadable destination; the ErrWrite marker. Existing dry-run, repeat, architecture, exclusive-create and failure-safety tests pass.
- TestOneInventoryReportsIndependentConflicts: one inventory call reports N conflicts. Runs needed to discover all conflicts: 1, 10 and 100 conflicts need 2 runs each with aggregation, against 2, 11 and 101 with the first-conflict baseline.
- `go test -run '^$' -bench . -benchmem ./internal/adopt/` (AMD Ryzen 7 5800X, time recorded without a threshold): conflicts=1 56,410 ns/op, 4,760 B/op, 91 allocs/op; conflicts=10 390,120 ns/op, 32,128 B/op, 515 allocs/op; conflicts=100 3,800,196 ns/op, 307,570 B/op, 4,592 allocs/op.
- `go test ./...`, `go vet ./...` and `gofmt -l .` passed on the integrated branch. Deviation: write-phase error messages now start with "write failed after preflight: " so callers can tell write failures from preflight failures. No stronger transaction guarantee is claimed.
