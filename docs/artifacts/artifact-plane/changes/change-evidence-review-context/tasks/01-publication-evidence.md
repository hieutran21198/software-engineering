---
id: publication-evidence
depends_on: []
---

# Correct publication-review recognition

## Scope and ownership

Own apps/artifact-plane/server/units-of-work.js, related workflow.js call-site changes, and focused unit/workflow/repository-query evidence tests. Coordinate shared knowledge updates through the coordinator. Preserve all unrelated code and historical evidence; other implementers may be working in separate scopes.

Governing knowledge: requirements/evidence-correctness.md E1/E2/E5; specifications/evidence-correctness.md publication assertions; specifications/units-of-work.md. Consume the unit's trustworthy-evidence criterion without copying its authority. Required external supplier is established ADD 2.1.0.

## Definition of Done

- [x] Only actual affirmative Publication review paragraphs from the correct version README/owning unit can supply member/version-scoped merge assertions; return exact source/assertion metadata.
- [x] Instructional specification prose, blocks/quotes/examples, negation/future/conditional text, location-only statements and wrong versions/members never establish.
- [x] Complete protected-ref snapshot/task bytes remain required; missing/conflicting/changed/unsafe sources retain honest proposed/unverified/unknown evidence.
- [x] Real and controlled regression fixtures reproduce the discovery false positive, prove rejection, and preserve valid explicit historical review assertions without rewriting snapshots.
- [x] Focused Node checks pass and actual commands/results are returned to the coordinator; repository fingerprints remain unchanged.

## Evidence

Publication recognition now reads only scoped affirmative Publication review paragraphs from the matching version README or unique owning unit. Exact assertion/source metadata is returned; specifications, examples, quotations, negations, location-only prose and unrelated member/version claims cannot supply proof. Complete protected-ref snapshot/task matching remains required. Bounded through/after/via PR-number provenance preserves legitimate explicit review paragraphs.

The final focused publication/unit/workflow/repository-query suites passed all 88 checks. The real 1.11.1 specification false-positive fixture is rejected and its repository fingerprint remains unchanged. An earlier combined publication/runtime run passed all 96 checks before the bounded-provenance addition; final integrated checks remain pending. No historical documentation was changed. Legacy sources without explicit review become unverified by design. KISS uses scoped Markdown paragraphs and existing readers; STE keeps recorded assertions distinct from independent validation.
