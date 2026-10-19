---
source_change: change-review-brief
---

# artifact-plane 1.20.0 — change brief and claim records

Compatible minor version. The change page gains a Change brief: seven review answers, the claims of the change with one verification step each, the reached, declared and undecided flows, at most seven attention rows, and for a delivered change its unmet evidence, unchecked DoD items and wording notes. A person can record a check of a claim with an observed result or add a counter-hypothesis. The review service adds the operation brief, the packet adds data.brief and a Change brief section in its Markdown export, and MCP adds the read tool get_change_brief. Two knowledge operations, claim.record and claim.verify, write ADD 2.9.0 claims; the interface sets verified_by (person through HTTP, agent through MCP). validate-knowledge and the operation validation report the claim diagnostics. Document and flow pages show an inferred note on delivered records that still say work is pending. No route, tool or packet field is removed, and the packet schema stays artifact-plane.change-context.v1.

This record holds no knowledge directories and no tasks. The originating plan and its evidence are in the [retained change](../../changes/change-review-brief/tasks/README.md).
