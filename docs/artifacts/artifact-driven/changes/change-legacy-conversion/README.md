# Convert retained legacy records

## Reason and scope

ADD 2.4.0 moved this repository's current knowledge to the in-place layout, but 22 version directories and 21 delivered change directories still held complete snapshot copies: about 1,000 of 1,331 files under docs/artifacts. On 16 October 2026, after PR #29 merged, the user asked to convert all legacy records and approved a full conversion.

This change amends the in-place layout contract to allow an optional conversion step. Git keeps every converted snapshot, and historical results stay the same. It updates the migration guidance, the requirements N7 and K5, and the AGENTS.md rule, and it converts this repository's records. The Plane-owned conversion option of migrate-layout belongs to the Plane's change-legacy-conversion. Both changes belong to the legacy-conversion unit.

Excluded: editing established knowledge, inventing provenance for version-owned task sets without a recorded change, other repositories, and new reader behavior.

- [Requirements](../../requirements/knowledge-layout.md) (N7, K5)
- [Contract](../../specifications/knowledge-layout.md) (migration step 5, version snapshot)
- [Plan](tasks/README.md)
