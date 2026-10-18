---
id: validation
depends_on: [guidance]
evidence_records:
  - id: dod
    method: Searches, live script runs on Linux and in PowerShell 7.6.6, link check, diff, Go tests and vet, website build and validate-knowledge.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-adoption-guidance/tasks/02-validation.md#evidence
---

# Validate the combined change

## Scope and ownership

Coordinator. Repository: this repository. Read-only checks over both bundle copies, the Go module, the website and the project knowledge. Fixes for failed checks return to task guidance.

## Governing knowledge

G4 and AG1–AG4 in requirements/adoption-guidance.md; Consistency and checks in specifications/adoption-guidance.md; the unit brief acceptance criteria of adoption-guidance.

## Prerequisites

Task guidance meets its DoD. Explicit user approval of this plan.

## Definition of Done

- [x] AG1: a search over both bundle copies finds download, checksum and se-adopt command blocks only in 05-adoption/README.md, the agent-ready request once, and the full harness setup rules once.
- [x] AG2: a search finds no fixed past tag used as a default. The Linux script, run on this machine with `release` empty, prints the latest tag, downloads the matching asset and passes checksum verification; with `release` set to an existing tag, it uses that tag. The Windows script runs in PowerShell if one is available; otherwise its review is static and the limitation is recorded.
- [x] AG3 and AG4: every relative link in both bundle copies resolves, the new and changed links do not point to the bundle README or the repository overview, and the repository overview link to #download-the-binary still resolves.
- [x] AG4: `diff -r docs/artifact-driven src/archs/artifact-driven` shows only the Go files and required-skills; `go test ./...` and `go vet ./...` pass; the website build passes; validate-knowledge reports no errors.

## Evidence

Executed on 18 October 2026 on the combined branch.

- AG1: an awk search for se-adopt, sha256sum, SHA256SUMS, Get-FileHash and curl inside fenced blocks finds command blocks only in 05-adoption/README.md. The two other hits are prose lines of the agent request in adopting-from-git.md. The request text occurs once per bundle copy, and the harness instruction rule ("Add concise ADD instructions to the applicable existing") occurs only in working-with-ai.md.
- AG2: a search for `v<major>.<minor>.<patch>` in both bundle copies finds nothing.
  - Linux: the script was extracted from the guide and run with bash. With `release` empty it printed `Using release v2.0.0`, downloaded se-adopt-linux-amd64, reported `se-adopt-linux-amd64: OK`, and `./se-adopt --list` listed artifact-driven and story-driven. With `release=v2.0.0` the result was the same. With `release=nope` it printed `Could not resolve a release tag.`
  - Old example: with `release=v1.1.0`, both downloads returned 404 and no binary ran. `gh release view v1.1.0` reports "release not found": the tag exists, but it has no published release, so the old example never worked.
  - Windows: the script was run with pwsh 7.6.6 from nixpkgs on Linux. The final `.\se-adopt.exe --list` line was replaced by a print, because the Windows binary cannot run here. With an empty tag and with v2.0.0, the script printed `Using release v2.0.0` and passed the hash comparison; with `nope` it threw `Could not resolve a release tag.` Windows PowerShell 5.1 (the ResponseUri branch) was not available and was reviewed statically only.
- AG3 and AG4: a Node link check over both bundle copies resolved 226 relative links and their anchors with 0 problems; no page below the bundle root links to the bundle README. The repository overview link to 05-adoption/README.md#download-the-binary resolves.
- AG4: `diff -rq docs/artifact-driven src/archs/artifact-driven` lists only bundle.go, bundle_test.go and required-skills. `go test ./...` passed (cmd/se-adopt, internal/adopt, src/archs/artifact-driven, src/archs/story-driven), and `go vet ./...` passed. `npm run build` in website generated the static files. validate-knowledge reports 0 errors and 1 existing info diagnostic (retained-legacy-change in artifact-plane).
