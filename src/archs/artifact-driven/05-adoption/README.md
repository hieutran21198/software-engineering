# Adoption

`se-adopt` is an architecture-aware Go command that copies a selected knowledge and role-skill bundle into a consumer workspace. ADD (`artifact-driven`) is currently the only available architecture and the default selection. The default destination is `docs/<architecture>`, which is `docs/artifact-driven` for ADD.

## Build

From the Software Engineering source repository, using Go 1.25 or later:

```sh
go build -o /tmp/se-adopt ./cmd/se-adopt
```

The binary embeds the bundle at build time. Rebuild it to include updated knowledge. Running it does not require the source repository or network access.

## Adopt

From the consumer workspace:

```sh
/tmp/se-adopt
```

Or select the consumer directory explicitly:

```sh
/tmp/se-adopt --project /path/to/consumer
```

List available architectures or select ADD explicitly:

```sh
/tmp/se-adopt --list
/tmp/se-adopt --arch artifact-driven --project /path/to/consumer
```

Unknown architecture names fail without writing. Additional architectures can be registered in the source catalog as they become available.

Preview changes or choose another workspace-relative destination:

```sh
/tmp/se-adopt --project /path/to/consumer --dry-run
/tmp/se-adopt --project /path/to/consumer --output docs/add
```

The consumer workspace must already exist. Output paths must remain inside it. Destination symlinks are rejected.

## Result

The destination contains the ADD overview, foundation, methodology, execution guidance and role skills, reusable patterns, adoption guide, and end-user guidelines. Relative documentation links remain usable within the copied bundle.

This destination holds ADD guidance. Project-specific artifacts can use the documented `docs/artifacts/` structure; adoption does not invent domain artifacts, tasks, or versions.

Read the copied overview, then use the coordinator skill in `03-execution/skills/add-coordinator/SKILL.md` with your agent. Skills are supplied as files; this command does not register them in a particular agent tool or modify consumer `AGENTS.md` files.

For AI-assisted adoption, the consumer agent handles project-local skill/team setup and focused additions to its applicable `AGENTS.md` or `CLAUDE.md`. The bundled end-user guidelines specify required capabilities; the agent chooses the native configuration appropriate to its harness.

## Existing Files

Repeated adoption retains identical files and adds missing bundle files. If a bundled path already contains different content or conflicts with a directory, the command fails before copying. It does not overwrite consumer edits or remove unrelated files.

For updates that conflict with local changes, compare and reconcile manually or adopt into a separate directory. There is no automatic upgrade, forced overwrite, Git commit, push, or PR creation. The normal ADD workflow applies when you begin a project change.

## Required Utility Skills

The ADD bundle includes `kiss` and `asd-ste-100` under `required-skills/`. Both are required for ADD work. The copy command embeds their canonical utility sources, so adopted bundles remain self-contained. Consumer AI setup must make both skills available to every ADD role.
