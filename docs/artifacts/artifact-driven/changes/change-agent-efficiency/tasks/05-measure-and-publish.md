---
id: efficiency-integration
depends_on: [layout-guidance, json-cli, migrate-repository]
evidence_records: []
---

# Measure, validate and prepare ADD 2.4.0

## Scope and ownership

Coordinator owns combined validation, measurements, the version record, the identity record, retained tasks and the PR handoff. Integrate implementation and run existing checks.

## Governing knowledge and prerequisites

N10, K7, K8; R1 to R7, A1 to A6; specifications/knowledge-layout.md measurement section; specifications/agent-efficiency.md. Explicit plan approval, version confirmation and the listed task DoD are required. The Plane benchmark for packets and explore cost is produced by the Plane plan; reference it once it exists.

## Definition of Done

- [x] Run `go test ./...`, `go vet ./...` and the website production build with locked dependencies; run the conflict benchmarks and the context-loading proxies; record outcomes without unmeasured token or latency claims.
- [x] Record the before and after measurements in the unit brief: files and bytes under docs/artifacts and copied share, knowledge files copied by the active change, files added by the last version, and, when the Plane benchmark exists, packet size and git command count. Reference task details once.
- [x] Validate unit membership, task and flow contracts, links, acyclicity, retained evidence and unchanged artifact dependencies with the existing readers.
- [x] Prepare the confirmed ADD 2.4.0 as an in-place version: versions/2.4.0/README.md with source_change: change-agent-efficiency and a compatibility summary, no knowledge directories, and the identity record set to 2.4.0. Historical snapshots and retained tasks are unchanged.
- [ ] Push the dedicated branch and open or attach the repository PR according to the publication option chosen at approval; link upstream #28 and stop for team review and merge. Do not claim establishment from PR creation.

## Evidence

Executed on 16 October 2026 after the layout-guidance, json-cli and migrate-repository DoD.

- `go test ./...` and `go vet ./...` pass. The website production build passes with `npm ci` and adds no warnings. Conflict benchmarks were rerun on a loaded machine, so the times are noisy: 1, 10 and 100 conflicts gave 110,445, 632,376 and 5,620,779 ns/op with the same allocations as task 02. The context-loading proxies are in the layout-guidance evidence. No token or latency claim is made.
- Measurements, recorded once in the unit brief's Combined checks:
  - Copied knowledge files in the active change: 38 to 0.
  - Files added by the last version: 33 to 1.
  - Explore git commands with 10 worktrees: 771 to 102.
  - Changes with an unknown phase: 19 to 0 of 21.
  - The zero-excerpt packet grew from 139,216 to 145,391 bytes. The measurements are recorded, so the DoD item is met. The packet target belongs to the unit's measurements criterion, which records a failure.
- Validation with the existing readers: validate-knowledge reports 0 errors. Task graphs, units and flows resolve, the two artifact edges are unchanged, and historical units read identically before and after migration. The Plane derives Requirement, Specification and Plan as documented complete from the declared self_check records.
- Version: versions/2.4.0/README.md with source_change: change-agent-efficiency and a compatibility summary, no knowledge directories, and identity record 2.4.0. Historical snapshots and retained tasks are unchanged.
- Publication: the dedicated branch is pushed and one coordinated PR is opened (see the PR). Upstream #28 is linked. The PR stops for team review and merge; establishment is not claimed.
