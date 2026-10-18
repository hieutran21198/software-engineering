# Adoption guidance

## Need and observed facts

Consumers and their agents use the bundled guidance to install ADD from a GitHub Release and to start their first change. On 18 October 2026 the user asked to improve this guidance. The user selected three outcomes: remove duplicated instructions, stop using stale release references, and add a clear path from an adopted bundle to the first change. The change is documentation only.

Observed facts in the canonical bundle on main:

- The binary download, checksum, preview and adopt commands, the destination and conflict rules, and the harness setup instructions occur in 05-adoption/README.md and again in 06-guidelines/adopting-from-git.md. Shorter copies of the adopt command and of the harness setup occur in 06-guidelines/getting-started.md and 06-guidelines/working-with-ai.md. Copies of the same instruction can drift apart.
- The download examples set the release to v1.1.0. The latest published release is v2.0.0. Its binary contains ADD 2.0.0; ADD 2.1.0 to 2.5.0 merged to main after that tag. The guidance does not say that the adopted bundle matches the release of the binary, not main or the website. Validation later found that v1.1.0 is a tag without a published release, so the documented example download returned 404.
- The adoption guide ends with a pointer to the coordinator skill and two paragraphs about harness setup. It does not give an ordered path from the copied bundle to a reviewed setup and the first artifact change.
- The bundle overview describes the guidelines as "Git-based adoption" and the adoption section as "Go command available", although the documented path is a released binary that does not need Go.

## Requirements

G1. One procedure. 05-adoption/README.md is the only bundle page that gives the binary selection, download and checksum commands, the se-adopt commands and options, and the destination, conflict and JSON rules. Other bundle pages keep only the facts that their purpose needs and link to the procedure for the rest. The agent-ready adoption request stays in 06-guidelines/adopting-from-git.md as its only copy. Harness setup rules stay in 06-guidelines/working-with-ai.md as their only full statement.

G2. Release selection. The guidance does not present a fixed past tag as the default. A reader either chooses a tag for repeatable adoption, or resolves the latest published release and then uses that same tag for the binary and SHA256SUMS. The procedure shows the tag that was used, so that the reader can record it. The guidance states that the adopted bundle is the bundle of the binary's release and can be older than main or the published website.

G3. Path after adoption. The adoption guide gives ordered next steps after a successful copy: check the adopted files, configure the harness with the role skills and both required skills, add focused project instructions, review the setup through the normal branch and PR process, and start the first artifact change. Each step links to the guide that owns its details instead of restating them. The steps state that adoption does not authorize a domain change, implementation, commits, pushes or merges.

G4. Consistency. The canonical bundle under docs/artifact-driven and the packaged copy under src/archs/artifact-driven stay identical for every changed file. Relative links resolve, child pages do not link to parent or ancestor pages, the overview describes the adoption section accurately, and existing anchors that external pages use stay valid. se-adopt behavior, flags and output do not change.

## Scope

Included: the ADD bundle pages 05-adoption/README.md, the 06-guidelines pages that repeat adoption instructions, the guideline index and the bundle overview, in both bundle copies.

Excluded: se-adopt code, flags and output; an upgrade or reconciliation procedure for an existing bundle; publication of a new release tag; renaming adopting-from-git.md, because existing links and website URLs use that name; the story-driven adoption guide; Artifact Plane; the repository overview, except where a changed anchor would break its link.

## Acceptance criteria

- AG1: Within the bundle, download, checksum and se-adopt command blocks occur only in 05-adoption/README.md. The agent-ready request occurs once, and the harness setup rules occur in full once.
- AG2: No bundle page uses a fixed past release tag as the default. The documented latest-release step resolves the current latest tag, and the documented download and checksum verification pass for that tag. The same procedure accepts an explicitly chosen tag.
- AG3: The adoption guide contains the ordered next steps of G3, and every link in those steps resolves.
- AG4: Both bundle copies are byte-identical for the changed files, relative links resolve, no child page links to an ancestor, Go tests pass, and the website builds.

## Affected artifacts and flows

Only artifact-driven is affected. The adoption flow in specifications/flows/adoption.md describes se-adopt selection, preflight and copying; G1 to G4 do not change that behavior, and the flow already excludes consumer harness setup. No artifact dependency changes.

## Requirement self-check

The requirements follow the three outcomes that the user selected and the documentation-only boundary. The observed facts come from the bundle, the release list and Git. KISS: the change removes copies and adds one short ordered list of links; it adds no tool, page or mechanism. STE: each requirement states one obligation, and the exclusions are explicit. No requirement blocker prevents Specification.
