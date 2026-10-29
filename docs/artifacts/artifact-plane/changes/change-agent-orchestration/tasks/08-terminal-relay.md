---
id: terminal-relay
depends_on: [runner]
covers:
  - element: requirements/agent-orchestration.md
    ids: [AO7, AO15, AO28, AOA13]
---

# Embedded terminal relay

## Scope and ownership

One implementer adds the relay start and stop to the runner, and the HTTP and WebSocket forwarding and the Content-Security-Policy changes to `server/http.js`. Tests use a fake ttyd: a small HTTP and WebSocket server on a UNIX socket.

## Governing knowledge

`specifications/agent-orchestration.md`: Embedded terminal, Commands and Failures. ADR 021.

## Definition of Done

- [ ] On the first view of a terminal session, the runner starts ttyd with the arguments of the contract and without a shell. The `relay` directory has mode 0700, and ttyd starts with umask 077.
- [ ] The server forwards `GET /api/sessions/terminal/<session ID>/…` and the WebSocket upgrade on that path to the relay socket. An unknown session or an ACP session gets 404.
- [ ] The server applies the loopback, Host and Origin checks before it forwards. A WebSocket upgrade needs an `Origin` equal to the workbench origin. Tests confirm a refusal for a foreign Host and a foreign Origin.
- [ ] The server forwards the bytes unchanged and stores nothing. A test confirms that the relay receives only the bytes that the client sent, and that Plane writes nothing to the relay by itself.
- [ ] The workbench policy adds `frame-src 'self'`. Relay responses carry `frame-ancestors 'self'`. Other responses keep `frame-ancestors 'none'`.
- [ ] The runner stops ttyd when the session ends, and 10 minutes after the last viewer disconnects.
- [ ] Without ttyd, or when ttyd does not start, the session query reports the relay as unavailable with the reason, and the session continues in herdr.
