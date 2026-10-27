# Storefront web app

The storefront web app is the page that customers use to browse books and place orders. The [Bookshop system overview](../../platform/specifications/system-overview.md) shows the web app in the bookshop.

## Orders

- The web app sends `POST /orders` with the cart and an `Idempotency-Key` header to the Orders API.
- The web app uses one new key for each order. It sends the same key again when it repeats a request for that order.

## Hosting

In the environment `production`, CloudFront serves the static files of the web app from the S3 bucket `storefront`. CloudFront forwards the path `/api/*` to the Orders API.
