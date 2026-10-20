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

- [x] The integration README section Workbench describes the start, the four lines, `ARTIFACT_PLANE_PORT`, `ARTIFACT_PLANE_AUTOSTART=0` for each harness and how to stop the server; the Plane README links to it from Run.
- [x] On the integrated branch, `npm test`, `npm run test:browser`, `go test ./...` and the executable smoke check pass (UDA8).
- [x] The first start of the built executable with an empty state directory and a second start are timed (claim start-latency).
- [x] A running Plane 1.23.1 at the port gives the unavailable line (claim plane-identity-route).
- [x] A new Claude Code session and a new Codex session in this repository with the built executable on the path show the line, and the address opens the work page of the repository; the evidence records the harness versions and what each harness shows (UDA7, claim codex-system-message).
- [x] Each claim of the specification has a status and evidence; the flow tests have basis observed with evidence.
- [x] The unit brief has evidence for each acceptance criterion, the validator reports ok true, and the version record 1.24.0 is prepared.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Documentation | integration/README.md section Workbench: the start, the four lines, both variables, how to set them, how to stop the server; the Run section of README.md links to it; `artifact-plane --help` names both variables | Passed |
| Suites (UDA8) | On the integrated branch: `npm test` 480 tests, 479 passed, 0 failed, 1 skipped; `npm run test:browser` 119 passed on the Playwright headless shell 156 (CI browser); `go test ./...` ok; `node scripts/app-smoke.mjs release/artifact-plane-linux-amd64` "All checks passed" | Passed |
| Smoke side effect | The first smoke run left a workbench on port 4310: its SessionStart check ran the hook in this checkout. scripts/app-smoke.mjs now runs the hook with `ARTIFACT_PLANE_AUTOSTART=0` at its own free port and checks that systemMessage names `artifact-plane serve`; no server remains after the run | Passed |
| Start latency | Built Linux AMD64 executable 1.24.0, private empty state directory: `serve` answered GET /api/plane after 184 ms (first start, with asset extraction) and 126 ms (second). The SessionStart hook took 977 ms (first), 820 ms (second, server started) and 887 ms (server running), each with the ready line | Passed |
| Plane 1.23.1 at the port | The 1.23.1 server of the protected commit answers GET /api/plane with 404; the 1.24.0 hook gives "Artifact Plane workbench is not available at port 4392. Run PORT=4392 artifact-plane serve to see why, or set ARTIFACT_PLANE_PORT to another port." | Passed |
| Live Claude Code | Claude Code 2.1.301, `claude -p` with stream-json hook events, in a disposable clone of this branch with the 1.24.0 executable on the path and the committed configuration: the SessionStart:startup answer holds systemMessage "Artifact Plane workbench: http://127.0.0.1:4310/?repository=<clone>" and the context line; the agent quoted the context line; GET /api/plane at 4310 answered version 1.24.0. A browser opened the address: one tab of the clone, the Current work page, no query left. The interactive display of the line is not observed in print mode | Passed with the owner look |
| Live Codex | codex-cli 0.163.0, `codex exec` in the same clone with `-c projects."<clone>".trust_level="trusted"` and `--dangerously-bypass-hook-trust`: the session loaded no project configuration (no `artifact-plane` MCP server, no hook call in a wrapper log), so the check did not reach the hook. The owner look covers Codex | Replaced by the owner look |
| Owner look (UDA7) | On 20 October 2026 the owner started an interactive Claude Code 2.1.301 session and an interactive codex-cli 0.163.0 session in the disposable clone, with the 1.24.0 executable on the path, and confirmed that each showed the workbench line and that the address opened the repository ("confirmed") | Passed |
| Claims and flows | The six claims of specifications/ui-discovery.md are verified with evidence; workbench-tests and address-checks of the two flows have basis observed with evidence | Passed |
| Unit and version | The unit brief has a passed evidence entry for each acceptance criterion; the validator reports ok true for the change; versions/1.24.0 names change-ui-discovery, current_version and package.json are 1.24.0 | Passed |
| Merge of main (Nix packages, 1.23.1 package version) | After the merge of origin/main the package version stays 1.24.0 and `check-release-version.mjs plane-v1.24.0` passes. The version bump changes the npm dependency hash of the Nix package; nix/lib/npm-deps.nix takes the value of `prefetch-npm-deps` for the 1.24.0 lockfile, and `nix build .#checks.x86_64-linux.packages` passes ("PASS: adoption, embedded validator, CLI, native modules, HTTP assets and MCP handshake"). `npm test` 479 passed, 1 skipped; the validator reports ok true | Passed |
