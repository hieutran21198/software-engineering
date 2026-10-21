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
        - compact-contract
        - ux-simplification-contract
        - ux-browser-checks
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - packet-format
        - http-adapter
        - mcp-adapter
        - adapter-checks
        - evidence-usability-contract
    - id: derive
      title: Derive packet facts from one validated revision
      supports:
        - delivery-support-contract
        - impact-contract
        - contract
        - review-service
        - review-interface
        - review-checks
        - browser-checks
        - packet-format
        - http-adapter
        - mcp-adapter
        - adapter-checks
        - evidence-usability-contract
        - layout-reading
        - brief-contract
        - concept-contract
        - concept-packet-checks
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
        - evidence-usability-contract
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
        - evidence-usability-contract
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
        - evidence-usability-contract
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
    - id: impact-contract
      kind: element
      artifact: artifact-plane
      element: specifications/change-impact.md
      requires: Add the tiered impact result and its coverage to the packet as additive fields.
      basis: documented
    - id: ux-browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/change-page.spec.js
      requires: Exercise the scoped user journey and its preserved evidence boundaries.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-workbench-redesign/tasks/07-browser-suites.md
    - id: ux-simplification-contract
      kind: element
      artifact: artifact-plane
      element: specifications/ux-simplification.md
      requires: Export the captured loaded records page through secondary controls
        with unchanged omission and revision limits.
      basis: documented
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
      path: apps/artifact-plane/src/pages/ChangePageReview.jsx
      requires: Present captured context, source comparisons, recovery and local exports.
      basis: static
    - id: review-checks
      kind: test
      path: apps/artifact-plane/test/change-review.test.js
      requires: Exercise comparison, evidence, impact and contained source boundaries.
      basis: static
    - id: browser-checks
      kind: test
      path: apps/artifact-plane/test/browser/change-page.spec.js
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
    - id: evidence-usability-contract
      kind: element
      artifact: artifact-plane
      element: specifications/evidence-and-comparison.md
      requires: Select comparison context and interpret evidence without inferring
        approval or publication.
      basis: documented
    - id: compact-contract
      kind: element
      artifact: artifact-plane
      element: specifications/compact-context.md
      requires: Offer bounded compact context with explicit omissions and revision-bound continuation.
      basis: documented
    - id: layout-reading
      kind: element
      artifact: artifact-plane
      element: specifications/knowledge-layout-reading.md
      requires: List each in-place knowledge file once from the Git comparison.
      basis: documented
    - id: brief-contract
      kind: element
      artifact: artifact-plane
      element: specifications/review-brief.md
      requires: Derive the change brief, the verification ladder and the claim facts from the review and impact services, and record claim checks through the operations.
      basis: documented
    - id: delivery-support-contract
      kind: element
      artifact: artifact-plane
      element: specifications/delivery-support.md
      requires: Add the PR description to the packet as data.description.
      basis: documented
    - id: concept-contract
      kind: element
      artifact: artifact-plane
      element: specifications/concept-pages.md
      requires: Define the concepts that the packet brief copies from the change brief.
      basis: documented
    - id: concept-packet-checks
      kind: test
      path: apps/artifact-plane/test/context-packet.test.js
      requires: Check that the packet brief, the brief operation and get_change_brief give the same concepts.
      basis: observed
      evidence:
        - docs/artifacts/artifact-plane/changes/change-concept-pages/tasks/08-brief-concepts.md
  gaps:
    - A captured packet cannot prove continuing freshness or authorize
      implementation.
    - The evidence-and-usability extension is specified; implementation and
      current integrated validation remain pending.
  exclusions:
    - Hosted generation, external sharing, agent launch and arbitrary file reads.
---

# Hand off source-backed change context

Tracked implementation and tests support this flow. Actual validation evidence remains in the originating delivery tasks; static support does not prove exhaustive behavior or approval.

## Simpler exploration

Export the captured loaded records page through secondary controls with unchanged omission and revision limits. The detailed contract owns behavior and recovery limits. Executed browser checks are recorded in the originating integration task. Observed fixture support does not establish a version or prove exhaustive usability coverage.
