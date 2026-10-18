# Adoption guidance contract

Governs G1–G4 and AG1–AG4 in [adoption guidance requirements](../requirements/adoption-guidance.md). It extends the documentation part of the [adoption and publishing contract](delivery.md). se-adopt inputs, output, copy and failure behavior stay as delivery.md and agent-efficiency.md define them.

## Page ownership

Each fact has one owning page in the bundle. Other pages link to the owning section and do not repeat its commands or rules.

| Page | Owns | Other content |
| --- | --- | --- |
| 05-adoption/README.md | Platform asset table, release selection, download and checksum scripts, se-adopt commands and options, result, existing files and JSON output, required utility skills, flow knowledge after adoption, and the next steps after adoption. | None. |
| 06-guidelines/adopting-from-git.md | Inputs for a release adoption, the agent-ready adoption request, blocker rules, and what the request authorizes. | Links to the procedure sections Download the Binary, Adopt and After Adoption. No command blocks. |
| 06-guidelines/working-with-ai.md | Harness setup, required skills and capabilities, project instructions, and the request to start a change. | Unchanged, except a link to the agent-ready adoption request where it tells the reader to ask an AI to adopt. |
| 06-guidelines/getting-started.md | Choice of knowledge workspace and the first artifact change. | One sentence that adoption supplies guidance and skills only, with a link to the adoption guide. No se-adopt command. |
| 06-guidelines/README.md | Guide index. | Row descriptions match the pages above. |
| README.md (bundle overview) | Section table. | The 05 row describes release binary adoption; its status does not mention Go. The 06 row says release-based adoption, not Git-based. |

Section headings Download the Binary and Adopt in 05-adoption/README.md keep their text, because the repository overview links to #download-the-binary. The new section is After Adoption (anchor #after-adoption). File names do not change.

## Release selection

The release paragraph in Download the Binary states:

- The binary contains the ADD bundle of its release. The bundle can be older than main or the published website. Read the adopted copy, not the website, when the two differ.
- Set a chosen tag for repeatable adoption. Leave the tag empty to use the latest published release. Use the same tag for the asset and SHA256SUMS. Record the tag that the script prints.

The Linux and macOS script starts with `release=` (empty) and the repository URL. When `release` is empty, the script resolves the tag from the final URL of `<repository>/releases/latest` with `curl -fsSLI -o /dev/null -w '%{url_effective}'` and keeps the last path segment. The script stops with a message unless the tag starts with `v`; when no release exists, the final URL ends in `releases` and fails this check. The script prints `Using release <tag>` before download. The remaining steps stay as they are: platform and processor selection, download into a new temporary directory, checksum selection and verification, and rename with chmod only after verification.

The Windows script starts with `$release = ''` and the repository URL. When the tag is empty, the script sends a HEAD request to `<repository>/releases/latest` with Invoke-WebRequest and keeps the last path segment of the final URL. It reads that URL from ResponseUri in Windows PowerShell 5.1 and from RequestMessage.RequestUri in PowerShell 7. It throws unless the tag starts with `v`, writes `Using release <tag>`, and then keeps the existing download, single-line checksum match and hash comparison.

Neither script uses the GitHub REST API. Its unauthenticated limit of 60 requests per hour applies per IP address, so a shared address can exhaust it. Validation of the first contract, which read `tag_name` from that API, failed for this reason.

No bundle page names a specific past tag as an example default. Prose that needs a tag uses `<tag>`.

## After Adoption

After Adoption is an ordered list. Each step links to its owning guide:

1. Check the result. Run the same se-adopt command with `--dry-run`; a complete adoption reports `0 new files`. Confirm that the destination contains README.md and required-skills/kiss/SKILL.md and required-skills/asd-ste-100/SKILL.md.
2. Configure the harness to load the coordinator, PO, TL and implementer skills and both required skills for every role, as working-with-ai.md#required-skills and #required-capabilities define.
3. Add focused ADD instructions to the applicable existing AGENTS.md or CLAUDE.md, as working-with-ai.md#required-capabilities defines.
4. Put the adopted bundle and the setup on a dedicated branch, record the release tag in the PR description, and use the normal review and merge process. se-adopt does not commit, push or open PRs.
5. Start the first change with getting-started.md, minimal-change.md for a one-artifact outcome, and the request in working-with-ai.md#start-a-change.

The section states that adoption and setup do not authorize a domain change, implementation, commits, pushes or merges. This replaces the earlier Result paragraphs about the coordinator skill and AI-assisted setup; Result keeps the description of the copied content and the boundary that adoption does not invent project artifacts.

## Agent-ready request

The request text in adopting-from-git.md keeps its existing obligations. Two edits apply: when no tag is given, the agent resolves the latest published release and reports the tag; after adoption, the agent follows the adopted After Adoption steps 1–3 and reports step 4 for the user to review. The request still does not authorize step 5 or any commit, push or merge.

## Consistency and checks

Each changed bundle file is edited in docs/artifact-driven and copied byte for byte to src/archs/artifact-driven. Links follow the documentation flow: 05-adoption and 06-guidelines can link to each other as sibling sections and to pages below them, but not to the bundle README or the repository overview.

Validation uses existing tools: `diff -r` of the two bundle copies (the only expected differences are the Go files and required-skills), a relative-link check over both copies, a search for command blocks and fixed tags (AG1, AG2), a run of the Linux script with an empty and a chosen tag on this machine, `go test ./...`, and the website build. The Windows script runs in PowerShell if one is available; otherwise its review is static and the limitation is recorded.

## Affected flows and dependencies

No flow changes. The adoption flow covers se-adopt behavior, which stays the same. No artifact dependency or element reference changes.

## Specification self-check

The contract assigns each fact in G1 to one page, defines the G2 tag selection for both scripts, the G3 steps with owning links and the G4 checks. It reuses existing pages, anchors and tools. KISS: no new page, script file or CLI behavior; the latest-tag step uses a redirect that needs no JSON parser on Linux and macOS. STE: steps are imperative and ordered, and limitations such as untested Windows execution are explicit. No Specification blocker prevents Plan.
