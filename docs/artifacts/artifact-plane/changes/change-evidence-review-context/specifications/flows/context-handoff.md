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
    - id: derive
      title: Derive packet facts from one validated revision
      supports:
        - contract
    - id: deliver
      title: Copy or download locally, or return through configured MCP
      supports:
        - contract
    - id: continue
      title: Read omitted registered source text at the same revision
      supports:
        - contract
    - id: recover
      title: Disclose stale or partial evidence and retry safely
      supports:
        - contract
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
  gaps:
    - Packet implementation, adapter parity and export behavior checks remain
      pending.
    - A captured packet cannot prove continuing freshness or authorize
      implementation.
  exclusions:
    - Hosted generation, external sharing, agent launch and arbitrary file reads.
---

# Hand off source-backed change context

This proposed flow has documented contract support. Add tracked implementation/test support and actual validation evidence after plan approval.
