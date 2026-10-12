# Adopting from a GitHub Release

## Inputs

Use releases from `hieutran21198/software-engineering`, an existing consumer knowledge workspace, and the binary for your operating system and processor. Choose a release tag when repeatability matters. Otherwise, resolve the latest published release and use that same release for the binary and checksums.

Go and a source checkout are not required. Git is needed for the later ADD commit and PR workflow, not for downloading the bundle.

## Download and Verify

Follow the [binary download instructions](../05-adoption/README.md#download-the-binary). Download the matching asset and `SHA256SUMS` from the same release into an unused directory. Verify the selected binary's checksum before running it. On Linux and macOS, make it executable after verification.

The binary embeds the knowledge and required skills for its release. Do not substitute a source checkout from another revision. Use a newer released binary when adopting newer guidance.

## Preview and Adopt

From the download directory:

```sh
./se-adopt --list
./se-adopt --arch artifact-driven --project /path/to/consumer --dry-run
./se-adopt --arch artifact-driven --project /path/to/consumer
```

On Windows, use `.\se-adopt.exe` and your consumer workspace path.

The default destination is `docs/artifact-driven`. Use `--output docs/add` for another relative destination. Identical files are retained; conflicting files stop adoption without overwriting existing content. Reconcile conflicts or choose another destination.

Read the adopted `README.md` and `06-guidelines/README.md`. The consumer AI then configures the skills and role team for its own harness and adds focused ADD guidance to the applicable existing `AGENTS.md` or `CLAUDE.md`, preserving unrelated instructions. Review these setup changes through your normal branch and PR process. The copy command itself does not perform harness setup or publish changes.

## Ask an AI Agent to Adopt

Provide your consumer workspace in this request. Replace the optional release instruction when a particular tag is required:

```text
Adopt Artifact-Driven Development into my knowledge workspace at
<consumer-workspace> using a published se-adopt binary from GitHub
Releases for hieutran21198/software-engineering.
[Use release <tag>; otherwise use the latest published release.]

Inspect the workspace and its instructions first. Identify the host
operating system and processor, select the matching release asset,
and download it and SHA256SUMS from the same release into a separate
unused directory. Verify the asset checksum before running it. Make
it executable on Linux or macOS. Do not build from source or require Go.

List available architectures, then preview --arch artifact-driven
with --project <consumer-workspace> --dry-run. Adopt to
docs/artifact-driven if no conflicts exist.

Configure your own harness to use the bundled coordinator, PO, TL,
and implementer skills, plus the required kiss and asd-ste-100 skills
for every role. Apply both during existing self-checks. Use native
team and skill capabilities; keep the canonical ADD bundle and its
references intact. Add concise ADD guidance to the applicable existing
AGENTS.md or CLAUDE.md, preserving unrelated instructions. Report any
capability or instruction conflicts.

The coordinator must interview me, complete Requirement, Specification,
and Plan with self-checks and phase commits, then wait for my plan
approval. A new plan or material change requires renewed approval.
Independent implementation agents use separate worktrees. Dependent
implementation waits for required established upstream versions.
After validation, prepare proposed versions and linked PRs, then stop
for team review and merge. Never commit directly to protected branches.

Preserve existing edits and stop on conflicts. Check that the adopted
overview, skills, patterns, and guideline links resolve and that your
harness can load the configured roles. Report the release tag, asset,
checksum verification result, destination, and setup changes. Adoption
does not authorize starting a domain change, implementing it,
committing setup, pushing, or merging.
```

If release access, a matching asset, checksum verification, or the destination is unavailable, report the blocker. Do not substitute another repository, run an unverified binary, or install tooling without authorization.

The request authorizes binary download, verified bundle adoption, and project-local harness setup. Beginning a domain change is separate work and implementation still requires the ADD interview and plan approval.
