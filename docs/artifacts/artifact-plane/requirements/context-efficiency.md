---
self_check:
  result: passed
  source: docs/artifacts/artifact-plane/requirements/context-efficiency.md#self-check
---

# Context efficiency requirements

- CE1: Existing review clients retain their behavior unless they request compact retrieval.
- CE2: Compact responses bound the whole serialized response, preserve explicit uncertainty and expose continuations for omitted material.
- CE3: Incremental reads identify additions, modifications and removals by source digest and revalidate current inputs. Lost captures require full refresh.
- CE4: HTTP and MCP share retrieval behavior. Compact MCP output avoids repeating full data in text.
- CE5: A reproducible three-scenario benchmark records actual model-visible input, cached input, output and child usage separately from payload proxies.
- CE6: Savings acceptance requires 25 percent median paired input reduction and no scenario median regression above 10 percent, with all correctness and gate checks satisfied.

## Acceptance

- CEA1: Governing requirements, DoD, unresolved claims, evidence limits and authorization boundaries remain available in initial and resumed workflows.
- CEA2: Existing relevant tests and new retrieval or guidance checks pass; live token results remain incomplete when actual usage evidence is unavailable.

## Self-check

Each requirement states an observable capability. Existing artifact ownership and dependencies remain unchanged. No instruction permits omitting governing contracts, evidence or approval. KISS/STE checklists applied.
