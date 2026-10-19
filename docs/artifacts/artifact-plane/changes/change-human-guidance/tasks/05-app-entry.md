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

- [x] `node server/app.js` with each command of the table behaves as specified; a Node test covers `--version`, `--help`, an unknown argument, `serve` on a free port and `mcp` listing its tools.
- [x] The server finds `dist/` beside a bundled `server.mjs` and in a source checkout.
- [x] `npm start`, `npm run mcp` and `npm run flow:model-install` keep their behavior.
- [x] `npm test` passes.

## Evidence

| DoD item | Check | Result |
| --- | --- | --- |
| Commands | `node --test test/app.test.js`: 6 of 6 (`--version`, `--help`, unknown argument with exit 2 and help on stderr, `distDirectory` in both layouts, `serve` on a free port answering GET /, `mcp` over a stdio client listing 10 tools), without and after `npm run build`. By hand: `PORT=abc` and a port in use exit 1; `model-install` with a stubbed fetch exits 1 with the hash error | Passed |
| dist lookup | `distDirectory` returns `<dir>/dist` when present, else `<dir>/../dist`. A Vite SSR bundle of server/app.js copied beside a `dist/index.html` printed `1.21.1` for `--version` and served that index; the JSON import of package.json is inlined | Passed |
| Source scripts | `npm start` prints the former line; `npm run mcp` without a root prints its former error and exits 1; existing stdio MCP and installer hash tests pass without edits | Passed |
| Node suite | `npm test`: 415 tests, 414 passed, 0 failed, 1 not run | Passed |

Implementation: server/app.js; `startServer` and `distDirectory` in server/http.js; `runFlowMcpStdio` in server/flow-mcp.js; `installFlowModel` in server/flow-model-install.js; thin wrappers keep the three npm scripts. scripts/migrate-layout.mjs now detects direct execution by its file name, because in a bundle all modules share one `import.meta.url` and the migrate command ran on `--version`. Notes for task app-build: the SSR build emits a split chunk from a dynamic import unless dynamic imports are inlined; the launcher keeps user arguments at index 2.
