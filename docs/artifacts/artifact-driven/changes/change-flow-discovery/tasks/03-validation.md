---
id: add-validation
depends_on: [flow-guidance, add-inventory]
---

# Validate and prepare ADD delivery

## Scope and governing knowledge

Coordinator owns combined validation, bundle adoption checks and the proposed complete ADD snapshot/root/provenance. Do not execute downstream tasks or rewrite historical snapshots.

Governing requirements: requirements/flows.md. Governing specification: specifications/system-flows.md. Consume the unit shared criteria without copying them into this authority.

## Definition of Done

- [x] Go tests and go vet pass with a writable cache.
- [x] Fresh/repeated/dry-run adoption preserves the full bundle and conflicts; website build succeeds.
- [x] New flow records and task DAG validate; changed Markdown links and hierarchy validate.
- [x] Historical snapshots/evidence are unchanged; proposed new version has source_change, delivery_tasks: change and no task copies.
- [ ] Record upstream-only evidence and prepare a PR; do not claim the shared unit complete.

## Evidence

## Commands and current results

- GOCACHE=/tmp/flow-discovery-go-cache go test ./...: passed for all Go packages, including full canonical/bundle fidelity, embedded filesystem, CLI selection, adoption/repeat/dry-run and conflict preservation.
- GOCACHE=/tmp/flow-discovery-go-cache go vet ./...: passed.
- npm run build in website: passed; generated documentation and strict broken-link checks succeeded.
- npm test in apps/artifact-plane: initially blocked by sandbox spawnSync git EPERM. The isolated reader test passed with required subprocess permissions; the full rerun passed 136 tests with no failures or skips. This is existing-input regression coverage, not completion of the planned flow reader.
- npm run build in apps/artifact-plane: passed. Existing bundler directive/chunk-size warnings are unchanged; no application source was changed.
- The authored flow-record check below passed: five flows, 29 steps, 30 transitions and 15 readable supporting sources. It validates these authored records, not the future Plane parser or semantic retrieval.
- All fresh task DAGs validate: ADD 3 tasks/3 edges, Plane 6 tasks/7 edges, Story-Driven 1 task/0 edges.

## Reproducible authored-record check

From repository root after installing the locked Plane development dependencies, run the following with node --input-type=module. The temporary script used during validation is fully included here; delivery does not depend on that file.

```javascript
import {readFile,readdir,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
const {parseDocument}=await import(pathToFileURL(resolve('apps/artifact-plane/node_modules/yaml/dist/index.js')));
const root=await realpath('.'),base='docs/artifacts/artifact-driven/changes/change-flow-discovery/';
const names=(await readdir(base+'specifications/flows')).filter(n=>n.endsWith('.md'));
const records=new Map();let steps=0,edges=0,sources=0;
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const id=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]*$/.test(s);
const text=s=>typeof s==='string'&&s.trim().length>0;
const unique=xs=>new Set(xs).size===xs.length;
const safe=p=>typeof p==='string'&&!isAbsolute(p)&&!p.includes('\\')&&!p.includes('\0')&&p.split('/').every(x=>x&&x!=='.'&&x!=='..'&&x!=='.git');
for(const name of names){
 const markdown=await readFile(base+'specifications/flows/'+name,'utf8');
 const match=markdown.match(/^---\n([\s\S]*?)\n---/);assert(match,name+': front matter');
 const doc=parseDocument(match[1]);assert(!doc.errors.length,name+': YAML');const f=doc.toJS().flow;
 assert(id(f.id)&&f.artifact==='artifact-driven'&&!records.has(f.id),name+': owner/identity');
 assert(['title','trigger','outcome'].every(k=>text(f[k])),name+': text');
 assert(Array.isArray(f.steps)&&f.steps.length>0&&unique(f.steps.map(s=>s.id)),name+': steps');
 assert(Array.isArray(f.support)&&unique(f.support.map(s=>s.id)),name+': support');
 const stepIDs=new Set(f.steps.map(s=>s.id)),supportIDs=new Set(f.support.map(s=>s.id));
 assert(Array.isArray(f.entry_steps)&&f.entry_steps.length&&unique(f.entry_steps)&&f.entry_steps.every(x=>stepIDs.has(x)),name+': entries');
 for(const s of f.steps)assert(id(s.id)&&text(s.title)&&Array.isArray(s.supports)&&unique(s.supports)&&s.supports.every(x=>supportIDs.has(x)),name+': support endpoint');
 assert(Array.isArray(f.transitions)&&f.transitions.every(e=>stepIDs.has(e.from)&&stepIDs.has(e.to)&&(!('condition'in e)||text(e.condition))),name+': transitions');
 for(const s of f.support){
  assert(id(s.id)&&text(s.requires)&&['documented','static','observed','inferred'].includes(s.basis),name+': evidence basis');
  assert(['element','flow','implementation','test'].includes(s.kind),name+': support kind');
  if(s.basis==='observed')assert(Array.isArray(s.evidence)&&s.evidence.length,name+': observation evidence');
  if(s.kind==='element'){
   assert(s.artifact==='artifact-driven'&&safe(s.element)&&/^(requirements|specifications|decisions|tasks)\/.+\.md$/.test(s.element),name+': element path');
   await readFile(base+s.element);sources++;
  }else if(s.kind==='flow')assert(s.artifact==='artifact-driven'&&id(s.flow),name+': target flow');
  else{
   assert(safe(s.path),name+': source path');const target=await realpath(s.path),rel=relative(root,target);
   assert(rel!=='..'&&!rel.startsWith('../')&&!isAbsolute(rel),name+': contained source');await readFile(target);sources++;
  }
 }
 for(const key of ['gaps','exclusions'])assert(Array.isArray(f[key])&&f[key].every(text),name+': coverage');
 records.set(f.id,f);steps+=f.steps.length;edges+=f.transitions.length;
}
for(const f of records.values())for(const s of f.support)if(s.kind==='flow')assert(records.has(s.flow),f.id+': subflow target');
assert(records.size===5,'five planned ADD journeys');
console.log(`${records.size} valid ADD flows; ${steps} steps; ${edges} transitions; ${sources} readable supporting sources. Shared support and a step loop remain valid.`);
```

## Remaining delivery checks

Changed Markdown link/hierarchy checks, snapshot/retention checks and PR preparation are recorded below after execution. Plane browser, embedding, MCP and new-flow retrieval checks belong to the downstream implementation and have not run.


## Snapshot, links and adoption review

The changed/new Markdown scan covered 127 files and resolved 167 local file/heading links with no ancestor README references. Compare relative destinations after stripping fenced examples, then resolve each Markdown link and heading against its source directory. All old tracked artifact snapshots and originating changes remain unchanged against main. The new 2.1.0 requirements/specifications/decisions path sets and bytes match the originating change; tasks are absent from the version. Provenance identifies change-flow-discovery with delivery_tasks: change.

CLI smoke check: GOCACHE=/tmp/flow-discovery-go-cache go run ./cmd/se-adopt --project <isolated-temporary-workspace> --dry-run reported 40 new files and created none. Fresh adoption copied 40 files, including system-flows.md byte-for-byte. Repeat reported zero new and 40 unchanged. After changing the consumer guide, adoption rejected the conflict and preserved those bytes. No project artifacts or index were generated.

## Upstream delivery boundary

ADD 2.1.0 is proposed, not established. The full unit remains incomplete. No new Plane parser/view/index/embedding/MCP implementation or Story-Driven inventory delivery was performed before the required upstream merge. Their approved preparation and fresh task plans remain available for continuation.
