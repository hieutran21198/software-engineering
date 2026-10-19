---
id: visual-system
depends_on: []
covers:
  - element: requirements/human-guidance.md
    ids: [HG7, HG8, HG9, HG10, HG11]
---

# Visual system

## Scope and ownership

Implementer, own worktree. `src/ui.jsx` (`StatusBadge`, `DiffBadge`, `KindTag`, `Term`, narrow stepper text), `src/glossary.js`, `src/styles.css` (control grammar, families, section and card rules) and Node tests of the glossary.

## Governing knowledge

specifications/human-guidance.md: Status vocabulary, Visual grammar of controls, Sections and cards, Glossary, Narrow screens.

## Definition of Done

- [x] Each family component renders an icon and a text for every member of its table row; a test fails for an unknown status name.
- [x] The glossary holds every listed term with a definition of at most 30 words; a Node test checks this.
- [x] `Term` opens and closes its popover with Enter, Space, Escape and a pointer, and returns focus to the term.
- [x] The styles of `a`, `button.link`, `button.quiet`, `button.primary` and `button.danger` follow the grammar table.
- [x] At 390 pixels the stepper shows "Phase n of 5: name".
- [x] `npm test` and `npm run build` pass.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Families | test/visual-system.test.js renders each StatusBadge and DiffBadge member and finds its icon or sign and its text; each KindTag renders its text without an icon, as the Kind row of the contract says; an unknown status, difference, kind or term throws | Passed |
| Glossary | The same test finds every listed term (27 entries; "reached (direct, transitive)" as three, "verified by an agent, not independent" as two), each definition at most 30 words, and each entry's family equal to its status family | Passed |
| Term | A temporary Playwright harness on the real components: Enter opens and closes, Space opens and Escape closes with focus on the term, a pointer opens and a second activation closes, a pointer outside and Tab away close, the popover stays inside a 390-pixel viewport (10 of 10). The harness is not committed; task guidance-validation adds page tests | Passed |
| Control grammar | Computed styles in the same harness: `a` and `button.link` accent with a 1-pixel underline at 40% opacity and a full underline on hover; `button.quiet` no underline and an accent-soft hover; default button border and text color; `button.primary` filled; `button.danger` danger text, a CSS trash icon and its label | Passed |
| Narrow stepper | Node SSR test for "Phase 4 of 5: Implementation" and the status fallback; the harness shows the line at 390 pixels and hides it at 1440 pixels | Passed |
| Suites | `npm test` 413 tests, 412 passed, 0 failed, 1 skipped (pinned model not installed); `npm run build` exits 0; the browser suite 109 of 109 on the Nix Chromium | Passed |

Implementation: src/glossary.js (families, differences, kinds, 27 terms); StatusBadge, DiffBadge, KindTag, StatusCard and Term in src/ui.jsx; PhaseSteps gains `status`; styles.css gains the control grammar, the families, `.status-card`, `.stripe.<family>`, section titles and the popover. An open claim uses the active family, as the contract says; the mockup showed it in the waiting family.
