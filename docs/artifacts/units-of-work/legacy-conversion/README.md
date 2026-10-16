---
unit_of_work: legacy-conversion
changes:
  - artifact: artifact-driven
    change: change-legacy-conversion
  - artifact: artifact-plane
    change: change-legacy-conversion
affected_flows:
  - artifact: artifact-driven
    flow: version-publication
    effect: modify
  - artifact: artifact-driven
    flow: unit-validation
    effect: modify
flow_assessment: The conversion changes where historical version knowledge is
  read (the Git commit that introduced a version record instead of a copied
  directory) and how historical unit evidence resolves (retained change tasks
  and structured publication reviews). Plane reading, review, refresh and
  context flows are unchanged because readers already resolve in-place records.
acceptance:
  - id: conversion
    criterion: No version directory holds knowledge and no change holds copied
      knowledge or dependencies.yaml; exceptions are explicit.
  - id: recoverable
    criterion: Every removed file exists unchanged in the commit that introduced
      its version or on main.
  - id: history
    criterion: All historical units read with the same completion and member
      states after the conversion, and links and evidence resolve.
  - id: integration
    criterion: Go, bundle, Plane, script, validation and documentation checks
      pass for the combined change.
    integration: true
evidence:
  - criterion: conversion
    method: migrate-layout --convert-history on this repository.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-legacy-conversion/tasks/01-convert-history.md#evidence
  - criterion: recoverable
    method: Blob comparison of every removed file with its introducing commit or origin/main.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-legacy-conversion/tasks/01-convert-history.md#evidence
  - criterion: history
    method: Plane unit comparison with main set to the converted revision; link and validation scripts.
    result: passed
    source: docs/artifacts/artifact-driven/changes/change-legacy-conversion/tasks/01-convert-history.md#evidence
  - criterion: integration
    method: Combined checks recorded below.
    result: passed
    source: docs/artifacts/units-of-work/legacy-conversion/README.md#combined-checks
---

# Convert retained legacy records

## Included scope

Allow the optional conversion step in the ADD contract and guidance, convert this repository's version and change directories to records, retarget evidence and links, and add the conversion option to migrate-layout.

## Excluded scope

Editing established knowledge, inventing provenance for the version-owned task sets of ADD 1.1.0 and Plane 1.5.0, converting the undelivered Plane change-model-explanations, reader or UI changes, and other repositories.

## Combined checks

Executed on 16 October 2026 on branch claude/convert-legacy-records, after PR #29 established ADD 2.4.0 and Plane 1.14.0.

- `go test ./...` and `go vet ./...` pass, with the bundle mirror identical. The Plane's `npm test` passes (308 tests, 307 pass, 1 skipped), as do `npm run build` and the website production build. The link script finds 0 broken links. validate-knowledge reports 0 diagnostics.
- Census of docs/artifacts (file and byte proxies): 1,330 files and 5,903,540 bytes with 71.5 percent byte-identical copies before; 407 files and 1,477,951 bytes with 21.3 percent after. The remaining copies are the undelivered Plane change-model-explanations, older task copies inside retained plans and the two kept task sets.
- `node apps/artifact-plane/scripts/layout-benchmark.mjs . 4eb71e3 HEAD --worktrees 9` (main 6a0e0c9 for the legacy form):
  - One explore: 771 git commands in 21.4 s for the legacy form, 102 commands in 3.4 s after the conversion.
  - The zero-excerpt ADD packet measures 158,117 bytes against 139,216 for the legacy form.
