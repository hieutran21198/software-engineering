---
current_version: 1.0.0
depends_on: [platform]
---

# Ordering

Own the Orders API, the order handler, the orders table, the order lifecycle and the order data of the bookshop. Own the flow `ordering:place-order`.

## Dependency meaning

The ordering documents place their parts in the system views that `platform` owns.

## Knowledge

- [Orders API](specifications/orders-api.md)
- [Order lifecycle](specifications/order-lifecycle.md)
- [Order data](specifications/order-data.md)
- [Place an order](specifications/flows/place-order.md)
- [Initial change](changes/change-initial/README.md)
