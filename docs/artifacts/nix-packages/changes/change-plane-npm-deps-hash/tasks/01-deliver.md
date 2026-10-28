---
id: deliver
depends_on: []
covers:
  - element: requirements/packages.md
    ids: [NP5]
---

# Deliver the refreshed hash

## Scope and location

`nix/lib/npm-deps.nix`.

## Definition of Done

- [x] The fixed-output hash equals the derivation value of the 1.29.0 Plane
      sources on every target.
- [x] `nix build .#checks.x86_64-linux.packages` builds the dependency set and
      the package check.
- [x] The knowledge validator reports `ok: true`, `nixfmt` passes and
      `git diff --check` passes.

## Evidence

Changed `nix/lib/npm-deps.nix` to
`sha256-dqLIaoctAYMZc9HqGJaFQ3u6aK0V9orf7qY3jSzeSsc=`. The failed run on
revision 8727e0b reported the same value on x86_64-linux, aarch64-linux,
x86_64-darwin and aarch64-darwin; it replaced
`sha256-psZAqaiAwh9vM7VMEFqf7JNjjNoJVlshYeLwZYuwRu0=`.

`nix build .#checks.x86_64-linux.packages -L --no-link` exited 0 with Nix
2.35.3. It built `artifact-plane-1.29.0` at
`/nix/store/iic932kznr0f7fz2cfwhvl6pnj4q26py-artifact-plane-1.29.0`, resolved
the ONNX and Sharp native libraries, and the package smoke check printed
"PASS: adoption, embedded validator, CLI, native modules, HTTP assets and MCP
handshake". The other three targets exercise the same platform-independent hash
in CI.
