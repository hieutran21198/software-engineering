---
id: json-cli
depends_on: [adoption-preflight]
evidence_records: []
---

# Add optional structured adoption results

## Scope and ownership

Implementer owns cmd/se-adopt/main.go and main_test.go. Coordinator updates the
canonical/embedded adoption guide consistently with the delivered CLI.

## Governing knowledge and prerequisites

R1-R2/A1-A2; specifications/agent-efficiency.md and delivery.md. Explicit approval
and adoption-preflight DoD are required. No new upstream artifact prerequisite.

## Definition of Done

- [ ] --json success, preview, list, aggregate conflicts, malformed arguments and fatal errors produce the specified single parseable result and compatible exit status; no duplicate human output appears.
- [ ] Test flag order, --json=true/false, repeats, unknown flags, invalid architecture, explicit empty output and help exception. Failed preflight never reports pending files as created.
- [ ] Default successful output remains compatible; human errors list every safe conflict and indicate incomplete inventories. Existing CLI and Story-driven adoption tests pass.
- [ ] Update CLI/adoption examples and bundled parity. Validate no overwrite or unsupported automatic upgrade/setup claim is introduced.

## Evidence

Not executed. Record methods, results, source references and limitations here.
