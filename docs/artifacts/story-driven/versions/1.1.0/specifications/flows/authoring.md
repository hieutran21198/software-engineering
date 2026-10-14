---
{
  "flow": {
    "id": "authoring",
    "artifact": "story-driven",
    "title": "Author a connected story slice",
    "trigger": "A creator supplies existing material or requests a novel or game knowledge slice.",
    "outcome": "The creator receives a linked skeleton, slice findings and production handoff with unresolved decisions identified.",
    "entry_steps": [
      "discover"
    ],
    "steps": [
      {
        "id": "discover",
        "title": "Inspect material and establish the next outcome",
        "supports": [
          "workflow",
          "coordinator"
        ]
      },
      {
        "id": "core",
        "title": "Define sufficient applicable Core",
        "supports": [
          "framework",
          "workflow"
        ]
      },
      {
        "id": "content",
        "title": "Build linked Content and a causal outline",
        "supports": [
          "framework",
          "workflow"
        ]
      },
      {
        "id": "slice",
        "title": "Walk through a representative slice",
        "supports": [
          "workflow",
          "validation"
        ]
      },
      {
        "id": "revise",
        "title": "Return contradictions to their authoritative owners",
        "supports": [
          "revision"
        ]
      },
      {
        "id": "review",
        "title": "Review decisions with the creator",
        "supports": [
          "workflow",
          "coordinator"
        ]
      },
      {
        "id": "handoff",
        "title": "Provide linked production knowledge",
        "supports": [
          "handoff"
        ]
      }
    ],
    "transitions": [
      {
        "to": "core",
        "from": "discover"
      },
      {
        "to": "content",
        "from": "core",
        "condition": "Applicable constraints are sufficient; provisional exploration remains explicit."
      },
      {
        "to": "slice",
        "from": "content"
      },
      {
        "to": "revise",
        "from": "slice",
        "condition": "The walkthrough reveals a contradiction or missing constraint."
      },
      {
        "to": "core",
        "from": "revise",
        "condition": "A shared constraint needs correction."
      },
      {
        "to": "content",
        "from": "revise",
        "condition": "The correction belongs to a particular Content record."
      },
      {
        "to": "review",
        "from": "slice",
        "condition": "The slice is ready for creator review."
      },
      {
        "to": "content",
        "from": "review",
        "condition": "Blocking contradictions or dependent decisions require revision."
      },
      {
        "to": "handoff",
        "from": "review",
        "condition": "Relevant Core and dependent Content have available creator approval."
      }
    ],
    "support": [
      {
        "id": "framework",
        "kind": "element",
        "artifact": "story-driven",
        "element": "specifications/framework.md",
        "requires": "Separate shared Core from named Content and apply only the domains required by the medium.",
        "basis": "documented"
      },
      {
        "id": "workflow",
        "kind": "implementation",
        "path": "src/archs/story-driven/02-methodology/workflow.md",
        "requires": "Inspect existing knowledge, define sufficient Core, build Content, review a slice and hand off.",
        "basis": "documented"
      },
      {
        "id": "coordinator",
        "kind": "implementation",
        "path": "src/archs/story-driven/03-execution/skills/story-driven-coordinator/SKILL.md",
        "requires": "Reuse available approval and coordinate responsibility without mandatory separate agents.",
        "basis": "documented"
      },
      {
        "id": "validation",
        "kind": "implementation",
        "path": "src/archs/story-driven/02-methodology/validation.md",
        "requires": "Review causal coherence and apply novel or game checks according to medium.",
        "basis": "documented"
      },
      {
        "id": "revision",
        "kind": "implementation",
        "path": "src/archs/story-driven/02-methodology/revision.md",
        "requires": "Return contradictions to the owner and assess dependent knowledge.",
        "basis": "documented"
      },
      {
        "id": "handoff",
        "kind": "implementation",
        "path": "src/archs/story-driven/02-methodology/handoff.md",
        "requires": "Provide authoritative references and identify production blockers.",
        "basis": "documented"
      }
    ],
    "gaps": [
      "This inventory describes shipped guidance, not an observed creative session.",
      "Creator judgment and consumer-specific knowledge are not available in this repository."
    ],
    "exclusions": [
      "Final manuscript drafting, engine implementation and production publishing.",
      "Mandatory game, visual or level knowledge for novel-only work."
    ]
  }
}
---

# Author a connected story slice

The flow covers discovery, Core, connected Content, representative review and handoff. A novel slice uses viewpoint and revelation checks. A game slice adds applicable actions, state and consequences. Art and Level domains apply only when needed.

Revision loops preserve valid independent material. Relevant constraints require creator approval before dependent Content is final. A paper walkthrough does not establish playability or artistic quality.
