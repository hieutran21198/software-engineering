---
models:
  - id: artifact
    title: Artifact
    description: Owns cohesive business or technical knowledge, its current established
      version and its implementation prerequisites.
    sources:
      - specifications/knowledge.md
  - id: change
    title: Change
    description: Owns proposed artifact knowledge and a fresh implementation plan whose
      delivery evidence remains retained after publication.
    sources:
      - specifications/knowledge.md
      - specifications/task-retention.md
  - id: version
    title: Version
    description: Contains the complete resulting artifact knowledge; establishment requires
      the applicable knowledge, code and originating delivery record to land on the
      protected branch.
    sources:
      - specifications/knowledge.md
      - specifications/task-retention.md
---

# ADD models used in dependency gates

## Ownership and evidence

These models name concepts already defined by the knowledge and retained-delivery contracts. Their source paths resolve in the same artifact snapshot. The declarations provide stable model identity; the source documents remain authoritative for detailed rules.

## Participation

The dependency-gates flow uses these models to explain the supplier artifact, its required established version and the consuming change. Model identities describe concepts, not specific live artifacts or approval states. Other journeys can reference the same models without copying these declarations. A reference to Version does not assert that a particular version has established.
