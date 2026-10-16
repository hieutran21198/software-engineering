# Convert retained legacy records with migrate-layout

## Reason and scope

The ADD change-legacy-conversion adds an optional conversion step to the migration procedure. This change adds `--convert-history` to scripts/migrate-layout.mjs, so the step is repeatable and verified against HEAD, and makes both knowledge scripts flush large JSON reports. Readers, APIs and the UI are unchanged. Both changes belong to the legacy-conversion unit.

- [Scripts contract](../../specifications/knowledge-layout-reading.md#scripts)
- [Plan](tasks/README.md)
