import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { createFlowService, guardFlowDirectory, SEMANTIC_CUTOFF } from "../server/flow-index.js";
import {
  createLocalEmbedder,
  normalizeVector,
} from "../server/flow-embeddings.js";
function fixture(revision = "one", worktree = "/repo") {
  const flow = {
    id: worktree + ":flow",
    logicalId: "owner:login",
    localId: "login",
    title: "Login membership",
    artifact: "owner",
    source: "change:change-flow",
    trigger: "Login",
    outcome: "Session",
    file: "flow.md",
    steps: [{ id: "check", nodeId: "step", title: "Check identity" }],
    support: [
      {
        file: "src/check.js",
        targetId: "source",
        requires: "Tenant membership",
      },
    ],
    transitions: [],
    gaps: [],
    exclusions: [],
    state: "valid",
  };
  return {
    repository: { path: "/repo" },
    worktree,
    revision,
    graph: {
      flows: [flow],
      nodes: [
        { id: flow.id, kind: "flow", logicalId: flow.logicalId },
        { id: "step", kind: "step", flow: flow.id },
        { id: "source", kind: "implementation", file: "src/check.js" },
      ],
      edges: [
        {
          source: "step",
          target: "source",
          kind: "supports",
          resolved: true,
          reason: "Membership",
        },
      ],
      diagnostics: [],
    },
    sources: [
      {
        id: "doc",
        path: "flow.md",
        kind: "element",
        text: "Login flow documentation",
        fingerprint: revision,
      },
      {
        id: "source",
        path: "src/check.js",
        kind: "implementation",
        text: "Membership validation",
        fingerprint: revision,
      },
    ],
    units: [],
  };
}
async function setup(t, options = {}) {
  const stateDir = await mkdtemp(join(tmpdir(), "plane-flow-"));
  const service = createFlowService({
    stateDir,
    loader: async () => fixture(),
    ...options,
  });
  t.after(async () => {
    service.close();
    await rm(stateDir, { recursive: true, force: true });
  });
  return { service, stateDir };
}
const query = { path: "/repo", operation: "search", query: "membership" };
test('search relevance and unique exact IDs beat newer records before paging', async (t) => {
  const record=fixture();
  record.graph.flows[0].createdAt='2020-01-01T00:00:00.000Z';
  record.graph.flows.push({...record.graph.flows[0],id:'/repo:new',localId:'new',logicalId:'owner:new',title:'New unrelated journey',createdAt:'2025-01-01T00:00:00.000Z'});
  const {service}=await setup(t,{loader:async()=>structuredClone(record),embedder:{signature:'ranking-fixture',embed:async texts=>texts.map(text=>text.includes('New unrelated')?[0,1]:[1,0])}});
  for(const value of ['owner:login','login','/repo:flow','  owner:login  ']){
    const first=await service.query({...query,query:value,limit:1});
    assert.equal(first.data.flows[0].id,'/repo:flow');
    const next=await service.query({...query,query:value.trim(),limit:1,cursor:first.pagination.nextCursor});
    assert.equal(next.data.flows[0].id,'/repo:new');
  }
  const ranked=await service.query({...query,limit:1});
  assert.equal(ranked.data.flows[0].id,'/repo:flow');
  for(const value of ['', '  ']){
    const browse=await service.query({...query,query:value,limit:1});
    assert.equal(browse.data.flows[0].id,'/repo:new');
  }
});
test("FTS and graph remain available when model is missing", async (t) => {
  const { service } = await setup(t);
  const result = await service.query(query);
  assert.equal(result.freshness, "fresh");
  assert.equal(result.completeness, "complete");
  assert.equal(result.data.flows[0].logicalId, "owner:login");
  assert.equal(result.data.semantic, false);
  assert.equal(result.diagnostics[0].code, "flow-model-unavailable");
  const impact = await service.query({
    path: "/repo",
    operation: "impact",
    ids: ["source"],
  });
  assert.equal(impact.data.flows.length, 1);
  assert.equal(impact.data.flows[0].paths[0].reason, "Membership");
});
test("incremental vector reuse and committed generations", async (t) => {
  let calls = 0,
    record = fixture();
  const embedder = {
    signature: "test",
    embed: async (texts) => {
      calls += texts.length;
      return texts.map(() => [1, 2]);
    },
  };
  const { service, stateDir } = await setup(t, {
    loader: async () => structuredClone(record),
    embedder,
  });
  const first = await service.query(query),
    initial = calls;
  const next = await service.query(query);
  assert.equal(next.generation, first.generation);
  assert.equal(calls, initial + 1);
  record.revision = "two";
  record.sources[1].text = "New contract";
  const third = await service.query(query);
  assert.equal(third.generation, first.generation + 1);
  const db = new DatabaseSync(join(stateDir, "flow-index.sqlite"));
  assert.equal(db.prepare("SELECT count(*) n FROM contexts").get().n, 1);
  assert.ok(db.prepare("SELECT count(*) n FROM vectors").get().n > 0);
  db.close();
});
test("source requires selected context and bounds excerpts", async (t) => {
  const { service } = await setup(t);
  await assert.rejects(
    service.query({
      path: "/repo",
      operation: "source",
      flow: "owner:login",
      source: "/etc/passwd",
    }),
    /not registered/,
  );
  const result = await service.query({
    path: "/repo",
    operation: "source",
    flow: "owner:login",
    source: "source",
    budget: 5,
  });
  assert.equal(result.data.text, "Membe");
  assert.equal(result.omissions.length, 1);
  await assert.rejects(service.query({ ...query, limit: 101 }), /page size/);
});
test("source change during async embedding never commits partial generation", async (t) => {
  let record = fixture(),
    changed = false;
  const { service, stateDir } = await setup(t, {
    loader: async () => structuredClone(record),
    embedder: {
      signature: "test",
      embed: async (texts) => {
        if (!changed) {
          changed = true;
          record.revision = "two";
        }
        return texts.map(() => [1]);
      },
    },
  });
  const result = await service.query(query);
  assert.equal(result.freshness, "stale");
  assert.equal(result.completeness, "partial");
  const db = new DatabaseSync(join(stateDir, "flow-index.sqlite"));
  assert.equal(db.prepare("SELECT count(*) n FROM contexts").get().n, 0);
  db.close();
});
test("worktrees and selectors have isolated contexts", async (t) => {
  const { service, stateDir } = await setup(t, {
    loader: async (_, { worktree, knowledge }) =>
      fixture(knowledge, worktree || "/repo"),
  });
  const a = await service.query(query),
    b = await service.query({ ...query, worktree: "/other" }),
    c = await service.query({ ...query, knowledge: "established" });
  assert.notEqual(a.context, b.context);
  assert.notEqual(a.context, c.context);
  const db = new DatabaseSync(join(stateDir, "flow-index.sqlite"));
  assert.equal(db.prepare("SELECT count(*) n FROM contexts").get().n, 3);
  db.close();
});
test("private state and finite normalized vectors", async (t) => {
  assert.throws(() => guardFlowDirectory("/tmp", []), /private/);
  assert.deepEqual(normalizeVector([3, 4]), [0.6, 0.8]);
  assert.throws(() => normalizeVector([NaN]), /Invalid/);
  const state = await mkdtemp(join(tmpdir(), "flow-model-"));
  t.after(() => rm(state, { recursive: true, force: true }));
  await assert.rejects(createLocalEmbedder(state).embed(["hello"]), /ENOENT/);
});
test("complete graph closure is paginated independently of search", async (t) => {
  const record = fixture();
  for (let i = 1; i < 125; i++) {
    const f = {
      ...record.graph.flows[0],
      id: "flow-" + i,
      logicalId: "owner:flow-" + i,
      steps: [{ nodeId: "step-" + i }],
    };
    record.graph.flows.push(f);
    record.graph.nodes.push(
      { id: f.id, kind: "flow", logicalId: f.logicalId },
      { id: "step-" + i, kind: "step", flow: f.id },
    );
    record.graph.edges.push({
      source: "step-" + i,
      target: "source",
      kind: "supports",
      resolved: true,
    });
  }
  const { service } = await setup(t, {
    loader: async () => structuredClone(record),
  });
  let cursor,
    ids = [];
  do {
    const result = await service.query({
      path: "/repo",
      operation: "impact",
      ids: ["source"],
      limit: 17,
      cursor,
    });
    assert.equal(result.completeness, "complete");
    ids.push(...result.data.flows.map((f) => f.id));
    cursor = result.pagination.next;
  } while (cursor);
  assert.equal(new Set(ids).size, 125);
});
test("two services publish complete generations and persist observed sources", async (t) => {
  const { service, stateDir } = await setup(t);
  const other = createFlowService({ stateDir, loader: async () => fixture() });
  t.after(() => other.close());
  const [a, b] = await Promise.all([service.query(query), other.query(query)]);
  assert.equal(a.completeness, "complete");
  assert.equal(b.completeness, "complete");
  assert.equal(service.observedSources("/repo").length, 2);
  assert.equal(other.observedSources("/unknown").length, 0);
});
test("ambiguous logical IDs require opaque IDs", async (t) => {
  const record = fixture();
  record.graph.flows.push({
    ...record.graph.flows[0],
    id: "other",
    source: "version:1.0.0",
  });
  const { service } = await setup(t, {
    loader: async () => structuredClone(record),
  });
  await assert.rejects(
    service.query({ path: "/repo", operation: "detail", flow: "owner:login" }),
    /ambiguous/,
  );
  const result = await service.query({
    path: "/repo",
    operation: "detail",
    flow: "other",
  });
  assert.equal(result.data.flow.source, "version:1.0.0");
  assert.equal(result.data.flow.markdown, undefined);
});
test("corrupt recorded model assets diagnose before runtime loading", async (t) => {
  const { MODEL, MODEL_REVISION } = await import(
    "../server/flow-embeddings.js"
  );
  const state = await mkdtemp(join(tmpdir(), "flow-corrupt-"));
  t.after(() => rm(state, { recursive: true, force: true }));
  await mkdir(join(state, "models", MODEL), { recursive: true });
  await writeFile(join(state, "models", MODEL, "config.json"), "{}");
  await writeFile(
    join(state, "models", "manifest.json"),
    JSON.stringify({
      model: MODEL,
      revision: MODEL_REVISION,
      files: { "config.json": "wrong" },
    }),
  );
  await assert.rejects(
    createLocalEmbedder(state).embed(["hello"]),
    /Corrupt flow model asset/,
  );
});
test(
  "actual pinned model runs with network fetch disabled",
  { skip: !process.env.FLOW_MODEL_STATE },
  async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = () => {
      throw Error("Network forbidden during inference");
    };
    try {
      const vectors = await createLocalEmbedder(
        process.env.FLOW_MODEL_STATE,
      ).embed(["User authentication", "Login identity", "Bread baking"]);
      assert.equal(vectors[0].length, 384);
      const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
      assert.ok(dot(vectors[0], vectors[1]) > dot(vectors[0], vectors[2]));
    } finally {
      globalThis.fetch = previous;
    }
  },
);
test("deleted and renamed registered sources remove stale records", async (t) => {
  let record = fixture();
  const { service, stateDir } = await setup(t, {
    loader: async () => structuredClone(record),
  });
  await service.query(query);
  record.revision = "renamed";
  record.sources = record.sources.filter((s) => s.id !== "source");
  record.sources.push({
    id: "renamed",
    path: "src/renamed.js",
    kind: "implementation",
    text: "New membership contract",
    fingerprint: "new",
  });
  record.graph.flows[0].support = [
    {
      file: "src/renamed.js",
      targetId: "renamed",
      requires: "New membership contract",
    },
  ];
  await service.query(query);
  assert.deepEqual(
    service
      .observedSources("/repo")
      .map((s) => s.path)
      .sort(),
    ["flow.md", "src/renamed.js"],
  );
  await assert.rejects(
    service.query({
      path: "/repo",
      operation: "source",
      flow: "owner:login",
      source: "source",
    }),
    /not registered/,
  );
  const db = new DatabaseSync(join(stateDir, "flow-index.sqlite"));
  assert.equal(
    db
      .prepare(
        "SELECT count(*) n FROM source_fingerprints WHERE path='src/check.js'",
      )
      .get().n,
    0,
  );
  db.close();
});
test("separate processes atomically publish complete SQLite records", async (t) => {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execute = promisify(execFile),
    stateDir = await mkdtemp(join(tmpdir(), "flow-process-"));
  t.after(() => rm(stateDir, { recursive: true, force: true }));
  const source = new URL("../server/flow-index.js", import.meta.url).href;
  const script = `import {createFlowService} from ${JSON.stringify(source)};const s=createFlowService({stateDir:${JSON.stringify(stateDir)},loader:async()=>(${JSON.stringify(fixture())})});try{await s.query(${JSON.stringify(query)});}finally{s.close();}`;
  await Promise.all([
    execute(process.execPath, ["--input-type=module", "-e", script]),
    execute(process.execPath, ["--input-type=module", "-e", script]),
  ]);
  const db = new DatabaseSync(join(stateDir, "flow-index.sqlite"));
  assert.equal(db.prepare("SELECT count(*) n FROM contexts").get().n, 1);
  assert.equal(
    db.prepare("SELECT count(*) n FROM source_fingerprints").get().n,
    2,
  );
  assert.equal(db.prepare("SELECT count(*) n FROM records").get().n, 3);
  assert.equal(
    db.prepare("SELECT count(*) n FROM documents").get().n,
    db.prepare("SELECT count(*) n FROM flow_fts").get().n,
  );
  db.close();
});
test('newest records sort before paging with stable ties and unknown dates last',async(t)=>{
 const record=fixture();
 record.graph.flows=Array.from({length:45},(_,i)=>({...record.graph.flows[0],id:`flow-${String(i).padStart(2,'0')}`,logicalId:`owner:flow-${i}`,createdAt:i<43?new Date(Date.UTC(2020,0,1+Math.floor(i/2))).toISOString():null}));
 record.graph.flows[0].createdAt=null;record.graph.flows[43].createdAt='1970-01-01T00:00:00.000Z';
 const {service}=await setup(t,{loader:async()=>structuredClone(record)});
 const all=[];let cursor;
 do{const result=await service.query({path:'/repo',operation:'search',query:'',limit:20,cursor});all.push(...result.data.flows);cursor=result.pagination.nextCursor;}while(cursor);
 assert.equal(all.length,45);assert.equal(new Set(all.map(f=>f.id)).size,45);
 assert.equal(all[0].id,'flow-42');assert.equal(all[1].id,'flow-40');assert.equal(all[2].id,'flow-41');
 assert.equal(all.at(-3).id,'flow-43');assert.deepEqual(all.slice(-2).map(f=>f.createdAt),[null,null]);
 for(let i=1;i<43;i++)assert.ok(all[i-1].createdAt>=all[i].createdAt);
});

