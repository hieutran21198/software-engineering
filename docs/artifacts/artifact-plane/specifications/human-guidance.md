---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/human-guidance.md#specification-self-check
claims:
  - id: upstream-from-local-refs
    kind: decision
    statement: The Plane tells "Ready for team review" from "Waiting for merge"
      by comparing HEAD with the branch's upstream ref in local Git; it never
      fetches.
    status: open
    basis: inferred
    rejected:
      - option: Ask the GitHub API whether a pull request exists.
        reason: The Plane makes no network call to a forge and keeps no token.
      - option: Show one status for both cases.
        reason: The person then cannot see whether the next step is theirs
          (push and open a PR) or the team's (review and merge).
    risk_if_wrong: A stale upstream ref shows "Waiting for merge" after the
      remote branch moved; Refresh does not fetch.
    check: Push a branch, then commit once more without pushing, and confirm
      that the status returns to "Ready for team review".
---

# Human guidance and visual distinction contract

## Governing requirements

HG1 to HG12 in requirements/human-guidance.md.

## Change status

The work model derives one status for each change from the workflow evidence that the server already returns, and from two new fields of each change: `delivered` (the version record is on the protected ref) and `upstream` (`same`, `behind`, `ahead`, `diverged` or `none`, from `git rev-list --left-right --count HEAD...@{upstream}` in the change's worktree; without an upstream the value is `none`). The server reads the upstream once for each worktree in the existing workflow read. It does not fetch.

| Status | Condition | Status text | Next step text | Primary action |
| --- | --- | --- | --- | --- |
| In progress | open change with a current phase | `<Phase>` | the existing phase hint | the existing phase action |
| Ready for version | every phase before Version is documented complete and no version record exists | Ready for version | Prepare the version record. | Prepare version |
| Unchecked items | a version record exists on the branch and a task of the plan has an unchecked DoD item | Unchecked items | Check or explain `<n>` unchecked DoD items before team review. | Open plan |
| Ready for team review | a version record exists on the branch, not on the protected ref, no unchecked DoD item, and `upstream` is not `same` | Ready for team review | Push branch `<branch>` and open a pull request with the PR description. The Plane never pushes. | Copy PR description |
| Waiting for merge | the same, and `upstream` is `same` | Waiting for merge | Team review and the merge of `<branch>` establish version `<version>`. | none; Copy PR description stays a secondary action |
| Delivered | `delivered` is true | Delivered `<version>` | none | none |

A change in any status except Delivered is listed under Current work in the sidebar and on the work page. History lists only delivered and retained changes. "0 open changes" becomes "`<n>` changes in progress" and counts the same set.

## Status card

The work page shows one status card for each change under Current work. The change page shows one status card under its title, above the change brief. A card has:

- a 4-pixel left border and a status badge in the color of its status family;
- the status text and the next step text;
- the primary action of the table above as the page's only `primary` button, or no primary button;
- on the change page, the branch name and, for a prepared version, the version label of the next section.

## Version labels

| State | Label | Family |
| --- | --- | --- |
| Version record on the protected ref | `<version>` established | done |
| Version record only on this branch | `<version>` prepared on this branch | waiting |

The artifact page header shows "Version `<established>` established" and, when a prepared version exists, "`<prepared>` prepared by `<change title>`" with a link to that change. The change page Delivery section, the sidebar and the work page use the same labels. The Labels table of the authoring workbench contract is amended accordingly.

## Agreement of views

- The phase stepper marks Implementation done only when every task of the plan has its DoD items checked. Version shows "prepared" in the waiting family while the version is not established, and done when it is.
- The change brief of a change whose version is not established describes the branch difference against the merge base with the protected branch, as for an open change. Only an established version uses the commit that introduced the version record.
- "What changed?" names its counts: "`<n>` requirement, specification or decision documents, `<m>` other knowledge files and `<k>` code and test files". The PR description table says "knowledge files under docs/artifacts" and "code and test lines". Both use the same difference.
- An undecided flow reads: "`<flow>` is reached (`<tier>`), and neither the unit brief's affected_flows nor a claim's `about` list names it." The row offers "Declare in unit brief" when the unit page is reachable.

## Status vocabulary

Three visual families replace the current badge styles. Each badge has an icon, a text and a color; the icon and the text carry the meaning without the color.

| Family | Shape | Members |
| --- | --- | --- |
| Status | filled pill with a leading icon | done (check, green): Passed, pass, Complete, established, Delivered, verified; waiting (clock, amber): prepared, Ready for team review, Waiting for merge, Incomplete, Unchecked items; active (dot, blue): current phase, open; problem (exclamation, red): Failed, fail, refuted, error; neutral (info, gray): coordinator, unresolved, Unknown, not loaded |
| Difference | outlined pill with a leading sign | New (+, blue), Changed (~, amber), Removed (−, red) |
| Kind | square tag, gray text, no icon | Decision, Assumption, Root cause, Risk, Unknown, Fact from Git, documented, static, observed |

One component renders each family. Pages pass a status name, not a color. Status words that are sentences, such as the uncertainty sentences about approval and independent verification, stay as text.

## Visual grammar of controls

| Kind | Element | Look | Use |
| --- | --- | --- | --- |
| Navigation | `a` or `button.link` | accent text with a 1-pixel underline at 40% opacity; full underline on hover | opens a page, a document, a section or an external file |
| Action | `button.quiet` | accent text without underline, a leading icon, a light accent background on hover | changes something or opens a form |
| Secondary action | default button | border, text color | a second action next to a form or card |
| Primary next action | `button.primary` | filled accent | at most one on a page, in the status card or as a form's submit |
| Destructive action | `button.danger` | danger text, a leading trash icon and a text label ("Remove", "Delete", "Discard") | removes or discards; Undo or a confirmation follows |

The "×" symbol closes or clears only: tabs, dialogs, popovers and the search field. The dependency remove control of the artifact header and the support remove control of a flow step become `button.danger` with the label "Remove" and the trash icon. Removing a dependency asks for confirmation; removing a support keeps the existing Undo.

The action row of an expanded flow step has three groups separated by 16 pixels and a top divider: change (Add support, Rename step, Add a next step), order (Move up, Move down) and remove (Remove step, aligned right).

## Sections and cards

- A section title is 16 pixels, semibold, with 40 pixels above it, and an optional one-line description in muted text below it.
- A claim card and an attention row have a 3-pixel left border in the color of their status family.
- Long pages (change and unit) show a row of section links under the status card.

## Glossary

`src/glossary.js` holds one entry for each term: term, family and a definition of at most 30 words. A `Term` component renders the term as a button with a dotted underline. Activating it with Enter, Space or a pointer opens a popover with the definition; Escape, a second activation or focus leaving the popover closes it, and focus returns to the term. The popover has `role="dialog"` and an accessible name of the term.

The first entries: documented, static, observed, coordinator, unresolved, prepared, established, Delivered, Ready for team review, Waiting for merge, Unchecked items, Retained change, Publication review, Declared evidence, verified by an agent, not independent, Re-checked, reached (direct, transitive), undecided flow, Fact from Git, open claim, tier, small, medium, large. A page wraps the first occurrence of a glossary term in each section with `Term`.

## Narrow screens

At 800 pixels and below the phase stepper shows the bars and, below them, "Phase `<n>` of 5: `<name>`" or the status text when no phase is current.

## Unchanged

Operations, routes, MCP tools, packet fields, the PR description sections and page content keep their behavior and data. Only labels, styles, the status card, the stepper rule, the brief difference of an unestablished change and the two remove controls change.

## Validation

Browser tests on fixtures cover HGA1 to HGA7: each change status on the work page and the change page; prepared and established labels on the artifact and change pages; the stepper with an unchecked DoD item; the named counts; each glossary term with the keyboard and a pointer; computed styles of every control kind on the six main pages, and no `button.danger` without a text label; every badge with an icon and text. Screenshots at 1440 and 390 pixels of the work, artifact, change and flow pages go to the change evidence for the owner look (HGA8).

## Specification self-check

- HG1, HG2: Change status, Status card. HG3: Version labels. HG4 to HG6: Agreement of views. HG7: Glossary. HG8, HG9: Visual grammar of controls. HG10: Status vocabulary. HG11: Narrow screens. HG12: Unchanged.
- The decision upstream-from-local-refs is open for the owner's plan approval.
- KISS: two server fields; the rest derives in the work model and three badge components; one glossary module. No state is stored.
- STE: each table row holds one rule; terms keep one meaning.
- No blocker prevents Plan.
