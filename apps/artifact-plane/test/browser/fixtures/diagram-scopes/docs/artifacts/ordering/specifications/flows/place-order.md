---
flow:
  id: place-order
  artifact: ordering
  title: Place an order
  trigger: A customer places an order in the storefront web app.
  outcome: The order is PAID or PAYMENT_FAILED, or it stays PENDING after the handler answers 503.
  entry_steps: [submit]
  steps:
    - id: submit
      title: Submit the order with an idempotency key
      supports: [web-app]
    - id: create
      title: Store the order as PENDING when the key is new
      supports: [orders-api, order-data]
    - id: request
      title: Send the payment request to the payment queue
      supports: [orders-api]
    - id: charge
      title: Charge the card through the payment provider
      supports: [payment-worker]
    - id: record
      title: Record the payment result in the orders table
      supports: [payment-worker, order-lifecycle]
  transitions:
    - from: submit
      to: create
    - from: create
      to: request
      condition: The key is new.
    - from: request
      to: request
      condition: The send fails. The handler retries at most three times with backoff.
    - from: request
      to: charge
      condition: The send succeeds and the queue delivers the request.
    - from: charge
      to: record
  support:
    - id: web-app
      kind: element
      artifact: storefront
      element: specifications/web-app.md
      requires: Send POST /orders with the cart and an Idempotency-Key header.
      basis: documented
    - id: orders-api
      kind: element
      artifact: ordering
      element: specifications/orders-api.md
      requires: Store a new order as PENDING once per key and send its payment request.
      basis: documented
    - id: order-data
      kind: element
      artifact: ordering
      element: specifications/order-data.md
      requires: Keep the idempotency key unique for each order.
      basis: documented
    - id: order-lifecycle
      kind: element
      artifact: ordering
      element: specifications/order-lifecycle.md
      requires: Change the status from PENDING to PAID or PAYMENT_FAILED.
      basis: documented
    - id: payment-worker
      kind: element
      artifact: payments
      element: specifications/payment-worker.md
      requires: Charge the card through the payment provider and record the result.
      basis: documented
  gaps:
    - This documented journey is not a live runtime trace.
  exclusions:
    - Shipping and cancellation of an order.
---

# Place an order

The flow describes how an order of a customer becomes a paid or a failed order. The [Bookshop system overview](../../../platform/specifications/system-overview.md) shows the containers of this journey. The Orders API document shows the part of the journey that `ordering` owns.

## Branches

- When the key exists, the handler answers `200` with the existing order. The journey ends after the step create.
- When the send fails three times, the handler answers `503`. The order stays `PENDING`, and the journey ends after the step request.

## Coverage

The record covers order creation and payment. It does not cover shipping or cancellation.
