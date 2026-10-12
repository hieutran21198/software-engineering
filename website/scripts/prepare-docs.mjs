import {mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = path.join(root, 'website/.docs');
await rm(destination, {recursive: true, force: true});
await mkdir(destination, {recursive: true});
async function writeDocument(relative, extra = '') {
  const source = await readFile(path.join(root, relative), 'utf8');
  const metadata = 'pagination_prev: null\npagination_next: null\n' + extra;
  const content = source.startsWith('---\n')
    ? source.replace('---\n', '---\n' + metadata)
    : '---\n' + metadata + '---\n\n' + source;
  await writeFile(path.join(destination, relative), content);
}
await writeDocument('README.md', 'slug: /\n');
async function copyMarkdown(relative) {
  for (const entry of await readdir(path.join(root, relative), {withFileTypes: true})) {
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) await copyMarkdown(file);
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      await mkdir(path.dirname(path.join(destination, file)), {recursive: true});
      await writeDocument(file);
    }
  }
}
await copyMarkdown('src');
