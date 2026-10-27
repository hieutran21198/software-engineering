import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {iconPacks,diagramIconsModule,logosCount} from '../scripts/diagram-icons.mjs';
import {lucideNames} from '../src/diagram-icon-names.js';
// The module virtual:diagram-icons of vite.config.js: a pack that lacks a name stops the build.
const require=createRequire(import.meta.url);
const pack=name=>require(`@iconify-json/${name}/icons.json`);
const input=change=>({logos:pack('logos'),logosInfo:require('@iconify-json/logos/info.json'),lucide:pack('lucide'),lucideInfo:require('@iconify-json/lucide/info.json'),names:lucideNames,notice:'ISC License',...change});
test('the icon module has the 65 aws logos and the 24 listed lucide icons with their info records and the Lucide notice',async()=>{
 const icons=await import('data:text/javascript,'+encodeURIComponent(diagramIconsModule()));
 assert.equal(logosCount,65);assert.equal(Object.keys(icons.logos.icons).length,65);
 assert.ok(Object.keys(icons.logos.icons).every(name=>name.startsWith('aws')&&icons.logos.icons[name].body));
 assert.equal(lucideNames.length,24);assert.deepEqual(Object.keys(icons.lucide.icons),lucideNames);
 assert.deepEqual([icons.logos.prefix,icons.logos.info.license.spdx,icons.lucide.prefix,icons.lucide.info.license.spdx],['logos','CC0-1.0','lucide','ISC']);
 assert.deepEqual([icons.logos.aliases,icons.lucide.aliases,icons.logos.notice],[undefined,undefined,undefined]);
 assert.match(icons.lucide.notice,/^ISC License\n\nCopyright \(c\) 2026 Lucide Icons and Contributors\n/);
 assert.match(icons.lucide.notice,/\nCopyright \(c\) 2013-present Cole Bemis\n/);
});
test('a listed lucide name that the pinned pack lacks stops the build',()=>{
 assert.throws(()=>iconPacks(input({names:[...lucideNames,'not-an-icon']})),/^Error: The lucide pack has no icon named not-an-icon\.$/);
});
test('a logos pack without exactly 65 names that start with aws stops the build',()=>{
 const {'aws-s3':removed,...fewer}=pack('logos').icons;
 assert.throws(()=>iconPacks(input({logos:{...pack('logos'),icons:fewer}})),/^Error: The logos pack has 64 names that start with aws, not 65\.$/);
 assert.throws(()=>iconPacks(input({logos:{...pack('logos'),icons:{...pack('logos').icons,'aws-new':{body:'<path/>'}}}})),/has 66 names/);
});
