import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {marked,Renderer} from 'marked';
import {diagramRecords,indexDiagrams} from '../server/diagram-index.js';
import {queryRepository,stripBodies} from '../server/repository-query.js';
import {scanRepository} from '../server/reader.js';
import {createReviewService} from '../server/change-review.js';
import {fixtureRepository,git,identity,inPlaceFixture,versionRecord} from './fixtures.js';

const fence='```',long='A'.repeat(150),wide=`Source: ${'word '.repeat(70)}\nsecond line`;
const document=`---
system_view: true
---
# Diagram fixture

${fence}mermaid
%% comment line
%%{init: {}}%%

flowchart LR
    accTitle: First view
    a --> b
${fence}

Source: platform:specifications/system-overview.md; derived one node per row; current snapshot.

Stale: payments:specifications/payment-worker.md changed; recheck pending.

## Lists and quotes

- Item with a diagram
  ${fence}mermaid
  sequenceDiagram
    accTitle: In a list
    a->>b: call
  ${fence}
  Illustrative: an example inside a list item.
- Other item
  > ${fence}mermaid
  > classDiagram
  >   accTitle: In a quote in a list
  > ${fence}

> ${fence}mermaid
> stateDiagram-v2
>   accTitle:    In a quote
>   [*] --> A
> ${fence}
>
> A paragraph.
>
> Stale: ordering:specifications/order-data.md changed; recheck pending.

${fence}js
const notADiagram = 1;
${fence}

    indented code is not a diagram

${fence}mermaidx
graph
${fence}

### Later section

${fence}mermaid title extra
erDiagram
  accTitle: ${long}
${fence}

${wide}

A first paragraph.

Stale: the third paragraph is out of range.

${fence}mermaid
graph TD
  accTitle: Last block
${fence}

## Next heading

Source: this paragraph belongs to the section, not to the block.
`;

// The numbering of renderer.code in src/Markdown.jsx, without its DOM sanitizing.
function figures(markdown){
 const content=markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,''),diagrams=[],renderer=new Renderer();
 renderer.code=({text,lang})=>{
  if((lang||'').trim().split(/\s+/)[0]!=='mermaid')return '<pre></pre>';
  return `<figure class="diagram-block" data-diagram-index="${diagrams.push(text)-1}"></figure>`;
 };
 const html=marked.parse(content,{renderer});
 return {diagrams,indexes:[...html.matchAll(/data-diagram-index="(\d+)"/g)].map(m=>Number(m[1]))};
}
const keysOf=value=>Array.isArray(value)?value.flatMap(keysOf):value&&typeof value==='object'?Object.entries(value).flatMap(([k,v])=>[k,...keysOf(v)]):[];

