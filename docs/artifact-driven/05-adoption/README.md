# Adoption

`se-adopt` is an architecture-aware Go command that copies a selected knowledge and role-skill bundle into a consumer workspace. ADD (`artifact-driven`) is the default selection. Use `se-adopt --list` to see the architectures included in your binary. The default destination is `docs/<architecture>`, which is `docs/artifact-driven` for ADD.

## Download the Binary

Download `se-adopt` and `SHA256SUMS` from the same [GitHub Release](https://github.com/hieutran21198/software-engineering/releases). Go and a source checkout are not required. The binary contains the ADD knowledge and required skills for that release; adoption runs locally without network access after download.

Choose the asset for your operating system and processor:

| Platform | Processor | Asset |
| --- | --- | --- |
| Linux | AMD64 / x86-64 | `se-adopt-linux-amd64` |
| Linux | ARM64 / aarch64 | `se-adopt-linux-arm64` |
| macOS | Intel | `se-adopt-darwin-amd64` |
| macOS | Apple silicon | `se-adopt-darwin-arm64` |
| Windows | AMD64 / x86-64 | `se-adopt-windows-amd64.exe` |
| Windows | ARM64 | `se-adopt-windows-arm64.exe` |

The bundle in a release can be older than `main` or the published website. When the two differ, read the adopted copy, not the website.

Set a chosen tag for repeatable adoption. Leave the tag empty to use the latest published release. The scripts use the same tag for the asset and `SHA256SUMS` and print the tag that they use; record it. Verify the checksum before running the binary.

### Linux and macOS

This shell example resolves the release, selects the platform, downloads into a new temporary directory, and checks the selected asset:

```sh
release=
repo_url=https://github.com/hieutran21198/software-engineering
if [ -z "$release" ]; then
  latest_url=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "$repo_url/releases/latest")
  release=${latest_url##*/}
fi
case "$release" in
  v*) echo "Using release $release" ;;
  *) echo 'Could not resolve a release tag.'; exit 1 ;;
esac
case "$(uname -s)" in
  Linux) platform=linux ;;
  Darwin) platform=darwin ;;
  *) echo 'Use the Windows instructions or select a supported platform.'; exit 1 ;;
esac
case "$(uname -m)" in
  x86_64|amd64) processor=amd64 ;;
  arm64|aarch64) processor=arm64 ;;
  *) echo 'No release asset is available for this processor.'; exit 1 ;;
esac
asset="se-adopt-$platform-$processor"
download_dir=$(mktemp -d)
cd "$download_dir"
release_url="$repo_url/releases/download/$release"
curl -fL "$release_url/$asset" -o "$asset"
curl -fL "$release_url/SHA256SUMS" -o SHA256SUMS
awk -v asset="$asset" '$2 == asset' SHA256SUMS > selected.sha256
test -s selected.sha256 && {
  if [ "$platform" = darwin ]; then
    shasum -a 256 -c selected.sha256
  else
    sha256sum -c selected.sha256
  fi
} && mv "$asset" se-adopt && chmod +x se-adopt
```

Continue only when checksum verification succeeds. Run `./se-adopt --list` from the download directory. Keep the binary in a permanent location if you need it after temporary files are removed.

### Windows

In a new download directory, use PowerShell. Choose the asset from the table for your processor:

```powershell
$release = ''
$repoUrl = 'https://github.com/hieutran21198/software-engineering'
if (-not $release) {
  $response = (Invoke-WebRequest "$repoUrl/releases/latest" -Method Head -UseBasicParsing).BaseResponse
  $latestUrl = if ($response.ResponseUri) { $response.ResponseUri } else { $response.RequestMessage.RequestUri }
  $release = $latestUrl.AbsoluteUri.Split('/')[-1]
}
if ($release -notlike 'v*') { throw 'Could not resolve a release tag.' }
"Using release $release"
$asset = 'se-adopt-windows-amd64.exe'
$releaseUrl = "$repoUrl/releases/download/$release"
Invoke-WebRequest "$releaseUrl/$asset" -OutFile $asset
Invoke-WebRequest "$releaseUrl/SHA256SUMS" -OutFile SHA256SUMS
$line = Get-Content SHA256SUMS | Where-Object { ($_ -split '\s+')[1] -eq $asset }
if (@($line).Count -ne 1) { throw 'Missing or duplicate asset checksum.' }
$expected = ($line -split '\s+')[0]
$actual = (Get-FileHash $asset -Algorithm SHA256).Hash
if ($actual -ne $expected) { throw 'Checksum verification failed.' }
Move-Item $asset se-adopt.exe
.\se-adopt.exe --list
```

On Windows, replace `./se-adopt` in subsequent examples with `.\se-adopt.exe` and use your consumer workspace path.

## Adopt

If the binary is installed on your `PATH`, run `se-adopt` from the consumer workspace. Otherwise, run the downloaded binary from its download directory and select the consumer directory explicitly:

```sh
./se-adopt --project /path/to/consumer
```

List available architectures or select ADD explicitly:

```sh
./se-adopt --list
./se-adopt --arch artifact-driven --project /path/to/consumer
```

Unknown architecture names fail without writing. Additional architectures can be registered in the source catalog as they become available.

Preview changes or choose another workspace-relative destination:

```sh
./se-adopt --project /path/to/consumer --dry-run
./se-adopt --project /path/to/consumer --output docs/add
```

The consumer workspace must already exist. Output paths must remain inside it. Destination symlinks are rejected.

## Result

The destination contains the ADD overview, foundation, methodology, execution guidance and role skills, reusable patterns, adoption guide, end-user guidelines and the `tools/` directory. Relative documentation links remain usable within the copied bundle.

This destination holds ADD guidance. Project-specific artifacts can use the documented `docs/artifacts/` structure; adoption does not invent domain artifacts, tasks, or versions. Skills are supplied as files; the command does not register them in an agent tool or modify consumer `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md` files.

## Existing Files

Repeated adoption retains identical files and adds missing bundle files. If bundled paths already contain different content or conflict with a file, directory or symlink, the command checks every destination, lists all conflicts with a code, path and action, and fails before copying. A blocked parent directory is listed once. When a fatal read error stops the check early, the output says that the inventory is incomplete. The command does not overwrite consumer edits or remove unrelated files.

Add `--json` to any command to write one `se-adopt.result.v1` JSON object to standard output instead of text, for scripts and agents. It contains `operation`, `ok`, `created`, `unchanged`, `diagnostics`, `complete` and `error`; a failed run always reports `created: 0`. `--help` stays text:

```sh
./se-adopt --project /path/to/consumer --dry-run --json
```

For updates that conflict with local changes, compare and reconcile manually or adopt into a separate directory. There is no automatic upgrade, forced overwrite, Git commit, push, or PR creation. The normal ADD workflow applies when you begin a project change.

## Validator

The `tools/` directory always contains a README that explains how to run the record validator. The validator file `tools/add-validate.mjs` is present only when the release build supplies it. Adoption succeeds without it, and the command does not run it. The validator needs Node.js 24 or later:

```sh
node docs/artifact-driven/tools/add-validate.mjs
```

It reads the project knowledge under `docs/artifacts` and writes one JSON object with its diagnostics. It never writes files. The [writing guide](../06-guidelines/writing-artifacts.md#check-records-with-the-validator) lists its checks. Without the file, apply the same rules by hand in each self-check.

## Required Utility Skills

The ADD bundle includes `kiss` and `asd-ste-100` under `required-skills/`. Both are required for ADD work. The copy command embeds their canonical utility sources, so adopted bundles remain self-contained. Consumer AI setup must make both skills available to every ADD role.

## Flow knowledge after adoption

The bundle includes the [system-flow format](../06-guidelines/system-flows.md) and phase maintenance instructions. Adoption copies guidance; it does not invent project flows, evidence, or unit membership. After adoption, the coordinator investigates existing knowledge and implementation, records applicable flow impact in each new unit, and keeps detailed flow definitions in their owning specifications. Configure available flow retrieval for source-backed discovery and retain targeted repository inspection when indexes are incomplete or stale.

## After Adoption

OpenCode V2 is a supported harness. Follow [OpenCode V2 setup](../06-guidelines/working-with-ai.md#opencode-v2-setup) for skill discovery, native role profiles and `AGENTS.md` instructions. Reuse existing `.agents/skills` entries rather than adding duplicate registrations. `se-adopt` does not install profiles, configure MCP or change user instructions.

Command Code is a supported harness. Follow [Command Code setup](../06-guidelines/working-with-ai.md#command-code-setup) for skill discovery, `AGENTS.md` memory, the implementer profile and the project MCP and hook files. Reuse existing `.agents/skills` entries; a duplicate `.commandcode/skills` entry would win a name conflict. `se-adopt` installs no profile and configures no MCP or hook file.

Do these steps in order after a successful copy:

1. Check the result. Run the same `se-adopt` command again with `--dry-run`. A complete adoption reports `0 new files`. Confirm that the destination contains `README.md`, `required-skills/kiss/SKILL.md`, `required-skills/asd-ste-100/SKILL.md` and `tools/README.md`. When `tools/add-validate.mjs` is present, run it once; exit status 0 means that the project knowledge has no error.
2. Configure your harness to load the coordinator, PO, TL and implementer skills, and make both [required skills](../06-guidelines/working-with-ai.md#required-skills) available to every role. The [required capabilities](../06-guidelines/working-with-ai.md#required-capabilities) describe the role setup and the fallback when a capability is unavailable.
3. Add focused ADD instructions to the applicable existing `AGENTS.md`, `CLAUDE.md`, or `GEMINI.md`, as the [required capabilities](../06-guidelines/working-with-ai.md#required-capabilities) describe. Preserve unrelated instructions.
4. Put the adopted bundle and the setup changes on a dedicated branch. Record the release tag in the PR description, then use your normal review and merge process. `se-adopt` does not commit, push or open PRs.
5. Start the first change. [Getting started](../06-guidelines/getting-started.md) explains the first artifact and its `change-initial`, the [minimal change scaffold](../06-guidelines/minimal-change.md) covers a one-artifact outcome, and [Start a change](../06-guidelines/working-with-ai.md#start-a-change) gives a request for your agent.

Adoption and setup do not authorize a domain change, implementation, commits, pushes or merges. Each of these needs its own request, and implementation still needs the ADD interview and plan approval.
