# Nix packages

The repository flake provides `se-adopt` and `artifact-plane` for `x86_64-linux`, `aarch64-linux`, `x86_64-darwin` and `aarch64-darwin`.
Use Nix with the `nix-command` and `flakes` features enabled.

## Build and run

From the repository root:

```sh
nix build .#se-adopt
./result/bin/se-adopt --list

nix build .#artifact-plane
./result/bin/artifact-plane --help

nix run .#se-adopt -- --project /absolute/consumer/workspace
nix run .#artifact-plane -- serve
```

Each build replaces the local `result` link. Use `--out-link` to keep separate links.
The packages include their application files and runtimes. Running them does not require a source checkout or `npm install`.

## Install

Install the local reviewed checkout:

```sh
nix profile install .#se-adopt .#artifact-plane
```

After the change has merged, install from GitHub:

```sh
nix profile install github:hieutran21198/software-engineering#se-adopt github:hieutran21198/software-engineering#artifact-plane
```

Nix profile changes must be available on the MCP client's PATH. Restart the client after installation if it inherited an older PATH.
An MCP client can run `artifact-plane` with argument `mcp` from a Git workspace, or use `mcp --repository /absolute/repository`.

## Runtime data

Artifact Plane preserves the calling directory, CLI arguments and existing environment settings.
Set `PORT` to change the HTTP port. Set `ARTIFACT_PLANE_STATE_DIR` to select a writable private directory outside repositories.
The default state location is `$XDG_STATE_HOME/artifact-plane`, or `~/.local/state/artifact-plane`.

Semantic discovery needs the pinned model. Download it once with:

```sh
artifact-plane model-install
```

The download requires network access. Model files and runtime state are stored outside the Nix store.
Git is included on the command's PATH. Optional Go analysis and agent integrations use tools available on the caller's PATH.

## Build checks

```sh
nix flake show --all-systems
nix flake check
```

The package check exercises adoption of both bundles, the embedded validator, Plane help and version, native module loading, HTTP assets and an MCP handshake.
On aarch64-linux, ONNX Runtime reads the CPU list from `/sys/devices/system/cpu`, which the build sandbox does not contain. Add `extra-sandbox-paths = /sys/devices/system/cpu` to the Nix configuration of a trusted user before you run the check there. The installed command does not need this setting.
Model installation and inference require a separate runtime check because model downloads are excluded from sandboxed builds.
Run that check against a built package:

```sh
nix build .#artifact-plane
node nix/tests/semantic.mjs ./result
```

The semantic check needs Node.js 24 or later, network access and temporary disk space for the model. It removes its temporary state after the check.
The Nix workflow in `.github/workflows/nix.yml` runs the package check natively on x86_64-linux, aarch64-linux, x86_64-darwin and aarch64-darwin.
Real model installation and inference were checked on x86_64-linux.

## Dependency updates

The se-adopt package version is `current_version` of `docs/artifacts/artifact-driven/README.md`, the ADD version that names se-adopt releases. The Artifact Plane package version is the version in `apps/artifact-plane/package.json`.
`flake.lock` pins Nixpkgs and Snowfall. Nixpkgs 26.05 retains Intel macOS support; 26.11 removes that target.
Update the pin deliberately if the supported targets change.
After updating `apps/artifact-plane/package-lock.json`, temporarily set the hash in `lib/npm-deps.nix` to `sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`, build either package, and replace it with the reported hash.
Both packages share the fixed npm cache because se-adopt embeds the generated ADD validator.
