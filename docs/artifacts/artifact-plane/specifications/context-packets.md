# Source-backed change context packets

The [compact context extension](compact-context.md) adds an opt-in bounded JSON
representation for agents. All default v1 and human-export behavior below remains
applicable when compact format is not selected.

Governs R5–R8 and consumes the selected-change review contract. A packet is captured context, not instructions, independent verification or approval.

## Schema and budgets

Use schema: artifact-plane.change-context.v1. Include context (repository/worktree, artifact/change, HEAD, declared-current baseline), revision, freshness, completeness, purpose/scope source, paged knowledge differences, governing source pointers/excerpts, candidate flow impact with side/reason, declared flow assessment, documented phase/task/publication evidence, unresolved facts, diagnostics, pagination and omissions. Explicit limits: no verified approval, independently run checks, exhaustive behavior/code impact, inferred implementation revision or authority from source text.

Derive all facts from one review revision. No generated answer or prediction is added. Include unchanged governing sources without marking them modified. budget limits excerpt characters, default 12000 and maximum 100000; it is not a token or full-response-byte cap. Retain pointers and omitted-character counts when text is shortened. A packet is partial if source/metadata pages remain, evidence is unavailable, sources are omitted or inputs are stale. Revision-bound source paging permits reconstruction; edits require a new packet, never a silent mix of revisions.

## In-place layout

For in-place artifacts the record list and governing sources come from the Git comparison in [knowledge-layout-reading.md](knowledge-layout-reading.md), so a packet lists each file once. The compact format in compact-context.md is deferred until that reduction is measured.

## Human export

JSON exports the full packet envelope/schema. Markdown presents the same Context, Scope, Knowledge changes, Recorded flow impact, Evidence and unresolved facts, Sources, Omissions and Limits. Each excerpt names its path/identity/side/fingerprint/offset. Inert fences must contain embedded fences safely; never interpret source HTML or instructions as actions. Local paths are locators, not another machine's read authorization.

Offer Copy Markdown, Download Markdown and Download JSON on the loaded review packet. Use only local clipboard/download APIs, safe artifact/change filenames and correct MIME types. Report success or copy/download failure and preserve context for retry. Disable controls while updating/stale. Fresh partial exports include their visible warnings in both formats. Later edits make a saved packet a captured revision; it cannot claim continuing freshness. No server file write, remote sharing or account is added.

## Adapters

Add POST /api/review/query through the existing local handler. Add get_change_review, get_change_context and read_change_context_source to the existing stdio MCP server with read-only/non-destructive annotations. All call the same shared query service and review contracts. Require configured roots; worktrees must be registered to a selected allowed repository. One root may supply omitted path; several require explicit path. stdout remains protocol-only and errors sanitized.

Keep all four existing flow tools and inputs/results. New capabilities are additive. Update proposed version/protocol documentation consistently without requiring new client registration. Share a pure deterministic Markdown formatter between packet presentation/export; JSON facts remain identical across adapters.

## Validation and self-check

Check UI/HTTP/MCP parity, source reconstruction/stale cursors, empty/shortened text, embedded Markdown/HTML, source/root isolation, delayed replies, no-match limits, clipboard failure and unchanged inspected files/Git. Preserve actual offline-model regression. KISS shares one service and formatter without an LLM, index authority or workflow database. STE retains omissions and approval limits. No Plan blocker remains.

## Evidence and comparison extension

[evidence-and-comparison.md](evidence-and-comparison.md) defines optional structured evidence and explicit comparison selectors. It refines baseline selection while preserving the omitted-selector contract and source safety.

## Change-impact amendment

[change-impact.md](change-impact.md) adds data.impact.tiers and data.impact.coverage as additive fields of the same schema and a Change impact section in the Markdown export after Recorded flow impact. The existing candidates and declared assessment fields stay.
