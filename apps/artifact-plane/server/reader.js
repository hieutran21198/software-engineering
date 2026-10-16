import {createHash} from 'node:crypto';
import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { relative, resolve, isAbsolute, sep } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {marked} from 'marked';
import { buildSnapshot, parseArtifact, KNOWLEDGE_KINDS } from "../src/model.js";
import { readBaselines } from "./knowledge-baseline.js";
const execute = promisify(execFile);
import {gitReads} from './git-reads.js';
import {gitSlot} from './git-process.js';
export const gitMetrics = {commands:0};
export const scanMetrics={files:0,fullBodies:0,scans:0};
import {frontMatter,unitBriefs, versionClaims, safeKnowledgePath} from "./units-of-work.js";
import { readWorkflow } from "./workflow.js";
export class ExploreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export async function git(root, args, raw = false) {
  const release=await gitSlot();
  try {
  gitMetrics.commands++;
  const { stdout } = await execute(
    "git",
    [
      "-c",
      "core.fsmonitor=false",
      "-c",
      "core.untrackedCache=false",
      "-C",
      root,
      ...args,
    ],
    {
      encoding: raw === "bytes" ? "buffer" : "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
      timeout: 15000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  return raw ? stdout : stdout.trim();
  }finally{release();}
}
export async function scanRepository(path, options = {}) {
  const runGit = options.git || git;
  scanMetrics.scans++;
  if (typeof path !== "string" || !isAbsolute(path) || path.includes("\0"))
    throw new ExploreError(400, "Enter an absolute repository path.");
  let root;
  try {
    root = await realpath(path);
  } catch (e) {
    throw new ExploreError(
      e.code === "ENOENT" ? 404 : 422,
      "Repository path does not exist or cannot be read.",
    );
  }
  let top;
  try {
    top = await runGit(root, ["rev-parse", "--show-toplevel"]);
  } catch {
    throw new ExploreError(422, "Select a readable Git worktree root.");
  }
  if ((await realpath(top)) !== root)
    throw new ExploreError(
      422,
      "Select the Git worktree root, not a nested directory.",
    );
  const contentHash=createHash('sha256');
  const loadedPaths=new Set();
  const files = new Map(),
    layouts = {},
    workingBytes = new Map(),
    diagnostics = [],
    unsafeTaskPaths = new Set();
  const diagnostic = (code, path, message) =>
    diagnostics.push({ code, path, message });
  const contained = (target) =>
    target === root ||
    (!relative(root, target).startsWith(`..${sep}`) &&
      relative(root, target) !== ".." &&
      !isAbsolute(relative(root, target)));
  async function safe(path) {
    try {
      const target = await realpath(resolve(root, path));
      if (
        !contained(target) ||
        relative(root, target).split(sep).includes(".git")
      ) {
        if (/\/(?:changes\/change-[^/]+|versions\/\d+\.\d+\.\d+)\/tasks\//.test(path)) unsafeTaskPaths.add(path);
        diagnostic(
          "unsafe-path",
          path,
          "Path leaves the repository or points into Git metadata; skipped.",
        );
        return null;
      }
      return target;
    } catch (e) {
      if (e.code !== "ENOENT")
        diagnostic("unreadable-path", path, "Path cannot be read.");
      return null;
    }
  }
  async function directory(path) {
    const target = await safe(path);
    if (!target) return [];
    try {
      return (await readdir(target, { withFileTypes: true })).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    } catch {
      diagnostic("unreadable-path", path, "Directory cannot be read.");
      return [];
    }
  }
  async function load(path) {
    if(loadedPaths.has(path))return true;
    const target = await safe(path);
    if (!target) return false;
    try {
      if (!(await stat(target)).isFile()) return false;
      const taskDirectory = path.match(/^(.*\/(?:changes\/change-[^/]+|versions\/\d+\.\d+\.\d+)\/tasks)\//)?.[1];
      if (taskDirectory) {
        const taskRelative = relative(resolve(root, taskDirectory), target);
        if (taskRelative === '..' || taskRelative.startsWith('..' + sep) || isAbsolute(taskRelative)) {
          unsafeTaskPaths.add(path);
          diagnostic('unsafe-path', path, 'Task path leaves the task directory; skipped.');
          return false;
        }
      }
      const bytes = await readFile(target);
      contentHash.update(JSON.stringify(path));contentHash.update(bytes);
      const owner = path.match(/^docs\/artifacts\/([^/]+)\/(?:requirements|specifications|decisions)\//)?.[1];
      if (owner && layouts[owner] === "in-place") workingBytes.set(path, bytes);
      const markdown = bytes.toString("utf8");
      if (!bytes.equals(Buffer.from(markdown, "utf8"))) {
        diagnostic("unreadable-path", path, "Knowledge file is not valid UTF-8; skipped.");
        return false;
      }
      scanMetrics.files++;
      const full=path.endsWith('.yaml') || !options.metadata || options.full?.(path) || /^docs\/artifacts\/[^/]+\/README\.md$/.test(path);
      if(full)scanMetrics.fullBodies++;
      const metadata=()=>{
        const front=markdown.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0]||'';
        const tokens=marked.lexer(markdown.slice(front.length));
        return front+tokens.filter(t=>t.type==='heading'&&t.depth===1||t.type==='code'&&/^ya?ml$/i.test(t.lang||'')).map(t=>t.raw).join('\n');
      };
      files.set(path,full?markdown:metadata());loadedPaths.add(path);
      return true;
    } catch {
      diagnostic("unreadable-path", path, "File cannot be read.");
      return false;
    }
  }
  // Traverse only current/candidate knowledge directories. Resolve every path
  // before access; a visited set prevents loops through internal symlinks.
  async function knowledge(path, visited = new Set()) {
    if(options.indexOnly&&!options.full?.(path+'/'))return;
    const target = await safe(path);
    if (!target || visited.has(target)) return;
    visited.add(target);
    for (const entry of await directory(path)) {
      if (entry.name === ".git") continue;
      const child = `${path}/${entry.name}`,
        resolved = await safe(child);
      if (!resolved) continue;
      try {
        const info = await stat(resolved);
        if (info.isDirectory()) await knowledge(child, visited);
        else if (info.isFile() && entry.name.endsWith(".md")) await load(child);
      } catch {
        diagnostic("unreadable-path", child, "Knowledge path cannot be read.");
      }
    }
  }
  const base = "docs/artifacts";
  const basePath = await safe(base);
  if (!basePath || !(await stat(basePath)).isDirectory())
    throw new ExploreError(
      404,
      "Repository has no readable docs/artifacts directory.",
    );
  await load(`${base}/dag.yaml`);
  for (const entry of await directory(base)) {
    const prefix = `${base}/${entry.name}`;
    if (entry.name === "units-of-work") continue;
    if (!(entry.isDirectory() || entry.isSymbolicLink())) continue;
    if (!(await load(`${prefix}/README.md`))) continue;
    // Root knowledge directories select the in-place layout for this artifact.
    const inPlace = (await directory(prefix)).some((e) => KNOWLEDGE_KINDS.includes(e.name) && (e.isDirectory() || e.isSymbolicLink()));
    layouts[entry.name] = inPlace ? "in-place" : "legacy";
    const a = parseArtifact(entry.name, files.get(`${prefix}/README.md`), [], layouts[entry.name]);
    if (inPlace) for (const kind of KNOWLEDGE_KINDS) await knowledge(`${prefix}/${kind}`);
    else if (a.currentVersion)
      for (const kind of [
        "requirements",
        "specifications",
        "decisions",
        "tasks",
      ])
        await knowledge(`${prefix}/versions/${a.currentVersion}/${kind}`);
    for (const version of await directory(`${prefix}/versions`)) {
      if (/^\d+\.\d+\.\d+$/.test(version.name)) {
        const versionPath=`${prefix}/versions/${version.name}/`;
        await load(`${versionPath}README.md`);
        const metadata=frontMatter(files.get(`${versionPath}README.md`));
        if (metadata.value?.delivery_tasks !== undefined) {
          if (metadata.value.delivery_tasks !== 'change') diagnostic('invalid-delivery-marker', `${versionPath}README.md`, 'Delivery marker must be the literal value change.');
          if (!/^change-[a-z0-9][a-z0-9-]*$/.test(metadata.value.source_change || '')) diagnostic('invalid-provenance', `${versionPath}README.md`, 'Change-owned delivery requires a safe source_change.');
        }
        if (metadata.value?.delivery_tasks !== undefined || options.historicalKnowledge)
          for (const kind of ['requirements','specifications','decisions','tasks']) await knowledge(`${versionPath}${kind}`);
      }
    }
    for (const change of await directory(`${prefix}/changes`)) {
      if (
        !change.name.startsWith("change-") ||
        !(change.isDirectory() || change.isSymbolicLink())
      )
        continue;
      const changePath = `${prefix}/changes/${change.name}`;
      if (!(await safe(changePath))) continue;
      // The directory itself is evidence of a candidate, even if empty.
      files.set(`${changePath}/README.md`, "");
      await load(`${changePath}/README.md`);
      await load(`${changePath}/dependencies.yaml`);
      if(options.indexOnly)await load(`${changePath}/tasks/README.md`);
      for (const kind of [
        "requirements",
        "specifications",
        "decisions",
        "tasks",
      ])
        await knowledge(`${changePath}/${kind}`);
    }
  }
  for (const unit of await directory(`${base}/units-of-work`)) {
    if (unit.isDirectory() || unit.isSymbolicLink()) await load(`${base}/units-of-work/${unit.name}/README.md`);
  }
  for (const unit of unitBriefs(files)) {
    for (const member of unit.members) for (const claim of versionClaims(files, member.artifact, member.change)) {
      await load(`${claim.prefix}dependencies.yaml`);
      for (const kind of ['requirements','specifications','decisions','tasks']) await knowledge(`${claim.prefix}${kind}`);
    }
    for (const evidence of unit.evidence) if (safeKnowledgePath(evidence.source.split('#')[0])) await load(evidence.source.split('#')[0]);
  }
  // Structured publication review sources in identity records and unit briefs.
  for (const [path, body] of [...files]) {
    if (!/^docs\/artifacts\/[^/]+(?:\/[^/]+)?\/README\.md$/.test(path)) continue;
    const reviews = frontMatter(body).value?.publication_reviews;
    if (Array.isArray(reviews)) for (const review of reviews) {const source = typeof review?.source === 'string' ? review.source.split('#')[0] : null;if (safeKnowledgePath(source)) await load(source);}
  }
  let branch, head, status;
  try {
    branch = await runGit(root, ["symbolic-ref", "--short", "HEAD"]).catch(
      () => "detached",
    );
    head = await runGit(root, ["rev-parse", "--verify", "HEAD"]).catch(() => null);
    status = await runGit(root, [
      "status",
      "--porcelain=v1",
      "--untracked-files=normal",
    ]);
  } catch {
    throw new ExploreError(422, "Git status could not be read.");
  }
  const inPlace = Object.keys(layouts).filter((id) => layouts[id] === "in-place").sort();
  const baselines = await readBaselines(root, runGit, inPlace, workingBytes, diagnostics);
  const snapshot = buildSnapshot(
    files,
    { path: root, branch, head, dirty: Boolean(status), status },
    diagnostics,
    { layouts, baselines },
  );
  contentHash.update(JSON.stringify(Object.entries(baselines).map(([id, b]) => [id, b.oid ?? b.state])));
  return { snapshot, files, unsafeTaskPaths, baselines, revision:contentHash.digest('hex') };
}

const inFlight = new Map();
export async function exploreRepository(path, {legacy=false}={}) {
  const identity=typeof path==='string'?await realpath(path).catch(()=>path):path;
  if(!legacy && inFlight.has(identity))return inFlight.get(identity);
  const work=(async()=>{
    const reads=legacy?git:gitReads(git,()=>gitMetrics.commands++);
    try{
      const scan=root=>scanRepository(root,{git:reads});
      const {snapshot,files,unsafeTaskPaths}=await scan(path);
      snapshot.workflow=await readWorkflow(snapshot.repository.path,{snapshot,files,unsafeTaskPaths},scan,reads);
      snapshot.unitsOfWork=snapshot.workflow.worktrees.find(w=>w.selected)?.unitsOfWork||[];
      return snapshot;
    }finally{reads.close?.();}
  })();
  if(!legacy)inFlight.set(identity,work);
  try{return await work;}finally{if(inFlight.get(identity)===work)inFlight.delete(identity);}
}
