---
id: heading-hierarchy
depends_on: [integration-publication]
---

# Increase document heading hierarchy

## Scope and ownership

Sequential implementation owner covers src/style.css and focused reader/browser typography checks. These tasks extend the current unmerged outcome; do not reopen, copy or change earlier completed task evidence.

## Governing knowledge

UX12; specifications/reading-controls.md Heading hierarchy.

## Prerequisites

The listed prerequisite must satisfy its applicable DoD. The original seven-task approval covers its original scope only. Obtain explicit approval of this concrete reading-control amendment before any new application/dependency changes. The established ADD 2.1.0 supplier and existing source/evidence boundaries remain unchanged; no new artifact dependency is introduced.

## Definition of Done

- [x] Rendered h1–h6 each exceed body size and decrease by level; a 15px reader body has approximately 28.5/24/20/18/17/16px headings.
- [x] Long source titles wrap at 390/700/851/1440; overview/inspector headings remain distinct, and graph labels keep their existing layout.
- [x] Focused affected checks pass and their actual commands, results and limitations are recorded here. KISS/STE self-check confirms no extra controls, settings store or semantic changes.

## Evidence

App production build passed. The focused Chromium heading case passed: all six rendered heading levels exceed the 15px reader body and decrease by level, a long title wraps without page overflow at 390/700/851/1440, and fixture bytes/Git state remain unchanged. Loaded-document screenshots were captured at each width. CSS changes scale Markdown headings and the reader title only; graph label styles remain unchanged. KISS/STE self-check passed.
