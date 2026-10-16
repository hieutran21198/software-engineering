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

Use a chosen release tag for repeatable adoption. The examples use `v1.1.0`; change the tag when selecting another release. Verify the checksum before running the binary.

### Linux and macOS

This shell example selects the platform, downloads into a new temporary directory, and checks the selected asset:

```sh
release=v1.1.0
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
release_url="https://github.com/hieutran21198/software-engineering/releases/download/$release"
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
$release = 'v1.1.0'
$asset = 'se-adopt-windows-amd64.exe'
$releaseUrl = "https://github.com/hieutran21198/software-engineering/releases/download/$release"
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

The destination contains the ADD overview, foundation, methodology, execution guidance and role skills, reusable patterns, adoption guide, and end-user guidelines. Relative documentation links remain usable within the copied bundle.

This destination holds ADD guidance. Project-specific artifacts can use the documented `docs/artifacts/` structure; adoption does not invent domain artifacts, tasks, or versions.

Read the copied overview, then use the coordinator skill in `03-execution/skills/add-coordinator/SKILL.md` with your agent. Skills are supplied as files; this command does not register them in a particular agent tool or modify consumer `AGENTS.md` files.

For AI-assisted adoption, the consumer agent handles project-local skill/team setup and focused additions to its applicable `AGENTS.md` or `CLAUDE.md`. The bundled end-user guidelines specify required capabilities; the agent chooses the native configuration appropriate to its harness.

## Existing Files

Repeated adoption retains identical files and adds missing bundle files. If bundled paths already contain different content or conflict with a file, directory or symlink, the command checks every destination, lists all conflicts with a code, path and action, and fails before copying. A blocked parent directory is listed once. When a fatal read error stops the check early, the output says that the inventory is incomplete. The command does not overwrite consumer edits or remove unrelated files.

Add `--json` to any command to write one `se-adopt.result.v1` JSON object to standard output instead of text, for scripts and agents. It contains `operation`, `ok`, `created`, `unchanged`, `diagnostics`, `complete` and `error`; a failed run always reports `created: 0`. `--help` stays text:

```sh
./se-adopt --project /path/to/consumer --dry-run --json
```

For updates that conflict with local changes, compare and reconcile manually or adopt into a separate directory. There is no automatic upgrade, forced overwrite, Git commit, push, or PR creation. The normal ADD workflow applies when you begin a project change.

## Required Utility Skills

The ADD bundle includes `kiss` and `asd-ste-100` under `required-skills/`. Both are required for ADD work. The copy command embeds their canonical utility sources, so adopted bundles remain self-contained. Consumer AI setup must make both skills available to every ADD role.

## Flow knowledge after adoption

The bundle includes the [system-flow format](../06-guidelines/system-flows.md) and phase maintenance instructions. Adoption copies guidance; it does not invent project flows, evidence, or unit membership. After adoption, the coordinator investigates existing knowledge and implementation, records applicable flow impact in each new unit, and keeps detailed flow definitions in their owning specifications. Configure available flow retrieval for source-backed discovery and retain targeted repository inspection when indexes are incomplete or stale.
