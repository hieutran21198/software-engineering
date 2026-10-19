---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/specifications/app-release.md#specification-self-check
claims:
  - id: node-sea
    kind: decision
    statement: The executable is a Node.js single executable application whose
      CommonJS launcher extracts the payload and imports the ES module entry.
    status: supported
    basis: observed
    evidence:
      - docs/artifacts/artifact-plane/specifications/app-release.md#packaging
    check: Build a blob with node --experimental-sea-config on Node 24.21.0,
      inject it with postject, and run a launcher that writes an ES module
      asset to a temporary directory, imports it and opens node:sqlite.
    rejected:
      - option: A platform-independent archive that needs Node.js 24.
        reason: The owner chose one executable file per target on 19 October
          2026.
      - option: Bun or Deno compile.
        reason: The server uses node:sqlite and Node-specific packages; a second
          runtime adds a second set of behaviors to test.
  - id: bundled-onnx-runtime
    kind: decision
    statement: Each executable carries the onnxruntime-node binding of its own
      target, so semantic discovery needs only the model download.
    status: open
    basis: inferred
    rejected:
      - option: Download the runtime with the model.
        reason: The npm package of the runtime holds the bindings of all
          targets in one large file, and a second download path adds a second
          failure mode.
    risk_if_wrong: The executable is larger than estimated, about 150 to 200 MB
      instead of about 120 MB.
    check: Compare the size of each built file in the CI artifacts with 200 MB.
  - id: sharp-import
    kind: unknown
    statement: The Node build of @huggingface/transformers imports sharp at load
      time, so the payload needs the sharp binding of its target.
    status: verified
    basis: observed
    verified_by: agent
    evidence:
      - docs/artifacts/artifact-plane/changes/change-human-guidance/tasks/06-app-build.md#evidence
    risk_if_wrong: Semantic discovery fails in the executable with a missing
      module error.
    check: Run the model install and one semantic query with the Linux AMD64
      executable on a machine without Node.js on the path.
---

# Application release contract

## Governing requirements

AR1 to AR8 in requirements/app-release.md.

## Command line

The executable `artifact-plane` (`artifact-plane.exe` on Windows) accepts:

| Command | Effect | Exit status |
| --- | --- | --- |
| none, or `serve` | starts the server as `npm start` does: `PORT` (default 4310), `ARTIFACT_PLANE_STATE_DIR`, the same routes and pages; prints `Artifact Plane <version>: http://127.0.0.1:<port>` | 1 when the port is invalid or in use |
| `mcp` | runs the stdio MCP server of `npm run mcp` | as the MCP server |
| `model-install` | runs the pinned model installer of `npm run flow:model-install` | 1 when a download or a hash check fails |
| `--version` | prints the package version | 0 |
| `--help` | prints the commands and environment variables | 0 |
| another argument | prints the help to standard error | 2 |

The source entry `server/app.js` implements this table. `npm start` and `npm run mcp` keep their scripts.

## Packaging

`npm run build:app` runs `scripts/build-app.mjs` and writes `release/artifact-plane-<os>-<arch>[.exe]` for the operating system and processor of the running Node.js. `<os>` is `linux`, `darwin` or `windows`; `<arch>` is `amd64` or `arm64`. Steps:

1. Build the browser application (`vite build`).
2. Bundle `server/app.js` with Vite in SSR mode into one ES module `payload/server.mjs`. `@huggingface/transformers` and its runtime packages stay external.
3. Copy into `payload/`: `dist/`, the external packages with only the native files of the running target, and a `manifest.json` with the version and the SHA-256 of every payload file.
4. Use `scripts/app-launcher.cjs` as the main of the blob; it reads the version from the manifest asset. At start it computes the cache directory `<state>/app/<version>-<first 12 hex of the manifest hash>`. When that directory has no `manifest.json` with the same hash, it writes every asset into a new sibling directory and renames it into place. Then it imports `server.mjs` from the cache directory with the arguments.
5. Generate the blob with `node --experimental-sea-config` (`useSnapshot: false`, `useCodeCache: false`, `disableExperimentalSEAWarning: true`, one asset for each payload file), copy `process.execPath`, and inject the blob with the pinned `postject`. On macOS, remove the signature before injection and sign ad hoc (`codesign --sign -`) after it.

