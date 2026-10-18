---
source_change: change-impact-intelligence
---

# artifact-plane 1.18.0 — change impact intelligence

Compatible minor version. An impact service answers what a change affects in tiers (direct, transitive, potential, unresolved) with a Verify and an Investigate list, a typed path with evidence for every entity, and a coverage statement. It combines declared knowledge with derived import, package, embed, mirror, history and vocabulary relations in a private, incremental index. A new Impact page, POST /api/impact/query, the MCP tool get_change_impact and an additive packet field return the answer; the existing impact operation and get_impact_context delegate to the service with their result shape unchanged. Discovery bounds the semantic rank with a measured cutoff and filters common terms; flow detail, source and impact reads no longer load the embedding model or re-read the repository, and the flow diagram draws from the document.

This record holds no knowledge directories and no tasks. The originating plan and its evidence are in the [retained change](../../changes/change-impact-intelligence/tasks/README.md).
