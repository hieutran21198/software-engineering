---
id: guide
depends_on: []
covers:
  - element: requirements/diagram-scopes.md
    ids: [DS1, DS2, DS3, DS4, DS5, DS6, DS7, DS8, DS9, DS10, DS11, DS12, DS13, DS14, DS15, DS17, DS18, ADS1, ADS2, ADS3, ADS7]
---

# Scopes, matrix and icons in the guide

## Scope and ownership

Implementer. Edit docs/artifact-driven as the Bundle changes table of the [contract](../../../specifications/diagram-scopes.md#bundle-changes) states, except the example page: 06-guidelines/visual-representations.md, 06-guidelines/README.md, 01-foundation/artifact-model.md and the Representations sections of the four role skill references. The coordinator keeps the knowledge files of this artifact.

## Definition of Done

- [x] visual-representations.md has the sections Scopes, Selection Matrix, Icons and Reader Fallback with the terms, the ownership and discovery rules, the edge meanings, the one flow authority rule, both matrix tables with all 14 views, the notation table, the icon sources with 65 `logos` names and 24 `lucide` names, the icon rules, the reader support table, the layout rules and the maintenance rules of the contract.
- [x] Rule 1, rule 5, procedure step 4 and the reader support section of the guide are amended as the contract states, and the guide links the example page.
- [x] artifact-model.md has one sentence in Records for `system_view` with a link to the Scopes section.
- [x] 06-guidelines/README.md lists the example page.
- [x] Each of the four role skill references has the Representations sentence that the contract states for it.
- [x] A diff review finds no changed meaning of an existing rule and no new phase, gate, quota or registry.
- [x] Every relative link of the changed pages resolves, and no child page links to an ancestor.
- [x] The changed text passes the KISS and STE checklist of the implementer skill.

## Evidence

Commit 1a3b286 on branch claude/diagram-scopes-add implements the task. The coordinator performed it in the implementer role.

| DoD item | Check | Result | Source |
| --- | --- | --- | --- |
| Guide sections | Read the new sections against the contract sections Terms, Ownership and discovery, Edge meanings, One flow authority, Selection matrix, Notation, Icons, Reader support, Layout and Sources and maintenance | All present; 7 system and 7 artifact rows; 65 `logos` and 24 `lucide` names | docs/artifact-driven/06-guidelines/visual-representations.md |
| Amended rules | Diff of rule 1, rule 5, procedure step 4, Traceability and Maintenance, and Reader Support | Each amendment matches the contract; the introduction links the example page | `git diff b67824e -- docs/artifact-driven/06-guidelines/visual-representations.md` |
| Artifact model | Diff of Records | One added paragraph for `system_view` with a link to Ownership and discovery | docs/artifact-driven/01-foundation/artifact-model.md |
| Guideline index | Diff of the index table | One row for the example page | docs/artifact-driven/06-guidelines/README.md |
| Role skills | Diff of the four Representations sections | Each has the sentence that the contract table states | docs/artifact-driven/03-execution/skills/*/reference.md |
| Meaning review | Read every changed line of the existing rules | No existing rule changes meaning; no phase, gate, quota or registry is added | this task |
| Links | Script that resolves every relative link and heading anchor of the eight changed bundle pages and flags links to a parent README | 0 problems | this task |
| KISS and STE | Implementer checklist on the changed text | One rule per sentence or row; the terms keep one meaning | this task |
