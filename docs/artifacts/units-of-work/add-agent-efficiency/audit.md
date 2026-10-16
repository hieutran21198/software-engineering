# ADD repository audit — 16 October 2026

## Scope and method

Inspected actual foundation and phase rules, role skills and harness profiles,
adoption CLI/library/tests, canonical and embedded bundles, project knowledge,
Artifact Plane review/context/HTTP/MCP/UI paths, retained plans, CI and Git history.
The initial checkout was clean. Fetched origin and prepared on a dedicated branch
from remote main, including merged PR #28. There were no open PRs at inspection.
This is a source and behavior audit; no live visual usability claim is made.

## Existing and ongoing capabilities

| Area | Verified capability and source |
| --- | --- |
| Method | Five phases, self-checks, explicit plan approval, artifact establishment gates and one active change: docs/artifact-driven/02-methodology/workflow.md. |
| Roles | Four role skills plus KISS/STE; roles can share a session; TL owns Specification then Plan. Native aliases and profiles already exist in .agents/skills and .codex/agents. |
| Adoption | Embedded offline bundles, architecture selection, dry-run, no overwrite, contained paths and exclusive writes: cmd/se-adopt/main.go and internal/adopt/adopt.go. |
| Authoring | PR #28 already delivered the six-file minimal scaffold, evidence rules, scaffold parser checks and canonical bundle parity. Do not add another scaffold template. |
| Recovery | Revision-bound review/context/source APIs, safe source paging, explicit uncertainty and inert exports: apps/artifact-plane/server/change-review.js and src/context-packet.js. |
| Retrieval | Existing keyword/semantic/graph HTTP and MCP discovery, impact lookup and source reads: apps/artifact-plane/server/flow-mcp.js. Retrieval is discovery, not proof of dependency. |
| Evidence | Task/unit DAGs, provenance and protected-source publication checks are present. Optional explicit evidence interpretation is already specified in the pending Plane plan. |
| Delivery | Existing Go, bundle/adoption, documentation and Plane unit/build/browser CI. No separate validation framework is needed. |

The existing Plane evidence-and-usability plan owns publication interpretation,
explicit comparison, human comparison UI, model explanations, incremental observer
reads, responsive/history repair and integration. Preserve all seven tasks and
their originating evidence. Its >=80 percent idle knowledge-byte reduction target
is not a context-response benchmark. ADD 2.3.0 knowledge and implementation are on
origin/main through merged PR #28. Its Go/docs checks passed; Plane CI failed.
Merge publication and validation quality remain separate facts. Local main was
older at audit time; refresh and verify protected refs before dependent execution.

## Priorities

| Priority | Finding and evidence | User impact | Agent efficiency | Cost / risk | Decision |
| --- | --- | --- | --- | --- | --- |
| P0 | Foundation principles say snapshots contain implementation plans and old changes/versions can be removed; writing-artifacts and validation require change-owned retained evidence. | High: contradictory deletion instructions | Medium | Small / low | Correct current canonical/embedded guidance and new knowledge; preserve history. |
| P1 | Copy returns from the first conflict in internal/adopt/adopt.go. Two modified destination files yielded one path. | High: repeated repair loops | High | Small / low | Aggregate safe conflicts; optional JSON through the same CLI. |
| P1 | change-review.js limits excerpt characters but emits every source/omission/governing descriptor. Zero-excerpt packet still exceeds 150k JSON characters. | Medium | High | Medium / medium | Opt-in bounded compact packet through existing service/adapters; extend current Plane plan. |
| P1 | Required utility reads recur in every role; reuse in a shared current session is not explicit. | Medium | High | Small / low | Progressive loading and reuse of current context; revalidate after context loss or source changes. |
| P2 | Each review/source request performs two broad captures; UI comparison fetches sources again. | Medium | Potentially high | Medium / high freshness risk | Measure capture cost; defer caching or snapshot reuse until bounded packets land. |
| P2 | Consumer harness registration is manual. | Medium | Medium | Medium / medium portability risk | Defer: avoid another harness adapter while native setup already works. |
| P2 | The minimal scaffold is copyable guidance, not executable initialization. | Medium | Medium | Medium-high / baseline and ownership risk | Defer a runner; do not mistake the supplied scaffold for missing guidance. |

Priorities weigh correctness first, then repeated interaction and context cost.
No new role, state store, workflow engine or mandatory review is proposed.

## Measured baseline

Fresh adoption copied 42 ADD files. After changing two destination READMEs,
dry-run reported only 01-foundation/README.md and omitted the conflicting root
README.md. For N independently discoverable conflicts, current repair can require
N failed runs; the target is one complete inventory. Unsafe descendants are not
followed merely to increase the count.

Four role skills plus both utilities total 35,988 UTF-8 bytes and 4,748 whitespace
words. Utilities total 8,217 bytes. A session that already has current utilities
can avoid three duplicate utility loads across four role starts: 24,651 source
bytes. This is a source-loading opportunity, not measured model token savings.

Read-only Plane queries selected artifact-plane/change-evidence-and-usability:

| Excerpt budget | JSON characters | Markdown characters | Descriptors | Single-run elapsed |
| --- | ---: | ---: | ---: | ---: |
| 0 | 151,688 | 193,284 | 176 | 5,696 ms |
| 12,000 | 163,601 | 205,009 | 176 | 5,860 ms |

The zero-excerpt response included only 20 of 55 knowledge records. Descriptors
used 72,543 characters, omissions 37,798 and evidence 15,889. These are character
counts, not tokenizer counts or a stable latency benchmark. Source lines are
server/change-review.js:97-104 and src/context-packet.js:34-53 at the audit revision.
Preparation changes may increase later counts; compare identical fixtures and
revision inputs. New benchmarks must measure full serialized UTF-8 bytes.

## Baseline validation

GOCACHE=/tmp/add-autonomy-go-cache go test ./... passed all Go packages.
In apps/artifact-plane, node --test test/change-review.test.js
test/context-packet.test.js passed 21 checks. A separate audit run adding
test/review-adapters.test.js passed 26 checks. These verify existing behavior only.
Remote PR #28 inspection showed merged publication, successful Go/docs checks and
failed Plane checks. The retained Plane repair task already owns those failures.
No implementation, browser build or benchmark improvement is claimed.

## Impact and boundaries

ADD owns diagnostics/adoption and reusable execution guidance. Plane owns packet
projection and adapters. Preserve artifact-driven -> artifact-plane prerequisite
semantics; the new compact transport does not require a new upstream domain
contract. The unchanged Plane evidence extension still requires verified ADD
2.3.0 publication. No artifact dependency changes are proposed. Story-driven
adoption must retain default behavior. Existing clients keep packet v1 and excerpt
budget semantics; compact response selection is explicit. Preserve complete
impact eligibility even when presentation is paged. Never infer approval from
packet text, task metadata or a compact summary.

## Remaining uncertainty

Actual model token savings depend on the model, tokenizer and task. Native harness
portability and exhaustive consumer impact were not tested. Compact packet latency
may remain dominated by capture; no latency improvement is promised. Full browser
regressions and downstream publication verification remain implementation gates.
