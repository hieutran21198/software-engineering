# Artifact-Driven Development

Artifact-Driven Development is an approach to software engineering that puts artifacts at the center of the work. Explicit knowledge, dependencies, and validation govern implementation and coordination.

## Overview

An artifact is a structured, versioned unit of knowledge managed through explicit changes. It represents a cohesive business or technical capability. Its versioned knowledge includes requirements, specifications, and applicable architectural decisions. Each originating change retains its implementation plan, validation criteria, and evidence; versions link to that delivery record.

Teams use these artifacts to establish what to build, why it is needed, what it depends on, and how to check the result. The artifacts provide shared context for implementation and coordination. A unit of work groups artifact changes around one deliverable outcome. ADD manages knowledge; progress and completion are derived from that knowledge, validation evidence, and Git.

This directory documents the approach.

## Main Parts

| Part | Scope | Status |
| --- | --- | --- |
| [01 — Foundation](01-foundation/README.md) | Definitions, principles, and the artifact model. | Documented from agreed design decisions. |
| [02 — Methodology](02-methodology/README.md) | Workflow ownership, dependency coordination, and validation. | Documented from agreed design decisions. |
| [03 — Execution](03-execution/README.md) | Coordinator and role skills, plan approval, worktrees, and PR handoff. | Documented with self-contained skills. |
| [04 — Patterns](04-patterns/README.md) | Reusable domain design, interface, behavior, architecture, testing, integration, and policy practices. | Pattern library available. |
| [05 — Adoption](05-adoption/README.md) | Download a verified release binary, install the self-contained ADD bundle with `se-adopt`, and take the next steps. | Release binaries available; Go not required. |
| [06 — Guidelines](06-guidelines/README.md) | Human and AI-assisted getting started, artifact writing, and release-based adoption. | End-user guides available. |

## Responsibilities

- Make requirements, decisions, assumptions, and constraints explicit.
- Identify dependencies between artifacts and the work they guide.
- Define validation criteria and record evidence that the work meets them.
- Keep artifacts consistent as requirements and implementation change.
- Use shared artifacts to coordinate work and communicate decisions.

## Getting Started

Use the [end-user guidelines](06-guidelines/README.md) to adopt ADD and start a change. Read the [foundation](01-foundation/README.md) for definitions, principles, and the artifact model.

## Development

### Project Structure

```text
artifact-driven/
├── README.md
├── 01-foundation/
│   ├── README.md
│   ├── definitions.md
│   ├── principles.md
│   ├── artifact-model.md
│   └── visual-knowledge.md
├── 02-methodology/
│   ├── README.md
│   ├── workflow.md
│   ├── dependencies.md
│   └── validation.md
├── 03-execution/
│   ├── README.md
│   └── skills/
│       ├── add-coordinator/
│       ├── add-product-owner/
│       ├── add-technical-lead/
│       └── add-implementer/
├── 04-patterns/
│   ├── README.md
│   ├── strategic-domain-driven-design.md
│   ├── tactical-domain-driven-design.md
│   ├── contract-driven-development.md
│   ├── behavior-driven-development.md
│   ├── event-driven-development.md
│   ├── test-driven-development.md
│   ├── ports-and-adapters.md
│   ├── continuous-integration.md
│   └── policy-as-code.md
├── 05-adoption/
│   └── README.md
└── 06-guidelines/
    ├── README.md
    ├── getting-started.md
    ├── system-flows.md
    ├── units-of-work.md
    ├── writing-artifacts.md
    ├── visual-representations.md
    ├── visual-examples.md
    ├── adopting-from-git.md
    └── working-with-ai.md
```

## Required Skills

ADD requires `kiss` for simple, sufficient solutions and `asd-ste-100` for clear document writing and rewriting. Both ship under `required-skills/` in the adopted bundle. Apply them in existing phase and task self-checks.
