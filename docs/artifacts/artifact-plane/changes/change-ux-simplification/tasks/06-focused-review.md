---
id: focused-review
depends_on: [browsing-shell]
---

# Lead reviews with purpose and changed passages

## Scope and ownership

Own ChangeReview.jsx, a small pure bounded line-comparison helper and targeted CSS. Add pure comparison tests and focused change-review browser fixtures. Reuse current packet/source operations and revision/omission fields. Keep exports inside one secondary disclosure; preserve existing formatters and API/MCP contracts.

## Governing knowledge

UX8, UX11; specifications/ux-simplification.md Focused review and bounded comparison; existing change-review/context-packets contracts.

## Prerequisites

Applicable DoD for browsing-shell must pass first. Explicit approval of this concrete plan and recheck of established ADD 2.1.0 are required. Preserve the inherited presentation baseline; no task authorizes editing established snapshots.

## Definition of Done

- [x] Purpose and changed records precede technical metadata; full bounded comparisons mark added/removed lines with text and color, three context lines and expandable unchanged blocks.
- [x] Added/deleted/unchanged files, repeated lines, Unicode, empty texts and final-newline differences are correct; the 200,000-character, 2,000-line-per-side and 1,000,000-work limits are enforced.
- [x] Partial or oversized sources show explicit raw/excerpt fallback; comparisons never align unrelated offsets, fabricate no changes or hide omissions. Explicit full comparison reads remain bounded and revision-consistent.
- [x] Export context preserves Markdown/JSON/copy formats and freshness guards, explicitly says Loaded records page and retains remaining-page/omission information.
- [x] Revision changes, failures and worktree/project switching invalidate obsolete comparison/export state; targeted pure and browser checks pass.

## Evidence

Three pure line-comparison Node checks passed: exact reconstruction for added/deleted/empty/repeated/Unicode/final-newline inputs, all character/line/work bounds, and unchanged-block reconstruction. Production build passed. Two real-HTTP Chromium checks passed: purpose first, marked before/after changed lines and secondary loaded-page export; partial 13,000-character sources show no aligned diff until explicit full source cursor loading completes. The first test fixture lacked a baseline README; adding the required baseline fixed the fixture rather than weakening unavailable-baseline behavior. Current revision/selection/active checks and AbortController protect full-comparison paging; the existing raw reader and external formats remain intact. Full stale/export/source paging regressions remain task 07.
