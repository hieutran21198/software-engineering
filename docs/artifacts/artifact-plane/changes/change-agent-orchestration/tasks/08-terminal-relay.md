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

- [x] On the first view of a terminal session, the runner starts ttyd with the arguments of the contract and without a shell. The `relay` directory has mode 0700. A socket path of 104 bytes or more makes the relay unavailable with the reason of the contract.
- [x] The server forwards `GET /api/sessions/terminal/<session ID>/…` and the WebSocket upgrade on that path to the relay socket. An unknown session or an ACP session gets 404.
- [x] The server applies the loopback, Host and Origin checks before it forwards. A WebSocket upgrade needs an `Origin` equal to the workbench origin. Tests confirm a refusal for a foreign Host and a foreign Origin.
- [x] The server forwards the bytes unchanged and stores nothing. A test confirms that the relay receives only the bytes that the client sent, and that Plane writes nothing to the relay by itself.
- [x] The workbench policy adds `frame-src 'self'`. Relay responses carry `frame-ancestors 'self'`. Other responses keep `frame-ancestors 'none'`.
- [x] The runner stops ttyd when the session ends, and 10 minutes after the last viewer disconnects.
- [x] Without ttyd, or when ttyd does not start, the session query reports the relay as unavailable with the reason, and the session continues in herdr.

## Evidence

Commit 63f0fbc adds `server/terminal-relay.js`, the relay methods of the runner, the relay route and the WebSocket forwarding in `server/http.js`, a fake ttyd on a UNIX socket and `test/terminal-relay.test.js`.

- Start: no ttyd runs before the first view; the first view starts ttyd with exactly the contract arguments; a state path with a space and `$HOME` arrives unchanged, so no shell runs; the `relay` directory becomes 0700; later views reuse the same ttyd; a relay socket path of 104 bytes or more gives "The state directory path is too long for a socket." and starts nothing.
- Forwarding: the page, the redirect, the token and the WebSocket upgrade (101) reach ttyd exactly as the client sent them; an unknown, malformed or ACP session gets 404 for the page and the upgrade.
- Checks: a foreign Host, a `localhost` Host, a foreign or missing Origin, an Origin with another port and `Sec-Fetch-Site: cross-site` get 403 before any request reaches ttyd.
- Bytes: for 400 ms after the upgrade the relay receives nothing; then a masked input frame, a resize message, 70 000 random bytes and control bytes arrive byte for byte, and nothing more follows.
- Policy: workbench responses carry `frame-src 'self'` and `frame-ancestors 'none'`; relay responses and relay errors carry `frame-ancestors 'self'`; refusals keep `frame-ancestors 'none'`.
- Stop: ttyd stops after the last viewer leaves (injected short time) and removes its socket, and stops when the session ends while a viewer is connected.
- Unavailable: without ttyd, with a ttyd that exits, and with a ttyd that does not listen, the view reports the reason, the page route returns 503, and the herdr session keeps running; the next view retries.

The coordinator reran the relay, runner and HTTP suites: 30 tests passed, and no fake process or temporary directory remained. The implementer ran `npm test` (690 tests, 689 passed, 1 skipped, 0 failed) and the application smoke check (passed).
