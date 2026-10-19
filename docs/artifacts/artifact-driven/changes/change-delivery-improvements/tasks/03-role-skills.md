---
id: role-skills
depends_on: [tier-guidance]
---

# Role skills

## Scope and ownership

Coordinator, as implementer. The four role skills under `docs/artifact-driven/03-execution/skills/` (coordinator, product owner, technical lead, implementer): rewrite each SKILL.md as a core of at most 400 words with the duty, the phase steps by tier and a self-check checklist that includes five KISS and STE items, followed by a "Read when" table. Move rare-case content (legacy layout, multi-repository publication, flows, representations, claims, units, patterns) behind table rows that point to the existing guidance. Add the implementer context rules and the impact-selected local tests to `06-guidelines/working-with-ai.md`. Update `03-execution/README.md` for the core and table structure. The `kiss` and `asd-ste-100` skills and the `agents/openai.yaml` files keep their content.

## Governing knowledge

specifications/agent-efficiency.md (Progressive context and recovery, Progressive guidance, Implementer context, Harness profiles); requirements/delivery-improvements.md, DI9 to DI11 and A3.

## Prerequisites

Task tier-guidance.

## Definition of Done

- [ ] `wc -w` on the body of each role SKILL.md, without front matter and without the Read-when table, is at most 400.
- [ ] The guidance that the coordinator reads unconditionally (the coordinator core and its table, with an empty `reading.coordinator`) has at most 3,000 words.
- [ ] Each rule that a skill held before the rewrite is either in the core or reachable through one Read-when row; a table in the evidence lists each removed paragraph and its new location.
- [ ] `working-with-ai.md` states the implementer dispatch, section reads, short summaries, new contexts at phase boundaries and impact-selected local tests with the full suites in CI.
- [ ] Every relative link resolves, `go test ./...` passes and `npm run build` in website exits 0.

## Evidence

Not recorded.
