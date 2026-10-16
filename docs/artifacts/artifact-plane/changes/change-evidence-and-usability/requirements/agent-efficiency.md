# Bounded agent context retrieval

## Need and observed behavior

Agents need a small, source-backed starting packet with a clear way to retrieve omitted facts. The current change-context packet limits excerpt text, but still includes repeated source descriptors and other metadata outside that limit. On the audited Plane change, a zero-excerpt request produced about 151,688 JSON characters, 193,284 Markdown characters and 176 source descriptors. These observations describe that fixture, not a universal packet size or measured model token count.

## Requirements

- R1: Offer an opt-in compact mode for the existing read-only change-context retrieval through HTTP and configured MCP. Keep the default v1 behavior compatible. Compact mode uses the existing service and registered source retrieval rather than a parallel context service. No UI change or compact UI export is required.
- R2: Apply the caller's supported compact response budget to the complete serialized response in UTF-8 bytes, including metadata, diagnostics, omission information and continuation selectors. A response must not silently exceed its accepted budget or return truncated invalid JSON. An unsupported budget produces a clear bounded diagnostic instead of pretending that a complete packet fits.
- R3: A compact packet identifies its repository/worktree/change and revision, selected baseline, comparison scope, key change facts, evidence limits and safe next actions. It makes omitted categories and counts explicit. If not all relevant records or sources fit, the receiver can continue retrieval using existing safe selectors at the captured revision. Omission never implies that a fact or dependency does not exist.
- R4: Compact output preserves distinctions between recorded evidence, independently verified facts and unavailable proof. Missing approval, upstream establishment, source freshness or publication proof remains visible. Compact output cannot authorize work or claim exhaustive impact coverage.
- R5: Preserve configured-root boundaries, source containment, read-only Git/filesystem behavior, revision checks and isolation between projects, worktrees and changes. Source edits invalidate continuation when required by the existing consistency contract. Recovery identifies a safe reread action; it never joins different revisions silently.
- R6: Existing comparison, evidence, model explanation, refresh and usability work in this change remains authoritative and retains its scope. The compact extension must not duplicate that work, create new membership, or change artifact/task dependency semantics.

## Acceptance criteria

- A1: A large change with many unchanged sources returns valid compact JSON within each accepted response budget. Measure the complete serialized UTF-8 response, including multibyte source text and diagnostic-heavy cases. Omitted records and safe continuation remain explicit.
- A2: HTTP and configured MCP return equivalent compact facts and limits for the same revision and request. Include transport-owned structured metadata in the defined budget where it contributes to the returned context; state any transport framing excluded from measurement. Default requests preserve v1 output behavior and existing clients/tests remain compatible.
- A3: Following continuation reconstructs the safely retrievable omitted information without silent loss or duplicate-page ambiguity. Changed revisions, invalid or cross-context selectors and unsafe sources return actionable failures. A compact budget too small for the required minimum is rejected clearly.
- A4: Compact packets retain the evidence/approval/publication limitations and explicit relationship coverage. A missing or omitted source cannot become a positive readiness, compatibility or establishment claim.
- A5: A repeatable benchmark records full default and compact response bytes for the audited representative change, the accepted compact budget and continuation cost. Demonstrate a material reduction for the initial agent read without claiming lower model token usage from character count alone.

## Impact and self-check

The context-handoff journey and its HTTP/MCP adapters are affected. Existing review, source-retrieval and evidence contracts must be checked for compatible continuation and revision behavior. This requirement adds an optional representation to current retrieval; it does not create a new flow owner or source of truth. No new artifact dependency is required.

KISS reuses the service, safe selectors and adapters. STE makes the budget unit and evidence limits explicit. The default contract and historical evidence remain valid. Specification selects the exact request/output contract, supported budget range and pagination behavior. No unresolved Requirement blocker prevents Specification.
