# Retain delivery work with its originating change

## Context and alternatives

Task copies enlarge version diffs and duplicate delivery instructions. Deleting completed tasks loses DoD evidence. Keeping tasks in changes and explicitly linking versions preserves one durable delivery source.

## Decision and consequences

Use source_change plus delivery_tasks: change for future versions. Retain the originating plan/evidence and validate its protected-ref publication. Keep complete artifact knowledge in versions. Preserve legacy copies. New changes create fresh plans. Consumers must distinguish version knowledge from change delivery records and diagnose missing records. No evidence registry is added.