The state directory default is the existing `defaultStateDir()`. The cache keeps only the two newest version directories; the launcher removes older ones after a successful start. The server finds `dist/` relative to `server.mjs` in the cache directory and relative to `server/` in a source checkout.

## Continuous integration

The workflow `.github/workflows/ci.yml` gains the job `plane-app` with a matrix of six targets, each on its own runner:

| Target | Runner |
| --- | --- |
| linux-amd64 | ubuntu-24.04 |
| linux-arm64 | ubuntu-24.04-arm |
| darwin-arm64 | macos-15 |
| darwin-amd64 | macos-15-intel |
| windows-amd64 | windows-2025 |
| windows-arm64 | windows-11-arm |

Each job sets up Node.js 24.21.0 exactly, runs `npm ci` with `ONNXRUNTIME_NODE_INSTALL_CUDA=skip`, `npm run build:app` and `node scripts/app-smoke.mjs <file>`, then uploads the file as the artifact `artifact-plane-<target>`. The smoke check runs the file with a new temporary state directory and a free port, and checks:

- `--version` prints the package version;
- `GET /` returns the application page;
- the explore route opens this checkout and reports at least one artifact;
- `mcp` answers `initialize` and lists its tools;
- the process stops on SIGTERM (Ctrl+Break on Windows) within 5 seconds.

The jobs `artifact-plane`, `go`, `docs`, `deploy` and `release` keep their steps and conditions.

## Release

The workflow also runs on tags `plane-v*`. The job `plane-release` runs only for such a tag, needs `artifact-plane` and `plane-app`, and:

1. runs `node scripts/check-release-version.mjs <tag>`, which exits 1 unless the tag version equals the package version and `current_version` of docs/artifacts/artifact-plane/README.md;
2. downloads the six files, writes `SHA256SUMS` with `sha256sum`;
3. runs `gh release create <tag> <files> --verify-tag --title "Artifact Plane <version>" --generate-notes`.

The existing `release` job keeps its condition `startsWith(github.ref, 'refs/tags/v')`, which a `plane-v` tag does not meet. A `v` tag does not run `plane-release`.

## README

The Plane README gains "Install" before "Run": download the file of the target and `SHA256SUMS` from the release, check the sum (`sha256sum --check --ignore-missing`, or `Get-FileHash` on Windows), make it executable on Linux and macOS, start it, and the commands of the table above. It names the warnings for an unsigned file: on macOS, `xattr -d com.apple.quarantine artifact-plane-darwin-<arch>` or Open in the Finder context menu; on Windows, "More info" and "Run anyway". "Run" keeps the source path.

## Validation

ARA1 and ARA4: the CI run of the pull request and the tests of `check-release-version.mjs` with a matching tag, a different package version, a different `current_version` and a `v` tag. ARA2: the Linux AMD64 file from the CI artifact, run with a `PATH` without Node.js, opens this repository and lists the MCP tools. ARA3: `model-install` and one semantic query with the same file. ARA5: the README section and the existing suites.

## Specification self-check

- AR1, AR2: Packaging and the target table. AR3: Command line. AR4: `model-install`, claims bundled-onnx-runtime and sharp-import. AR5: Release. AR6: Continuous integration. AR7: README. AR8: unchanged jobs and scripts.
- The decision node-sea is supported by the spike recorded in its check. The decisions bundled-onnx-runtime and the unknown sharp-import are open; implementation records their checks.
- KISS: one build script, one launcher, one smoke script, one version check, the existing release mechanism. No installer and no updater.
- STE: one rule in each row or step.
- No blocker prevents Plan.
