# Read-only change review and context handoff

## Need

A reviewer must understand a selected change's knowledge differences, explicitly recorded behavior impact, governing sources, and unresolved evidence without assembling several disconnected views. A person or agent must receive the same source-backed context and its limits without repeating broad repository exploration.

## Requirements

- R1: Open a contextual review from an artifact's delivery change. Compare proposed requirement/specification/decision knowledge with that artifact's declared current version in the selected worktree. Identify additions, modifications, removals, and unchanged sources. Show both exact source locations and the selected worktree, HEAD, baseline version, freshness, and omissions.
- R2: Preserve delivery navigation and historical evidence. If a retained change is already delivered, name the comparison's declared-current baseline and warn that this is not necessarily its historical predecessor. Initial artifacts use an explicit empty baseline. Missing or ambiguous baselines produce diagnostics instead of an invented comparison.
- R3: Show candidate affected flows from fresh explicit relationships on both sides of the knowledge comparison and from the owning unit's declared flow assessment. Keep declarations, discovered candidates, reasons, and unresolved selectors distinguishable. Empty results prove only that no consumers were found in the evaluated declared relationships.
- R4: Show task/phase evidence and missing or unverified publication facts with exact sources. The review does not assert plan approval, readiness, independently verified tests, or comprehensive code-change coverage. It does not infer which code commit implemented a knowledge version.
- R5: Produce a context packet for the same selected change. Include purpose/scope, baseline, source identities, knowledge differences, relevant governing excerpts, explicit flow impact reasons, documented evidence limits, unresolved facts, freshness, revision, and omissions. No generated recommendation or prompt inside source text grants authority to act.
- R6: Let the user copy or download a readable Markdown packet or structured JSON. Expose equivalent read-only packet/review retrieval to configured MCP clients. Source excerpts are bounded; users and agents can request a safe registered source page to read omitted text. Download/copy failure leaves the review usable and reports recovery.
- R7: Abort or ignore obsolete replies after changing change/worktree/project. Refresh rereads inputs and preserves valid review selection. Packets identify their revision and remain explicitly captured context after later repository edits; stale replies do not silently become fresh exports.
- R8: Keep all operations read-only for inspected repositories and Git. Reuse scoped source containment, sanitization, configured MCP roots, and local state rules. No remote sharing, hosted generation, automatic agent launch, new model download, arbitrary source path, or cross-repository federation is included.

## Acceptance examples

1. A current baseline has requirement A and specification B. The selected change modifies A, removes B, and adds decision C. Review lists those three differences and renders readable before/after excerpts with exact source identities.
2. An unchanged contract can be read as governing context without being listed as modified. Missing/unsafe/invalid-UTF-8 sources remain diagnostics and cannot be read through an arbitrary source selector.
3. A removed baseline contract explicitly supports a baseline flow. Review still includes that baseline consumer even when the planning graph no longer records its support. Related candidates do not create unit membership or execution prerequisites.
4. A legacy change has no predecessor provenance. Review names the declared-current comparison and does not infer a historical code baseline. If a current-version declaration conflicts or its directory is missing, comparison is unavailable with a reason.
5. A small excerpt budget shortens a large source. Markdown and JSON preserve its path, side, fingerprint/revision, omitted-character count, and retrieval selector. A registered-source cursor reconstructs all allowed text and rejects an edited revision.
6. Opening a second project or worktree while a review loads cannot display the first source's response. Copy/download operate on the displayed fresh packet, retain its evidence warnings, and send nothing to an external service.
7. A configured agent client obtains the same change context as HTTP. Existing four flow tools continue to work. Its packet includes unresolved approval/publication facts rather than authorizing implementation.

## Self-check

The scope is a first useful read-only review/handoff workflow, not an issue tracker, code review engine, or agent control plane. User demand is authorized for these two directions; generalized federation and semantic code drift remain excluded hypotheses. Requirements use existing artifact ownership and ADD gates. KISS shares the review data with packet export and MCP; STE labels explicit relationship coverage and captured evidence precisely. No Requirement blocker remains.
