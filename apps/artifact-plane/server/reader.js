import { readdir, readFile, realpath, stat } from "node:fs/promises";
import { relative, resolve, isAbsolute, sep } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { buildSnapshot, parseArtifact } from "../src/model.js";
const execute = promisify(execFile);
import {unitBriefs, versionClaims, safeKnowledgePath} from "./units-of-work.js";
import { readWorkflow } from "./workflow.js";
export class ExploreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export async function git(root, args, raw = false) {
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
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
      timeout: 15000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  return raw ? stdout : stdout.trim();
}
export async function scanRepository(path) {
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
    top = await git(root, ["rev-parse", "--show-toplevel"]);
  } catch {
    throw new ExploreError(422, "Select a readable Git worktree root.");
  }
  if ((await realpath(top)) !== root)
    throw new ExploreError(
      422,
      "Select the Git worktree root, not a nested directory.",
    );
  const files = new Map(),
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
      files.set(path, await readFile(target, "utf8"));
      return true;
    } catch {
      diagnostic("unreadable-path", path, "File cannot be read.");
      return false;
    }
  }
  // Traverse only current/candidate knowledge directories. Resolve every path
  // before access; a visited set prevents loops through internal symlinks.
  async function knowledge(path, visited = new Set()) {
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
    const a = parseArtifact(entry.name, files.get(`${prefix}/README.md`));
    if (a.currentVersion)
      for (const kind of [
        "requirements",
        "specifications",
        "decisions",
        "tasks",
      ])
        await knowledge(`${prefix}/versions/${a.currentVersion}/${kind}`);
    for (const version of await directory(`${prefix}/versions`)) {
      if (/^\d+\.\d+\.\d+$/.test(version.name)) await load(`${prefix}/versions/${version.name}/README.md`);
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
  let branch, head, status;
  try {
    branch = await git(root, ["symbolic-ref", "--short", "HEAD"]).catch(
      () => "detached",
    );
    head = await git(root, ["rev-parse", "--verify", "HEAD"]).catch(() => null);
    status = await git(root, [
      "status",
      "--porcelain=v1",
      "--untracked-files=normal",
    ]);
  } catch {
    throw new ExploreError(422, "Git status could not be read.");
  }
  const snapshot = buildSnapshot(
    files,
    { path: root, branch, head, dirty: Boolean(status), status },
    diagnostics,
  );
  return { snapshot, files, unsafeTaskPaths };
}

export async function exploreRepository(path) {
  const { snapshot, files, unsafeTaskPaths } = await scanRepository(path);
  snapshot.workflow = await readWorkflow(snapshot.repository.path, { snapshot, files, unsafeTaskPaths }, scanRepository, git);
  snapshot.unitsOfWork = snapshot.workflow.worktrees.find(w => w.selected)?.unitsOfWork || [];
  return snapshot;
}