test('title metadata filters complete eligible sets without invoking the encoder', async t => {
  const record=fixture();
  record.snapshot={artifacts:[{id:'owner',title:'Owner'},{id:'consumer',title:'Consumer'},{id:'empty',title:'No flows'}]};
  const base=record.graph.flows[0];
  record.graph.flows=Array.from({length:30},(_,i)=>({...base,id:`flow-${i}`,localId:`lookup-${i}`,logicalId:`owner:lookup-${i}`,title:`Lookup ${i}`,createdAt:`2026-10-${String(30-i).padStart(2,'0')}T00:00:00Z`,steps:[],support:[]}));
  record.graph.flows.push({...base,id:'cross',artifact:'consumer',localId:'foreign',logicalId:'consumer:foreign',title:'Café lookup',steps:[],support:[]});
  record.graph.flows.push({...base,id:'unrelated',artifact:'consumer',localId:'unrelated',logicalId:'consumer:unrelated',title:'Lookup unrelated',steps:[],support:[]});
  record.graph.nodes=record.graph.flows.map(f=>({id:f.id,kind:'flow',artifact:f.artifact,logicalId:f.logicalId}));
  record.graph.nodes.push({id:'owner-element',kind:'element',artifact:'owner'});
  record.graph.edges=[{source:'cross',target:'owner-element',kind:'references',resolved:true}];
  let calls=0;
  const {service}=await setup(t,{loader:async()=>record,embedder:{get signature(){calls++;throw Error('Encoder initialized');},embed(){calls++;throw Error('Unexpected inference');}}});
  const query=body=>service.query({path:'/repo',operation:'search',match:'title',...body});
  const browse=await query({limit:20,artifact:'owner'});
  assert.equal(browse.data.total,31);
  assert.equal(browse.data.artifactOptions.length,3);
  const hit=await query({query:'  LOOKUP 29  ',artifact:'owner'});
  assert.deepEqual(hit.data.flows.map(f=>f.id),['flow-29']);
  assert.equal((await query({query:'lookup 1',artifact:'owner'})).data.flows[0].id,'flow-1');
  assert.equal(hit.freshness,'fresh');
  const unicode=await query({query:'  CAFE\u0301  ',artifact:'owner'});
  assert.deepEqual(unicode.data.flows.map(f=>f.id),['cross']);
  assert.equal((await query({query:'lookup',artifact:'empty'})).data.total,0);
  assert.equal((await query({query:'not-a-flow'})).data.total,0);
  assert.equal((await query({query:'lookup 29owner'})).data.total,0);
  const first=await query({query:'lookup',artifact:'owner',limit:2});
  assert.deepEqual(first.data.flows.map(f=>f.title),['Café lookup','Lookup 0']);
  const next=await query({query:' LOOKUP ',artifact:'owner',limit:2,cursor:first.data.next});
  assert.deepEqual(next.data.flows.map(f=>f.title),['Lookup 1','Lookup 2']);
  await assert.rejects(query({query:'lookup',artifact:'consumer',cursor:first.data.next}),{status:422});
  const emptyCursor=(await query({limit:2})).data.next;
  record.revision='changed';
  await assert.rejects(query({cursor:emptyCursor}),{status:422});
  assert.equal(calls,0);
});

