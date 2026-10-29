---
id: measurement
depends_on: [retrieval]
covers:
  - element: requirements/context-efficiency.md
    ids: [CE5]
---

# Benchmark and integration evidence

## Scope and ownership

Sequential implementer, coordinated in this checkout. apps/artifact-plane/server, scripts and relevant Node and adapter tests.

## Governing knowledge

requirements/context-efficiency.md and specifications/context-efficiency.md. Existing ADD boundaries and approval rules apply. The combined plan was explicitly approved in the conversation before implementation.

## Definition of Done

- [x] Implement the three-scenario, three-pair live runner with fixed model/settings, exact fact and approval oracles, private transcripts, usage accounting and an incomplete result on unavailable usage.
- [x] Exercise all 18 isolated preparations with a synthetic runner as a runner test; do not report synthetic usage as measured savings.
- [x] Run deterministic payload comparisons and label them as proxies.
- [x] Complete and record the integrated browser check.

## Evidence

The benchmark unit tests passed all four cases, including all 18 isolated scenario preparations, exact prompt pairing, restored dirty resumed sources and early stop after missing live usage. Synthetic equal usage fails the savings threshold. Missing runs, incorrect facts, different models, partial usage and unaccounted delegation cannot pass acceptance.

`npm run test:browser` passed all 177 tests with system Chromium (8.2 minutes), with no failures or skips. The integrated Node, browser, build, Go and scoped-validator checks pass. Live savings remain a separate incomplete acceptance criterion.

### Payload proxy

`node scripts/context-benchmark.mjs --payload-only --output /tmp/plane-context-payload-evidence` produced:

| Scenario | Legacy packet bytes | First compact page bytes |
| --- | ---: | ---: |
| Contained | 30463 | 5131 |
| Multi-artifact | 31020 | 4888 |
| Resumed | 30790 | 5368 |

Every compact response has a continuation. These first-page values do not imply equal coverage, model-visible tokens, accepted savings or lower total workflow cost.

### Live measurement blocker

The first read-only Codex probe could not initialize its runtime in the sandbox's read-only home. An automatically approved runtime probe then reached the model transport, but the proxy returned HTTP CONNECT 403 for the Codex responses endpoint. The probe supplied no completed model turn or token usage and was stopped. Raw probe output stays outside the checkout. No actual token percentage or MCP model-rendering behavior is claimed. Restore authorized model endpoint access, then run:

```sh
node scripts/context-benchmark.mjs --model <same-model-for-every-run> --baseline fe44680 --output /absolute/private/output
```

### Deferred live run

The owner deferred the 18 real model runs and the savings target to a later change. The removed DoD item was: "Execute all 18 real model runs; meet 25% median paired input reduction with no scenario regression above 10% and every correctness oracle passing." This task claims no measured savings. The `live-token-savings` claim in the specification stays open.

## Plane 1.30.0 preparation

The user requested this version update in the conversation. The package, lockfile and proposed version record name 1.30.0. No dependency declarations or resolved dependency integrities change. Nix is not installed in the cloud machine, and its download host returns HTTP 403. Updating root version metadata in package-lock.json can change the fixed-output Nix dependency hash. The existing trusted hash remains unchanged until it can be regenerated and verified with the pinned Nix tooling. Nix packaging and release readiness remain unverified.

Version preparation checks: the package, root lockfile metadata and identity record agree on 1.30.0; `check-release-version.mjs plane-v1.30.0` passes; the ten release-version and app CLI/HTTP/MCP tests pass; the source CLI reports 1.30.0. No dependency versions or integrity strings change. Nix validation remains pending as described above.
