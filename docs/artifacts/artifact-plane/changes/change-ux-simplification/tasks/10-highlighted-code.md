---
id: highlighted-code
depends_on: [navigation-resize]
---

# Highlight source and fenced code in a shared panel

## Scope and ownership

Sequential implementation owner covers src/Reader.jsx, src/Markdown.jsx, a small shared code helper/component, scoped CSS, package/lock and focused source/security tests. These tasks extend the current unmerged outcome; do not reopen, copy or change earlier completed task evidence.

## Governing knowledge

UX14; specifications/reading-controls.md Code panels; contained reading decision 011.

## Prerequisites

The listed prerequisite must satisfy its applicable DoD. The original seven-task approval covers its original scope only. Obtain explicit approval of this concrete reading-control amendment before any new application/dependency changes. The established ADD 2.1.0 supplier and existing source/evidence boundaries remain unchanged; no new artifact dependency is introduced.

## Definition of Done

- [x] Explicit source/fence languages select only the ten specified local grammars. Known inputs show syntax tokens in a readable panel; unknown, erroneous and over-20,000-character blocks show full escaped plain code without truncation.
- [x] Raw returned source, Unicode, whitespace and final newlines remain exact; fence payload is unformatted. Malicious HTML, resource loads and forged link markers remain inert. Source paging/partial labels and inline code are preserved. Record the registry-verified dependency version and measured production build.
- [x] Focused affected checks pass and their actual commands, results and limitations are recorded here. KISS/STE self-check confirms no extra controls, settings store or semantic changes.

## Evidence

Registry lookup verified highlight.js 11.12.0; the direct dependency is pinned and only the ten approved grammars are bundled. Two Node checks pass for all grammars/aliases, Unicode, escaped hostile text, empty and oversized fallback, and exact newline reconstruction. Fourteen Chromium cases pass across flow source paging/isolation and the new controls: actual HTTP JavaScript source has highlighted keywords and exactly preserved CRLF, fenced JS/YAML has tokens, unknown fences stay exact plain text, inline code/prose remain distinct, forged markers/scripts remain inert and all four viewport widths avoid page overflow. Code screenshots were inspected at 390 and 1440. Production build passed: JavaScript 704.28 kB / 223.50 kB gzip versus prior 637.80 / 201.34; no runtime model or hosted service was added. The initial build failed because the inherited ignored dependency symlinks were disturbed by installation; clean independent dependency installs restored both checkouts, with no original tracked changes. Source text is escaped and highlighting markup is sanitized at each rendering boundary. KISS/STE self-check passed.
