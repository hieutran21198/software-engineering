# Orders API

This document is the contract of the Orders API, the order handler and the orders table. The [Bookshop system overview](../../platform/specifications/system-overview.md) shows these parts in the bookshop. The flow `ordering:place-order` is the authority for the order journey.

## Create an order

This view shows the part of the flow `ordering:place-order` that `ordering` owns; the flow record continues with the payment worker of `payments`. Arrows are messages from the sender to the receiver; a dashed arrow is a response, and an open arrowhead is an asynchronous send. The facts are:

1. The storefront web app sends `POST /orders` with the cart and an `Idempotency-Key` header to the Orders API.
2. The Orders API invokes the order handler with the request.
3. The order handler puts the order with status `PENDING` into the orders table only when no order has the key.
4. When the key is new, the handler sends a payment request to the payment queue.
5. When the send succeeds, the handler answers `202 Accepted` with the order ID.
6. When the send fails, the handler retries at most three times with backoff. After the third failure it answers `503`, and the order stays `PENDING`.
7. When the key exists, the handler answers `200` with the existing order.
8. The Orders API returns the answer to the storefront web app.

```mermaid
sequenceDiagram
    accTitle: Place an order
    accDescr: The storefront posts an order with an idempotency key. The order handler stores the order as PENDING only when the key is new, sends a payment request to the payment queue, and answers 202 with the order ID. A repeated key returns the existing order. A failed send is retried three times; after the third failure the handler answers 503 and the order stays PENDING.
    participant S as Storefront web app
    participant A as Orders API
    participant H as Order handler
    participant T as Orders table
    participant Q as Payment queue
    S->>A: POST /orders with cart and Idempotency-Key
    A->>H: Invoke with the request
    H->>T: Put order PENDING if the key is new
    alt Key is new
        H-)Q: Send payment request
        alt Send fails
            H-)Q: Retry, at most 3 times with backoff
            H-->>A: 503 after the third failure
        else Send succeeds
            H-->>A: 202 Accepted with order ID
        end
    else Key exists
        H-->>A: 200 with the existing order
    end
    A-->>S: Response
```

Source: ordering:specifications/orders-api.md#create-an-order; ordering:place-order; derived one participant per named party and one message per stated step; current snapshot.

## Idempotency check

The view shows the decision that the order handler makes for each request. Each arrow is the next step, with its condition.

```mermaid
flowchart TB
    accTitle: Idempotency check of the order handler
    accDescr: The handler looks for an order with the Idempotency-Key of the request. A new key creates a PENDING order and a payment request. An existing key returns the existing order.
    request[Request with Idempotency-Key] --> lookup{Order with the key?}
    lookup -->|no| create[Put order PENDING]
    create --> send[Send payment request]
    lookup -->|yes| existing[Answer 200 with the existing order]
```

The handler keeps the key in the field `idempotency_key` of the order. Two requests with the same key therefore create one order.

## Order emails

The order handler sends an order email through the email service when it accepts an order. In the environment `production`, the email service is SES.

## Resources

In the environment `production`, the Orders API is the HTTP API `orders-api` of API Gateway. The order handler is the Lambda function `order-handler`. The orders table is the DynamoDB table `orders`.
