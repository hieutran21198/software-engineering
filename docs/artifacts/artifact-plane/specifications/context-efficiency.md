---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/context-efficiency.md#self-check
claims:
  - id: live-token-savings
    kind: unknown
    statement: Actual Codex input-token savings and MCP rendering remain unmeasured because the model endpoint returns a proxy HTTP 403 in this environment.
    status: open
    basis: inferred
    check: Run three paired repetitions per scenario with provider usage and correctness checks after restoring model endpoint access.
    risk_if_wrong: Payload byte reductions could be mistaken for accepted model-token savings.
---

# Context efficiency contract

## Additive API

Review requests accept view: compact for packet, brief and source, and operation: delta with captureToken. Legacy operations and defaults are unchanged. maxResponseBytes defaults to 16384, range 4096–65536, and is allowed only for compact requests. budget still caps excerpt characters. HTTP POST /api/review/query and MCP get_change_context, get_change_brief and read_change_context_source share these fields; get_change_context_delta selects delta. Unknown fields, unsupported combinations and invalid limits return 400.

## Compact envelope and pagination

The schema is artifact-plane.change-context.compact.v1. The envelope retains repository identity, worktree, artifact/change, revision, freshness, completeness, approval uncertainty and evidence limits. data.entries holds named sections: brief, records, sources, diagnostics, omissions and evidence. Packet compact mode does not generate the PR description or detailed impact ledger. Workflow evidence contains status and uncertainty plus task-source pointers, not duplicated task graphs or commit histories. Brief sections retain the seven answers, claims, attention and counts. Sources are registered pointers without automatic text; selected source reads use budget.

The UTF-8 serialized response, including metadata and cursors, is within maxResponseBytes, with 512 bytes reserved for the MCP wrapper and concise text. Page entries before source expansion. Oversized JSON values use explicitly labeled JSON fragments with character offsets and total length; continuations reconstruct the exact value, not an implicitly truncated assertion. Fragments with source paths retain those pointers in the reconstructed value. Omitted pages and source text mark completeness partial. If mandatory envelope metadata cannot fit, return a bounded 413 error. Cursors bind canonical selectors, operation, compact view, revision, limit, budget, byte cap and previous capture token. Cursors are opaque server-issued tokens, expire after 10 minutes and share the bounded cache lifetime. Stale or unavailable continuations return 422 with full-refresh guidance.

## Disposable delta captures

Each service keeps at most 16 capture snapshots for 10 minutes. Tokens are random, bind repository/worktree/artifact/change, and retain only source fingerprints and identities. Continuation state is bounded to the same capture entries. No files or persistent workflow registry are written. Reset/expiry requires a full compact packet, not an empty successful delta. Compare stable source side/path plus byte digest; return added/modified pointers and removed identities, an unchanged count, current evidence, diagnostics and a new capture token. An unchanged source is not resent as text. Revalidate every result; a capture changed during reading is stale and cannot seed another delta.

## Measurement

Use three paired repetitions of contained, multi-artifact and resumed scenarios in disposable clones. Fix model/settings and scenario prompt across pairs. Record provider-reported input, cached input, output and child usage, and actual tool-visible payload bytes separately. Compare medians per scenario and median paired percentage savings. Require ≥25% overall median paired reduction, no scenario median regression >10%, and every scenario oracle passing. Missing actual usage or correctness evidence is incomplete, never a passing savings claim. Keep raw transcripts private outside the checkout and persist only non-secret metrics and check results.

MCP legacy content stays unchanged. Compact content is one short instruction directing the client to structuredContent, not a duplicate serialized result. Measure client rendering before claiming either representation is omitted from model input.

## Self-check

The contract is additive and minor. Existing artifact dependencies are unchanged; neither member consumes an unestablished upstream contract. All errors preserve uncertainty. KISS: one opt-in representation and one disposable cache. STE: terms and limits are explicit. The live savings criterion remains unverified until actual agent runs complete.
