---
id: responsive-repair
depends_on: [incremental-refresh]
---

# Resolve the merged browser regressions

## Scope and ownership

Own src/panel-layout.js, relevant scoped styles/layout consumers and reading-controls/browser checks, plus the execution-history recovery fixture and affected recovery consumers if a product defect is reproduced. Diagnose before changing assertions.

## Governing knowledge

P6, P7; specifications/reading-controls.md; specifications/codex-execution.md.

## Prerequisites

Explicit approval of this new combined plan and establishment of the new ADD evidence contract are required before implementation. Recheck ADD 2.2.0 model metadata and the new evidence version on protected refs. These external gates are not cross-artifact task IDs. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [ ] Reproduce or explain the PR #26 width-851 overflow failure with measured element bounds and trace evidence; inspect PR #27 failed-job details too.
- [ ] At 851 pixels document width fits while canvas remains at least 300 pixels and panel content stays accessible; at 390/700 narrow controls work; at 1440 preferences restore.
- [ ] Pointer/keyboard resize, reader alignment, long content and refresh preserve geometry. Do not hide inaccessible overflow or delete the meaningful assertion.
- [ ] Reproduce PR #27 execution-history retry detachment. Validate automatic recovery and manual retry separately, hide empty history and restore navigation for new recordings; fix fixture synchronization or the evidenced product defect without arbitrary waits.
- [ ] Run focused reading-controls, runtime recovery, resize and changed review/model browser checks; record remaining environmental limitations instead of claiming a pass.

## Evidence

Implementation has not started. Record executed commands or review methods, outcomes, relevant sources and limitations here after approval.
