---
id: reply-guard
depends_on: []
---

# Guard JSON replies so a failure cannot stop the server

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files: apps/artifact-plane/server/http.js (`json()` and the request catch block) and apps/artifact-plane/test/http.test.js (one new test).

## Governing knowledge

R12 in requirements/live-reload.md; Runtime and opening in specifications/explorer.md.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [ ] `json()` serializes the body before it writes the headers.
- [ ] The request catch block closes the connection when the headers are already sent, and otherwise sends the sanitized error reply.
- [ ] A node test injects a flow service whose reply cannot be serialized: the request receives a 500 reply, and a later request on the same server receives its normal answer.
- [ ] On a private server copy, `POST /api/explore` for this repository does not stop the process, and the next request answers.

## Evidence

Implementation has not started.
