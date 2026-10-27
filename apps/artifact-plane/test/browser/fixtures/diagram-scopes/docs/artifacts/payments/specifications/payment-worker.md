# Payment worker

This document is the contract of the payment queue, the payment worker and the payment provider integration. The [Bookshop system overview](../../platform/specifications/system-overview.md) shows these parts in the bookshop.

## Payment requests

- The order handler of `ordering` sends one payment request for each new order to the payment queue.
- The payment queue delivers each request to the payment worker.

## Charges

- The payment worker charges the card through the payment provider over HTTPS.
- The payment provider stores the card data. The bookshop stores no card data.
- The payment worker records the payment result in the orders table. A confirmed payment sets the status `PAID`, and a declined payment sets `PAYMENT_FAILED`.

## Resources

In the environment `production`, the payment queue is the SQS queue `payment-requests`. The payment worker is the Lambda function `payment-worker`.
