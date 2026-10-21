import {test, expect} from '@playwright/test';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {capturePages, goldenRepository, withoutAllowedDifferences} from './golden-pages.js';
// CP1 (claim golden-captures): a repository without models shows the pages,
// controls and text of Artifact Plane 1.24.0. scripts/capture-pages.mjs wrote
// test/fixtures/golden-1.24.0.json from 0eecce1; this test captures the
// current build the same way and allows only the differences that CP1 names.
test('a repository without models shows the 1.24.0 pages, controls and text', async ({browser, baseURL}) => {
  test.setTimeout(240000);
  const golden = JSON.parse(await readFile(new URL('../fixtures/golden-1.24.0.json', import.meta.url), 'utf8'));
  const parent = await mkdtemp(join(tmpdir(), 'plane-golden-'));
  try {
    const root = await goldenRepository(parent);
    const captures = await capturePages(width => browser.newPage({baseURL, viewport: {width, height: width < 500 ? 844 : 1000}}), root);
    const expected = withoutAllowedDifferences(golden.captures), actual = withoutAllowedDifferences(captures);
    expect(Object.keys(actual)).toEqual(Object.keys(expected));
    for (const key of Object.keys(expected)) expect.soft(actual[key], key).toEqual(expected[key]);
  } finally {
    await rm(parent, {recursive: true, force: true});
  }
});
