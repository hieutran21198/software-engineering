# Diagrams

Fixture document for the diagram rendering contract.

## Flowchart

```mermaid
flowchart LR
  accTitle: Change flow
  accDescr: A requirement leads to a specification, then a plan, then implementation.
  R[Requirement] --> S[Specification]
  S --> P[Plan]
  P --> I[Implementation]
  I -->|evidence| R
```

## Sequence

```mermaid
sequenceDiagram
  accTitle: Review sequence
  accDescr: The coordinator sends a plan to the user and receives approval.
  participant C as Coordinator
  participant U as User
  C->>U: Present the plan
  U-->>C: Approve
```

## State

```mermaid
stateDiagram-v2
  accTitle: Version states
  accDescr: A version is prepared, then established on main.
  [*] --> Prepared
  Prepared --> Established: merge to main
  Established --> [*]
```

## Invalid

```mermaid
flowchart LR
  A --> 
  this is not valid ((((
```

## Directive

```mermaid
%%{init: {"theme": "dark"}}%%
flowchart LR
  A --> B
```

## Label with markup

```mermaid
flowchart LR
  accTitle: Markup labels
  accDescr: Labels that contain HTML and a script stay text.
  A["<img src=x onerror=alert(1)>"] --> B["<script>alert(2)</script>"]
  B --> C["<a href='https://example.com'>link</a>"]
```

## Wide

```mermaid
flowchart LR
  accTitle: Wide flow
  accDescr: A long chain of steps that is wider than a phone screen.
  A[Requirement] --> B[Specification] --> C[Plan] --> D[Approval] --> E[Implementation] --> F[Validation] --> G[Review] --> H[Merge]
```

## Code

```js
const kept = 'code panel';
```
