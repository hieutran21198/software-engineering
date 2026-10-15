---
flow:
  id: context-handoff
  artifact: artifact-plane
  title: Hand off source-backed change context
  trigger: A person exports context or a configured agent requests its packet.
  outcome: The receiver obtains bounded captured knowledge, impact reasons,
    evidence limits and safe continuation selectors.
  entry_steps:
    - request
  steps:
    - id: request
      title: Select a permitted context and excerpt budget
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - packet-format
        - http-adapter
        - mcp-adapter
        - adapter-checks
    - id: derive
      title: Derive packet facts from one validated revision
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - packet-format
        - http-adapter
        - mcp-adapter
        - adapter-checks
    - id: deliver
      title: Copy or download locally, or return through configured MCP
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - packet-format
        - http-adapter
        - mcp-adapter
        - adapter-checks
    - id: continue
      title: Read omitted registered source text at the same revision
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - packet-format
        - http-adapter
        - mcp-adapter
        - adapter-checks
    - id: recover
      title: Disclose stale or partial evidence and retry safely
      supports:
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - packet-format
        - http-adapter
        - mcp-adapter
        - adapter-checks
  transitions:
    - from: request
      to: derive
    - from: derive
      to: deliver
    - from: deliver
      to: continue
    - from: continue
      to: recover
    - from: recover
      to: request
      condition: The source selection changes or a stale/error reply requires a new read.
  support:
    - id: contract
      kind: element
      artifact: artifact-plane
      element: specifications/context-packets.md
      requires: Define safe source context, evidence limits, revision recovery and
        read-only behavior.
      basis: documented
    - id: review-service
      kind: implementation
      path: apps/artifact-plane/server/change-review.js
      requires: Derive safe comparison, explicit impact and revision-bound source
        context.
      basis: static
    - id: review-interface
      kind: implementation
      path: apps/artifact-plane/src/ChangeReview.jsx
      requires: Present captured context, source comparisons, recovery and local exports.
      basis: static
    - id: review-checks
      kind: test
      path: apps/artifact-plane/test/change-review.test.js
      requires: Exercise comparison, evidence, impact and contained source boundaries.
      basis: static
    - id: browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/change-review.spec.js
      requires: Exercise review navigation, exports, refresh and delayed replies.
      basis: static
    - id: packet-format
      kind: implementation
      path: apps/artifact-plane/src/context-packet.js
      requires: Format equivalent captured facts as inert Markdown.
      basis: static
    - id: http-adapter
      kind: implementation
      path: apps/artifact-plane/server/http.js
      requires: Enforce local HTTP guards and expose the shared query.
      basis: static
    - id: mcp-adapter
      kind: implementation
      path: apps/artifact-plane/server/flow-mcp.js
      requires: Expose additive read-only tools through configured roots.
      basis: static
    - id: adapter-checks
      kind: test
      path: apps/artifact-plane/test/review-adapters.test.js
      requires: Check actual HTTP/stdio parity, paging, stale revisions and repository
        fingerprints.
      basis: static
  gaps:
    - A captured packet cannot prove continuing freshness or authorize
      implementation.
  exclusions:
    - Hosted generation, external sharing, agent launch and arbitrary file reads.
---

# Hand off source-backed change context

Tracked implementation and tests support this flow. Actual validation evidence remains in the originating delivery tasks; static support does not prove exhaustive behavior or approval.
