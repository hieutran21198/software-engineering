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

- [ ] Explicit source/fence languages select only the ten specified local grammars. Known inputs show syntax tokens in a readable panel; unknown, erroneous and over-20,000-character blocks show full escaped plain code without truncation.
- [ ] Raw returned source, Unicode, whitespace and final newlines remain exact; fence payload is unformatted. Malicious HTML, resource loads and forged link markers remain inert. Source paging/partial labels and inline code are preserved. Record the registry-verified dependency version and measured production build.
- [ ] Focused affected checks pass and their actual commands, results and limitations are recorded here. KISS/STE self-check confirms no extra controls, settings store or semantic changes.

## Evidence

No implementation or checks have run for this follow-up task. Earlier delivered checks are retained in their original tasks and do not validate this scope.
