---
id: validation
depends_on: [runbook-guide, rule-guidance]
covers:
  - element: requirements/runbooks.md
    ids: [RA4, RA5]
---

# Validation

## Scope and location

Coordinator, as implementer. A replay of the runbooks against this repository and a disposable clone, the bundle checks, the claim statuses of specifications/runbooks.md, the unit evidence and the version record.

## Definition of Done

- [ ] Replay: after-merge against the merge of #45 and the release plane-v1.23.0; amendment against the task 04 DoD and the refuted claim of change-agent-integration of Artifact Plane; live-check against its live check; failed-check against CI run 39255201333. Each replay names the runbook steps that cover what the coordinator did, and any step that was missing.
- [ ] In a disposable clone with a local `main`: renumber with a moved `main`, stop with a withdrawn test change, and reverse with a reversal of a test version give a validator result with no version or retention diagnostic; the reversed version record and change directory stay byte-identical. The claims stopped-change-no-record and reversal-is-new-change record the result.
- [ ] Every relative link of the changed pages resolves and no changed page links a parent page; `go test ./...` passes; `npm run build` in website exits 0; the validator reports `ok: true` for the change and no new diagnostic on the repository.
- [ ] The unit brief has evidence for each criterion, the version record and the identity record are prepared, and the PR is open for team review.

## Evidence

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
