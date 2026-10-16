# Evidence correctness contract

Governs E1–E5 in requirements/evidence-correctness.md. Existing unit/workflow, flow-query and runtime readers apply these corrections; new review/packet consumers share them.

## Publication assertions

Continue matching complete version knowledge and required originating task path sets/bytes against available local refs/heads/main or refs/heads/master. These names are the existing local baseline convention, not proof of remote protection or freshness. Missing/conflicting/unsafe publication retains current unknown/proposed diagnostics.

Recognize review only in a Markdown section headed Publication review, ending at the next equal-or-higher heading. Allowed sources are the selected version README and its owning unit brief. A version README applies only to that version/owner. A brief paragraph must begin with the exact artifact identifier and delivered version followed by a colon.

Parse top-level paragraphs with the Markdown lexer. The first sentence, after a brief's member prefix, must assert that all required knowledge and implementation/code changes have landed or merged on main/master. Examine an affirmative assertion, not a matching substring. Reject negations, future/conditional/hypothetical/example language, format instructions, quotations, contradictory assertions and unrelated members/versions. Do not scan specifications, code blocks, blockquotes, task instructions or arbitrary linked files. Repository-local implementation-location statements alone do not prove merges.

Accepted evidence identifies kind: documented-merge-review, path, heading: publication-review, artifact, version and assertion. Show this independently of matching ref/snapshot/task sources. Published bytes without an accepted review are unverified; valid review without complete matching bytes cannot establish. Historical sources remain readable; broad legacy prose matches may become unverified. Never rewrite snapshots/briefs to manufacture proof or infer approval, implementation commit identity or independent CI success.

## Flow ordering

Trim whitespace. Empty queries browse by creation date descending, opaque ID ties and unknown dates last. Nonempty queries put unique exact opaque/logical/local ID matches first, then existing reciprocal-rank-fusion score descending and opaque ID ties. Ambiguous local IDs remain multiple candidates; detail still needs an unambiguous selector. Recency never overrides search relevance. Impact output retains deterministic newest-first order independently of search scoring.

Sort before paging; preserve existing revision/context/operation/query cursor safety, source budgets, model fallback and HTTP/MCP parity. UI labels search Relevance first and browsing/impact Newest records first. Test older exact matches, weak newer candidates, ties/unknown dates, whitespace queries and changed cursors. Real-model checks require unique exact rank 1 and all five existing semantic benchmark cases in the top ten, without network calls.

## Worktree-bound observation

Repository identity remains the canonical Git common directory. Current task matching also requires canonical source worktree, artifact, originating change, relative task path and task signature. New capture identity includes canonical source worktree, source HEAD/revision when known, unit selector and graph digest. Identical plans in another worktree or captured source revision cannot reuse a capture.

Persist sourceWorktree and sourceRevision in new attempt JSON. Add fields without dropping/recreating tables or discarding history. Legacy records without an unambiguous source identity remain inspectable in Recorded executions but cannot supply current-worktree activity. Canonical aliases resolve through realpath; removed sources retain their captured identity for explicit recorded viewing.

Pass current worktree through RuntimeProvider/signature keys and individual/unit task selectors. Recorded views select context ID explicitly. Runtime queries may return repository-wide history, but live overlays filter by exact worktree/task identity. Unchanged bytes can match earlier attempts from the same worktree after an unrelated HEAD edit; display captured revision and never imply the attempt ran at current HEAD. Changed task bytes do not inherit an observation. Preserve session/agent retries, stale/disconnected semantics, reported-validation limits, privacy and fail-open hooks.

## Impact and self-check

Plane owns all changes. Established ADD 2.1.0 task, unit, retention and flow contracts remain unchanged; no dependency proposal is needed. Conservative recognition can expose missing historical review evidence without modifying it. KISS uses explicit sections, existing Markdown parsing and additive JSON fields. STE distinguishes documented assertions from independent verification. No Specification blocker remains.

## Named-search amendment

The search-label-usability contract governs the new explicit title/ID mode and shared normal search UI. Existing exact/keyword/semantic discovery and ranking remain the default for omitted external match selectors. Graph identity and evidence semantics remain unchanged.

## Evidence and comparison extension

[evidence-and-comparison.md](evidence-and-comparison.md) defines optional structured evidence and explicit comparison selectors. It refines baseline selection while preserving the omitted-selector contract and source safety.
