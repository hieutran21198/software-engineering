import test from 'node:test';
import assert from 'node:assert/strict';
import {chmod,mkdir,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createImpactIndex,parseModule,vocabulary,isTestFile,git as rawGit} from '../server/impact-index.js';
import {impactRepository} from './impact-fixtures.js';
import {git} from './fixtures.js';

const goAvailable=(()=>{try{execFileSync('go',['version'],{stdio:'ignore'});return true;}catch{return false;}})();

test('parseModule reads specifiers, declarations with mentions, re-exports and dynamic imports',()=>{
  const r=parseModule("import def, {a as b, c} from './x.js';\nimport * as ns from './y.js';\nimport './side.css';\nexport {q as r} from './z.js';\nexport * from './w.js';\nexport function f(){return b()+c;}\nexport class K{m(){return ns.v;}}\nconst [p,{q2}]=[1,{q2:2}];\nexport default function D(){return f();}\nconsole.log(p);\nconst lazy=()=>import('./lazy.js');\n",'m.js');
  assert.equal(r.failed,null);
  assert.deepEqual(r.imports.map(i=>[i.spec,i.names.map(n=>n.imported+'>'+n.local).join(','),i.dynamic]),[['./x.js','default>def,a>b,c>c',false],['./y.js','*>ns',false],['./side.css','*>*',false],['./z.js','q>(re-export:r)',false],['./w.js','*>*',false],['./lazy.js','*>*',true]]);
  const byName=Object.fromEntries(r.declarations.map(d=>[d.name,d]));
  assert.ok(byName.f.exported&&byName.f.mentions.includes('b')&&byName.f.mentions.includes('c'));
  assert.ok(byName.K.mentions.includes('ns')&&!byName.K.mentions.includes('m'));
  assert.deepEqual(byName['(export list)'].exportNames,[{local:'(re-export:r)',exported:'r'}]);
  assert.deepEqual(byName['(export all)'].mentions,['*']);
  assert.ok(byName.p&&byName.q2&&byName.D.exportNames[0].exported==='default');
  assert.ok(byName['(statement)'].mentions.includes('p'));
  const broken=parseModule("import {x} from './x.js';\nexport function f( {\n",'b.js');
  assert.ok(broken.failed);assert.deepEqual(broken.imports.map(i=>i.spec),['./x.js']);assert.equal(broken.declarations.length,0);
  assert.ok(vocabulary('const identityFormat=1; const path=2; function loginRule(){}').includes('identityFormat'));
  assert.ok(isTestFile('apps/x/test/a.test.js')&&isTestFile('pkg/a_test.go')&&!isTestFile('src/a.js'));
});

test('index builds derived relations, updates incrementally by identity and removes stale rows',async t=>{
  const f=await impactRepository();t.after(f.cleanup);
  const index=createImpactIndex({stateDir:f.stateDir,goCommand:'go-not-installed'});t.after(()=>index.close());
  const first=await index.update(f.root);
  assert.equal(first.generation,1);assert.ok(first.parsed>=9);assert.equal(first.goAvailable,false);
  const rel=index.relations(f.root);
  assert.ok(rel.imports.some(e=>e.from==='src/check.js'&&e.to==='src/util.js'&&e.names[0]==='helper'));
  assert.ok(rel.imports.some(e=>e.from==='src/main.jsx'&&e.to==='src/styles.css'&&e.names[0]==='*'));
  assert.ok(rel.imports.some(e=>e.from==='src/index.js'&&e.to==='src/check.js'&&e.locals[0]==='(re-export:verify)'));
  assert.ok(rel.declarations.get('src/check.js').some(d=>d.name==='check'&&d.exported&&d.mentions.includes('helper')));
  assert.ok(rel.diagnostics.some(d=>d.path==='src/broken.js'&&d.code==='parse-failure'));
  assert.ok(rel.imports.some(e=>e.from==='src/broken.js'&&e.to==='src/check.js'),'file-level relations survive a parse failure');
  assert.equal(rel.packages.length,0);
  const mirror=[...rel.mirrors.values()].find(paths=>paths.includes('docs/bundle/page.md'));
  assert.deepEqual(mirror.sort(),['docs/bundle/page.md','mirror/page.md']);
  const pairs=rel.history.get('hist/a.js');
  assert.ok(pairs.some(p=>p.b==='hist/b.js'&&p.support===3&&p.total===4&&p.confidence===0.75));
  assert.ok(!pairs.some(p=>p.b==='hist/c.js'),'single co-change stays out');
  assert.ok(!rel.history.has('bulk/f1.txt'),'bulk commits are skipped');
  assert.ok(rel.vocabulary.get('src/vocab.js').includes('identityFormat'));
  // No change: nothing is parsed. One change: one file parsed, generation advances.
  const second=await index.update(f.root);assert.equal(second.parsed,0);assert.equal(second.generation,1);
  await f.write('src/util.js','export function helper(){return 3;}\nexport function other(){return 2;}\nexport function added(){return 4;}\n');
  const started=performance.now();const third=await index.update(f.root);const ms=performance.now()-started;
  assert.equal(third.parsed,1);assert.equal(third.changed,1);assert.equal(third.generation,2);assert.ok(ms<2000,`incremental update took ${ms} ms`);
  assert.ok(index.relations(f.root).declarations.get('src/util.js').some(d=>d.name==='added'));
  // Removal drops relations; the same path is also gone from the files table.
  await rm(join(f.root,'src/only-unrelated.js'));f.commit('remove');
  const fourth=await index.update(f.root);assert.equal(fourth.removed,1);
  const after=index.relations(f.root);assert.ok(!after.files.has('src/only-unrelated.js'));assert.ok(!after.imports.some(e=>e.from==='src/only-unrelated.js'));
  // A dirty copy of a mirror is reported as diverged.
  await f.write('docs/bundle/page.md','# Page\n\nChanged copy.\n');await index.update(f.root);
  assert.ok(index.relations(f.root).diverged.has('docs/bundle/page.md'));
  console.log(`impact-index fixture: full ${first.timings.totalMs} ms, incremental ${Math.round(ms)} ms`);
});

