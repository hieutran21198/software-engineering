import { DatabaseSync } from "node:sqlite";
import { realpath } from "node:fs/promises";
import {
  existsSync,
  mkdirSync,
  realpathSync,
  statSync,
  openSync,
  closeSync,
} from "node:fs";
import { resolve, relative, isAbsolute, dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { defaultStateDir, repositoryIdentity } from "./runtime-store.js";
import { readFlowRepository, flowFingerprint } from "./flow-reader.js";
import { flowImpact, safeFlowID } from "./flow-model.js";
import { conceptList, conceptAnswer } from "./concepts.js";
import { ExploreError } from "./reader.js";
import { createLocalEmbedder, normalizeVector } from "./flow-embeddings.js";
const digest = (x) => createHash("sha256").update(x).digest("hex");
// Discovery keeps only chunks whose cosine similarity to the query reaches this value, so a
// query returns the flows it resembles instead of every flow. Measured on this repository's
// 18 flows with the pinned model on 18 October 2026: unrelated sentences score at most 0.26,
// the expected flows of the benchmark queries score at least 0.59; see README, Flow discovery.
export const SEMANTIC_CUTOFF = 0.5;
const normalizedName = value => String(value || "").trim().normalize("NFC").toLowerCase();
const inside = (root, path) => {
  const r = relative(root, path);
  return !r || (r !== ".." && !r.startsWith("../") && !isAbsolute(r));
};
function canonical(path) {
  path = resolve(path);
  let p = path,
    suffix = [];
  while (!existsSync(p)) {
    suffix.unshift(p.split("/").at(-1));
    p = dirname(p);
  }
  return join(realpathSync(p), ...suffix);
}
export function guardFlowDirectory(directory, roots = []) {
  const dir = canonical(directory);
  if (roots.some((root) => inside(canonical(root), dir)))
    throw Error("Flow state must be outside repositories and worktrees");
  let parent = dir;
  while (!existsSync(parent)) parent = dirname(parent);
  let top;
  try {
    top = execFileSync("git", ["-C", parent, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {}
  if (top && inside(canonical(top), dir))
    throw Error("Flow state must be outside repositories and worktrees");
  let common;
  try {
    common=execFileSync("git",["-C",parent,"rev-parse","--path-format=absolute","--git-common-dir"],{encoding:"utf8",stdio:["ignore","pipe","ignore"]}).trim();
  } catch {}
  if(common&&inside(canonical(common),dir))
    throw Error("Flow state must be outside repositories and worktrees");
  if (existsSync(dir) && statSync(dir).mode & 0o077)
    throw Error("Flow state directory must be private (0700)");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}
function validate(body) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof body.path !== "string" ||
    !isAbsolute(body.path)
  )
    throw new ExploreError(422, "Select an absolute repository path");
  const keys=['path','worktree','knowledge','operation','query','flow','ids','source','cursor','limit','budget','match','artifact','concept'];
  if(Object.keys(body).some(key=>!keys.includes(key))||body.path.includes('\0'))throw new ExploreError(422,'Invalid flow query fields');
  const knowledge = body.knowledge ?? "planning",
    operation = body.operation;
  if (
    !["planning", "established", "all"].includes(knowledge) ||
    !["search", "detail", "impact", "source", "concepts", "concept"].includes(operation)
  )
    throw new ExploreError(422, "Invalid flow operation or knowledge selector");
  if (
    body.cursor !== undefined &&
    (typeof body.cursor !== "string" || body.cursor.length > 10000)
  )
    throw new ExploreError(422, "Invalid cursor");
  if (body.match !== undefined && (operation !== 'search' || !['title','discovery'].includes(body.match)))
    throw new ExploreError(422, 'Invalid match selector');
  if (body.artifact !== undefined && (!['search','impact','concepts'].includes(operation) || !safeFlowID(body.artifact)))
    throw new ExploreError(422, 'Invalid artifact selector');
  const limit = body.limit ?? 10,
    budget = body.budget ?? 12000;
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isInteger(budget) ||
    budget < 0 ||
    budget > 100000
  )
    throw new ExploreError(422, "Invalid page size or excerpt budget");
  if (
    body.query !== undefined &&
    (typeof body.query !== "string" || body.query.length > 4000)
  )
    throw new ExploreError(422, "Query must be at most 4000 characters");
  if (
    body.worktree !== undefined &&
    (typeof body.worktree !== "string" || !isAbsolute(body.worktree))
  )
    throw new ExploreError(422, "Select an absolute worktree");
  if (
    ["detail", "source"].includes(operation) &&
    (typeof body.flow !== "string" || !body.flow || body.flow.length > 10000)
  )
    throw new ExploreError(422, "Select a flow");
  if (
    operation === "source" &&
    (typeof body.source !== "string" || body.source.length > 10000)
  )
    throw new ExploreError(422, "Select a registered source ID");
  if (
    operation === "concept" &&
    (typeof body.concept !== "string" || !body.concept.trim() || body.concept.length > 4000)
  )
    throw new ExploreError(422, "Select a concept by identity, entity or title");
  if (body.concept !== undefined && operation !== "concept")
    throw new ExploreError(422, "Invalid concept selector");
  if (
    operation === "impact" &&
    (!Array.isArray(body.ids) ||
      !body.ids.length ||
      body.ids.length > 100 ||
      !body.ids.every((x) => typeof x === "string" && x.length < 10000))
  )
    throw new ExploreError(422, "Select up to 100 impact IDs");
  return {
    ...body,
    match: operation === 'search' ? body.match ?? 'discovery' : undefined,
    query: body.match === 'title' ? normalizedName(body.query) : body.query?.trim(),
    knowledge, operation, limit, budget,
  };
}
// Impact IDs of the flow query become origins of the impact service: a matching
// graph node gives a flow, step, model or file origin; 'artifact:<id>' gives the
// artifact's working documents; another ID is tried as a repository path.
export function impactOrigins(record, ids) {
  const flows = record.graph.flows, origins = [], unresolved = [], byId = new Map();
  const add = (id, origin) => { const key = JSON.stringify(origin); if (!origins.some(o => JSON.stringify(o) === key)) origins.push(origin); byId.set(id, [...(byId.get(id) || []), origin]); };
  for (const id of ids) {
    if (id.startsWith("artifact:")) {
      const artifact = record.snapshot?.artifacts?.find(a => a.id === id.slice(9));
      const files = (artifact?.elements || []).filter(e => e.file).map(e => e.file);
      if (files.length) for (const file of files.slice(0, 100)) add(id, { path: file }); else unresolved.push(id);
      continue;
    }
    // A file ID names its document, not the models that the document declares.
    const node = record.graph.nodes.find(n => n.id === id || n.logicalId === id || n.elementId === id || n.kind !== "model" && n.file === id);
    const flow = node?.kind === "flow" ? flows.find(f => f.id === node.id) : null;
    if (flow) add(id, { flow: flow.logicalId });
    else if (node?.kind === "step") { const owner = flows.find(f => f.id === node.flow); if (owner) add(id, { step: `${owner.logicalId}:${node.localId}` }); else unresolved.push(id); }
    else if (node?.kind === "model" && node.logicalId) add(id, { model: node.logicalId });
    else if (node?.file) add(id, { path: node.file });
    else if (!node && !id.startsWith("[") && !id.includes("\0") && id.length < 2000) add(id, { path: id.replace(/^\.\//, "") });
    else unresolved.push(id);
  }
  return { origins: origins.slice(0, 100), unresolved, byId };
}
// The old impactPath lists reverse edges from the origin outward: each target is the dependency.
const legacyPath = (path, origin) => path.map((edge, i) => ({ source: edge.to, target: i ? path[i - 1].to : origin, kind: edge.via, ...(edge.reason ? { reason: edge.reason } : {}), ...(edge.basis ? { basis: edge.basis } : {}), ...(edge.symbols ? { symbols: edge.symbols } : {}), resolved: true }));
async function delegatedImpact(service, record, body) {
  const { origins, unresolved, byId } = impactOrigins(record, body.ids);
  if (!origins.length) return { flows: [], unresolved, coverage: "Typed impact; no ID resolves to a known entity.", diagnostics: [] };
  const result = await service.query({ path: body.path, ...(body.worktree ? { worktree: body.worktree } : {}), knowledge: body.knowledge, origins, depth: 4, limit: 200 });
  const data = result.data, changed = new Map(data.changed.map(c => [c.path, c]));
  // An ID is unresolved when none of its origins resolved.
  const failed = new Set(data.unresolved.map(u => u.entity));
  for (const [id, list] of byId) if (list.every(o => (o.path && changed.get(o.path)?.status === "unknown") || failed.has(o.flow || o.step || o.model || o.path))) unresolved.push(id);
  const reached = [...data.direct, ...data.transitive].filter(i => i.kind === "flow");
  const flows = [];
  // Origin flows stay in the result as the old closure kept its starting nodes.
  for (const o of origins) {
    const logical = o.flow || o.step?.split(":").slice(0, 2).join(":");
    const flow = logical ? record.graph.flows.find(f => f.logicalId === logical) : o.path ? record.graph.flows.find(f => f.file === o.path) : null;
    if (!flow || flows.some(f => f.id === flow.id) || changed.get(flow.file)?.status === "unknown") continue;
    flows.push({ ...flow, impactPath: o.step ? [{ source: flow.id, target: o.step, kind: "contains", resolved: true }] : o.path ? [{ source: flow.id, target: o.path, kind: "defines", resolved: true }] : [] });
  }
  for (const item of reached) {
    const flow = record.graph.flows.find(f => `flow:${f.logicalId}` === item.entity);
    if (!flow || flows.some(f => f.id === flow.id)) continue;
    const path = item.paths[0] || [];
    flows.push({ ...flow, impactPath: legacyPath(path, item.origins[0]) });
  }
  const diagnostics = [];
  if (result.omissions.some(o => ["direct", "transitive"].includes(o.section))) diagnostics.push({ code: "truncated-impact", message: "More than 200 entities are affected in one tier; some flows may be missing. Use /api/impact/query." });
  if (result.freshness !== "fresh") diagnostics.push({ code: "stale-flow-context", message: "Source or index changed during retrieval; retry before deciding impact" });
  return { flows, unresolved, coverage: `Typed impact to depth ${data.coverage.depth}: declared knowledge and derived code relationships. Not analyzed: ${data.coverage.not_analyzed.join("; ")}.`, diagnostics };
}
const summary = (f) => ({
  id: f.id,
  localId:f.localId,
  createdAt:f.createdAt||null,
  logicalId: f.logicalId,
  title: f.title,
  artifact: f.artifact,
  source: f.source,
  trigger: f.trigger,
  outcome: f.outcome,
  state: f.state,
  sourcePublication: f.sourcePublication,
  gaps: f.gaps,
  exclusions: f.exclusions,
});
function chunks(record, split) {
  const output = [];
  for (const flow of record.graph.flows) {
    const prefix = [
      flow.title,
      flow.logicalId,
      flow.trigger,
      flow.outcome,
      ...flow.steps.map((s) => s.title),
      ...flow.support.map((s) => s.requires),
    ].join("\n");
    const paths = new Set([
      flow.file,
      ...flow.support
        .map(
          (s) =>
            s.file || record.graph.flows.find((f) => f.id === s.targetId)?.file,
        )
        .filter(Boolean),
      ...flow.support.flatMap((s) => s.evidence || []),
    ]);
    const sections = [
      prefix,
      ...record.sources
        .filter((s) => paths.has(s.path))
        .flatMap((s) => s.text.split(/(?=^#{1,6}\s)/m)),
    ];
    for (const section of sections) {
      const parts = split
        ? split(section)
        : section.replace(/\s+/g, " ").match(/[\s\S]{1,120}/g) || [];
      for (const text of parts) {
        if (text)
          output.push({
            id: digest(flow.id + "\0" + output.length + "\0" + text),
            flow: flow.id,
            text,
            hash: digest(text),
          });
      }
    }
  }
  return output;
}
export function createFlowService({
  stateDir = defaultStateDir(),
  roots = [],
  embedder,
  loader = readFlowRepository,
  impactService,
  fingerprint = loader === readFlowRepository ? flowFingerprint : null,
} = {}) {
  const dir = guardFlowDirectory(stateDir, roots),
    path = join(dir, "flow-index.sqlite");
  if (
    existsSync(path) &&
    (canonical(path) !== path || statSync(path).mode & 0o077)
  )
    throw Error("Flow database must be private and cannot be a symlink");
  if (!existsSync(path)) {
    try {
      closeSync(openSync(path, "wx", 0o600));
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
    }
  }
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL;
 CREATE TABLE IF NOT EXISTS contexts(id TEXT PRIMARY KEY,revision TEXT,generation INTEGER,json TEXT,model TEXT);
 CREATE TABLE IF NOT EXISTS vectors(hash TEXT,model TEXT,vector TEXT,PRIMARY KEY(hash,model));
 CREATE TABLE IF NOT EXISTS documents(context TEXT,id TEXT,flow TEXT,text TEXT,PRIMARY KEY(context,id));
 CREATE VIRTUAL TABLE IF NOT EXISTS flow_fts USING fts5(context UNINDEXED,id UNINDEXED,flow UNINDEXED,text);
 CREATE TABLE IF NOT EXISTS records(context TEXT,id TEXT,kind TEXT,json TEXT,PRIMARY KEY(context,id));
 CREATE TABLE IF NOT EXISTS source_fingerprints(context TEXT,id TEXT,path TEXT,kind TEXT,fingerprint TEXT,PRIMARY KEY(context,id));
 CREATE TABLE IF NOT EXISTS relations(context TEXT,source TEXT,target TEXT,kind TEXT,json TEXT);
 CREATE INDEX IF NOT EXISTS reverse_relations ON relations(context,target);`);
  let encoder = embedder;
  const getEncoder = () => encoder ??= createLocalEmbedder(dir);
  let serial = Promise.resolve(), closing=false, closePromise;
  // Loaded repositories by fingerprint: consecutive reads of an unchanged repository reuse one load.
  const loaded = new Map();
  const remember = (key, record) => {loaded.delete(key);loaded.set(key, record);while (loaded.size > 4) loaded.delete(loaded.keys().next().value);};
  // One cached load per repository, worktree, knowledge selector and fingerprint. Paths are
  // canonical so that the impact service, which passes real paths, shares the same entry.
  async function cachedLoad(path, worktree, knowledge) {
    const root = await realpath(path).catch(() => path), target = worktree ? await realpath(worktree).catch(() => worktree) : root;
    const load = () => loader(path, { worktree, knowledge, roots });
    if (!fingerprint) return { record: await load(), unchanged: async record => (await load()).revision === record.revision };
    const probe = () => fingerprint(root, target), initial = await probe();
    const key = JSON.stringify([root, target, knowledge, initial]);
    let record = loaded.get(key);
    if (!record) {record = await load();remember(key, record);}
    return { record, unchanged: async () => (await probe()) === initial };
  }
  async function execute(raw) {
    const started = performance.now(),
      timings = {};
    let measured = started;
    const mark = (name) => {
      timings[name] = performance.now() - measured;
      measured = performance.now();
    };
    const body = validate(raw);
    if (loader === readFlowRepository) {
      const identity = repositoryIdentity(body.path);
      guardFlowDirectory(dir, [identity.common, ...identity.roots]);
    }
    // Freshness compares the cheap fingerprint; without one, a second load compares revisions.
    const current = await cachedLoad(body.path, body.worktree, body.knowledge);
    const record = current.record, unchanged = () => current.unchanged(record);
    mark("loadMs");
    const artifactOptions = (record.snapshot?.artifacts || [])
      .filter(a => safeFlowID(a.id))
      .map(({id,title}) => ({id,title: title || id}));
    if (body.artifact && !artifactOptions.some(a => a.id === body.artifact))
      throw new ExploreError(422, 'Artifact does not exist in selected context');
    const participation = body.artifact ? flowImpact(record.graph, ['artifact:' + body.artifact]) : null;
    const eligible = participation ? new Set(participation.flows.map(f => f.id)) : null;
    const eligibleFlows = record.graph.flows.filter(f => !eligible || eligible.has(f.id));
    const scopedRecord = {...record, graph: {...record.graph, flows: eligibleFlows}};
    const titleMode = body.operation === 'search' && body.match === 'title';
    // Only discovery search chunks sources and prepares embeddings. Title search, detail,
    // impact and source never load the model and never rebuild documents for an unchanged revision.
    const discovery = body.operation === 'search' && !titleMode;
    const context = digest(
      JSON.stringify([record.repository.path, record.worktree, body.knowledge, body.match, body.artifact]),
    );
    const model = discovery ? getEncoder().signature || "injected" : "metadata-only-v1";
    let cached = db.prepare("SELECT * FROM contexts WHERE id=?").get(context),
      diagnostics = [...record.graph.diagnostics];
    const reusableChunks =
      discovery &&
      cached?.revision === record.revision &&
      cached.model === model &&
      JSON.parse(cached.json).semantic &&
      JSON.parse(cached.json).chunker === "token128-v1";
    let docs = reusableChunks
      ? db
          .prepare("SELECT id,flow,text FROM documents WHERE context=?")
          .all(context)
          .map((doc) => ({ ...doc, hash: digest(doc.text) }))
      : discovery ? chunks(scopedRecord) : [];
    const vectors = new Map();
    let semantic = false;
    if (discovery) try {
      await encoder.embed([]);
      if (encoder.split && !reusableChunks)
        docs = chunks(scopedRecord, (text) => encoder.split(text));
      const missing = [];
      for (const doc of docs) {
        const row = db
          .prepare("SELECT vector FROM vectors WHERE hash=? AND model=?")
          .get(doc.hash, model);
        if (row)
          vectors.set(
            doc.hash,
            Array.from(new Float32Array(Uint8Array.from(row.vector).buffer)),
          );
        else if (!missing.some((d) => d.hash === doc.hash)) missing.push(doc);
      }
      if (missing.length) {
        const values = await encoder.embed(missing.map((d) => d.text));
        if (values.length !== missing.length)
          throw Error("Embedding count does not match chunks");
        missing.forEach((doc, i) =>
          vectors.set(doc.hash, normalizeVector(values[i])),
        );
      }
      semantic = true;
    } catch (error) {
      diagnostics.push({
        code: "flow-model-unavailable",
        message: error.message,
      });
    }
    mark("embeddingPreparationMs");
    const chunkRevision = discovery ? digest(JSON.stringify(docs.map((d) => d.id).sort())) : null;
    const needsRebuild =
      !cached ||
      cached.revision !== record.revision ||
      (discovery &&
        (cached.model !== model ||
          JSON.parse(cached.json).chunker !== "token128-v1" ||
          JSON.parse(cached.json).chunkRevision !== chunkRevision ||
          (semantic && !JSON.parse(cached.json).semantic)));
    let fresh = true;
    if (needsRebuild) fresh = await unchanged();
    if (fresh && needsRebuild) {
      db.exec("BEGIN IMMEDIATE");
      try {
        cached = db.prepare("SELECT * FROM contexts WHERE id=?").get(context);
        const generation = (cached?.generation || 0) + 1;
        db.prepare("DELETE FROM records WHERE context=?").run(context);
        db.prepare("DELETE FROM source_fingerprints WHERE context=?").run(
          context,
        );
        for (const node of record.graph.nodes)
          db.prepare("INSERT INTO records VALUES(?,?,?,?)").run(
            context,
            node.id,
            node.kind,
            JSON.stringify(node),
          );
        for (const source of record.sources)
          db.prepare("INSERT INTO source_fingerprints VALUES(?,?,?,?,?)").run(
            context,
            source.id,
            source.path,
            source.kind,
            source.fingerprint,
          );
        db.prepare("DELETE FROM documents WHERE context=?").run(context);
        db.prepare("DELETE FROM flow_fts WHERE context=?").run(context);
        db.prepare("DELETE FROM relations WHERE context=?").run(context);
        for (const doc of docs) {
          db.prepare("INSERT INTO documents VALUES(?,?,?,?)").run(
            context,
            doc.id,
            doc.flow,
            doc.text,
          );
          db.prepare("INSERT INTO flow_fts VALUES(?,?,?,?)").run(
            context,
            doc.id,
            doc.flow,
            doc.text,
          );
          const vector = vectors.get(doc.hash);
          if (vector)
            db.prepare("INSERT OR IGNORE INTO vectors VALUES(?,?,?)").run(
              doc.hash,
              model,
              Buffer.from(new Float32Array(vector).buffer),
            );
        }
        for (const edge of record.graph.edges)
          db.prepare("INSERT INTO relations VALUES(?,?,?,?,?)").run(
            context,
            edge.source,
            edge.target,
            edge.kind,
            JSON.stringify(edge),
          );
        db.prepare("INSERT OR REPLACE INTO contexts VALUES(?,?,?,?,?)").run(
          context,
          record.revision,
          generation,
          JSON.stringify({
            semantic,
            chunker: discovery ? "token128-v1" : "none",
            chunkRevision,
            repository: record.repository.path,
            worktree: record.worktree,
            sources: record.sources.map(({ path, kind }) => ({ path, kind })),
          }),
          model,
        );
        db.exec("COMMIT");
        cached = { revision: record.revision, generation, model };
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    }
    mark("indexValidationMs");
    const generation = cached?.generation || 0;
    const omissions = [];
    let exactMatch = null;
    let data,
      items = [],
      total = 0;
    function selected() {
      const matches = record.graph.flows.filter(
        (f) => f.id === body.flow || f.logicalId === body.flow,
      );
      if (matches.length !== 1)
        throw new ExploreError(
          422,
          matches.length
            ? "Flow selector is ambiguous; use its opaque ID"
            : "Flow does not exist in selected context",
        );
      return matches[0];
    }
    // Named models of one flow, grouped by owner on the client. Known
    // participation lists other flows that use the same concrete model node.
    function flowModels(flow) {
      const nodes = new Map(record.graph.nodes.map((n) => [n.id, n]));
      return [...new Set((flow.participants || []).map((p) => p.nodeId))].map((id) => {
        const node = nodes.get(id) || {id, kind: "missing"};
        const participants = flow.participants.filter((p) => p.nodeId === id);
        const knownFlows = record.graph.edges
          .filter((e) => e.kind === "participates" && e.target === id && e.source !== flow.id)
          .map((e) => record.graph.flows.find((f) => f.id === e.source))
          .filter(Boolean)
          .map((f) => ({id: f.id, logicalId: f.logicalId, title: f.title, artifact: f.artifact, source: f.source}));
        const sources = record.graph.edges.filter((e) => e.kind === "describes" && e.source === id).map((e) => nodes.get(e.target)?.file).filter(Boolean);
        return {id, kind: node.kind, resolved: node.kind === "model", title: node.title, description: node.description || null, artifact: node.artifact || participants[0]?.artifact, source: node.source || null, logicalId: node.logicalId || `${participants[0]?.artifact}:${participants[0]?.model}`, file: node.file || null, sources, missingSources: (node.sources || []).filter((path) => !sources.some((file) => file.endsWith("/" + path))), selector: node.selector || null, participants: participants.map((p) => ({id: p.id, requires: p.requires})), knownFlows, coverage: "Known participation in recorded flows only."};
      });
    }
    function flowSources(flow) {
      const modelFiles = flowModels(flow).flatMap((m) => [m.file, ...m.sources]).filter(Boolean);
      const paths = new Set([
        ...modelFiles,
        flow.file,
        ...flow.support
          .map(
            (s) =>
              s.file ||
              record.graph.flows.find((f) => f.id === s.targetId)?.file,
          )
          .filter(Boolean),
        ...flow.support.flatMap((s) => s.evidence || []),
      ]);
      return record.sources.filter((s) => paths.has(s.path));
    }
    let remaining = body.budget;
    function excerpt(source) {
      const text = source.text.slice(0, remaining);
      remaining -= text.length;
      if (text.length < source.text.length)
        omissions.push({
          source: source.id,
          characters: source.text.length - text.length,
        });
      return { ...source, text };
    }
    if (titleMode) {
      const query = body.query || "";
      items = eligibleFlows
        .filter(f => !query || [f.title,f.id,f.logicalId,f.localId].some(v => normalizedName(v).includes(query)))
        .map(f => ({...summary(f), score:0}));
      const exactIDs = items.filter(f => [f.id,f.logicalId,f.localId].some(v => normalizedName(v) === query));
      const exactID = exactIDs.length === 1 ? exactIDs[0].id : null;
      if(query) items.sort((a,b) =>
        Number(normalizedName(b.title) === query || b.id === exactID) - Number(normalizedName(a.title) === query || a.id === exactID)
        || String(a.title || '').localeCompare(String(b.title || ''), undefined, {numeric:true,sensitivity:"base"})
        || a.id.localeCompare(b.id));
      total = items.length;
      data = {flows:items,total,semantic:false,artifactOptions,coverage: participation?.coverage || "Explicit known relationships only; participation requires contract impact review."};
    } else if (body.operation === "search") {
      const query = body.query || "",
        ranks = [],
        exact = eligibleFlows
          .filter((f) => [f.id, f.logicalId, f.localId].includes(query))
          .map((f) => f.id);
      ranks.push(exact);
      exactMatch = exact.length === 1 ? exact[0] : null;
      // Keyword rank: terms shorter than three characters, and terms that occur in at least
      // 80 percent of the context's flows (when it has five or more), carry no signal and are
      // dropped before matching; a query of only such terms skips this rank.
      const terms = [...new Set((query.match(/[\p{L}\p{N}_-]+/gu) || []).filter((t) => t.length >= 3))];
      if (terms.length && cached?.revision === record.revision) {
        const flowCount = db.prepare("SELECT count(DISTINCT flow) AS n FROM documents WHERE context=?").get(context).n;
        const frequency = db.prepare("SELECT count(DISTINCT flow) AS n FROM flow_fts WHERE flow_fts MATCH ? AND context=?");
        const informative = flowCount < 5 ? terms : terms.filter((t) => frequency.get('"' + t + '"', context).n < 0.8 * flowCount);
        if (informative.length) {
          const rows = db
            .prepare(
              "SELECT flow,bm25(flow_fts) AS rank FROM flow_fts WHERE flow_fts MATCH ? AND context=? ORDER BY rank,id",
            )
            .all(informative.map((t) => '"' + t + '"').join(" OR "), context);
          ranks.push([...new Set(rows.filter(r => !eligible || eligible.has(r.flow)).map((r) => r.flow))]);
        }
      }
      if (semantic && query) {
        try {
          const [q] = await encoder.embed([query]),
            v = normalizeVector(q),
            scores = new Map();
          for (const doc of docs) {
            const vector = vectors.get(doc.hash);
            if (!vector || vector.length !== v.length) continue;
            const score = vector.reduce((sum, x, i) => sum + x * v[i], 0);
            scores.set(
              doc.flow,
              Math.max(scores.get(doc.flow) ?? -Infinity, score),
            );
          }
          ranks.push(
            [...scores]
              .filter(([, score]) => score >= SEMANTIC_CUTOFF)
              .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
              .map(([id]) => id),
          );
        } catch (error) {
          semantic = false;
          diagnostics.push({
            code: "flow-model-unavailable",
            message: error.message,
          });
        }
      }
      const scores = new Map();
      for (const rank of ranks)
        rank.forEach((id, i) =>
          scores.set(id, (scores.get(id) || 0) + 1 / (60 + i + 1)),
        );
      items = eligibleFlows
        .filter((f) => !query || scores.has(f.id))
        .map((f) => ({ ...summary(f), score: scores.get(f.id) || 0 }));
      total = items.length;
      data = { flows: items, total, semantic, artifactOptions, coverage: participation?.coverage || "Explicit known relationships only; participation requires contract impact review." };
    } else if (body.operation === "detail") {
      const flow = selected(),
        ids = new Set([
          flow.id,
          ...flow.steps.map((s) => s.nodeId),
          ...flow.support.map((s) => s.targetId),
          ...(flow.participants || []).map((p) => p.nodeId),
        ]);
      // Model source evidence is reachable from the participating model nodes.
      for (const edge of record.graph.edges)
        if (edge.kind === "describes" && ids.has(edge.source)) ids.add(edge.target);
      for (const edge of record.graph.edges)
        if (
          edge.target === flow.id &&
          ["contains", "defines"].includes(edge.kind)
        )
          ids.add(edge.source);
      const graph = {
        nodes: record.graph.nodes.filter((n) => ids.has(n.id)),
        edges: record.graph.edges.filter(
          (e) => ids.has(e.source) && ids.has(e.target),
        ),
      };
      data = {
        flow: {
          ...summary(flow),
          file: flow.file,
          entry_steps:flow.entry_steps||[],
          steps: flow.steps,
          participants: flow.participants || [],
          support: flow.support,
          transitions: flow.transitions,
          diagnostics: flow.diagnostics,
        },
        graph,
        models: flowModels(flow),
        sources: flowSources(flow).map(excerpt),
        units: record.units
          .filter((u) =>
            (u.affectedFlows || []).some(
              (f) => f.artifact === flow.artifact && f.flow === flow.localId,
            ),
          )
          .map(({ id, title, path, affectedFlows }) => ({
            id,
            title,
            path,
            affectedFlows,
          })),
      };
    } else if (body.operation === "concepts") {
      data = { concepts: (await conceptList(record, { artifact: body.artifact })).concepts };
    } else if (body.operation === "concept") {
      const answer = await conceptAnswer(record, body.concept);
      data = { concept: answer.concept };
      diagnostics.push(...answer.diagnostics);
    } else if (body.operation === "impact") {
      // With an impact service, the typed tiers answer; the result keeps the flow-only shape.
      const impact = impactService ? await delegatedImpact(impactService, record, body) : flowImpact(record.graph, body.ids);
      if (impact.diagnostics) diagnostics.push(...impact.diagnostics);
      items = impact.flows.filter(f => !eligible || eligible.has(f.id)).map((f) => ({ ...summary(f), paths: f.impactPath }));
      total = items.length;
      data = {
        flows: items,
        artifactOptions,
        unresolved: impact.unresolved,
        coverage: impact.coverage,
      };
      if (impact.unresolved.length)
        diagnostics.push({
          code: "unresolved-impact-selector",
          message: "Some impact IDs do not resolve",
        });
    } else {
      const flow = selected(),
        source = flowSources(flow).find((s) => s.id === body.source);
      if (!source)
        throw new ExploreError(
          403,
          "Source is not registered in this flow context",
        );
      let offset=0;
      if(body.cursor){
        try{const c=JSON.parse(Buffer.from(body.cursor,'base64url'));if(c.context!==context||c.revision!==record.revision||c.operation!=='source'||c.source!==source.id||c.flow!==flow.id||!Number.isInteger(c.offset)||c.offset<0||c.offset>source.text.length)throw Error();offset=c.offset;}
        catch{throw new ExploreError(422,'Invalid or stale source cursor');}
      }
      const text=source.text.slice(offset,offset+body.budget),nextOffset=offset+text.length;
      if(nextOffset<source.text.length)omissions.push({source:source.id,characters:source.text.length-nextOffset});
      data = {
        source: source.id,
        path: source.path,
        fingerprint: source.fingerprint,
        text,offset,totalCharacters:source.text.length,
        next:nextOffset<source.text.length&&text.length?Buffer.from(JSON.stringify({context,revision:record.revision,operation:'source',flow:flow.id,source:source.id,offset:nextOffset})).toString('base64url'):null,
      };
    }
    if (items.length || ["search", "impact"].includes(body.operation)) {
      let offset = 0;
      if (body.cursor) {
        try {
          const c = JSON.parse(Buffer.from(body.cursor, "base64url"));
          if (
            c.context !== context ||
            c.revision !== record.revision ||
            c.operation !== body.operation ||
            c.selector !== digest(JSON.stringify([body.query, body.ids, body.match, body.artifact])) ||
            !Number.isInteger(c.offset) ||
            c.offset < 0
          )
            throw Error();
          offset = c.offset;
        } catch {
          throw new ExploreError(422, "Invalid or stale cursor");
        }
      }
      if (titleMode && body.query) {
        // Named results were ordered over the complete eligible set above.
      } else if (body.operation === 'search' && body.query) {
        items.sort((a,b) => Number(b.id === exactMatch) - Number(a.id === exactMatch)
          || b.score - a.score || a.id.localeCompare(b.id));
      } else {
        items.sort((a,b)=>{const x=Date.parse(a.createdAt),y=Date.parse(b.createdAt),knownX=Number.isFinite(x),knownY=Number.isFinite(y);return Number(knownY)-Number(knownX)||(knownX&&knownY?y-x:0)||a.id.localeCompare(b.id);});
      }
      data.flows = items.slice(offset, offset + body.limit);
      data.total = total;
      data.next =
        offset + body.limit < total
          ? Buffer.from(
              JSON.stringify({
                context,
                revision: record.revision,
                operation: body.operation,
                selector: digest(JSON.stringify([body.query, body.ids, body.match, body.artifact])),
                offset: offset + body.limit,
              }),
            ).toString("base64url")
          : null;
    }
    mark("rankingMs");
    fresh &&= await unchanged();
    const published = db
      .prepare("SELECT generation FROM contexts WHERE id=?")
      .get(context);
    fresh &&= published?.generation === generation;
    if (!fresh)
      diagnostics.push({
        code: "stale-flow-context",
        message:
          "Source or index changed during retrieval; retry before deciding impact",
      });
    mark("finalValidationMs");
    timings.totalMs = performance.now() - started;
    return {
      metrics: timings,
      repository: record.repository,
      worktree: record.worktree,
      context,
      revision: record.revision,
      generation,
      freshness: fresh ? "fresh" : "stale",
      completeness:
        !fresh || diagnostics.some((d) => d.code !== "flow-model-unavailable")
          ? "partial"
          : "complete",
      data,
      diagnostics,
      pagination: { total, next: data.next || null,nextCursor:data.next||null, limit: body.limit },
      omissions,
    };
  }
  return {
    // The cached repository read, shared with the impact service.
    async load(path, {worktree, knowledge = 'planning'} = {}) {return (await cachedLoad(path, worktree, knowledge)).record;},
    observedSources(root) {
      const result = [];
      for (const row of db.prepare("SELECT json FROM contexts").all()) {
        const value = JSON.parse(row.json);
        if (value.repository === root)
          for (const source of value.sources || [])
            if (
              !result.some(
                (s) => s.worktree === value.worktree && s.path === source.path,
              )
            )
              result.push({ worktree: value.worktree, ...source });
      }
      return result;
    },
    query(body) {
      if(closing)return Promise.reject(new ExploreError(503,'Flow service is closed'));
      const result = serial.then(() => execute(body));
      serial = result.catch(() => {});
      return result;
    },
    close() {
      closing=true;
      return closePromise??=(serial.then(()=>db.close()));
    },
  };
}
