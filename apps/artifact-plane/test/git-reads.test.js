import {test} from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fixtureRepository,git as fixtureGit} from './fixtures.js';
import {git} from '../server/reader.js';
import {gitReads,clearHistory,historyStats} from '../server/git-reads.js';
import {processStats} from '../server/git-process.js';
test('immutable byte reuse, coalesced reads, missing recovery and fresh refs',async()=>{
 const f=await fixtureRepository(new Map([['docs/artifacts/a.md','first\n']]));clearHistory();let spawned=0;let session=gitReads(git,()=>spawned++);
 try{
  const head=await git(f.root,['rev-parse','HEAD']);const values=await Promise.all(Array.from({length:20},()=>session(f.root,['show',head+':docs/artifacts/a.md'],'bytes')));
  assert(values.every(v=>v.equals(Buffer.from('first\n'))));assert.equal(spawned,1);
  await assert.rejects(session(f.root,['show',head+':absent'],'bytes'));
  session.close();session=gitReads(git,()=>spawned++);assert.equal(await session(f.root,['show',head+':docs/artifacts/a.md'],true),'first\n');assert.equal(spawned,1);
  await writeFile(join(f.root,'docs/artifacts/a.md'),'second');fixtureGit(f.root,'add','.');fixtureGit(f.root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','second');
  assert.equal(await session(f.root,['show','main:docs/artifacts/a.md'],true),'second');assert(historyStats().bytes<=32*1024*1024);assert(historyStats().entries<=4096);assert(processStats().peak<=8);
 }finally{session.close();await f.cleanup();}
});
test('entry and byte budgets evict historical content',async()=>{
 const files=new Map();for(let i=0;i<4100;i++)files.set('docs/artifacts/f'+i+'.md','x');
 const f=await fixtureRepository(files);clearHistory();const session=gitReads(git);
 try{const head=await git(f.root,['rev-parse','HEAD']);for(let i=0;i<4100;i++)await session(f.root,['show',head+':docs/artifacts/f'+i+'.md'],'bytes');assert.equal(historyStats().entries,4096);assert.equal(historyStats().bytes,4096);}finally{session.close();await f.cleanup();}
 const big=await fixtureRepository(new Map(Array.from({length:40},(_,i)=>['docs/artifacts/f'+i+'.md','x'.repeat(1024*1024)])));clearHistory();const large=gitReads(git);
 try{const head=await git(big.root,['rev-parse','HEAD']);for(let i=0;i<40;i++)await large(big.root,['show',head+':docs/artifacts/f'+i+'.md'],'bytes');assert.equal(historyStats().bytes,32*1024*1024);assert.equal(historyStats().entries,32);}finally{large.close();await big.cleanup();}
});
test('concurrent sessions reserve capacity for mutable Git reads',async()=>{
 const f=await fixtureRepository(new Map([['docs/artifacts/a.md','data']]));clearHistory();
 try{const head=await git(f.root,['rev-parse','HEAD']);await Promise.all(Array.from({length:16},async(_,i)=>{const read=gitReads(git);try{await read(f.root,['show',head+':docs/artifacts/a.md'],true);assert.equal(await read(f.root,['rev-parse','HEAD']),head);}finally{read.close();}}));assert(processStats().peak<=8);}finally{await f.cleanup();}
});
