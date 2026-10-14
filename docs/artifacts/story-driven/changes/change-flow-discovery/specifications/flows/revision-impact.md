---
{
  "flow": {
    "id": "revision-impact",
    "artifact": "story-driven",
    "title": "Revise knowledge and assess impact",
    "trigger": "A new need or contradiction challenges an authoritative rule or a downstream representation.",
    "outcome": "The owning knowledge records contain the correction, affected-work findings and explicit remaining uncertainty.",
    "entry_steps": [
      "identify"
    ],
    "steps": [
      {
        "id": "identify",
        "title": "Identify conflicting statements and their owner",
        "supports": [
          "revision",
          "framework"
        ]
      },
      {
        "id": "propose",
        "title": "Propose the smallest supported correction",
        "supports": [
          "revision"
        ]
      },
      {
        "id": "discover",
        "title": "Find consumers through links, concepts and aliases",
        "supports": [
          "revision"
        ]
      },
      {
        "id": "assess",
        "title": "Review affected causality and representations",
        "supports": [
          "revision",
          "validation"
        ]
      },
      {
        "id": "approve",
        "title": "Obtain creator approval for material changes",
        "supports": [
          "revision"
        ]
      },
      {
        "id": "record",
        "title": "Record conclusions with their owners",
        "supports": [
          "revision"
        ]
      }
    ],
    "transitions": [
      {
        "to": "propose",
        "from": "identify"
      },
      {
        "to": "discover",
        "from": "propose"
      },
      {
        "to": "assess",
        "from": "discover"
      },
      {
        "to": "propose",
        "from": "assess",
        "condition": "Impact reveals an unsupported capability or contradiction."
      },
      {
        "to": "approve",
        "from": "assess",
        "condition": "A material change affects dependent Content."
      },
      {
        "to": "record",
        "from": "approve",
        "condition": "Creator approval is available."
      },
      {
        "to": "record",
        "from": "assess",
        "condition": "No material change requires new creator approval."
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
        "id": "revision",
        "kind": "implementation",
        "path": "src/archs/story-driven/02-methodology/revision.md",
        "requires": "Find owners and consumers, inspect aliases, preserve uncertainty and obtain approval for material change.",
        "basis": "documented"
      },
      {
        "id": "validation",
        "kind": "implementation",
        "path": "src/archs/story-driven/02-methodology/validation.md",
        "requires": "Review continuity, revelation and applicable gameplay representations.",
        "basis": "documented"
      }
    ],
    "gaps": [
      "No consumer knowledge corpus or live revision trace was inspected.",
      "Text search and recorded links do not prove exhaustive consumer discovery."
    ],
    "exclusions": [
      "Automatic canon rewriting, promotion of local game outcomes to canon, and a separate impact registry."
    ]
  }
}
---

# Revise knowledge and assess impact

The flow covers Core and Content corrections, downstream feedback, consumer discovery and review. Deliberate witness disagreement remains distinct from inconsistent objective facts. Shared Core and particular World, Narrative, Gameplay, Visual and Level records retain their own responsibility.

Game consequences and visual or spatial representations are checked only when applicable. Unchanged approval remains valid. An intentional unknown remains explicit; a new capability cannot silently hide an earlier contradiction.
