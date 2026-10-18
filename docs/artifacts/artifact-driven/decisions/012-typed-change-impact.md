# Define change impact as typed tiers over declared and derived relationships

## Context

ADD asks the Requirement and Specification phases to assess which knowledge, artifacts, contracts and tasks a change affects, but defines no result. The delivered readers answer with the flows reachable over declared relationships, and the user found the answers neither useful nor accurate. A source-level investigation of this repository on 18 October 2026 found four causes: the method treats every relationship type the same; it has no notion of distance, scope or evidence strength in its output; the declared graph is sparse because authors declare whole-file links by hand (9 references and 1 cross-artifact support in the whole repository); and code changes cannot start an assessment at all. A prototype that applied typed rules to the declared relationships plus derived code, mirror and history relations answered nine real change cases of this repository with direct precision and recall 1.0 where the changed declarations were known, exact step scope in all 15 step checks, and an explicit unresolved item for every artifact prerequisite that lacks a declared relationship.

## Alternatives

| Option | Description | Assessment |
| --- | --- | --- |
| A. Keep reachability, ask for more declarations | Keep the flow-only reverse closure and require authors to declare every consumer and every implementation link. | Maintenance grows with the system; the data stays stale between changes; a code change still cannot seed an assessment; distance and evidence stay invisible. Rejected. |
| B. Rank by similarity | Use embedding or lexical similarity to rank candidate consumers. | Similarity is not dependency: in the measured distractor case the top result shared words and no code or contract. Rankings cannot explain a path or bound coverage. Rejected as impact; kept for discovery search only. |
| C. Exhaustive static analysis | Require call graphs, slicing or a language-server index for every repository. | Precise for code but silent on knowledge, contracts and evidence; expensive per language; still blind to injected functions and process boundaries. Rejected as the base; its cheapest parts (imports with symbols, package imports, embeds) are reused as derived relations. |
| D. Typed tiers over declared and derived relationships | Define affected as tiers (changed, direct, transitive, potential, unresolved) with a propagation rule per relationship type, an explanation record per entity and a coverage statement per answer. Declared knowledge stays authoritative; derived relations need no maintenance; evidence without a relationship stays potential. | Measured on real changes. Adds one contract and one guideline, no mandatory field, no state. Selected. |
| E. Numeric confidence | Score each item with a probability. | No calibration data exists; a number would state a precision the readers cannot prove. Rejected; ordered strength labels instead. |

## Decision

Adopt option D as specifications/change-impact.md. Every reader that answers what a change affects labels each entity with one tier, follows the propagation rule of each relationship type, explains each edge with its evidence, and states what it did not analyze. Transitions and artifact prerequisites never propagate; tests are verification; semantic similarity never contributes. Potential impact from history and vocabulary is reported, capped and never promoted. The unit flow assessment stays the declared authority and is reconciled with the computed flows.

## Consequences

Readers can start from code, knowledge or Git differences and return the same tiers. Authors declare nothing new; the optional support symbol and cross-artifact references remain the two declarations that raise precision. Transitive results through shared modules stay broad and are labeled as such, with the depth and the frontier reported, so a person decides how far to look. Dynamic calls, injected functions and process boundaries remain outside the analyzed relationships and are named in every coverage statement.
