import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openRepository,openArtifact,treeItem,showTree,documentPage,noOverflow} from './workbench.js';
import {editingRepository,editingFiles,tenant,read,commits,changedPaths,fingerprint} from './editing-fixtures.js';
// Task document-editing: the document page edits bodies, properties and
// self-checks through operations and keeps every other byte unchanged.
const spec=tenant+'specifications/identity.md';
async function openSpec(page,root){
 await openRepository(page,root);await openArtifact(page,'Tenant tenant');
 await treeItem(page,/^Specifications/).last().click();await treeItem(page,/^identity\.md/).click();
 await expect(documentPage(page)).toContainText('Established identity rules.');return documentPage(page);
}
const editor=page=>page.getByRole('textbox',{name:'Document text'});

test('edit, save with Ctrl+S, preview, discard and undo keep front matter and other bytes',async({page})=>{
 const f=await editingRepository(),before=await fingerprint(f.root),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const doc=await openSpec(page,f.root);
  await doc.getByRole('button',{name:'Edit',exact:true}).click();
  await expect(editor(page)).toHaveValue('# Identity\n\nEstablished identity rules.\n\n## Details\n\nUnchanged details.\n');
  await editor(page).fill('# Identity\n\nProposed identity rules.\n\n## Details\n\nUnchanged details.\n');
  await expect(page.getByRole('status',{name:'Edit state'})).toContainText('1 unsaved');
  await doc.getByRole('button',{name:'Preview',exact:true}).click();await expect(doc.locator('.editor-preview')).toContainText('Proposed identity rules.');await doc.getByRole('button',{name:'Preview',exact:true}).click();
  await editor(page).press('Control+s');
  await expect(doc.locator('.document-reader')).toContainText('Proposed identity rules.');
  await expect(page.locator('.operation-status')).toContainText('Saved specifications/identity.md.');
  // The writer keeps the front matter bytes and separates the body with one blank line.
  expect(await read(f.root,spec)).toBe('---\n# Kept comment\nowner_note: keep me\n---\n\n# Identity\n\nProposed identity rules.\n\n## Details\n\nUnchanged details.\n');
  expect(changedPaths(before,await fingerprint(f.root))).toEqual([spec]);
  await expect(page.getByRole('status',{name:'Edit state'})).toHaveText('1 uncommitted knowledge file');
  await page.locator('.operation-status').getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.locator('.operation-status')).toContainText('Undid the last operation');
  expect(await read(f.root,spec)).toBe(editingFiles().get(spec));
  // Discard asks before it drops unsaved text.
  await doc.getByRole('button',{name:'Edit',exact:true}).click();await editor(page).fill('# Identity\n\nDraft.\n');
  page.once('dialog',dialog=>dialog.accept());await doc.getByRole('button',{name:'Discard',exact:true}).click();
  await expect(editor(page)).toHaveCount(0);expect(await read(f.root,spec)).toBe(editingFiles().get(spec));
  expect(changedPaths(before,await fingerprint(f.root))).toEqual([]);expect(commits(f.root)).toEqual(['fixture']);expect(errors).toEqual([]);
 }finally{await f.cleanup();}
});

test('a concurrent edit shows both versions with Reload and Overwrite; refresh keeps editor text',async({page})=>{
 const f=await editingRepository();
 try{
  const doc=await openSpec(page,f.root);
  await doc.getByRole('button',{name:'Edit',exact:true}).click();await editor(page).fill('# Identity\n\nMy text.\n');
  await writeFile(join(f.root,spec),'---\nowner_note: other\n---\n# Identity\n\nTheir text.\n');
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(doc.getByRole('status').filter({hasText:'The file changed on disk.'})).toBeVisible();
  await expect(editor(page)).toHaveValue('# Identity\n\nMy text.\n');
  await doc.getByRole('button',{name:'Save',exact:true}).click();
  const dialog=page.getByRole('alertdialog',{name:'Save conflict'});await expect(dialog).toBeVisible();
  await expect(dialog.locator('.diff-line.remove')).toContainText('Their text.');await expect(dialog.locator('.diff-line.add')).toContainText('My text.');
  await expect(dialog.getByRole('button',{name:'Reload',exact:true})).toBeFocused();
  await dialog.getByRole('button',{name:'Overwrite',exact:true}).click();
  await expect(doc.locator('.document-reader')).toContainText('My text.');
  expect(await read(f.root,spec)).toBe('---\nowner_note: other\n---\n\n# Identity\n\nMy text.\n');
  // Reload takes the text on disk into the editor.
  await doc.getByRole('button',{name:'Edit',exact:true}).click();await editor(page).fill('# Identity\n\nSecond draft.\n');
  await writeFile(join(f.root,spec),'---\nowner_note: other\n---\n# Identity\n\nDisk wins.\n');
  await doc.getByRole('button',{name:'Save',exact:true}).click();
  await page.getByRole('alertdialog',{name:'Save conflict'}).getByRole('button',{name:'Reload',exact:true}).click();
  await expect(editor(page)).toHaveValue('# Identity\n\nDisk wins.\n');
  expect(await read(f.root,spec)).toBe('---\nowner_note: other\n---\n# Identity\n\nDisk wins.\n');
 }finally{await f.cleanup();}
});

