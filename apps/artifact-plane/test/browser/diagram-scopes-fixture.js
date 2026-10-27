import {readdir, readFile} from 'node:fs/promises';
import {join, relative, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fixtureRepository} from '../fixtures.js';
// The fixture repository of the diagram scopes contract (artifact-plane
// specifications/diagram-scopes.md, Fixture repository): an invented bookshop on
// AWS with the in-place artifacts platform, storefront, ordering and payments.
// Each file under fixtures/diagram-scopes/ has its repository-relative path.
export const fixtureDirectory = fileURLToPath(new URL('./fixtures/diagram-scopes/', import.meta.url));

// The fixture files as a map of repository-relative paths to their text, in path order.
export async function diagramScopesFiles() {
  const entries = await readdir(fixtureDirectory, {recursive: true, withFileTypes: true});
  const paths = entries.filter(entry => entry.isFile()).map(entry => relative(fixtureDirectory, join(entry.parentPath, entry.name)).split(sep).join('/')).sort();
  return new Map(await Promise.all(paths.map(async path => [path, await readFile(join(fixtureDirectory, path), 'utf8')])));
}

// A Git repository of the fixture with one commit on a local main branch. Returns {root, cleanup}.
export async function diagramScopesRepository() {
  return fixtureRepository(await diagramScopesFiles());
}
