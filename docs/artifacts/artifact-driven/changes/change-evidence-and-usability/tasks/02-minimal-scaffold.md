---
id: minimal-scaffold
depends_on: [evidence-guidance]
---

# Provide a complete minimal authoring scaffold

## Scope and ownership

Own the canonical and embedded minimal-change guide, parent guide links, coordinator/PO/TL references and scaffold checks in existing bundle tests.

## Governing knowledge

A3, A5; specifications/minimal-authoring.md.

## Prerequisites

Explicit approval of this concrete plan is required before implementation. No new artifact prerequisite is proposed. Listed internal prerequisites must satisfy their DoD.

## Definition of Done

- [x] The one-artifact example has complete unit/change/requirement/specification/task structure, no inherited task copies and no fabricated domain or passing evidence.
- [x] Parse task/unit/evidence examples; validate required fields, unique IDs, safe paths, references and acyclic task dependencies.
- [x] Phase approval, upstream establishment and necessary ADR guidance remain explicit; no new mandatory runner or service appears.
- [x] Canonical/embedded files and harness skill resolution agree; all new links respect the documentation hierarchy.

## Evidence

Checks passed: focused Go bundle/adoption/CLI tests, including TestMinimalChangeScaffold; scaffold extraction through the existing Plane YAML, unit and task parsers (six files, one valid task, no dependency edges, zero checked DoD); canonical target/hierarchy review (92 links). The persistent Go test assembles copied files, verifies their links and metadata, and rejects fabricated initial evidence. Its JSON-compatible YAML front matter needs no added Go dependency.

The canonical and embedded minimal guide, parent index and coordinator/PO/TL references match through TestCanonicalBundleFidelity. The examples retain explicit placeholders and incomplete self-checks until the author supplies verified facts. No generator, overwrite behavior or extra review phase was added. KISS/STE self-check passed.