test('artifact scope intersects impact reasons and scopes discovery before ranking', async t=>{
  const record=fixture();record.snapshot={artifacts:[{id:'owner'},{id:'other'},{id:'empty'}]};
  const base=record.graph.flows[0];
  record.graph.flows=[base,{...base,id:'cross',artifact:'other',logicalId:'other:cross',localId:'cross'},{...base,id:'unrelated',artifact:'other',logicalId:'other:unrelated',localId:'unrelated'}];
  record.graph.nodes=[{id:base.id,artifact:'owner',kind:'flow'}, {id:'cross',kind:'flow',artifact:'other'},{id:'unrelated',kind:'flow',artifact:'other'}, {id:'specific',kind:'element',artifact:'owner'}];
  record.graph.edges=[{source:'cross',target:'specific',kind:'references',resolved:true}];
  const {service}=await setup(t,{loader:async()=>record,embedder:{signature:'stub',embed:async texts=>texts.map(()=>[1,0])}});
  const request={path:'/repo',operation:'search',query:'membership',artifact:'owner',limit:1};
  const found=await service.query(request);assert.equal(found.data.total,2);assert.equal(found.data.flows.length,1);
  const remaining=await service.query({...request,cursor:found.data.next});assert.equal(remaining.data.flows.length,1);
  assert.ok(![...found.data.flows,...remaining.data.flows].some(f=>f.id==='unrelated'));
  const impact=await service.query({path:'/repo',operation:'impact',ids:['specific'],artifact:'owner'});
  assert.deepEqual(impact.data.flows.map(f=>f.id),['cross']);assert.equal(impact.data.flows[0].paths[0].target,'specific');
  await assert.rejects(service.query({...request,match:'title',cursor:found.data.next}),{status:422});
  for(const args of [{artifact:'missing'},{artifact:'../owner'},{match:'unknown'},{operation:'impact',ids:['specific'],match:'title'},{operation:'detail',flow:base.id,artifact:'owner'},{operation:'source',flow:base.id,source:'doc',match:'discovery'}])await assert.rejects(service.query({...request,...args}),{status:422});
});

