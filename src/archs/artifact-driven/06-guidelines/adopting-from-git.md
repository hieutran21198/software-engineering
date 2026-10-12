# Adopting from a Git Repository

## Inputs

You need the Software Engineering repository URL, an existing consumer knowledge workspace, Git for fetching the source, and Go 1.25 or later to build the command. Use a trusted source and inspect repository instructions before executing commands. If a particular tag or commit is required, check it out before building.

The URL is not hard-coded because this source repository has no configured publishing remote. Replace the example URL and paths with actual values.

## Fetch and Build

Choose an unused directory for the source checkout. From a shell, run:

```sh
git clone <repository-url> /path/to/software-engineering-source
cd /path/to/software-engineering-source
go build -o /tmp/se-adopt ./cmd/se-adopt
/tmp/se-adopt --list
```

The source checkout is separate from the consumer project. Do not clone over existing project files.

## Preview and Adopt

```sh
/tmp/se-adopt --arch artifact-driven --project /path/to/consumer --dry-run
/tmp/se-adopt --arch artifact-driven --project /path/to/consumer
```

The default destination is `docs/artifact-driven`. Use `--output docs/add` for another relative destination. Identical files are retained; conflicting files stop adoption without overwriting existing content. Reconcile conflicts or choose another destination.

Read the adopted `README.md` and `06-guidelines/README.md`. The consumer AI then configures the skills and role team for its own harness and adds focused ADD guidance to the applicable existing `AGENTS.md` or `CLAUDE.md`, preserving unrelated instructions. Review these setup changes through your normal branch and PR process. The copy command itself does not perform harness setup or publish changes.

## Ask an AI Agent to Adopt

Provide the actual URL and consumer workspace in this request:

```text
Adopt Artifact-Driven Development into my knowledge workspace at
<consumer-workspace> using the Software Engineering repository at
<repository-url>. [Use revision <tag-or-commit> if required.]

Inspect the workspace and its instructions first. Clone the source into
a separate unused directory, inspect its instructions, and build se-adopt
with Go 1.25 or later. Preview --arch artifact-driven with --dry-run,
then adopt to docs/artifact-driven if no conflicts exist.

Configure your own harness to use the bundled coordinator, PO, TL,
and implementer skills. Use native team and skill capabilities; keep
the canonical ADD bundle and its references intact. Add concise ADD
guidance to the applicable existing AGENTS.md or CLAUDE.md, preserving
unrelated instructions. Report any capability or instruction conflicts.

The coordinator must interview me, complete Requirement, Specification,
and Plan with self-checks and phase commits, then wait for my plan
approval. A new plan or material change requires renewed approval.
Independent implementation agents use separate worktrees. Dependent
implementation waits for required established upstream versions.
After validation, prepare proposed versions and linked PRs, then stop
for team review and merge. Never commit directly to protected branches.

Preserve existing edits and stop on conflicts. Check that the adopted
overview, skills, patterns, and guideline links resolve and that your
harness can load the configured roles. Report the source revision,
destination, and setup changes. Adoption does not authorize starting
a domain change, implementing it, committing setup, pushing, or merging.
```

If the URL, access, Go toolchain, or destination is unavailable, ask for the missing input or report the blocker. Do not substitute another repository or install tooling without authorization.

The optional revision instruction can be removed when no revision is specified. The request authorizes bundle adoption and project-local harness setup. Beginning a domain change is separate work and implementation still requires the ADD interview and plan approval.
