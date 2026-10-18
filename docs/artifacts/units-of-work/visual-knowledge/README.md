---
unit_of_work: visual-knowledge
changes:
  - artifact: artifact-driven
    change: change-visual-knowledge
affected_flows:
  - artifact: artifact-driven
    flow: change-delivery
    effect: modify
flow_assessment: Inspected the five ADD flows, the nine Plane flows, the bundle
  pages that mention diagrams, the four role skills, the Plane's Markdown and
  graph rendering and the website configuration at revision 126990d.
  change-delivery is modified because its requirement, specification, plan and
  implement steps gain a support record for the visual knowledge contract; its
  step identities and transitions do not change. The adoption,
  version-publication, dependency-gates and unit-validation flows describe
  behavior that this change does not alter. Plane flows are excluded because no
  Plane code or contract changes; the Plane directions are recorded as
  knowledge only.
acceptance:
  - id: principles
    criterion: The bundle foundation states the visual knowledge design
      principles with cited sources and limits, and separates established
      findings from design hypotheses and engineering recommendations.
  - id: guidance
    criterion: The guideline gives the three representation categories, the
      selection guide, the agent decision procedure, the self-review criteria
      and prohibitions, the phase application and the maintenance rule, and the
      role skills point to them.
  - id: examples
    criterion: The worked examples derive at least six representations from
      named elements of this repository at a named revision, each with a text
      alternative and a source statement, and every diagram renders on the
      built website.
  - id: preservation
    criterion: No page adds a phase, a state registry or an approval field;
      ownership, versioning, dependency and flow semantics are unchanged; no
      file under apps changes.
  - id: integration
    criterion: Both bundle copies are byte-identical for the changed files,
      links and the documentation hierarchy are valid, Go tests pass, the
      website builds and validate-knowledge reports no error.
    integration: true
evidence: []
---

# Establish visual knowledge design principles for ADD

## Included scope

Research the cognitive science and information visualization evidence; state the visual knowledge design principles in the bundle foundation; add a representation guideline with the selection guide, the three categories, the agent decision procedure, self-review criteria, phase application and maintenance rules; add representation sections to the four role skills and the working-with-ai guide; show worked examples derived from this repository's artifacts; record the Artifact Plane implications as directions. Apply the edits to docs/artifact-driven and src/archs/artifact-driven and keep both copies identical.

## Excluded scope

Artifact Plane code and its artifact knowledge; the story-driven bundle; image files; a diagram registry, index or front matter schema; a mandatory rendering tool in the bundle; the repository overview; a release tag.

## Validation evidence

No checks have run. Requirement, Specification and Plan are preparatory knowledge; implementation waits for explicit approval of the plan.
