---
source_change: change-legacy-conversion
---

# artifact-driven 2.5.0 — convertible legacy records

Compatible minor version. The migration procedure adds an optional step that converts retained legacy records. A version directory keeps only its record, a delivered change keeps its record and tasks, and Git keeps every removed snapshot in the commit that introduced its version. Repositories that do not convert keep reading the legacy layout as before.

This record holds no knowledge directories and no tasks. The originating plan and its evidence are in the [retained change](../../changes/change-legacy-conversion/tasks/README.md).
