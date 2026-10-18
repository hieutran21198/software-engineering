---
id: reply-guard
depends_on: []
evidence_records:
  - id: dod
    method: New http.test.js test with an unserializable flow reply, run on the fix and on the 1.18.0 http.js; /api/explore on a private server copy.
    result: passed
    source: docs/artifacts/artifact-plane/changes/change-hidden-tab-streams/tasks/02-reply-guard.md#evidence
---

# Guard JSON replies so a failure cannot stop the server

## Scope and ownership

Coordinator, as implementer. Repository: this repository. Files: apps/artifact-plane/server/http.js (`json()` and the request catch block) and apps/artifact-plane/test/http.test.js (one new test).

## Governing knowledge

R12 in requirements/live-reload.md; Runtime and opening in specifications/explorer.md.

## Prerequisites

Explicit user approval of this plan.

## Definition of Done

- [x] `json()` serializes the body before it writes the headers.
- [x] The request catch block closes the connection when the headers are already sent, and otherwise sends the sanitized error reply.
- [x] A node test injects a flow service whose reply cannot be serialized: the request receives a 500 reply, and a later request on the same server receives its normal answer.
- [x] On a private server copy, `POST /api/explore` for this repository does not stop the process, and the next request answers.

## Evidence

Executed on 18 October 2026 after the owner approved the plan.

- server/http.js: `json()` serializes the body before `writeHead`. The request catch block calls `res.destroy()` and returns when `res.headersSent` is true; otherwise it sends the sanitized error reply as before.
- "a reply that cannot be serialized returns 500 and the server keeps answering" passed: an injected flow service returns a BigInt first, and the request receives 500 with "The repository could not be explored."; the next request receives 200 and its normal body. Each request has a 5-second abort.
- Negative control: with the 1.18.0 http.js, the first request never received an answer, so the test stopped only when it was killed. The 5-second abort was added so that this failure ends the test quickly. The fix was then restored.
- Private server copy on port 4321 with a private state directory: `POST /api/explore` for this repository returned 500 after 14.6 seconds, the process stayed alive, and the next document read returned 200 in 0.37 seconds. Before the fix, the same request stopped the process with `ERR_HTTP_HEADERS_SENT`.
- Limit: the `/api/explore` reply for this repository is still too large to serialize. The UI does not call this route; its size is out of scope.
