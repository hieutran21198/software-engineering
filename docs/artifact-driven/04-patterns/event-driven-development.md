# Event-Driven Development

## Purpose and Applicability

Use events to communicate facts that have occurred and allow other components to react. Apply this pattern when asynchronous reactions, multiple consumers, or independent processing serve the requirements. A command requests an action; an event reports a fact.

Choose synchronous interaction when the caller needs an immediate authoritative result and asynchronous behavior adds no value. Event-driven communication does not require event sourcing, CQRS, or a specific broker.

## Inputs and Outputs in ADD

| Phase | Inputs | Outputs |
| --- | --- | --- |
| Requirement | Business or technical outcomes, timing needs, and failure expectations. | Observable reactions and acceptable consistency delays. |
| Specification | Completed requirements and producer/consumer responsibilities. | Event contracts, delivery behavior, ownership, and applicable ADRs. |
| Plan | Completed contracts and decisions. | Producer, consumer, recovery, and integration tasks with DoD checks. |
| Implementation | Approved tasks and required established upstream contracts. | Publishing and handling code, tests, and task evidence. |

## Apply

The TL defines event meaning and ownership in the producing artifact's specifications. Consumers reference that knowledge and specify their own reactions. Record payload fields, event identity, schema compatibility, tenant scope where relevant, and any needed correlation information.

Specify delivery guarantees, duplicate handling, ordering scope, retry limits, failure handling, and replay behavior where relevant. Do not assume exactly-once business effects merely because a transport provides a delivery guarantee. When duplicate delivery is possible, define how handlers avoid repeating side effects.

If an event must correspond to a committed state change, specify how publication and persistence remain consistent. Evaluate approaches such as an outbox when necessary; do not add one automatically. Record an ADR when an architectural choice has multiple options.

Choose a contract representation suited to the interfaces and tools already used. AsyncAPI can describe asynchronous interfaces; CloudEvents can standardize event envelopes. Neither is mandatory, and neither by itself establishes business delivery guarantees.

Use the normal ADD dependency rules. Runtime event paths may form feedback loops, but the artifact execution DAG must remain acyclic. Do not copy runtime message paths directly into the execution DAG. Resolve actual knowledge prerequisites through contracts and ownership.

## Validation

Task DoD and integrated checks cover the specified behavior: payload compatibility, producer failures, consumer failures, retries, duplicate effects, ordering, replay, and isolation as applicable. Check recovery and observability when required by the specification. Record evidence with tasks.

## Example

Tenant management publishes `TenantCreated` after the tenant creation state is committed. A provisioning consumer creates resources from the event and avoids duplicate provisioning if the same event arrives again. Specifications define the identifier, delivery policy, and provisioning outcome before implementation; this example does not prescribe a broker or payload schema.

## Research Basis

AsyncAPI documentation, *Event-Driven Architectures*, describes asynchronous interface concepts. The CloudEvents specification defines event context and identity. Phase placement and artifact dependency rules here are ADD-specific adaptations.
