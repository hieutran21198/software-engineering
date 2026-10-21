---
id: deliver
depends_on: []
covers:
  - element: requirements/packages.md
    ids: [NP1]
---

# Deliver the se-adopt version

## Scope and location

nix/packages/se-adopt/default.nix and nix/README.md.

## Definition of Done

- [x] The se-adopt package version is `current_version` of docs/artifacts/artifact-driven/README.md, and evaluation fails when the record has no version.
- [x] nix/README.md names the version source of both packages.
- [x] nix eval gives the ADD version for x86_64-linux and aarch64-darwin.
- [x] The package check builds se-adopt with that version and passes on x86_64-linux.
- [x] The Nix workflow passes on the four systems.
- [x] nixfmt, the validator and git diff --check pass.

## Evidence

Implementation commit 49c25ca: nix/packages/se-adopt/default.nix reads `current_version` with lib.pipe over the ADD identity record and throws "The ADD identity record has no current_version." when no line matches. nix/README.md names the version source of both packages.

Ran nix eval --raw .#packages.x86_64-linux.se-adopt.version and .#packages.aarch64-darwin.se-adopt.version: 3.2.0 for both.

Ran nix build .#checks.x86_64-linux.packages .#se-adopt --no-link --print-out-paths: /nix/store/xw93hnnmkn1kwg64c459rjcpw89y7hrz-se-adopt-3.2.0, and the package check log printed "PASS: adoption, embedded validator, CLI, native modules, HTTP assets and MCP handshake".

Nix workflow run 39542791275 on 49c25ca: x86_64-linux, aarch64-linux, x86_64-darwin and aarch64-darwin built se-adopt-3.2.0 and printed the same PASS line.

Ran nixfmt --check nix/packages/se-adopt/default.nix and git diff --check: passed. Ran node apps/artifact-plane/scripts/validate-knowledge.mjs --repository . --change nix-packages/change-se-adopt-version: ok true, allowed tier small, two open-change-conflict warnings for the merged branch feat/nix-packages and its remote copy.