test('detail, impact and source never initialize the embedder and keep a later discovery search cheap', async t => {
  const calls=[];
  const embedder={signature:'inert',embed:async texts=>{calls.push([...texts]);return texts.map(()=>[1,0]);}};
  const {service,stateDir}=await setup(t,{embedder});
  const detail=await service.query({path:'/repo',operation:'detail',flow:'owner:login'});
  assert.equal(detail.freshness,'fresh');assert.equal(detail.data.flow.logicalId,'owner:login');assert.equal(detail.data.sources.length,2);
  const impact=await service.query({path:'/repo',operation:'impact',ids:['source']});
  assert.equal(impact.data.flows.length,1);
  const source=await service.query({path:'/repo',operation:'source',flow:'owner:login',source:'source'});
  assert.equal(source.data.text,'Membership validation');
  assert.deepEqual(calls,[],'detail, impact and source must not call the embedder');
  // The context exists without documents; the first discovery search adds chunks and vectors once.
  const db=new DatabaseSync(join(stateDir,'flow-index.sqlite'));t.after(()=>db.close());
  assert.equal(db.prepare('SELECT count(*) n FROM contexts').get().n,1);
  assert.equal(db.prepare('SELECT count(*) n FROM documents').get().n,0);
  const searched=await service.query({...query});
  assert.equal(searched.data.semantic,true);assert.ok(calls.some(texts=>texts.length>0));
  assert.ok(db.prepare('SELECT count(*) n FROM documents').get().n>0);
  const embedded=calls.length;
  await service.query({path:'/repo',operation:'detail',flow:'owner:login'});
  const again=await service.query({...query});
  assert.equal(again.data.semantic,true);
  assert.deepEqual(calls.slice(embedded),[[],['membership']],'a detail read between two searches must not drop the indexed documents: only the model check and the query text are embedded');
  assert.equal(again.generation,searched.generation);
});
test('a repository fingerprint replaces repeated loads and detects a change during the query', async t => {
  // Query 1 probes at start, before the rebuild and at the end; query 2 at start and end; query 3 starts on b and ends on c.
  let loads=0,probes=[];const values=['a','a','a','a','a','b'];
  const {service}=await setup(t,{loader:async()=>{loads++;return fixture();},fingerprint:async()=>{const v=values[probes.length]??'c';probes.push(v);return v;},embedder:{signature:'fp',embed:async texts=>texts.map(()=>[1,0])}});
  const first=await service.query({path:'/repo',operation:'detail',flow:'owner:login'});
  assert.equal(first.freshness,'fresh');assert.equal(loads,1);
  const second=await service.query({path:'/repo',operation:'detail',flow:'owner:login'});
  assert.equal(second.freshness,'fresh');assert.equal(loads,1,'an unchanged fingerprint reuses the loaded repository');
  const third=await service.query({path:'/repo',operation:'detail',flow:'owner:login'});
  assert.equal(loads,2,'a new fingerprint loads again');
  assert.equal(third.freshness,'stale');assert.equal(third.completeness,'partial');
  assert.ok(third.diagnostics.some(d=>d.code==='stale-flow-context'));
});
test('discovery drops chunks below the semantic cutoff instead of returning every flow', async t => {
  const record=fixture();
  // The far flow shares no source with the login flow and its summary fits one chunk, so every chunk of it carries the marker word.
  record.graph.flows.push({...record.graph.flows[0],id:'/repo:far',localId:'far',logicalId:'owner:far',title:'Unrelated far away journey',trigger:'Far away.',outcome:'Far away.',file:'far.md',steps:[],support:[],createdAt:'2025-01-01T00:00:00.000Z'});
  const {service}=await setup(t,{loader:async()=>structuredClone(record),embedder:{signature:'cutoff',embed:async texts=>texts.map(text=>text.includes('Unrelated far')?[0,1]:[1,0])}});
  const near=await service.query({...query,query:'zzqqx'});
  assert.equal(near.data.semantic,true);
  assert.deepEqual(near.data.flows.map(f=>f.id),['/repo:flow'],'the orthogonal flow scores 0 and stays out');
  assert.ok(SEMANTIC_CUTOFF>0&&SEMANTIC_CUTOFF<1);
});
test('keyword rank drops short terms and terms in most flows, so a query of common words finds nothing without the model', async t => {
  const record=fixture();
  record.graph.flows[0].title='Common login';
  // Four more flows share the word "common" but none of the login sources; five flows enable the frequency rule.
  const far=i=>({...record.graph.flows[0],id:`/repo:far${i}`,localId:`far${i}`,logicalId:`owner:far${i}`,title:`Common far away journey ${i}`,trigger:'Far away.',outcome:'Far away.',file:`far${i}.md`,steps:[],support:[]});
  const five={...record,graph:{...record.graph,flows:[record.graph.flows[0],...[1,2,3,4].map(far)]}};
  const {service}=await setup(t,{loader:async()=>structuredClone(five)});
  const common=await service.query({...query,query:'common of a'});
  assert.equal(common.data.semantic,false);
  assert.deepEqual(common.data.flows,[]);assert.equal(common.data.total,0);
  const rare=await service.query({...query,query:'common membership'});
  assert.deepEqual(rare.data.flows.map(f=>f.id),['/repo:flow'],'a term present in one flow still matches');
  // With fewer than five flows, frequency carries no signal and every term of three or more characters matches.
  const {service:small}=await setup(t,{loader:async()=>structuredClone(record)});
  assert.deepEqual((await small.query({...query,query:'common of a'})).data.flows.map(f=>f.id),['/repo:flow']);
  // With the model, only flows above the semantic cutoff remain for a common-word query.
  const {service:semantic}=await setup(t,{loader:async()=>structuredClone(five),embedder:{signature:'common',embed:async texts=>texts.map(text=>text.includes('far away')?[0,1]:[1,0])}});
  const result=await semantic.query({...query,query:'common'});
  assert.equal(result.data.semantic,true);
  assert.deepEqual(result.data.flows.map(f=>f.id),['/repo:flow']);
});
test('switching title and discovery preserves cached document vectors', async t => {
  const calls=[];
  const {service,stateDir}=await setup(t,{embedder:{signature:'switch-cache',embed:async texts=>{calls.push([...texts]);return texts.map(()=>[1,0]);}}});
  const request={path:'/repo',operation:'search'};
  await service.query(request);
  assert.ok(calls.some(texts=>texts.length>0));
  const db=new DatabaseSync(join(stateDir,'flow-index.sqlite'));
  t.after(()=>db.close());
  const before=db.prepare('SELECT hash,model,hex(vector) AS vector FROM vectors ORDER BY hash,model').all();
  const prepared=calls.length;
  await service.query({...request,match:'title',query:'login'});
  await service.query({...request,match:'title',query:''});
  assert.equal(calls.length,prepared);
  assert.deepEqual(db.prepare('SELECT hash,model,hex(vector) AS vector FROM vectors ORDER BY hash,model').all(),before);
  await service.query({...request,match:'discovery'});
  assert.deepEqual(calls.slice(prepared),[[]],'existing document vectors must not be embedded again');
});

