import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createFlowService, guardFlowDirectory } from "../server/flow-index.js";
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
