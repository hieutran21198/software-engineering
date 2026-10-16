---
id: json-cli
depends_on: [adoption-preflight]
evidence_records:
  - id: dod
    method: CLI tests and built-binary smoke test recorded in Evidence.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-agent-efficiency/tasks/03-json-cli.md#evidence
---

# Add optional structured adoption results

## Scope and ownership

Implementer owns cmd/se-adopt/main.go and main_test.go. Coordinator updates the
canonical/embedded adoption guide consistently with the delivered CLI.

## Governing knowledge and prerequisites

R1-R2/A1-A2; specifications/agent-efficiency.md and delivery.md. Explicit approval
and adoption-preflight DoD are required. No new upstream artifact prerequisite.

## Definition of Done

- [x] --json success, preview, list, aggregate conflicts, malformed arguments and fatal errors produce the specified single parseable result and compatible exit status; no duplicate human output appears.
- [x] Test flag order, --json=true/false, repeats, unknown flags, invalid architecture, explicit empty output and help exception. Failed preflight never reports pending files as created.
- [x] Default successful output remains compatible; human errors list every safe conflict and indicate incomplete inventories. Existing CLI and Story-driven adoption tests pass.
- [x] Update CLI/adoption examples and bundled parity. Validate no overwrite or unsupported automatic upgrade/setup claim is introduced.

## Evidence

Implemented on 16 October 2026 with the adoption-preflight task and integrated in the same commit.

- cmd/se-adopt/main.go: `--json` writes one se-adopt.result.v1 object (schema, operation list, preview or adopt, ok, architecture, destination, created, unchanged, diagnostics, complete, error with code, message and action, and architectures for list). Error codes: invalid-arguments, unsupported-architecture, destination-conflict, preflight-failed and write-failed. A failed operation reports created 0. `--json` and `--json=true` are detected before flag parsing, so parse errors are also JSON; `--json=false` gives text; a repeated `--json` is rejected; JSON mode writes nothing to standard error; `--help` stays text with exit 0.
- cmd/se-adopt/main_test.go: JSON preview, adopt, repeat and list; JSON and text conflict output with the same codes, paths and actions; ten argument and flag-form cases; `--json=false`; `--output --json` taken as a value; help with `--json`. Default successful output is unchanged; text errors list every conflict and mark an incomplete inventory.
- Smoke test with the built binary: `--dry-run --json` on an empty workspace gave ok true, created 42; two edited files gave "2 destination conflicts; no files were written" with both paths and exit status 1.
- 05-adoption/README.md (canonical and embedded) documents the aggregate conflict list and `--json` with one example; bundle parity passed. No overwrite, automatic upgrade or setup claim is added.
