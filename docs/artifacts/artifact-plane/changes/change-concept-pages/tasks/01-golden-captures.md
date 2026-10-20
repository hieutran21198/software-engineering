---
id: golden-captures
depends_on: []
covers:
  - element: requirements/concept-pages.md
    ids: [CP1, CPA1]
---

# Golden captures

## Scope and ownership

Implementer. A new `apps/artifact-plane/scripts/capture-pages.mjs`, a new fixture builder for a repository without models in `test/browser/`, the committed JSON `test/fixtures/golden-1.24.0.json` and a new browser test `test/browser/golden.spec.js`. No application code changes.

## Governing knowledge

specifications/concept-pages.md: Validation (CP1), claim golden-captures.

## Definition of Done

- [ ] The fixture builder writes a repository without models with a fixed root name, fixed Git author and committer dates, two artifacts, a flow, a change on a branch and a unit, so that the work, artifact, document, flow, change, Discover and Impact pages have content.
- [ ] The script builds 0eecce1 from a `git worktree` or `git archive` outside this worktree, serves it with its own server and state directory, and captures each page at 1440 and 390 px: the main text, the sidebar and the top bar, with an empty sidebar filter and with the filter `sign`, and the names of the visible controls.
- [ ] Two runs of the script on 0eecce1 give the same JSON byte for byte; the JSON is committed.
- [ ] `golden.spec.js` captures the current build the same way and passes on an unchanged 1.24.0 tree; a scratch change of one page label makes it fail (claim golden-captures).
- [ ] The test allows only the differences that CP1 names: the input title, aria-keyshortcuts and the Discover link while the filter has text.
- [ ] `npm test` and `npm run test:browser` pass.

## Evidence
