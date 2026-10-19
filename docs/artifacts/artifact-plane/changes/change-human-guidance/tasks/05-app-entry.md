---
id: app-entry
depends_on: []
covers:
  - element: requirements/app-release.md
    ids: [AR3, AR4, AR8]
---

# Application entry

## Scope and ownership

Implementer, own worktree. `server/app.js` (command line), the `dist/` path lookup of the HTTP server, and Node tests of the commands.

## Governing knowledge

specifications/app-release.md: Command line, Packaging (dist lookup).

## Definition of Done

- [ ] `node server/app.js` with each command of the table behaves as specified; a Node test covers `--version`, `--help`, an unknown argument, `serve` on a free port and `mcp` listing its tools.
- [ ] The server finds `dist/` beside a bundled `server.mjs` and in a source checkout.
- [ ] `npm start`, `npm run mcp` and `npm run flow:model-install` keep their behavior.
- [ ] `npm test` passes.

## Evidence

Not recorded.
