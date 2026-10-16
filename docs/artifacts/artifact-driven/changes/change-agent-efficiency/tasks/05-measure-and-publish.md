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

- [ ] Run `go test ./...`, `go vet ./...` and the website production build with locked dependencies; run the conflict benchmarks and the context-loading proxies; record outcomes without unmeasured token or latency claims.
- [ ] Record the before and after measurements in the unit brief: files and bytes under docs/artifacts and copied share, knowledge files copied by the active change, files added by the last version, and, when the Plane benchmark exists, packet size and git command count. Reference task details once.
- [ ] Validate unit membership, task and flow contracts, links, acyclicity, retained evidence and unchanged artifact dependencies with the existing readers.
- [ ] Prepare the confirmed ADD 2.4.0 as an in-place version: versions/2.4.0/README.md with source_change: change-agent-efficiency and a compatibility summary, no knowledge directories, and the identity record set to 2.4.0. Historical snapshots and retained tasks are unchanged.
- [ ] Push the dedicated branch and open or attach the repository PR according to the publication option chosen at approval; link upstream #28 and stop for team review and merge. Do not claim establishment from PR creation.

## Evidence

Not executed. Record methods, results, source references and limitations here.
