---
id: validation
depends_on: [guidance]
evidence_records: []
---

# Validate the combined change

## Scope and ownership

Coordinator. Repository: this repository. Read-only checks over both bundle copies, the Go module, the website and the project knowledge. Fixes for failed checks return to task guidance.

## Governing knowledge

G4 and AG1–AG4 in requirements/adoption-guidance.md; Consistency and checks in specifications/adoption-guidance.md; the unit brief acceptance criteria of adoption-guidance.

## Prerequisites

Task guidance meets its DoD. Explicit user approval of this plan.

## Definition of Done

- [ ] AG1: a search over both bundle copies finds download, checksum and se-adopt command blocks only in 05-adoption/README.md, the agent-ready request once, and the full harness setup rules once.
- [ ] AG2: a search finds no fixed past tag used as a default. The Linux script, run on this machine with `release` empty, prints the latest tag, downloads the matching asset and passes checksum verification; with `release` set to an existing tag, it uses that tag. The Windows script runs in PowerShell if one is available; otherwise its review is static and the limitation is recorded.
- [ ] AG3 and AG4: every relative link in both bundle copies resolves, the new and changed links do not point to the bundle README or the repository overview, and the repository overview link to #download-the-binary still resolves.
- [ ] AG4: `diff -r docs/artifact-driven src/archs/artifact-driven` shows only the Go files and required-skills; `go test ./...` and `go vet ./...` pass; the website build passes; validate-knowledge reports no errors.

## Evidence

Implementation has not started.
