import {mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const destination = path.join(root, 'website/.docs');
await rm(destination, {recursive: true, force: true});
await mkdir(destination, {recursive: true});
async function writeDocument(relative, extra = '', target = relative) {
  // Repository links to the ADD bundle point to its site path.
  const source = (await readFile(path.join(root, relative), 'utf8')).replaceAll('](docs/artifact-driven/', '](src/archs/artifact-driven/');
  const metadata = 'pagination_prev: null\npagination_next: null\n' + extra;
  const content = source.startsWith('---\n')
    ? source.replace('---\n', '---\n' + metadata)
    : '---\n' + metadata + '---\n\n' + source;
  await writeFile(path.join(destination, target), content);
}
await writeDocument('README.md', 'slug: /\n');
async function copyMarkdown(relative, target = relative) {
  for (const entry of await readdir(path.join(root, relative), {withFileTypes: true})) {
    const file = path.join(relative, entry.name);
    if (entry.isDirectory()) await copyMarkdown(file, path.join(target, entry.name));
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      await mkdir(path.dirname(path.join(destination, target, entry.name)), {recursive: true});
      await writeDocument(file, '', path.join(target, entry.name));
    }
  }
}
await copyMarkdown('src');
// The ADD bundle has one source; its pages keep their existing site path.
for (const section of ['README.md', '01-foundation', '02-methodology', '03-execution', '04-patterns', '05-adoption', '06-guidelines', 'tools']) {
  const source = path.join('docs/artifact-driven', section);
  const target = path.join('src/archs/artifact-driven', section);
  if (section.endsWith('.md')) {
    await mkdir(path.join(destination, 'src/archs/artifact-driven'), {recursive: true});
    await writeDocument(source, '', target);
  } else await copyMarkdown(source, target);
}