test('DP3: diagram records follow the field table in document order',()=>{
 const records=diagramRecords(document);
 assert.deepEqual(records.map(r=>[r.index,r.type,r.title,r.heading]),[
  [0,'flowchart','First view','Diagram fixture'],
  [1,'sequenceDiagram','In a list','Lists and quotes'],
  [2,'classDiagram','In a quote in a list','Lists and quotes'],
  [3,'stateDiagram-v2','In a quote','Lists and quotes'],
  [4,'erDiagram','A'.repeat(120),'Later section'],
  [5,'graph','Last block','Later section'],
 ]);
 assert.deepEqual(records[0].source,{kind:'source',text:'Source: platform:specifications/system-overview.md; derived one node per row; current snapshot.'});
 assert.equal(records[0].stale,'Stale: payments:specifications/payment-worker.md changed; recheck pending.');
 assert.deepEqual(records[1].source,{kind:'illustrative',text:'Illustrative: an example inside a list item.'});
 assert.equal(records[1].stale,null);
 assert.equal(records[2].source,null);
 // The second paragraph after the block holds the stale line.
 assert.equal(records[3].source,null);assert.equal(records[3].stale,'Stale: ordering:specifications/order-data.md changed; recheck pending.');
 assert.equal(records[4].source.kind,'source');assert.equal(records[4].source.text.length,300);assert.ok(records[4].source.text.startsWith('Source: word word'));assert.ok(!records[4].source.text.includes('\n'));
 assert.equal(records[4].stale,null);
 // A heading ends the paragraphs of a block: the next Source: line is not its source.
 assert.equal(records[5].source,null);assert.equal(records[5].stale,null);
});
test('DP3: blocks without a heading, title or diagram line get null fields',()=>{
 assert.deepEqual(diagramRecords(`${fence}mermaid\nflowchart\n  a --> b\n${fence}\n\nText.\n`),[{index:0,type:'flowchart',title:null,heading:null,source:null,stale:null}]);
 assert.deepEqual(diagramRecords(`# Only comments\n\n${fence}mermaid\n%% nothing else\n\n${fence}\n`).map(r=>[r.type,r.heading]),[[null,'Only comments']]);
 assert.deepEqual(diagramRecords('# No diagram\n\n```js\nmermaid\n```\n'),[]);
});
test('DP3: a Stale: line directly under the source line is found and ends the source text',()=>{
 const [record]=diagramRecords(`${fence}mermaid\nflowchart\n  a --> b\n${fence}\n\nSource: a:specifications/x.md; current snapshot.\nStale: a:specifications/x.md changed; recheck pending.\n`);
 assert.deepEqual(record.source,{kind:'source',text:'Source: a:specifications/x.md; current snapshot.'});
 assert.equal(record.stale,'Stale: a:specifications/x.md changed; recheck pending.');
});
test('DP3: the index of each record equals the data-diagram-index of src/Markdown.jsx',async()=>{
 const source=await readFile(new URL('../src/Markdown.jsx',import.meta.url),'utf8');
 // These lines are the numbering that figures() reproduces; a change there must change this test.
 assert.ok(source.includes("if((lang||'').trim().split(/\\s+/)[0]!=='mermaid')return panel;"));
 assert.ok(source.includes('data-diagram-index="${diagrams.push(text)-1}"'));
 assert.ok(source.includes("text.replace(/^---\\r?\\n[\\s\\S]*?\\r?\\n---(?:\\r?\\n|$)/,'')"));
 const records=diagramRecords(document),{diagrams,indexes}=figures(document);
 assert.deepEqual(indexes,records.map(r=>r.index));
 // Each figure holds the block of the record with the same index.
 for(const record of records)assert.ok(diagrams[record.index].includes(record.title),record.title);
});
test('DP3: only working elements of in-place artifacts are indexed',()=>{
 const text=Buffer.from(`---\nsystem_view: true\n---\n# View\n\n${fence}mermaid\nflowchart\n${fence}\n`);
 const element=(source,file)=>({source,path:'specifications/view.md',file});
 const snapshot={artifacts:[
  {layout:'legacy',elements:[element('version:1.0.0','docs/artifacts/l/versions/1.0.0/specifications/view.md')]},
  {layout:'in-place',elements:[element('change:change-x','docs/artifacts/i/changes/change-x/specifications/view.md'),element('working','docs/artifacts/i/specifications/view.md')]},
 ]};
 const texts=new Map(snapshot.artifacts.flatMap(a=>a.elements.map(e=>[e.file,text])));
 indexDiagrams(snapshot,texts);
 assert.deepEqual(snapshot.artifacts.flatMap(a=>a.elements.map(e=>[e.source,!!e.systemView,e.diagrams?.length??0])),[['version:1.0.0',false,0],['change:change-x',false,0],['working',true,1]]);
});

