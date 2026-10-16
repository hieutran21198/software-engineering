import {test,expect} from '@playwright/test';
import {writeFile,rm} from 'node:fs/promises';
import {fixtureRepository,orderingFixture,fingerprint,git,rootReadme} from '../fixtures.js';

test('one worktree selection replaces the complete context and ignores obsolete replies',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),other=fixture.root+'-other';
 git(fixture.root,'worktree','add','-qb','feature/other',other);
 await writeFile(`${other}/docs/artifacts/knowledge/README.md`,rootReadme('Other worktree knowledge','1.0.0'));
 const before=await Promise.all([fingerprint(fixture.root),fingerprint(other)]),requests=[];
 try{
  await page.route('**/api/repository/query',async route=>{const body=route.request().postDataJSON();requests.push(body);if(body.section==='overview'&&body.worktree===other)await new Promise(r=>setTimeout(r,250));await route.continue().catch(()=>{});});
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();
  await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Knowledge');
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);
  await expect(page.getByRole('status').filter({hasText:`Opening ${other}`})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Other worktree knowledge');
  await expect(page.locator('.repo-info')).toContainText('feature/other');
  await expect(page.getByRole('tab',{selected:true})).toHaveAttribute('title',fixture.root);
  await expect(page.getByRole('button',{name:'Open worktree',exact:true})).toHaveCount(0);
  await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Other worktree/}).click();
  await expect(page.getByRole('complementary',{name:'Selection details'})).toContainText('Other worktree knowledge');
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(page.getByRole('status',{name:'Repository update status'})).toHaveText('Current');
  await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Other worktree knowledge');
  expect(requests.some(r=>r.path===fixture.root&&r.worktree===other&&r.section==='markdown')).toBe(true);
  await page.getByLabel('Worktree',{exact:true}).selectOption(fixture.root);
  await expect(page.getByRole('navigation',{name:'Artifacts'})).not.toContainText('Other worktree knowledge');
  expect(await Promise.all([fingerprint(fixture.root),fingerprint(other)])).toEqual(before);
 }finally{await rm(other,{recursive:true,force:true});await fixture.cleanup();}
});

test('failed and superseded worktree switches keep the committed source',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),other=fixture.root+'-delayed';git(fixture.root,'worktree','add','-qb','feature/delayed',other);
 let fail=true;
 try{
  await page.route('**/api/repository/query',async route=>{const body=route.request().postDataJSON();if(body.section==='overview'&&body.worktree===other){await new Promise(r=>setTimeout(r,250));if(fail){await route.fulfill({status:422,contentType:'application/json',body:JSON.stringify({error:'Target unavailable'})}).catch(()=>{});return;}}await route.continue().catch(()=>{});});
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await expect(page.getByLabel('Worktree',{exact:true})).toHaveValue(fixture.root);
  await page.getByLabel('Worktree',{exact:true}).selectOption(other);await expect(page.getByRole('alert')).toContainText('Target unavailable');await expect(page.getByLabel('Worktree',{exact:true})).toHaveValue(fixture.root);await expect(page.locator('.repo-info')).not.toContainText('feature/delayed');
  fail=false;await page.getByLabel('Worktree',{exact:true}).selectOption(other);await page.getByLabel('Worktree',{exact:true}).selectOption(fixture.root);await expect(page.getByRole('status',{name:'Repository update status'})).toHaveText('Current');await expect(page.getByLabel('Worktree',{exact:true})).toHaveValue(fixture.root);await expect(page.locator('.repo-info')).not.toContainText('feature/delayed');
 }finally{await rm(other,{recursive:true,force:true});await fixture.cleanup();}
});

