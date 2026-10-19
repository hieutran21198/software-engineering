import {test, expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {fixtureRepository, identity, versionRecord} from '../fixtures.js';
import {openRepository, openDocument, documentPage} from './workbench.js';
// The diagram rendering contract: fenced Mermaid blocks render as sanitized SVG
// under the unchanged Content-Security-Policy, with the code panel as fallback.
const base = 'docs/artifacts/tenant/';
const diagrams = readFileSync(new URL('./diagram-fixture.md', import.meta.url), 'utf8');
const shots = process.env.DIAGRAM_SCREENSHOT_DIR;
const fixture = () => fixtureRepository(new Map([
  [base + 'README.md', identity('Tenant', '1.0.0')],
  [base + 'specifications/diagrams.md', diagrams],
  [base + 'specifications/identity.md', '# Identity\n\nNo diagram here.\n\n```js\nconst plain = true;\n```\n'],
  [base + 'versions/1.0.0/README.md', versionRecord('change-initial')],
  [base + 'changes/change-initial/README.md', '# Initial\n'],
  [base + 'changes/change-initial/tasks/README.md', '---\ntasks: []\n---\n# Plan\n'],
]));
// Records CSP violations, page errors and every request of the page.
async function watch(page) {
  const seen = {errors: [], requests: []};
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', e => console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`));
    // Records the time of the last SVG insertion into a diagram figure.
    new MutationObserver(records => {if (records.some(r => r.target.matches?.('figure.diagram-block') && [...r.addedNodes].some(n => n.nodeName === 'svg'))) window.diagramInserted = performance.now();}).observe(document, {childList: true, subtree: true});
  });
  // The browser asks for /favicon.ico, which the Plane does not serve.
  page.on('console', m => {if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) seen.errors.push(`${m.text()} ${m.location().url}`);});
  page.on('pageerror', e => seen.errors.push(e.message));
  page.on('request', r => seen.requests.push(r.url()));
  return seen;
}
const figure = (page, heading) => documentPage(page).locator(`h2:text-is("${heading}") + figure.diagram-block`);
const scripts = requests => requests.filter(url => new URL(url).pathname.endsWith('.js'));

