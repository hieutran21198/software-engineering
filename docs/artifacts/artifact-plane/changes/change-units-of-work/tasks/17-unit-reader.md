---
id: unit-reader
depends_on: []
---

# Read unit knowledge and derive establishment evidence

## Scope and location

apps/artifact-plane/server/reader.js, workflow.js; plain unit parser module; existing src/model.js; reader/model tests. Work only on this task's scope; preserve unrelated edits. The coordinator controls artifact and shared brief updates.

## Governing knowledge

- Requirements
- Specification

## Prerequisites

All Plane implementation waits for artifact-driven/change-units-of-work to establish. Recheck specifications/units-of-work.md against the owning artifact current established version before execution. Renew approval for material differences. The existing artifact-plane dependency on artifact-driven remains unchanged.

Internal prerequisites must satisfy applicable DoD before this task starts.

## Definition of Done

- [x] Exclude units-of-work from artifact nodes and read briefs/provenance/evidence safely for each worktree.
- [x] Produce additive unit records and diagnose duplicate membership, malformed metadata, unsafe paths, and missing sources.
- [x] Resolve delivered historical versions independently of the current version and retain legacy behavior.
- [x] Derive completion with documented-evidence labels and uncertainty when publication or implementation merge evidence is unavailable.
- [x] Test branch-only and main/master publication, removed retained changes, newer artifact versions, failed/incomplete shared checks, and read-only fingerprints.

## Evidence

Reader/API cases passed in the focused 27-test run and the integrated 86-test regression suite. Fixtures verify published/branch-only/unknown/conflicting protected refs, historical provenance, removed change directories, newer versions, duplicate membership, unsafe/missing evidence, legacy compatibility, worktree isolation, and repository/Git fingerprints. The API response adds unitsOfWork without changing legacy fields.

Commands: node --test test/units-of-work.test.js test/unit-graphs.test.js test/http.test.js and npm test in apps/artifact-plane. Git fixture subprocesses required sandbox escalation. Initial fixture-directory/API expectation failures were corrected and rerun successfully. ADD 1.2.0 established after PR #10 and the contract recheck passed. KISS reuses existing safe scanning, YAML, task graphs, and workflow evidence; STE preserves unknown/proposed/established distinctions. Self-check passed.
