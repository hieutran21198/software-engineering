# Flow discovery and retrieval requirements

## Outcome

People and agents can find named flows, their artifact elements, implementation and evidence without repeating broad repository exploration.

## Requirements

- P1: Read ADD flow records and diagnose invalid/missing references while preserving safely readable knowledge. Visualize steps, branches, joins, loops, shared support, and participating artifacts.
- P2: Provide flow discovery from artifact/element selection and affected-flow links from units. Participation creates no unit member or prerequisite automatically.
- P3: Retrieve flows by exact identifiers, keywords, and natural language. Combine local semantic ranking with explicit graph traversal; distinguish ranked candidates from graph-connected consumers.
- P4: Keep a rebuildable local SQLite knowledge index outside repositories, separate from execution observations. Include source fingerprints, snapshot/worktree identity, forward/reverse relationships, full-text data, and cached embeddings.
- P5: Generate embeddings locally with an explicitly installed quantized multilingual MiniLM model. Normal indexing/query operation is offline. Missing models leave keyword and graph discovery available with a diagnostic.
- P6: Return source evidence, relationship reasons, revision, freshness, completeness, and omissions. Source changes invalidate affected knowledge and embeddings. Stale/partial results cannot support a no-consumers claim.
- P7: Expose the same read-only operations through a local HTTP endpoint and stdio MCP tools. Agent retrieval does not authorize implementation, create artifact files, or expose arbitrary repository files.
- P8: Inventory current repository exploration, unit inspection, source retrieval, refresh, project tabs, and explicit execution observation. Preserve existing navigation, runtime storage, and worktree isolation.
- P9: Representative queries return expected flows in the top ten. Impact traversal finds all explicitly connected expected consumers, independently of search ranking limits. Measure latency, indexing cost, and context volume without inventing token savings.

## Local acceptance

Valid, malformed, historical, multi-worktree and proposed/established fixtures exercise visualization and both adapters. Repository bytes remain unchanged by reads/indexing. Offline embedding checks use actual installed model weights; mocked vectors alone do not prove semantic quality. Existing Plane tests/builds pass.

## Impact and self-check

Consume proposed artifact-driven change-flow-discovery, specifications/system-flows.md. The existing artifact-plane -> artifact-driven dependency remains unchanged. Dependent implementation waits for upstream establishment. KISS reuses existing readers, graphs, query patterns, freshness and local SQLite; STE preserves evidence limits. No Requirement blocker remains for Specification.
