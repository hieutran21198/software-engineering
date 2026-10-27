# Order data

This document states the entities of the order data in the orders table. The [Bookshop system overview](../../platform/specifications/system-overview.md) shows the orders table in the bookshop.

## Entities

Each line of the view below is a relationship with its cardinality.

| Entity | Fields | Rule |
| --- | --- | --- |
| `ORDER` | `order_id` (key), `customer_id`, `idempotency_key` (unique), `status`, `total_cents` | — |
| `ORDER_LINE` | `order_id` (reference to `ORDER`), `line_no`, `isbn`, `quantity`, `price_cents` | An order has one or more lines. |
| `STATUS_CHANGE` | `order_id` (reference to `ORDER`), `changed_at`, `from_status`, `to_status` | An order has zero or more status changes. |

```mermaid
erDiagram
    accTitle: Order data model
    accDescr: An order has one or more order lines and zero or more status changes.
    ORDER ||--|{ ORDER_LINE : contains
    ORDER ||--o{ STATUS_CHANGE : records
    ORDER {
        string order_id PK
        string customer_id
        string idempotency_key UK
        string status
        int total_cents
    }
    ORDER_LINE {
        string order_id FK
        int line_no
        string isbn
        int quantity
        int price_cents
    }
    STATUS_CHANGE {
        string order_id FK
        string changed_at
        string from_status
        string to_status
    }
```

Source: ordering:specifications/order-data.md#entities; derived one entity per table row, one attribute per field and one line per stated rule; current snapshot.

## Reader fallback sample

The sample below shows two cases that every reader draws the same way: an icon name outside the supported set, and a long label that wraps. The arrow shows runtime interaction: the source feeds the target.

```mermaid
flowchart LR
    accTitle: Fallback sample
    accDescr: One node names an icon outside the supported set and shows the unknown-icon mark. One node has a label longer than 60 characters that wraps.
    model@{ icon: "logos:aws-bedrock", form: "square", label: "Recommendation model", pos: "b" }
    report@{ icon: "lucide:file-text", form: "square", label: "Weekly sales report for the publishing partners, as a PDF document", pos: "b" }
    model -->|feeds| report
```

Illustrative: an icon outside the set and a label longer than 60 characters; the order data facts do not include this pair.
