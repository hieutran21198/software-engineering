# Represent knowledge with text-defined diagrams derived from records

## Context

Three readers show ADD knowledge differently. The documentation website and GitHub render a fenced Mermaid block as a diagram. Artifact Plane shows the block as source text, forbids images and derives its own graphs from front matter. ADD stores structural facts in front matter and derives views from them, but it has no rule for diagrams that an author or an agent adds to a document: no text alternative, no source statement, no check and no maintenance rule. The research basis in [the visual knowledge contract](../specifications/visual-knowledge.md) shows that the choice of representation changes comprehension and that generated diagrams are often syntactically valid and semantically wrong. The decision is how representations are stored, derived, checked and kept consistent.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Image files | Export PNG or SVG files from a drawing tool and link them from the Markdown. | Not diffable, not derivable from records, refused by the Plane sanitizer, needs separate long descriptions, and drifts silently from the text. Rejected. |
| B. Text-defined diagrams with text alternatives and source lines | Mermaid in fenced blocks; the body carries the facts; a source line names the identities and the derivation; structural graphs stay reader-derived and an embedded copy says it is derived; checks run inside the existing self-checks. | Portable, diffable, regenerable, renders on the website and GitHub, falls back to readable source text in the Plane. Needs authoring discipline and recorded checks. Selected. |
| C. Structured diagram records in front matter | A `representations` list per document with sources and fingerprints for every diagram. | Enables machine stale detection, but adds a schema and a second place to maintain for each diagram before any reader uses it. Deferred as reader direction R7; a reader change can propose the record later. Rejected now. |
| D. Mandatory diagram tool or service | A PlantUML server, a modelling tool or image generation as part of the bundle. | External dependency, loss of portability, and image output that is not verified knowledge. Rejected. |
| E. Prose only | Keep the current state. | Leaves relational knowledge spread across paragraphs and YAML, which the evidence says costs comprehension. Rejected. |

## Decision

Adopt option B as the visual knowledge contract specifies. Mermaid is the default notation. Representations belong to one of three categories, semantic diagram, explanatory illustration or interactive knowledge view, each with its own generation and validation expectations. A representation is selected from the structure of the information; no rule requires a diagram per document. No phase, record, registry or tool is added.

## Consequences

Authors and agents follow the guideline and record their representation checks in the existing self-checks and task evidence. The website renders the diagrams; the Plane shows the source text with the introduction and the text alternative until a Plane change renders Mermaid. The four role skills gain a Representations section. A later reader change can add the optional structured record of option C through its own ADD change without invalidating documents written under this decision.
