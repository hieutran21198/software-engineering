---
references:
  - artifact: artifact-driven
    element: specifications/evidence-records.md
    requires: Interpret optional check and publication records with safe source resolution and honest verification limits.
    status: proposed
    change: change-evidence-and-usability
---

# Evidence summary and explicit comparison

## Upstream and scope

Governs P1-P3 and P7. Implementation waits for the referenced ADD contract to establish and be rechecked. Extend existing workflow, publication, change review and UI services. Preserve query containment, read-only behavior, revision validation, pagination and legacy defaults.

## Evidence interpretation and presentation

Read optional evidence_records, self_check and publication_reviews using the ADD-owned contract. Return diagnostics with file, field and cause. Invalid explicit metadata cannot be interpreted through positive legacy fallback. Failed/incomplete check records and unchecked DoD block documented completion. A document self-check is not whole-phase approval. Publication still compares exact snapshot and retained-delivery sets/bytes with local main/master. Unknown remote proof remains an explicit limitation.

In the selected artifact/change inspector show declared version, inspected worktree/revision, and publication evidence as separately labelled facts. Display disagreement without silently rewriting the selection. For unresolved publication, show a concrete reason and action such as verify missing implementation merges, restore missing delivery evidence, or reconcile the declared root. A merged version with failed validation shows both facts. Do not infer that current package version is the established artifact version. Evidence source links use the existing contained reader.

## HTTP and MCP comparison selectors

Add optional comparison to existing review, packet and source requests: an object with kind equal to declared-current, version or change; id is required only for version/change and must be a safe existing same-artifact snapshot/change identifier. Omission equals declared-current and preserves existing responses. Reject other keys, self-comparison to the selected change, unsafe IDs, missing selected targets and cross-artifact paths. There is no arbitrary Git ref or filesystem-path selector.

Explicit version/change selects the baseline used for before/after and impact. Also retain the declared-current identity and per-record comparison status against it. Extend baseline with requested selector, resolved path, fingerprint and publication evidence; selected existing fields remain compatible. Add comparison and declaredBaseline to the envelope/context as additive fields. Each record adds declaredStatus and comparisonRelation: inherited-only when selected content equals explicit baseline but differs from declared current; changed-after-predecessor when selected content differs from explicit baseline; unchanged when all three match. Missing files are compared as absence, including removals. With the default selector relation is unchanged or changed-against-declared. These labels describe byte comparisons at file level; they do not assign authorship or claim hunk-level provenance.

Compute full record/impact eligibility before paging. Source registration includes both permitted baselines; source IDs and cursors bind comparison, declared baseline, revision, operation, artifact, worktree and project. A comparison change resets cursors and selection, cancels stale reads and prevents old results from appearing in the new context. Changes during capture return stale/partial as before. Failure to read either required baseline produces partial evidence with diagnostics; it cannot turn all records into additions.

Errors retain existing statuses: 400 malformed fields, 403 forbidden source/root, 404 removed selected resource, 422 invalid selector or stale cursor, sanitized 500 unexpected failures. MCP uses the same service and validation as HTTP. Exported packets and Markdown include both comparison identities, file-level meanings, freshness and omissions. Existing clients without comparison keep declared-current semantics.

## UI

Use one labelled Compare with control in the existing review: Declared current, Version, Retained change. Offer only safe same-artifact targets supplied by the reader; label publication evidence independently. Explicit predecessor comparison exposes inherited-only records as a secondary filter and changed-after-predecessor records first. Show a short explanation that this is a comparison target, not verified implementation ancestry. Use existing reader/diff controls and keyboard access.

## In-place layout

For in-place artifacts, [knowledge-layout-reading.md](knowledge-layout-reading.md) replaces directory comparison with a Git comparison against the protected branch, and the version and change selectors above are rejected. Legacy artifacts keep this contract.

## Self-check

P1-P3 are covered by source-aware evidence and explicit compatible selectors. Safe paths, invalid evidence, stale packets and missing baselines fail visibly. KISS uses existing service/envelope/inspector boundaries. Self-check: passed.