const view=(value,body='')=>`---\nsystem_view: ${value}\n---\n# View ${value}\n${body}`;
const block=`\n${fence}mermaid\nflowchart LR\n  accTitle: Context\n  a --> b\n${fence}\n\nSource: tenant:specifications/system-overview.md; current snapshot.\n`;
function viewFixture(){
 const files=inPlaceFixture(),base='docs/artifacts/tenant/';
 files.set(base+'specifications/system-overview.md',view('true',block));
 files.set(base+'specifications/flows/journey.md',view('true',block));
 files.set(base+'requirements/quoted.md',view('"true"'));
 files.set(base+'requirements/yes.md',view('yes'));
 files.set(base+'decisions/one.md',view('1'));
 files.set(base+'decisions/false.md',view('false',block));
 files.set(base+'decisions/broken.md','---\nsystem_view: [true\n---\n# Broken\n');
 return files;
}
const fields=artifacts=>JSON.parse(JSON.stringify(artifacts,(key,value)=>key==='systemView'||key==='diagrams'?undefined:value));
test('DP3, DP12: the overview adds systemView and diagrams; other element records are unchanged byte for byte',async t=>{
 const f=await fixtureRepository(viewFixture());t.after(f.cleanup);
 const overview=await queryRepository({path:f.root,section:'overview'}),plain=stripBodies((await scanRepository(f.root,{metadata:true})).snapshot);
 const tenant=overview.data.artifacts.find(a=>a.id==='tenant'),byPath=Object.fromEntries(tenant.elements.map(e=>[e.path,e]));
 assert.equal(byPath['specifications/system-overview.md'].systemView,true);
 assert.deepEqual(byPath['specifications/system-overview.md'].diagrams,[{index:0,type:'flowchart',title:'Context',heading:'View true',source:{kind:'source',text:'Source: tenant:specifications/system-overview.md; current snapshot.'},stale:null}]);
 // A flow record never declares a system view, but its diagrams stay in the index.
 assert.equal('systemView' in byPath['specifications/flows/journey.md'],false);assert.equal(byPath['specifications/flows/journey.md'].diagrams.length,1);
 for(const path of ['requirements/quoted.md','requirements/yes.md','decisions/one.md','decisions/broken.md'])assert.deepEqual(Object.keys(byPath[path]).filter(k=>k==='systemView'||k==='diagrams'),[],path);
 assert.equal('systemView' in byPath['decisions/false.md'],false);assert.equal(byPath['decisions/false.md'].diagrams.length,1);
 assert.deepEqual(overview.data.artifacts.flatMap(a=>a.elements.filter(e=>e.systemView).map(e=>`${a.id}:${e.path}`)),['tenant:specifications/system-overview.md']);
 // Other records and keys stay as they were without the index.
 assert.equal(JSON.stringify(fields(overview.data.artifacts)),JSON.stringify(plain.artifacts));
 const unindexed=overview.data.artifacts.flatMap(a=>a.elements).filter(e=>!e.systemView&&!e.diagrams),before=plain.artifacts.flatMap(a=>a.elements);
 assert.ok(unindexed.length>5);for(const e of unindexed)assert.equal(JSON.stringify(e),JSON.stringify(before.find(b=>b.id===e.id)));
});
test('DP12: change context packets contain no diagrams or systemView field',async t=>{
 const base='docs/artifacts/a/',files=new Map([[base+'README.md',identity('A','1.0.0')],[base+'requirements/README.md','# Need\n'],[base+'specifications/system-overview.md',view('true',block)],[base+'versions/1.0.0/README.md',versionRecord('change-initial')],[base+'changes/change-initial/README.md','# Initial'],[base+'changes/change-initial/tasks/README.md','---\ntasks: []\n---\n# Plan']]);
 const f=await fixtureRepository(files);t.after(f.cleanup);
 git(f.root,'checkout','-q','-b','change-test');
 await writeFile(join(f.root,base+'specifications/system-overview.md'),view('true',block+block));
 await mkdir(join(f.root,base+'changes/change-test/tasks'),{recursive:true});
 await writeFile(join(f.root,base+'changes/change-test/README.md'),'# Proposed scope\n');await writeFile(join(f.root,base+'changes/change-test/tasks/README.md'),'---\ntasks: []\n---\n# Plan\n');
 const packet=await createReviewService({roots:[f.root]}).query({path:f.root,artifact:'a',change:'change-test',operation:'packet',limit:100,budget:100000});
 assert.ok(packet.data.records.some(r=>r.path==='specifications/system-overview.md'&&r.status==='modified'));
 assert.ok(packet.data.sources.some(s=>s.text.includes('system_view: true')&&s.text.includes('```mermaid')));
 const keys=keysOf(packet);assert.ok(!keys.includes('diagrams'));assert.ok(!keys.includes('systemView'));
});