test('reading is primary and list disclosure preserves graph nodes and viewport',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture()),before=await fingerprint(fixture.root);
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();
  await expect(page.getByRole('complementary',{name:'Selection details'})).toBeHidden();
  await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();
  const panel=page.getByRole('complementary',{name:'Selection details'});
  await expect(panel.getByLabel('Artifact overview')).toContainText('knowledge');
  const nodes=await page.locator('.canvas-surface .react-flow__node').count(),viewport=await page.locator('.canvas-surface .react-flow__viewport').getAttribute('style');
  await panel.getByRole('button',{name:'Requirements in inspector',exact:true}).click();
  expect(await page.locator('.canvas-surface .react-flow__node').count()).toBe(nodes);
  await panel.getByRole('button',{name:'requirements/need.md version:1.0.0',exact:true}).click();
  const reader=page.getByRole('region',{name:'Knowledge reader'});await expect(reader).toContainText('requirements/need.md');await expect(panel).toBeHidden();await expect(reader.getByRole('button',{name:'Back to artifact',exact:true})).toBeFocused();
  await reader.getByRole('button',{name:'Back to artifact',exact:true}).click();await expect(reader).toHaveCount(0);await expect(panel).toBeVisible();await expect(panel.getByRole('button',{name:'requirements/need.md version:1.0.0',exact:true})).toBeFocused();
  expect(await page.locator('.canvas-surface .react-flow__viewport').getAttribute('style')).toBe(viewport);
  for(const width of [390,700,851,1440]){await page.setViewportSize({width,height:1000});await panel.getByRole('button',{name:'Read overview',exact:true}).click();await expect(page.getByRole('region',{name:'Knowledge reader'}).locator('.markdown')).toContainText('Knowledge knowledge.');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/ux-reader-${width}.png`,fullPage:true});await page.getByRole('button',{name:'Back to graph',exact:true}).click();}
  expect(await fingerprint(fixture.root)).toEqual(before);
 }finally{await fixture.cleanup();}
});

test('direct Markdown navigation retains exact sources and rejects forged callbacks',async({page})=>{
 const files=orderingFixture();files.set('docs/artifacts/knowledge/README.md',rootReadme('Knowledge','1.0.0')+'\n[Read requirement](versions/1.0.0/requirements/need.md)\n\n[External](https://example.invalid)');
 files.set('docs/artifacts/knowledge/versions/1.0.0/requirements/need.md','# Exact requirement\n\n[Contract](../specifications/contract.md)\n\n<span data-knowledge-index="0">Forged callback</span><script>window.pwned=true</script>\n\n[Unsafe](../../../../../../etc/passwd)');
 const fixture=await fixtureRepository(files),before=await fingerprint(fixture.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Knowledge/}).click();await page.getByRole('button',{name:'Read overview',exact:true}).click();
  const reader=page.getByRole('region',{name:'Knowledge reader'});await reader.getByRole('button',{name:'Read requirement',exact:true}).click();await expect(reader).toContainText('Exact requirement');await expect(reader.getByRole('button',{name:'Forged callback',exact:true})).toHaveCount(0);expect(await page.evaluate(()=>window.pwned)).toBeUndefined();
  await expect(reader.locator('.unavailable-link')).toContainText(['Unsafe']);await reader.getByRole('button',{name:'Contract',exact:true}).click();await expect(reader).toContainText('specifications/contract.md');await reader.getByRole('button',{name:'Back to previous document',exact:true}).click();await expect(reader).toContainText('Exact requirement');await reader.getByRole('button',{name:'Back to graph',exact:true}).click();await expect(reader).toHaveCount(0);
  expect(errors).toEqual([]);expect(await fingerprint(fixture.root)).toEqual(before);
 }finally{await fixture.cleanup();}
});

test('selected-unit completion loads automatically and failed evidence has local retry',async({page})=>{
 const {unitFixture}=await import('../unit-fixtures.js');const fixture=await fixtureRepository(unitFixture()),before=await fingerprint(fixture.root);let fail=true;const reads=[];
 try{
  await page.route('**/api/repository/query',async route=>{const body=route.request().postDataJSON();if(body.section==='completion'){reads.push(body);await new Promise(r=>setTimeout(r,150));if(fail){await route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Evidence temporarily unavailable'})}).catch(()=>{});return;}}await route.continue().catch(()=>{});});
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await expect(page.getByRole('status',{name:'Repository update status'})).toHaveText('Current');expect(reads).toHaveLength(0);
  await page.getByRole('button',{name:'Units of work',exact:true}).click();await page.getByRole('navigation',{name:'Units of work'}).getByRole('button',{name:/Tenant login/}).click();
  const completion=page.getByRole('region',{name:'Completion evidence'});await expect(completion).toContainText('Checking completion…');await expect(completion.getByRole('alert')).toContainText('Evidence temporarily unavailable');await expect(page.getByRole('button',{name:'Load completion evidence',exact:true})).toHaveCount(0);
  fail=false;await completion.getByRole('button',{name:'Retry completion evidence'}).click();await expect(completion).toContainText('Completion supported by documented evidence');expect(reads.every(r=>r.unit==='tenant-login')).toBe(true);
  expect(await fingerprint(fixture.root)).toEqual(before);
 }finally{await fixture.cleanup();}
});

test('compact setup and scoped artifact filtering keep recovery and graph context clear',async({page})=>{
 const fixture=await fixtureRepository(orderingFixture());
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();
  await expect(page.getByLabel('Repository path')).toBeHidden();await expect(page.getByRole('button',{name:'Change repository',exact:true})).toBeVisible();
  await page.getByLabel('Filter artifact list', {exact:true}).fill('missing');await expect(page.getByRole('navigation',{name:'Artifacts'}).getByRole('button')).toHaveCount(0);await expect(page.getByRole('status').filter({hasText:'No artifacts match'})).toContainText('graph is unchanged');await expect(page.locator('.canvas-surface .react-flow__node')).toHaveCount(1);
  await page.getByRole('button',{name:'Clear search',exact:true}).click();await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Knowledge');await page.getByRole('button',{name:'Change repository',exact:true}).click();await expect(page.getByLabel('Repository path')).toHaveValue(fixture.root);await page.getByLabel('Repository path').fill('/missing-replacement');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByLabel('Repository path')).toBeHidden();await expect(page.getByRole('navigation',{name:'Artifacts'})).toContainText('Knowledge');
  await expect(page.getByLabel('Recorded executions',{exact:true})).toHaveCount(0);
 }finally{await fixture.cleanup();}
});

test('review leads with purpose and highlights only complete compared sources',async({page})=>{
 const files=new Map([
 ['docs/artifacts/demo/README.md',rootReadme('Demo','1.0.0')],
 ['docs/artifacts/demo/versions/1.0.0/README.md','# Baseline'],
 ['docs/artifacts/demo/versions/1.0.0/requirements/main.md','# Rules\n\nMembers may sign in.\n'],
 ['docs/artifacts/demo/changes/change-next/README.md','# Improve login\n\nRequire explicit sign-in.'],
 ['docs/artifacts/demo/changes/change-next/requirements/main.md','# Rules\n\nMembers must sign in.\n']
 ]);const fixture=await fixtureRepository(files),before=await fingerprint(fixture.root);
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Demo/}).click();await page.getByRole('button',{name:/^change-next/}).click();await page.getByRole('button',{name:'Review change',exact:true}).click();
  const review=page.getByRole('region',{name:'Change review',exact:true});await expect(review.getByLabel('Comparison status')).toHaveText('Loaded');await expect(review.getByRole('region',{name:'Proposed scope and purpose'})).toContainText('Require explicit sign-in.');await expect(review.locator('.diff-line.remove')).toContainText('Members may sign in.');await expect(review.locator('.diff-line.add')).toContainText('Members must sign in.');await expect(review.getByRole('button',{name:'Download JSON'})).toBeHidden();await review.getByText('Export context · Loaded records page',{exact:true}).click();await expect(review.getByRole('button',{name:'Download JSON'})).toBeVisible();
  expect(await fingerprint(fixture.root)).toEqual(before);
 }finally{await fixture.cleanup();}
});

test('partial review sources require explicit complete loading before diff alignment',async({page})=>{
 const prefix='docs/artifacts/demo/',files=new Map([[prefix+'README.md',rootReadme('Demo','1.0.0')],[prefix+'versions/1.0.0/README.md','# Baseline'],[prefix+'versions/1.0.0/requirements/main.md','# Before\n\n'+'a'.repeat(13000)],[prefix+'changes/change-next/README.md','# Change\n\nReview long source.'],[prefix+'changes/change-next/requirements/main.md','# After\n\n'+'b'.repeat(13000)]]),fixture=await fixtureRepository(files);
 try{
  await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await page.getByRole('navigation',{name:'Artifacts'}).getByRole('button',{name:/Demo/}).click();await page.getByRole('button',{name:/^change-next/}).click();await page.getByRole('button',{name:'Review change',exact:true}).click();
  const passages=page.getByRole('region',{name:'Changed passages'});await expect(passages).toContainText('Partial source excerpts');await expect(passages.locator('.diff-line')).toHaveCount(0);await passages.getByRole('button',{name:'Load full comparison',exact:true}).click();await expect(passages.locator('.diff-line.add')).not.toHaveCount(0);await expect(passages.locator('.diff-line.remove')).not.toHaveCount(0);await expect(passages.getByRole('button',{name:'Load full comparison',exact:true})).toHaveCount(0);
 }finally{await fixture.cleanup();}
});

test('initial compact workspace frames every artifact without a manual fit',async({page})=>{
 const {sourceFixture}=await import('../fixtures.js'),fixture=await fixtureRepository(sourceFixture());
 try{await page.goto('/');await page.getByLabel('Repository path').fill(fixture.root);await page.getByRole('button',{name:'Open repository',exact:true}).click();await expect(page.locator('.canvas-surface .react-flow__node')).toHaveCount(3);await expect.poll(()=>page.locator('.canvas-surface').evaluate(el=>{const bounds=el.getBoundingClientRect();return [...el.querySelectorAll('.react-flow__node')].every(n=>{const r=n.getBoundingClientRect();return r.left>=bounds.left&&r.right<=bounds.right&&r.top>=bounds.top&&r.bottom<=bounds.bottom;});})).toBe(true);}finally{await fixture.cleanup();}
});