// Concept search (specifications/concept-pages.md: MCP; CP17, CPA12): a record
// on the protected branch, so the concepts operation reads no Git.
function conceptRecord() {
  const record = fixture();
  record.graph.flows.push({...record.graph.flows[0], id: '/repo:other', localId: 'other', logicalId: 'owner:other', title: 'Other membership'});
  record.snapshot = {repository: {branch: 'main'}, artifacts: [{id: 'owner', title: 'Owner', elements: []}, {id: 'consumer', title: 'Consumer', elements: []}]};
  const model = (artifact, id, title, description) => ({id: `model-${artifact}-${id}`, kind: 'model', logicalId: `${artifact}:${id}`, artifact, title, description, file: `docs/artifacts/${artifact}/specifications/model.md`, sources: []});
  record.graph.nodes.push(
    model('owner', 'identity', 'Identity', 'The identity of a member.'),
    model('consumer', 'identity', 'Identity', 'A tenant identity.'),
    model('owner', 'provider', 'Identity provider', 'Issues tokens.'),
    model('owner', 'session', 'Session', 'The period after an identity check.'),
    model('owner', 'alias', 'owner:session', 'A title equal to another id.'),
    model('owner', 'audit', 'Audit', 'A record of checks.'));
  return record;
}
const ids = result => result.data.concepts.map(c => c.logicalId);
const decoded = cursor => JSON.parse(Buffer.from(cursor, 'base64url'));
const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('CP17: search with kinds concept ranks concepts by identity, title, title substring and description, and lists all for an empty query', async t => {
  let calls = 0;
  const {service} = await setup(t, {loader: async () => conceptRecord(), embedder: {signature: 'concept-search', embed: async texts => {calls++;return texts.map(() => [1, 0]);}}});
  const search = body => service.query({path: '/repo', operation: 'search', kinds: ['concept'], ...body});
  const all = await search({});
  assert.deepEqual(ids(all), ['consumer:identity', 'owner:audit', 'owner:identity', 'owner:provider', 'owner:alias', 'owner:session']);
  assert.deepEqual(all.data.totals, {concepts: 6});
  assert.deepEqual(Object.keys(all.data.concepts[0]).sort(), ['artifact', 'declaration', 'declaredIn', 'description', 'entity', 'logicalId', 'sources', 'title']);
  assert.deepEqual(ids(await search({query: '  '})), ids(all));
  assert.deepEqual(ids(await search({query: 'identity'})), ['consumer:identity', 'owner:identity', 'owner:provider', 'owner:session']);
  assert.deepEqual(ids(await search({query: 'OWNER:IDENTITY'})), ['owner:identity']);
  assert.deepEqual(ids(await search({query: 'model:owner:session'})), ['owner:session']);
  assert.deepEqual(ids(await search({query: 'owner:session'})), ['owner:session', 'owner:alias']);
  assert.deepEqual(ids(await search({query: 'identity', match: 'title'})), ['consumer:identity', 'owner:identity', 'owner:provider', 'owner:session']);
  assert.deepEqual(ids(await search({query: 'identity', artifact: 'consumer'})), ['consumer:identity']);
  const none = await search({query: 'nothing'});
  assert.deepEqual([none.data.concepts, none.data.totals], [[], {concepts: 0}]);
  // Without flow in kinds, data.flows is empty, total is 0 and discovery prepares no embeddings.
  assert.deepEqual([all.data.flows, all.data.total, all.data.next, all.pagination.total, all.pagination.next], [[], 0, null, 0, null]);
  assert.equal(calls, 0);
  const both = await search({query: 'identity', kinds: ['flow', 'concept'], limit: 1});
  assert.equal(both.data.total, 2);assert.equal(both.data.flows.length, 1);
  const page = await search({query: 'identity', kinds: ['flow', 'concept'], limit: 1, cursor: both.pagination.next});
  assert.equal(page.data.flows.length, 1);
  assert.deepEqual(ids(page), ids(both), 'concepts are not paged');
  for (const kinds of [[], ['model'], ['flow', 'flow'], 'concept', ['flow', 'concept', 'flow']])
    await assert.rejects(search({kinds}), {status: 422}, JSON.stringify(kinds));
  await assert.rejects(service.query({path: '/repo', operation: 'detail', flow: 'owner:login', kinds: ['flow']}), {status: 422});
});

