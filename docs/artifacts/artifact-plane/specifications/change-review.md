# Selected-change review contract

Governs R1–R4 and R7–R8 in requirements/change-review-context.md. Review is derived local knowledge, not workflow state or authorization.

## Context and comparison

Select one permitted/open repository, registered readable worktree, artifact and actual retained change. Resolve canonical paths and safe artifact/change IDs through existing guards. Never substitute the root's active change or a newer version.

Read current_version from the selected worktree's artifact root. Baseline.kind is declared-current; context names its version, selected worktree and HEAD. Compare recursive requirements, specifications and decisions from versions/<current>/ with changes/<selected>/. Null current version is an explicit empty initial baseline. Invalid/conflicting declaration or missing snapshot is baseline.state: unavailable with diagnostics, not an empty baseline. Historical changes warn that declared current is not a proven predecessor. Protected-ref publication is separate; no code/implementation predecessor is inferred.

Strip only counterpart version/change prefixes. Compare exact UTF-8 bytes and SHA256 fingerprints. Each record has opaque id, relative element path, category, status (added/modified/removed/unchanged), nullable baseline/change source IDs, paths, fingerprints, character counts and availability. Order Requirements → Specifications → Decisions, changed before unchanged, README first then natural paths. Root READMEs supply scope/purpose; tasks remain originating evidence and are not contract deltas.

UI exposes changed records first and unchanged governing knowledge separately. Selecting a record reads before/after excerpts. Use side-by-side text on wide layouts and stacked before/after on narrow layouts. Missing sides are explicit; text is escaped/sanitized. No AST/code-diff engine or semantic compatibility claim is needed.

## Impact and evidence

Build baseline-current and selected-change projections with existing flow/reference parsers, overriding the selected change independently of active-change metadata. Traverse explicit reverse relationships for changed knowledge on each side separately, including removed baseline sources. Merge logical flow candidates while retaining side/snapshot/reason/path. Read the unique owning unit's affected_flows and flow_assessment as separate declared impact. Multiple owning units remain diagnostics. Paging must not truncate reverse closure to search top-k.

Coverage is Explicit recorded relationships and declared assessment. Candidates do not create membership, prerequisites, compatibility proof or exhaustive code coverage. Invalid/missing/stale graph inputs make impact partial. Empty results are scoped to evaluated fresh declared relationships, never all behavior.

Reuse scoped plan/phase/task/provenance readers. Show missing/unverified publication reasons using corrected recognition, exact sources and recorded evidence labels. Always state Approval not verified by this reader. Do not execute checks, infer readiness, or correlate required implementation by commit-message wording.

## Query and source boundaries

One small review service supplies UI, packet, HTTP and MCP. Request fields: path, optional worktree, artifact, change, operation (review/packet/source), optional limit (1–100; default 20), budget (0–100000 excerpt characters; default 12000), cursor and source for source operations. Reject unknown fields. IDs use existing safe-ID rules; changes use change-. Cursor/source strings are at most 10000 characters. Existing 16 KiB HTTP cap and host/origin safeguards remain.

The table lists the request fields with presence, rule and default. "—" means that the text states no default.

| Field | Presence | Values or rule | Default |
| --- | --- | --- | --- |
| path | required | permitted or open repository | — |
| worktree | optional | registered readable worktree | — |
| artifact | required | existing safe-ID rules | — |
| change | required | existing safe-ID rules; starts with change- | — |
| operation | required | review, packet or source | — |
| limit | optional | 1–100 | 20 |
| budget | optional | 0–100000 excerpt characters | 12000 |
| cursor | for source operations | at most 10000 characters | — |
| source | for source operations | at most 10000 characters | — |

Source: artifact-plane:specifications/change-review.md, Context and comparison paragraph 1 (repository and worktree) and Query and source boundaries paragraph 1; derived one row per request field in source order; current snapshot.

Envelope: repository, worktree, context, revision, freshness (fresh/stale), completeness (complete/partial), data, diagnostics, pagination, omissions. Revision hashes selected context, relevant source bytes/declarations/refs, unit assessment and evidence. Read/revalidate relevant inputs before returning. Changed inputs return stale/partial with retry diagnostics. Bind source IDs and cursors to context/revision/operation/selectors. A remaining comparison-record page stays explicit; comparison/impact discovery precedes page slicing.

Registered sources are selected/baseline root and contract knowledge, selected plan/tasks, owning unit/evidence, and safe tracked implementation/test support explicitly referenced by those flows. Preserve scoped-directory containment for knowledge and existing tracked-file source guards for support. New interface sources must be UTF-8 text of at most 1 MiB. Missing/unsafe/oversized sources become diagnostics/omissions; no arbitrary path is accepted. Source pages contain offset, totalCharacters, text, fingerprint and optional next cursor; zero budget returns metadata and no advancing text cursor.

Errors: 400 malformed fields, 403 unconfigured MCP root/unregistered source, 404 vanished selected change/source, 422 invalid selector/stale cursor, sanitized 500 unexpected failure. Baseline failure returns partial metadata with unavailable comparison and reasons instead of invented initial state.

## UI and refresh

Add Review change in existing delivery details. A contextual center view and inspector show source context, changed/unchanged knowledge, before/after, flow reasons, evidence and packet actions. Back to delivery restores phase/history context. Preserve Dependencies / Units of work / Flows and unit Artifacts → Workflow → Implementation. No new top-level dashboard is required.

Bind requests to project session plus review context/revision. Abort/ignore old replies when project/worktree/change changes. Repository invalidation rereads active review, preserving only still-valid selections. Inactive project tabs pause reads; release inactive body detail. Disable export during updates/stale/no packet. Fresh partial packets may export only with visible diagnostics/omissions. Use native labeled controls/status and the existing 700-pixel narrow supported layout; no claim of a full accessibility redesign.

## Self-check

The service separates declared-current comparison from publication and historical claims. Contracts cover removals, source safety, paging, ambiguity, races and return navigation. KISS uses text and existing readers/graphs; STE names evidence limits. No upstream change, new dependency or Plan blocker is needed.

## Focused comparison presentation

Apply ux-simplification.md for purpose-first review, complete bounded line comparisons, honest partial/large-source fallback, source recovery deadlines and secondary loaded-page exports. Captured source identity, baseline meaning, publication uncertainty and external packet shapes remain unchanged.

## Evidence and comparison extension

[evidence-and-comparison.md](evidence-and-comparison.md) defines optional structured evidence and explicit comparison selectors. It refines baseline selection while preserving the omitted-selector contract and source safety.

## Change brief extension

[review-brief.md](review-brief.md) adds the brief operation, the additive packet field `data.brief` and the Change brief section of the change page. It reuses this service, its request fields and its envelope.
