---
id: plane-integration
depends_on: [agent-adapters, flow-view, plane-inventory]
---

# Validate integrated flow retrieval

## Scope and governing knowledge

Coordinator owns integrated Node/browser/build checks, actual-model quality/latency/context benchmarks, complete snapshot/provenance and unit shared evidence.

Governing requirements: requirements/flows.md. Governing specification: specifications/flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Representative queries return expected flows within the top ten and expected explicit consumers appear in complete impact traversal.
- [x] Offline, freshness, interrupted indexing, isolation and read-only checks pass.
- [x] Existing Node/browser suites and build pass; hardware/dataset/context metrics are recorded without invented token claims.
- [ ] Prepare complete proposed version and PR with retained task evidence; shared completion waits for every member establishment.

## Evidence

Final checks on the integrated delivery:

- FLOW_MODEL_STATE=/tmp/plane-flow-model-state npm test: 179 passed, no failures or skips. This includes actual offline embeddings, fixed model asset hashes, shared HTTP/MCP results, a real stdio client, source cursor reconstruction, repeated dirty edits, root/worktree isolation, interrupted/process-concurrent indexing and repository byte preservation.
- Browser suite with the verified local Chromium executable: 32 passed in 1.3 minutes. Five flow cases and all existing unit/task/worktree/project-tab/lazy/race/observer cases pass. Task 04 records the executable and traced UI fixes.
- App and website builds passed. npm audit --omit=dev reported zero vulnerabilities. Go tests/vet passed with GOCACHE=/tmp/flow-discovery-go-cache, including bundle and adoption fidelity checks.
- The actual reader returns 14 planning flows with 57 readable supporting sources. Established selection uses protected declarations, including legacy snapshots; all-snapshot flow IDs are unique. Branch-only or modified source bytes cannot acquire a published-source label. Unrelated YAML task examples do not become reference diagnostics.
- Documentation review checked 59 changed/new Markdown files and 66 actual local links without missing or ancestor destinations. Complete snapshots match their changes: Plane 1.11.0 has 29 knowledge files; Story 1.1.0 has eight. No task copies. All 240 protected historical snapshot/upstream task files retain their bytes.
- Artifact DAG: three nodes/two edges. Plane task DAG: six nodes/seven edges; Story: one/zero; ADD: three/three. Paths/IDs are unique, dependencies resolve and graphs are acyclic. Shared unit membership remains independent of these dependencies.

### Retrieval measurements

Run ARTIFACT_PLANE_STATE_DIR=/absolute/private/state node scripts/benchmark-flows.mjs /absolute/repository after explicit model installation. The final run used Linux, AMD Ryzen 7 5800X, 16 logical CPUs and 15.50 GiB RAM. The dataset was this repository's 14 planning flows, an empty index, pinned local model assets and the five expected-query cases in the script. Repository inputs stayed stable during the measurement.

| Expected journey | Rank | Time | Response bytes |
| --- | --- | --- | --- |
| Plane source retrieval, cold index | 1 | 17.532 s | 13,451 |
| Plane project tabs, warm | 1 | 1.094 s | 13,326 |
| ADD adoption, warm | 1 | 1.043 s | 13,543 |
| ADD dependency gates, warm | 1 | 1.057 s | 13,377 |
| Story revision impact, warm | 1 | 1.035 s | 13,510 |

Cold embedding/model preparation took 15.919 s; atomic index validation took 0.622 s. Warm queries mainly spent time rereading and validating source inputs. All five results used actual semantic vectors and were fresh/complete with zero diagnostics. Impact for internal/adopt/adopt.go returned both explicitly connected ADD and Story adoption flows in 0.982 s, with no missing expected consumers and fresh/complete traversal. Paginated fixture tests separately verify complete closure independent of top-k.

These are measurements of this small inventory and structured response bytes. They do not prove exhaustive system discovery, predict large-corpus latency, or estimate hidden reasoning/token savings. A transient measurement during concurrent knowledge edits correctly reported stale/partial; it was excluded from the stable-input benchmark.

### Version and handoff

Prepared compatible proposed minor versions Plane 1.11.0 and Story 1.1.0, with complete knowledge, originating source_change, delivery_tasks: change and retained task evidence. Protected main continues to establish prior downstream versions until review/merge. ADD 2.1.0 is already established and its supplying contract was rechecked. The shared unit records local checks separately from remaining publication. PR handoff is pending below.

KISS and STE self-check passed: one authoritative Git map, disposable local index, shared adapters and explicit coverage. No additional workflow registry, hosted inference or approval bypass was added.
