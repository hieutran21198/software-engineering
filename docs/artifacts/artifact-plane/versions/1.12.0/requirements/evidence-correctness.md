# Evidence correctness

## Need and scope

Readers must not mistake format instructions for publication evidence, recent records for relevant search results, or another worktree's execution for the inspected task. Correct these behaviors while retaining read-only exploration, historical knowledge, reported-validation limits, existing source guards, and supported project navigation.

## Requirements

- E1: Recognize publication review only from an explicit review assertion scoped to its artifact and delivered version. Format instructions, examples, quotations, negative statements, unrelated versions, and repository-local implementation-location statements alone cannot prove all required merges.
- E2: Keep matching published snapshot/task bytes and the scoped recorded merge assertion separate. Missing assertions remain unverified; inaccessible or conflicting proof remains unknown. The inspector explains the exact missing proof and identifies an accepted assertion's source. Never infer approval or independently verified implementation completion from this evidence.
- E3: Unique exact flow IDs lead search results. Nonempty searches order by relevance before paging; empty browsing retains newest-first record ordering with deterministic ties and unknown dates last. HTTP and MCP produce equivalent order and cursor semantics.
- E4: Current task activity matches the selected canonical worktree, artifact, change, source path, and task content. Captures preserve their source worktree and revision. An identical graph in another worktree cannot borrow observations. Explicit recorded-context inspection remains possible after a source disappears.
- E5: Preserve merged 1.11.1 navigation, source pagination, diagnostic readability, project isolation, safe refresh, and historical task retention. Expose the declared-version/publication disagreement without silently reassigning lifecycle state.

## Acceptance examples

1. Given identical published knowledge contains a specification that explains the sentence used for merge review, and no actual review assertion exists, the reader reports unverified merge evidence. A convention inside a code block, quotation, or example produces the same result.
2. Given a review for artifact A version 1.0.0, it cannot establish A 1.1.0 or artifact B. A qualified statement in the owning unit's publication-review section can support A 1.0.0 only after its complete snapshot and retained tasks match a local main/master ref.
3. Given a review says changes have not landed, or only says implementation resides in the inspected repository, it cannot support establishment. A missing/local-only/changed task record still prevents completion even with a valid review assertion.
4. Given older flow A is an exact ID match and newer flow B is only a weaker candidate, A leads the first search page. Empty-query browsing still shows B first. Paging produces no duplicates or omissions and rejects changed-context cursors.
5. Given two registered worktrees contain identical task bytes and only worktree B has an observed attempt, inspection of A shows no matching recorded execution. B shows its own attempt. A renamed/canonical alias of B resolves consistently, but changed task bytes do not inherit the older observation.
6. Given a captured source worktree disappears, its explicit recorded graph remains readable and labels its captured worktree/revision. It does not become activity for the current worktree.

## Self-check

These requirements define observable outcomes, not a new workflow state or independently verified approval. Existing flow retrieval and observer contracts remain except for the stated corrections. KISS preserves optional local embeddings and existing storage boundaries. STE keeps unverified publication, unknown proof, and absent observation distinct.
