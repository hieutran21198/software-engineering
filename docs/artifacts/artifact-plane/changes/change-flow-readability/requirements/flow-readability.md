# Flow readability requirements

The flow explorer currently prints raw diagnostic messages and serialized omission records above the graph. A missing optional model repeats a filesystem error. The supporting-node checkbox inherits a column layout that separates its control from its text.

## Scope and acceptance

- Keep the flow title, trigger, outcome and graph easy to scan on wide and narrow screens.
- Show the missing-model condition once per visible explorer context in plain language. State that keyword and graph discovery remain available. Keep exact diagnostic details available on demand.
- Show shortened-source counts with expandable readable paths and omitted character counts. Hide empty omission lists. Do not claim omitted text means missing artifacts.
- Keep the supporting-node checkbox beside its label and usable with the keyboard.
- Preserve freshness, completeness, source publication, diagnostic severity, source pagination and navigation behavior.

Model installation, backend retrieval changes, new dependencies and historical snapshot changes are excluded.

## Requirement self-check

Inspected Flows.jsx, its CSS, the shipped flow specification and the delivered browser evidence. The screenshot matches raw JSON rendering and the shared column-label rule. One owning artifact is affected. KISS limits work to presentation; STE uses direct notices and keeps technical detail available. No requirement blocker remains.