test('a failed update publishes nothing and the private file is guarded',async t=>{
  const f=await impactRepository();t.after(f.cleanup);
  const index=createImpactIndex({stateDir:f.stateDir,goCommand:'go-not-installed'});t.after(()=>index.close());
  await assert.rejects(index.update(join(f.root,'missing-directory')));
  assert.equal(index.generation(join(f.root,'missing-directory')),0);
  await chmod(index.path,0o644);
  assert.throws(()=>createImpactIndex({stateDir:f.stateDir}),/private/);
  await chmod(index.path,0o600);
  assert.throws(()=>createImpactIndex({stateDir:join(f.root,'inside')}),/outside repositories/);
});

test('go packages, same-package tests and embedded files are indexed when go is available',{skip:!goAvailable},async t=>{
  const f=await impactRepository(new Map([['go.mod','module example.com/m\n\ngo 1.21\n'],['pkg/a/a.go','package a\n\nimport _ "embed"\n\n//go:embed data.txt\nvar Data string\n'],['pkg/a/data.txt','hello\n'],['pkg/a/a_test.go','package a\n\nimport "testing"\n\nfunc TestA(t *testing.T){}\n'],['cmd/main.go','package main\n\nimport "example.com/m/pkg/a"\n\nfunc main(){_=a.Data}\n']]));t.after(f.cleanup);
  const index=createImpactIndex({stateDir:f.stateDir});t.after(()=>index.close());
  const r=await index.update(f.root);assert.equal(r.goAvailable,true);
  const rel=index.relations(f.root);
  assert.ok(rel.packages.some(p=>p.dir==='cmd'&&p.imports.some(i=>i.dir==='pkg/a'&&i.test===false)));
  assert.ok(rel.embeds.some(e=>e.file==='pkg/a/a.go'&&e.target==='pkg/a/data.txt'));
});

test('ls-files is skipped when HEAD and status are unchanged',async t=>{
  const f=await impactRepository();t.after(f.cleanup);
  const index=createImpactIndex({stateDir:f.stateDir,goCommand:'go-not-installed'});t.after(()=>index.close());
  const porcelain=()=>rawGit(f.root,['status','--porcelain=v1','-z','--untracked-files=no'],true);
  const head=git(f.root,'rev-parse','HEAD'),status=await porcelain();
  await index.update(f.root,f.root,{head,status});
  const again=await index.update(f.root,f.root,{head,status});
  assert.equal(again.skipped,true);assert.equal(again.generation,1);
  await writeFile(join(f.root,'src/util.js'),'export function helper(){return 7;}\n');
  const changed=await index.update(f.root,f.root,{head,status:await porcelain()});
  assert.equal(changed.parsed,1);
});
