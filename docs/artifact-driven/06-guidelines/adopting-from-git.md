# Adopting from a GitHub Release

## Inputs

Use releases from `hieutran21198/software-engineering`, an existing consumer knowledge workspace, and the binary for your operating system and processor. Choose a release tag when repeatability matters. Otherwise, use the latest published release, and use that same release for the binary and checksums.

Go and a source checkout are not required. Git is needed for the later ADD commit and PR workflow, not for downloading the bundle.

## Adopt by Hand

Follow the adoption guide in this order:

1. [Download the binary](../05-adoption/README.md#download-the-binary) and verify its checksum.
2. [Adopt](../05-adoption/README.md#adopt) the bundle. Preview with `--dry-run` first.
3. Do the steps [after adoption](../05-adoption/README.md#after-adoption).

The binary embeds the knowledge and required skills for its release. Do not substitute a source checkout from another revision. Use a newer released binary when adopting newer guidance.

## Ask an AI Agent to Adopt

Provide your consumer workspace in this request. Replace the optional release instruction when a particular tag is required:

```text
Adopt Artifact-Driven Development into my knowledge workspace at
<consumer-workspace> using a published se-adopt binary from GitHub
Releases for hieutran21198/software-engineering.
[Use release <tag>; otherwise resolve the latest published release
and report its tag.]

Inspect the workspace and its instructions first. Identify the host
operating system and processor, select the matching release asset,
and download it and SHA256SUMS from the same release into a separate
unused directory. Verify the asset checksum before running it. Make
it executable on Linux or macOS. Do not build from source or require Go.

List available architectures, then preview --arch artifact-driven
with --project <consumer-workspace> --dry-run. Adopt to
docs/artifact-driven if no conflicts exist.

Then follow steps 1-3 of After Adoption in the adopted
05-adoption/README.md. Configure your own harness to use the bundled
coordinator, PO, TL, and implementer skills, plus the required kiss
and asd-ste-100 skills for every role. Apply both during existing
self-checks. Use native team and skill capabilities; keep the
canonical ADD bundle and its references intact. Add concise ADD
guidance to the applicable existing AGENTS.md or CLAUDE.md, preserving
unrelated instructions. Report any capability or instruction conflicts.

The coordinator must interview me and assign a change tier. For a
medium or large change, complete Requirement, Specification, and Plan
with self-checks and phase commits, then wait for my plan approval. A
new plan or material change requires renewed approval. A small change
commits the three phases together, and my request is its approval.
Independent implementation agents use separate worktrees. Dependent
implementation waits for required established upstream versions.
After validation, prepare proposed versions and linked PRs, then stop
for team review and merge. Never commit directly to protected branches.

Preserve existing edits and stop on conflicts. Check that the adopted
overview, skills, patterns, and guideline links resolve and that your
harness can load the configured roles. Report the release tag, asset,
checksum verification result, destination, and setup changes, so that
I can review them as step 4 of After Adoption. Adoption does not
authorize starting a domain change, implementing it, committing setup,
pushing, or merging.
```

If release access, a matching asset, checksum verification, or the destination is unavailable, report the blocker. Do not substitute another repository, run an unverified binary, or install tooling without authorization.

The request authorizes binary download, verified bundle adoption, and project-local harness setup. Beginning a domain change is separate work and implementation still requires the ADD interview and plan approval.
