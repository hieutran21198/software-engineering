---
id: se-adopt
depends_on: [flake]
covers:
  - element: requirements/packages.md
    ids: [NP1, NP4, NA2]
---

# Build se-adopt

## Scope and location

Implement nix/packages/se-adopt/default.nix and package-specific checks.

## Definition of Done

- [x] Build the installed binary from repository Go sources.
- [x] Run existing command and adoption tests.
- [x] Run installed --help and --list outside the source checkout.
- [x] Adopt both architectures into separate temporary workspaces and verify expected bundle files.
- [x] Record commands, platform and results.

## Evidence

Platform: x86_64-linux.
Ran nix build .#artifact-plane .#se-adopt --no-link -L: both packages built successfully.
The Go build runs go test ./cmd/se-adopt ./internal/adopt; both packages passed.
Ran nix build .#checks.x86_64-linux.packages --no-link -L: passed.
The check invokes the installed help and list commands from temporary directories, adopts both bundles and checks their README files.
It runs the adopted add-validate.mjs against a temporary ADD repository and requires ok true.
The builder generates that validator from the existing application entry point with Vite and embeds it before Go compilation.
Source filtering retains the Go module, command, adoption engine, architecture sources, skill sources and ADD bundle. Unrelated workspace files are excluded.

