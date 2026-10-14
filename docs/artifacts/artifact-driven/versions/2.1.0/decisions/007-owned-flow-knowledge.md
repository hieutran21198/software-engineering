# Decision: owned flow knowledge with derived retrieval

## Context and alternatives

Change discovery currently uses artifact prerequisites and element references; named system journeys are not a shared machine-readable input. A separate flow database would duplicate authority and obscure Git review. Vectors alone would discard exact dependency explanations. Exhaustive call-graph extraction would exceed the named-journey outcome and still miss dynamic behavior.

## Decision

Own flow definitions as specifications, with stable IDs and explicit evidence-linked support. Derive graph views, full-text documents and embeddings. Units assess impact and reference flows without acquiring runtime semantics. Indexing is rebuildable and does not add workflow states. Existing ADD gates still control delivery.

## Consequences

Initial discovery requires repository investigation and ongoing changes maintain affected records. Readers can retrieve relevant paths with evidence, but freshness and structural validity do not prove completeness or runtime correctness. Detailed format is in specifications/system-flows.md.