for (const width of [1440, 390]) {
  test(`diagram blocks render at ${width} pixels under the CSP with title, desc, fallback notes and no foreign markup`, async ({page, baseURL}) => {
    await page.setViewportSize({width, height: 900});
    const seen = await watch(page), f = await fixture();
    await openRepository(page, f.root);
    // A page without a diagram block requests no diagram chunk.
    await openDocument(page, 'Tenant', 'Specifications', 'Identity');
    await expect(documentPage(page).locator('.code-panel')).toHaveCount(1);
    await expect(documentPage(page).locator('figure.diagram-block')).toHaveCount(0);
    const before = new Set(scripts(seen.requests));
    expect([...before].filter(url => url.includes('diagram-render'))).toEqual([]);
    // The diagram page loads the renderer once and renders every valid block.
    const start = await page.evaluate(() => performance.now());
    await openDocument(page, 'Tenant', 'Specifications', 'Diagrams');
    const rendered = documentPage(page).locator('figure.diagram-block > svg');
    await expect(rendered).toHaveCount(5);
    await expect(documentPage(page).locator('.diagram-note')).toHaveCount(3);
    // First render time: from the renderer chunk request to the insertion of the last SVG.
    const timing = await page.evaluate(start => {
      const chunk = performance.getEntriesByType('resource').find(e => e.name.includes('diagram-render'));
      return {opened: Math.round(window.diagramInserted - start), rendered: Math.round(window.diagramInserted - chunk.startTime)};
    }, start);
    const summary = `${timing.rendered} ms from the renderer request, ${timing.opened} ms from the start of the sidebar navigation, at ${width} pixels`;
    test.info().annotations.push({type: 'first render', description: summary});
    console.log(`first render of the fixture page: ${summary}`);
    const after = scripts(seen.requests).filter(url => !before.has(url));
    expect(after.some(url => url.includes('diagram-render'))).toBe(true);
    // Flowchart, sequence and state diagrams carry title and desc from accTitle and accDescr.
    for (const [heading, title, desc] of [
      ['Flowchart', 'Change flow', 'A requirement leads to a specification, then a plan, then implementation.'],
      ['Sequence', 'Review sequence', 'The coordinator sends a plan to the user and receives approval.'],
      ['State', 'Version states', 'A version is prepared, then established on main.'],
    ]) {
      const svg = figure(page, heading).locator('svg').first();
      await expect(svg.locator('> title')).toHaveText(title);
      await expect(svg.locator('> desc')).toHaveText(desc);
      await expect(svg).toHaveAttribute('aria-labelledby', /.+/);
      await expect(figure(page, heading).locator('.code-panel')).toHaveCount(0);
      // The scoped style element and the root ID survive, so the theme applies.
      expect(await svg.evaluate(e => [e.id.startsWith('plane-diagram-'), e.querySelector('style')?.textContent.includes('#' + e.id)])).toEqual([true, true]);
    }
    // Invalid and directive blocks keep the code panel and add one note.
    await expect(figure(page, 'Invalid').locator('.code-panel')).toHaveCount(1);
    await expect(figure(page, 'Invalid').locator('svg')).toHaveCount(0);
    await expect(figure(page, 'Invalid').getByRole('note')).toHaveText(/^Diagram not rendered: .+/);
    await expect(figure(page, 'Directive').locator('.code-panel')).toContainText('%%{init');
    await expect(figure(page, 'Directive').getByRole('note')).toHaveText('Diagram not rendered: the block contains a configuration directive (%%{).');
    await expect(figure(page, 'Front matter config').getByRole('note')).toHaveText('Diagram not rendered: the block contains front matter configuration (---).');
    await expect(figure(page, 'Front matter config').locator('.code-panel')).toHaveCount(1);
    // CSS in style elements and style attributes of the rendered diagrams names no remote resource.
    const remoteCSS = await documentPage(page).evaluate(root => [...root.querySelectorAll('svg style, svg [style]')].map(e => e.nodeName === 'style' ? e.textContent : e.getAttribute('style')).filter(css => /url\(\s*['"]?(?!#)/i.test(css) || /@import/i.test(css)));
    expect(remoteCSS).toEqual([]);
    expect((await figure(page, 'Invalid').getByRole('note').textContent()).length).toBeLessThanOrEqual('Diagram not rendered: '.length + 160);
    // Markup in labels stays text: no element or attribute outside the profile.
    const markup = figure(page, 'Label with markup').locator('svg');
    await expect(markup).toHaveCount(1);
    // Mermaid strict mode drops the handler and the script; the rest shows as label text.
    await expect(markup.locator('g.node')).toHaveCount(3);
    await expect(markup).toContainText('<img src="x">');
    const foreign = await documentPage(page).evaluate(root => ({
      elements: root.querySelectorAll('img, script, a, foreignObject, image, iframe').length,
      handlers: [...root.querySelectorAll('*')].flatMap(e => [...e.attributes].map(a => a.name)).filter(n => n.startsWith('on')),
      links: [...root.querySelectorAll('[href], [*|href]')].map(e => e.getAttribute('href') || e.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).filter(v => !v.startsWith('#')),
      temporary: document.querySelectorAll('body > div[id^="dplane-diagram-"]').length,
    }));
    expect(foreign).toEqual({elements: 0, handlers: [], links: [], temporary: 0});
    // Other fenced blocks keep the highlighted code panel.
    await expect(documentPage(page).locator('h2:text-is("Code") + .code-panel .code-panel-label')).toHaveText('JavaScript');
    // No request goes to another origin; the page has no CSP violation or error.
    // The hostile label handler never runs. Newer Chromium builds (156 in CI) report
    // a script-src-attr violation when the sanitizer parses that label in an inert
    // document; only that report is accepted, and any other violation fails.
    const origin = new URL(baseURL).origin;
    expect(seen.requests.filter(url => !url.startsWith('data:') && new URL(url).origin !== origin)).toEqual([]);
    expect(await page.evaluate(() => window.diagramHandlerRan)).toBeUndefined();
    const labelReport = text => text.startsWith('Executing inline event handler violates') || text.startsWith('CSP violation: script-src-attr inline ');
    expect(seen.errors.filter(text => !labelReport(text))).toEqual([]);
    // The page does not scroll horizontally; a wider diagram scrolls inside its figure.
    expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
    const wide = await figure(page, 'Wide').evaluate(e => ({inside: e.scrollWidth > e.clientWidth, fits: e.getBoundingClientRect().right <= document.documentElement.clientWidth}));
    expect(wide.fits).toBe(true);
    if (width === 390) expect(wide.inside).toBe(true);
    // A tall viewport shows the whole document in one screenshot for review.
    if (shots) {await page.setViewportSize({width, height: 3200});await page.screenshot({path: `${shots}/diagrams-${width}.png`});}
  });
}

test('a renderer that does not load leaves the code panels with a note', async ({page}) => {
  await page.route(/diagram-render[^/]*\.js$/, route => route.abort());
  await page.setViewportSize({width: 1440, height: 900});
  const f = await fixture();
  await openRepository(page, f.root);
  await openDocument(page, 'Tenant', 'Specifications', 'Diagrams');
  const figures = documentPage(page).locator('figure.diagram-block');
  await expect(figures.first().getByRole('note')).toHaveText('Diagram not rendered: the diagram renderer did not load.');
  expect(await documentPage(page).locator('figure.diagram-block svg').count()).toBe(0);
  expect(await figures.count()).toBe(await documentPage(page).locator('figure.diagram-block .code-panel').count());
});
