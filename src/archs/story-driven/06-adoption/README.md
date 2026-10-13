# Adoption and Getting Started

## Adopt the complete bundle

Use a se-adopt binary that lists story-driven. Older releases may not contain this architecture; run `./se-adopt --list` to check. Obtain a reviewed binary and its matching SHA256SUMS from the repository's [GitHub Releases](https://github.com/hieutran21198/software-engineering/releases), verify the chosen asset's checksum, and keep both from the same release. On Windows use `se-adopt.exe`.

From a source checkout with Go installed, build the current executable:

```sh
go build -o /tmp/se-adopt ./cmd/se-adopt
/tmp/se-adopt --list
```

Adoption itself runs locally without network access:

```sh
./se-adopt --arch story-driven --project /path/to/project --dry-run
./se-adopt --arch story-driven --project /path/to/project
```

The default destination is docs/story-driven. `--output guidance/story` selects another project-relative directory. Existing identical files remain; a conflicting consumer edit aborts adoption without replacing it. Reconcile differences manually or select a new output directory. Repeated adoption is not an upgrade merger. The command copies guidance and supporting skills, not canon, project artifacts or harness instructions. It does not create your authored knowledge.

The bundle includes all domain guidance, workflows, templates, examples and required utility skills. Do not copy only the role directories; their references need the full bundle. The repository embeds shared utility sources into required-skills at delivery, avoiding a separately maintained copy.

## Create your knowledge workspace

Keep reusable guidance in docs/story-driven and your decisions in docs/story-knowledge by default. A small project can begin with only relevant files:

```text
docs/story-knowledge/
├── README.md                         # Project purpose and downward navigation
├── core/
│   ├── creative-direction.md
│   ├── world-foundation.md
│   ├── setting-rules.md
│   ├── lore-foundation.md
│   └── narrative-foundation.md
└── content/
    ├── world/                        # Authoritative entities and events
    └── narrative/
        ├── works/                    # Particular work briefs and skeletons
        ├── arcs/
        └── scenes/
```

Use the four templates from the adopted 04-templates directory. Add Game Design and Gameplay Content for games; add Art/Visual and Level domains when needed. Chapters, quests, dialogue and accounts can get separate directories as useful. Do not create empty categories merely to match a tree.

Keep work briefs, arcs and scenes in sibling record directories so links to their authoritative owners do not point back to ancestor overview documents. Parent pages may link to children; content pages may link across domains to actual owners. Resolve a relative link's destination before judging its hierarchy.

## Optional agent discovery

Use the coordinator skill directly by its file path, or register the three role directories with your harness. In a default Unix workspace, create links only when the names are unused:

```sh
mkdir -p .agents/skills
ln -s ../../docs/story-driven/03-execution/skills/story-driven-coordinator .agents/skills/story-driven-coordinator
ln -s ../../docs/story-driven/03-execution/skills/story-driven-architect .agents/skills/story-driven-architect
ln -s ../../docs/story-driven/03-execution/skills/story-driven-author .agents/skills/story-driven-author
```

Adjust paths for custom output. Preserve existing registrations and instructions; do not overwrite consumer AGENTS.md. On harnesses without symlink support, register the bundled skill paths directly or use the harness's directory registration facility. The supporting utilities are loaded from bundled paths; they do not need duplicate harness registrations.

## First session

Ask the coordinator to inspect your existing material and produce a brief for one novel or game slice. Choose audience experience, relevant Core, participants and conflict. Walk through an outline, review contradictions and hand off the linked skeleton. A single session can assume all three roles. If interviewing is requested, ask one material question at a time.

When production reveals a contradiction, revise its authoritative knowledge and review affected works. You do not need ADD, a game engine or a narrative scripting tool to author this knowledge. The knowledge workflow has no automatic commits, publishing or merge authority.