test('CPA12: search without kinds keeps the 1.24.0 data and cursors; kinds enters the cursor selector only when present', async t => {
  const {service} = await setup(t, {loader: async () => conceptRecord(), embedder: {signature: 'concept-cursor', embed: async texts => texts.map(() => [1, 0])}});
  const search = body => service.query({path: '/repo', operation: 'search', limit: 1, ...body});
  const keys = ['artifactOptions', 'coverage', 'flows', 'next', 'semantic', 'total'];
  for (const body of [{query: 'Membership', match: 'title'}, {query: 'membership'}, {}]) {
    const plain = await search(body), flows = await search({...body, kinds: ['flow']}), mixed = await search({...body, kinds: ['concept', 'flow']});
    assert.deepEqual(Object.keys(plain.data).sort(), keys, JSON.stringify(body));
    assert.equal(plain.data.total, 2);
    const query = body.match === 'title' ? body.query.toLowerCase() : body.query;
    assert.equal(decoded(plain.pagination.next).selector, sha([query, undefined, body.match ?? 'discovery', undefined]), '1.24.0 selector');
    assert.equal(decoded(flows.pagination.next).selector, sha([query, undefined, body.match ?? 'discovery', undefined, ['flow']]));
    assert.equal(decoded(mixed.pagination.next).selector, sha([query, undefined, body.match ?? 'discovery', undefined, ['flow', 'concept']]));
    assert.deepEqual(flows.data.flows, plain.data.flows);assert.deepEqual(mixed.data.flows, plain.data.flows);
    assert.deepEqual(Object.keys(flows.data).sort(), keys);
    const second = await search({...body, cursor: plain.pagination.next});
    assert.equal(second.data.flows.length, 1);assert.notEqual(second.data.flows[0].id, plain.data.flows[0].id);
    await assert.rejects(search({...body, kinds: ['flow'], cursor: plain.pagination.next}), {status: 422});
    await assert.rejects(search({...body, cursor: mixed.pagination.next}), {status: 422});
    assert.deepEqual((await search({...body, kinds: ['flow', 'concept'], cursor: mixed.pagination.next})).data.flows, second.data.flows);
  }
});
