# Adoption and publishing contract

The [agent efficiency contract](agent-efficiency.md) extends this baseline with
aggregate preflight diagnostics and optional JSON output. Its explicit rules
replace the first-error-only and no-machine-readable-schema statements below;
unaffected default copying, adoption and publishing behavior remains applicable.
The [adoption guidance contract](adoption-guidance.md) defines which bundle page
owns each adoption instruction, release selection and the steps after adoption.

Governs R4–R5, R7–R9 and A2–A6 in [baseline requirements](../requirements/baseline.md). Primary files are listed in [the evidence inventory](../requirements/evidence.md).

## Bundle interface

src/archs/catalog.go returns a fresh Architecture catalog with Name, Description and fs.FS Bundle. The default entry is artifact-driven; story-driven is also available. Lookup rejects unsupported names. Flow guidance extends the ADD bundle without changing architecture selection or copying behavior.

docs/artifact-driven/bundle.go (package artifactdriven) embeds README.md, sections 01-foundation through 06-guidelines and tools from the canonical bundle directory; no second copy of the bundle exists (decision 017). It mounts src/utils/agents/skills at required-skills; it does not maintain a second embedded utility copy. tools/README.md is always embedded; tools/add-validate.mjs is embedded when the release build has placed it there (decision 016, record-checks.md). Open, ReadFile, ReadDir and directory iteration support valid fs paths, including the mounted directory. Invalid paths return filesystem errors. bundle_test.go applies fstest.TestFS and checks that no Go file is part of the embedded bundle. The website build copies the bundle Markdown from docs/artifact-driven to its existing site path src/archs/artifact-driven. The delivered bundle contains role metadata, required skill metadata and relative references; it does not contain project artifacts, Go source, or workflow state.

## CLI interface

cmd/se-adopt/main.go defines these inputs:

| Input | Default | Behavior |
| --- | --- | --- |
| --project | . | Existing consumer workspace. |
| --arch | artifact-driven | Select catalog entry. Unsupported name errors before copying. |
| --output | docs/<architecture> when omitted | Explicit workspace-relative destination; explicit empty value is invalid. |
| --list | false | Print name and description for each entry and return without opening/writing the workspace. |
| --dry-run | false | Validate and count pending/unchanged assets without filesystem writes. |
| --help | false | Print usage; return success. |

Unexpected positional arguments and unknown flags fail. Go flag parsing governs accepted forms; no additional configuration file or network protocol is supplied. The executable writes errors to stderr prefixed se-adopt: and exits 1. Successful adoption writes an Adopted or Would adopt line containing description, destination and counts, then a Start with README path. Result.Destination is absolute; Created counts new or would-create files and Unchanged counts byte-identical files. This interface does not promise a machine-readable output schema beyond the existing API.

## Copy and failure behavior

internal/adopt.Copy(bundle fs.FS, project, output string, dryRun bool) returns Result and error. Reject empty output, dot, nonlocal/absolute/escaping paths and a missing/unopenable project. Open the workspace using os.OpenRoot. Walk regular valid bundle files, read contents, and preflight all destinations before writing. Reject nonregular entries, symlink/non-directory parents, differing content, and nonregular destinations. Retain identical files and leave unrelated consumer files intact. An empty bundle errors.

Dry-run returns the same preflight counts without creating directories. Real copying creates needed directories with 0755 and files exclusively with 0644. Exclusive creation rejects files that appear after preflight. A write/close failure attempts removal of files created by that invocation; directories may remain and rollback removal errors are ignored. This is not a filesystem transaction or a guarantee of atomicity against all concurrent external changes. Ordinary preflight conflicts create no new files.

The command does not overwrite differing files, remove obsolete/unrelated files, auto-upgrade, download releases, register agents, edit consumer instructions, generate domain artifacts, commit, push, or open PRs. Consumer setup and updates are documented human/agent procedures. Existing tests cover copying/repeat, full embedded bytes, required utilities, custom output/dry-run, invalid CLI inputs, conflict preflight, unsafe destinations, type conflicts and adding missing files.

## Documentation and release interface

website/scripts/prepare-docs.mjs regenerates website/.docs from repository README.md and Markdown under src. It adds pagination metadata and a root slug without changing sources. Docusaurus uses generated Markdown, Mermaid, a generated sidebar and strict broken-link handling. Existing configuration derives repository site URL/base path, with SITE_URL and SITE_BASE_URL overrides. The current generator does not publish docs/artifacts or the local docs/artifact-driven bundle. Publishing project artifacts would be future work, not an unfulfilled baseline requirement.

The existing .github/workflows/ci.yml runs on PRs, main/master pushes, v* tags and manual dispatch. Go checks run go test ./... and go vet ./.... The build matrix is Linux/macOS/Windows × AMD64/ARM64 with CGO_ENABLED=0, trimpath and SHA256SUMS. The documentation job installs locked dependencies and builds with Node 24. Artifact Plane has its own app tests/build/browser job; it remains separately owned.

Pages deployment is configured only on the default branch outside PRs, after Go/docs jobs pass. Tag release publication waits for Go/docs and attaches six binaries plus checksums. Tag runs do not meet the default-branch Pages condition. Configuration is evidence of delivery rules, not proof a deployment or release exists. Download instructions require assets and checksums from the same selected release and successful verification before running. Consumer download is not an executable adoption subcommand.

Go module baseline is Go 1.25; website package requires Node >=22, while repo instructions and CI use Node 24. Use existing tool versions for delivery validation. No release tag or deployment is planned.

## Version boundaries and impact

The artifact version describes complete ADD knowledge. It is separate from repository v* binary tags and Artifact Plane's app/artifact versions. This evidence-and-usability delivery adds bundled guidance and examples without changing CLI flags or copy semantics. All supporting implementation remains inside this artifact boundary; no new dependency edge is required merely because Go imports packages or the website renders guidance.

## Specification self-check

CLI, filesystem, bundle and publishing contracts reflect inspected code. Error behavior and rollback limits avoid stronger claims than implementation supports. Existing checks and explicit reviews can validate this baseline without new abstractions or code. KISS/STE checks pass; no Specification blocker prevents Plan. Current parity and test execution still require task evidence.
