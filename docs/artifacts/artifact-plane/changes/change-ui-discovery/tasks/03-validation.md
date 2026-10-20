---
id: validation
depends_on: [workbench-step, repository-address]
covers:
  - element: requirements/ui-discovery.md
    ids: [UD9, UD11, UDA7, UDA8]
---

# Validation

## Scope and ownership

Coordinator. `apps/artifact-plane/integration/README.md` (section Workbench), `apps/artifact-plane/README.md` (link from Run), the claims of specifications/ui-discovery.md, the flow records, the unit brief evidence, the version record and the package version.

## Governing knowledge

specifications/ui-discovery.md: all sections; units-of-work/plane-ui-discovery/README.md: acceptance.

## Definition of Done

- [ ] The integration README section Workbench describes the start, the four lines, `ARTIFACT_PLANE_PORT`, `ARTIFACT_PLANE_AUTOSTART=0` for each harness and how to stop the server; the Plane README links to it from Run.
- [ ] On the integrated branch, `npm test`, `npm run test:browser`, `go test ./...` and the executable smoke check pass (UDA8).
- [ ] The first start of the built executable with an empty state directory and a second start are timed (claim start-latency).
- [ ] A running Plane 1.23.1 at the port gives the unavailable line (claim plane-identity-route).
- [ ] A new Claude Code session and a new Codex session in this repository with the built executable on the path show the line, and the address opens the work page of the repository; the evidence records the harness versions and what each harness shows (UDA7, claim codex-system-message).
- [ ] Each claim of the specification has a status and evidence; the flow tests have basis observed with evidence.
- [ ] The unit brief has evidence for each acceptance criterion, the validator reports ok true, and the version record 1.24.0 is prepared.

## Evidence