test('references, fix of an unresolved reference, self-check and advanced front matter',async({page})=>{
 const files=editingFiles();files.set(spec,'---\nreferences:\n  - artifact: billing\n    element: requirements/missing.md\n    requires: Old invoice rules\n---\n# Identity\n\nRules.\n');
 const f=await editingRepository(files),before=await fingerprint(f.root);
 try{
  await openRepository(page,f.root);await openArtifact(page,'Tenant tenant');await treeItem(page,/^Specifications/).last().click();await treeItem(page,/^identity\.md/).click();
  const doc=documentPage(page);await expect(doc).toContainText('Rules.');
  const refs=doc.getByRole('group',{name:'References'});
  await expect(refs).toContainText('unresolved');
  await refs.getByRole('button',{name:'Fix',exact:true}).click();
  const fix=refs.getByRole('form',{name:'Replace reference'});
  await fix.getByLabel('Target artifact').selectOption('billing');await fix.getByLabel('Target document').selectOption('requirements/invoice.md');
  await expect(fix.getByLabel('Reason')).toHaveValue('Old invoice rules');
  await fix.getByRole('button',{name:'Replace reference',exact:true}).click();
  await expect(refs).toContainText('billing / requirements/invoice.md');await expect(refs).not.toContainText('unresolved');
  expect(await read(f.root,spec)).toContain('element: requirements/invoice.md\n    requires: Old invoice rules');
  await refs.getByRole('button',{name:'Add reference',exact:true}).click();
  const add=refs.getByRole('form',{name:'Add reference'});await add.getByLabel('Target artifact').selectOption('tenant');await add.getByLabel('Target document').selectOption('requirements/need.md');await add.getByLabel('Reason').fill('The need it serves');await add.getByLabel('Reason').press('Enter');
  await expect(refs).toContainText('tenant / requirements/need.md');
  await refs.getByRole('button',{name:'Remove reference to tenant / requirements/need.md'}).click();
  await expect(refs).not.toContainText('tenant / requirements/need.md');
  await doc.getByRole('button',{name:'Record self-check',exact:true}).click();
  await doc.getByRole('form',{name:'Record'}).getByRole('button',{name:'Record',exact:true}).click();
  await expect(doc.getByRole('region',{name:'Properties'})).toContainText(`passed · ${spec}#self-check`);
  const text=await read(f.root,spec);expect(text).toMatch(/self_check:\n  result: passed\n  source: .*#self-check/);expect(text).toContain('## Self check\n\nThe content is complete');
  // Invalid front matter stays inline; valid front matter saves.
  await doc.getByText('Advanced front matter',{exact:true}).click();
  const front=doc.getByRole('textbox',{name:'Front matter'});await front.fill('references: [unclosed');await doc.getByRole('button',{name:'Save front matter'}).click();
  await expect(doc.getByRole('alert')).toBeVisible();expect(await read(f.root,spec)).toBe(text);
  await front.fill(text.match(/^---\n([\s\S]*?)\n---/)[1]+'\nreviewer: team');await doc.getByRole('button',{name:'Save front matter'}).click();
  await expect.poll(()=>read(f.root,spec)).toContain('reviewer: team');
  expect(changedPaths(before,await fingerprint(f.root))).toEqual([spec]);
 }finally{await f.cleanup();}
});

test('keyboard editing, unsaved navigation guard and narrow and wide widths',async({page})=>{
 const f=await editingRepository();
 try{
  const doc=await openSpec(page,f.root);
  await doc.getByRole('button',{name:'Edit',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(editor(page)).toBeVisible();await editor(page).focus();await page.keyboard.press('End');await page.keyboard.press('Control+End');await page.keyboard.type('Keyboard line.\n');
  let asked=0;page.once('dialog',dialog=>{asked++;dialog.dismiss();});
  await showTree(page);await treeItem(page,/^Dependency graph/).click();expect(asked).toBe(1);await expect(editor(page)).toBeVisible();
  for(const width of [390,1440]){await page.setViewportSize({width,height:900});expect(await noOverflow(page)).toBe(true);await page.screenshot({path:`test-results/document-editing-${width}.png`,fullPage:true});}
  await editor(page).press('Control+s');await expect(doc.locator('.document-reader')).toContainText('Keyboard line.');
  expect(await read(f.root,spec)).toContain('Unchanged details.\nKeyboard line.\n');
 }finally{await f.cleanup();}
});
