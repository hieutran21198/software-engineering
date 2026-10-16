---
{
  "flow": {
    "id": "adoption",
    "artifact": "story-driven",
    "title": "Adopt the Story-Driven bundle",
    "trigger": "A consumer requests local adoption of Story-Driven guidance.",
    "outcome": "The selected destination contains the complete guidance bundle, a dry-run preview, or an explicit failure without replacing conflicting edits.",
    "entry_steps": [
      "select"
    ],
    "steps": [
      {
        "id": "select",
        "title": "Select the available architecture and destination",
        "supports": [
          "guidance",
          "command"
        ]
      },
      {
        "id": "preflight",
        "title": "Validate destination and inspect file conflicts",
        "supports": [
          "copy",
          "tests"
        ]
      },
      {
        "id": "preview",
        "title": "Return a dry-run preview",
        "supports": [
          "copy",
          "command",
          "tests"
        ]
      },
      {
        "id": "conflict",
        "title": "Report conflicts or unsafe destinations",
        "supports": [
          "copy",
          "tests"
        ]
      },
      {
        "id": "copy",
        "title": "Copy the complete bundle and retain identical files",
        "supports": [
          "copy",
          "bundle",
          "tests"
        ]
      },
      {
        "id": "knowledge",
        "title": "Create applicable authored knowledge separately",
        "supports": [
          "guidance"
        ]
      }
    ],
    "transitions": [
      {
        "to": "preflight",
        "from": "select"
      },
      {
        "to": "conflict",
        "from": "preflight",
        "condition": "The destination is unsafe or existing files conflict."
      },
      {
        "to": "select",
        "from": "conflict",
        "condition": "The consumer reconciles differences or selects another destination."
      },
      {
        "to": "preview",
        "from": "preflight",
        "condition": "Preflight passes and --dry-run is selected."
      },
      {
        "to": "copy",
        "from": "preflight",
        "condition": "Preflight passes and adoption is requested."
      },
      {
        "to": "knowledge",
        "from": "copy",
        "condition": "The consumer chooses to begin authoring."
      }
    ],
    "support": [
      {
        "id": "guidance",
        "kind": "implementation",
        "path": "src/archs/story-driven/06-adoption/README.md",
        "requires": "Select story-driven, preview adoption, preserve consumer edits and keep authored knowledge separate.",
        "basis": "documented"
      },
      {
        "id": "command",
        "kind": "implementation",
        "path": "cmd/se-adopt/main.go",
        "requires": "Select the architecture and dispatch dry-run or copy behavior.",
        "basis": "static",
        "symbol": "run"
      },
      {
        "id": "copy",
        "kind": "implementation",
        "path": "internal/adopt/adopt.go",
        "requires": "Reject unsafe destinations, preflight conflicts and copy files without replacing differing consumer files.",
        "basis": "static",
        "symbol": "Copy"
      },
      {
        "id": "bundle",
        "kind": "implementation",
        "path": "src/archs/story-driven/bundle.go",
        "requires": "Embed the complete framework and mount shared required utility skills.",
        "basis": "static"
      },
      {
        "id": "tests",
        "kind": "test",
        "path": "cmd/se-adopt/main_test.go",
        "requires": "Declare Story-Driven selection, complete adoption, dry-run and conflict-preservation checks.",
        "basis": "static",
        "symbol": "TestStoryDrivenAdoptionContract"
      }
    ],
    "gaps": [
      "Source and test declarations are static support; this record does not claim executed adoption observations.",
      "Release asset availability and consumer harness configurations were not checked."
    ],
    "exclusions": [
      "Automatic upgrades, canon creation, consumer AGENTS.md replacement and mandatory harness registration."
    ]
  }
}
---

# Adopt the Story-Driven bundle

The flow covers architecture selection, safe preflight, dry-run, conflict rejection, complete copying and optional knowledge setup. Identical files remain intact. A repeat adoption is not an upgrade merger.

The default bundle destination is docs/story-driven. Authored knowledge defaults to docs/story-knowledge. Game Design, Gameplay, Art/Visual and Level records are optional according to the work. Harness registration is also optional. Adoption does not authorize creative publishing or Git changes.
