// Bundle the validator entry point and its imports into one ES module for
// Node.js 24, with no runtime package dependency, at
// docs/artifact-driven/tools/add-validate.mjs (ignored by Git; the release embeds it).
// Usage: node scripts/build-validator.mjs [output directory]
import {build} from 'vite';
import {fileURLToPath} from 'node:url';

const app = fileURLToPath(new URL('..', import.meta.url));
await build({
  root: app, configFile: false, logLevel: 'warn', publicDir: false,
  ssr: {noExternal: true, target: 'node'},
  build: {
    ssr: 'scripts/validate-knowledge.mjs', outDir: process.argv[2] ?? fileURLToPath(new URL('../../../docs/artifact-driven/tools', import.meta.url)),
    emptyOutDir: false, target: 'node24', minify: false, copyPublicDir: false,
    rollupOptions: {output: {format: 'es', entryFileNames: 'add-validate.mjs', codeSplitting: false}},
  },
});
