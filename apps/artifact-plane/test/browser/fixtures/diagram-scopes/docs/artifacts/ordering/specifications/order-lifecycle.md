# Order lifecycle

This document states the statuses of an order and the events that change them. The [Bookshop system overview](../../platform/specifications/system-overview.md) shows the parts of the bookshop that send these events.

## States and events

Each arrow of the view below is an event that changes the status of an order.

| Status | Event | Next status |
| --- | --- | --- |
| — | order placed | `PENDING` |
| `PENDING` | payment confirmed | `PAID` |
| `PENDING` | payment declined, or no result in 15 minutes | `PAYMENT_FAILED` |
| `PENDING` | customer cancels | `CANCELLED` |
| `PAID` | parcel handed to carrier | `SHIPPED` |

`PAYMENT_FAILED`, `CANCELLED` and `SHIPPED` are final statuses.

```mermaid
stateDiagram-v2
    accTitle: Order lifecycle
    accDescr: An order starts as PENDING. It becomes PAID when the payment is confirmed, PAYMENT_FAILED when the payment is declined or no result arrives in 15 minutes, and CANCELLED when the customer cancels before payment. A PAID order becomes SHIPPED when the parcel goes to the carrier.
    direction LR
    [*] --> PENDING: order placed
    PENDING --> PAID: payment confirmed
    PENDING --> PAYMENT_FAILED: declined, or no result in 15 min
    PENDING --> CANCELLED: customer cancels
    PAID --> SHIPPED: parcel handed to carrier
    PAYMENT_FAILED --> [*]
    CANCELLED --> [*]
    SHIPPED --> [*]
```

Source: ordering:specifications/order-lifecycle.md#states-and-events; derived one state per status and one transition per row of the table; current snapshot.

Stale: payments:specifications/payment-worker.md changed; recheck pending.
