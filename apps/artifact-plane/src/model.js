import { orderElements } from "./elements.js";
import { effectiveEdges } from "./graph.js";
export { effectiveEdges, relationships } from "./graph.js";
import { parseDocument } from "yaml";
import { marked } from "marked";
const BASE = "docs/artifacts/";
const VERSION = /^\d+\.\d+\.\d+$/;
const record = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const unique = (v) => [...new Set(v)].sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const report = (ds, code, path, message) => ds.push({ code, path, message });
export const elementId = (artifact, source, path) =>
  JSON.stringify([artifact, source, path]);
export function safeElementPath(path) {
  return (
    typeof path === "string" &&
    /^(requirements|specifications|decisions|tasks)\/.+\.md$/.test(path) &&
    !path.split("/").some((p) => p === ".." || p === "." || !p) &&
    !path.includes("\\") &&
    !path.includes("\0")
  );
}
function yaml(text, path, ds) {
  try {
    const doc = parseDocument(text);
    if (doc.errors.length) throw Error(doc.errors[0].message.split("\n")[0]);
    return doc.toJS({ maxAliasCount: 50 });
  } catch (e) {
    report(ds, "invalid-yaml", path, `Cannot parse YAML: ${e.message}`);
    return null;
  }
}
function frontMatter(markdown, path, ds) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  return {
    data: match ? yaml(match[1], path, ds) : null,
    body: match ? markdown.slice(match[0].length) : markdown,
  };
}
function sections(body, names) {
  const tokens = marked.lexer(body),
    results = [];
  for (let i = 0; i < tokens.length; i++) {
    const heading = tokens[i];
    if (
      heading.type !== "heading" ||
      !names.includes(heading.text.toLowerCase())
    )
      continue;
    let end = i + 1;
    while (
      end < tokens.length &&
      !(tokens[end].type === "heading" && tokens[end].depth <= heading.depth)
    )
      end++;
    results.push(
      tokens
        .slice(i + 1, end)
        .map((t) => t.raw)
        .join("")
        .trim(),
    );
  }
  return results;
}
function markdownVersion(text) {
  if (/^none\b/i.test(text)) return null;
  const m = text.match(
    /^(?:`(\d+\.\d+\.\d+)`|\[(\d+\.\d+\.\d+)\]\((?:\.\/)?versions\/\2\/?\)|(\d+\.\d+\.\d+))\.?$/,
  );
  return m ? m[1] || m[2] || m[3] : undefined;
}
function dependencyList(value) {
  return !Array.isArray(value) ||
    value.some((v) => typeof v !== "string" || !/^[\w.-]+$/.test(v))
    ? undefined
    : unique(value);
}
function markdownDependencies(text) {
  if (/^none\b/i.test(text)) return [];
  const list = [];
  for (const line of text.split(/\r?\n/).filter((l) => l.trim())) {
    const m =
      line.match(/^\s*[-*+]\s+`?([\w.-]+)`?\s*$/) ||
      line.match(
        /^\s*[-*+]\s+\[[^\]]+\]\((?:\.\.\/|\.\/)?([\w.-]+)\/README\.md\)\s*$/,
      );
    if (!m) return undefined;
    list.push(m[1]);
  }
  return list.length ? unique(list) : undefined;
}
export function parseArtifact(id, markdown, ds = []) {
  const path = `${BASE}${id}/README.md`,
    { data, body } = frontMatter(markdown, path, ds);
  const versions = sections(body, [
    "current established version",
    "current version",
  ]).map(markdownVersion);
  if (record(data) && Object.hasOwn(data, "current_version"))
    versions.push(
      data.current_version === null || data.current_version === "None"
        ? null
        : typeof data.current_version === "string" &&
            VERSION.test(data.current_version)
          ? data.current_version
          : undefined,
    );
  const deps = sections(body, ["established dependencies", "dependencies"]).map(
    markdownDependencies,
  );
  if (record(data) && Object.hasOwn(data, "depends_on"))
    deps.push(dependencyList(data.depends_on));
  const consistent = (vs) =>
    vs.length && !vs.includes(undefined) && vs.every((v) => same(v, vs[0]));
  if (!consistent(versions))
    report(
      ds,
      "ambiguous-version",
      path,
      "Declare one current version or None; declarations must agree.",
    );
  if (!consistent(deps))
    report(
      ds,
      "ambiguous-dependencies",
      path,
      "Declare dependencies as artifact identifiers or None; declarations must agree.",
    );
  return {
    id,
    title:
      marked.lexer(body).find((t) => t.type === "heading" && t.depth === 1)
        ?.text || id,
    readme: markdown,
    currentVersion: consistent(versions) ? versions[0] : null,
    dependsOn: consistent(deps) ? deps[0] : [],
    activeChange: null,
    changes: [],
    elements: [],
  };
}
function checkCycles(edges, label, ds) {
  const visiting = new Set(),
    visited = new Set(),
    adjacency = new Map();
  for (const { source, target } of edges) {
    if (!adjacency.has(source)) adjacency.set(source, []);
    adjacency.get(source).push(target);
  }
  function visit(node, stack) {
    if (visiting.has(node)) {
      report(
        ds,
        "cycle",
        BASE,
        `${label} graph cycle: ${[...stack.slice(stack.indexOf(node)), node].join(" → ")}`,
      );
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    for (const next of adjacency.get(node) || []) visit(next, [...stack, node]);
    visiting.delete(node);
    visited.add(node);
  }
  for (const node of adjacency.keys()) visit(node, []);
}
export function buildSnapshot(files, repository = {}, inputDiagnostics = []) {
  const diagnostics = [...inputDiagnostics];
  const artifacts = [...files]
    .filter(([p]) => /^docs\/artifacts\/[^/]+\/README\.md$/.test(p))
    .map(([p, content]) => parseArtifact(p.split("/")[2], content, diagnostics))
    .sort((a, b) => a.id.localeCompare(b.id));
  const byId = new Map(artifacts.map((a) => [a.id, a])),
    edges = [],
    references = [];
  for (const a of artifacts) {
    const prefix = `${BASE}${a.id}/`,
      changes = new Set();
    for (const path of files.keys()) {
      if (!path.startsWith(prefix)) continue;
      const match = path
        .slice(prefix.length)
        .match(/^changes\/(change-[^/]+)\//);
      if (match) changes.add(match[1]);
    }
    a.changes = [...changes].sort().map((name) => ({
      name,
      readme: files.get(`${prefix}changes/${name}/README.md`) || "",
    }));
    if (changes.size === 1) a.activeChange = [...changes][0];
    if (changes.size > 1)
      report(
        diagnostics,
        "multiple-changes",
        `${prefix}changes`,
        "Multiple change candidates; no active change was selected.",
      );
    if (
      a.currentVersion &&
      ![...files.keys()].some((p) =>
        p.startsWith(`${prefix}versions/${a.currentVersion}/`),
      )
    )
      report(
        diagnostics,
        "missing-version",
        prefix,
        `Current version ${a.currentVersion} has no readable knowledge files.`,
      );
    for (const source of [
      ...(a.currentVersion ? [`version:${a.currentVersion}`] : []),
      ...[...changes].map((c) => `change:${c}`),
    ]) {
      const [kind, name] = source.split(":"),
        sourcePrefix = `${prefix}${kind === "version" ? "versions" : "changes"}/${name}/`;
      for (const [path, markdown] of files) {
        if (!path.startsWith(sourcePrefix)) continue;
        const elementPath = path.slice(sourcePrefix.length);
        if (safeElementPath(elementPath))
          a.elements.push({
            id: elementId(a.id, source, elementPath),
            artifact: a.id,
            path: elementPath,
            source,
            markdown,
            file: path,
          });
      }
    }
    a.elements = orderElements(a);
    for (const source of a.dependsOn) {
      edges.push({ source, target: a.id, status: "established" });
      if (!byId.has(source))
        report(
          diagnostics,
          "missing-artifact",
          `${prefix}README.md`,
          `Dependency artifact ${source} does not exist.`,
        );
    }
  }
  for (const a of artifacts) {
    if (!a.activeChange) continue;
    const path = `${BASE}${a.id}/changes/${a.activeChange}/dependencies.yaml`;
    if (!files.has(path)) continue;
    const proposal = yaml(files.get(path), path, diagnostics);
    if (!record(proposal)) {
      report(
        diagnostics,
        "invalid-proposal",
        path,
        "Proposal must contain an artifact, add, and remove mapping.",
      );
      continue;
    }
    const add = dependencyList(proposal.add ?? []),
      remove = dependencyList(proposal.remove ?? []);
    if (
      !record(proposal) ||
      proposal.artifact !== a.id ||
      !add ||
      !remove ||
      add.some((id) => remove.includes(id))
    ) {
      report(
        diagnostics,
        "invalid-proposal",
        path,
        "Proposal must name its owning artifact and contain nonconflicting add/remove lists.",
      );
      continue;
    }
    for (const [list, status] of [
      [add, "proposed-add"],
      [remove, "proposed-remove"],
    ])
      for (const source of list) {
        if (!byId.has(source))
          report(
            diagnostics,
            "missing-artifact",
            path,
            `Proposed dependency artifact ${source} does not exist.`,
          );
        if (
          (status === "proposed-add" && a.dependsOn.includes(source)) ||
          (status === "proposed-remove" && !a.dependsOn.includes(source))
        )
          report(
            diagnostics,
            "redundant-proposal",
            path,
            `${status} of ${source} conflicts with the established declaration.`,
          );
        edges.push({ source, target: a.id, status });
      }
  }
  const indexPath = `${BASE}dag.yaml`;
  if (files.has(indexPath)) {
    const index = yaml(files.get(indexPath), indexPath, diagnostics);
    if (index && !record(index.artifacts))
      report(
        diagnostics,
        "invalid-index",
        indexPath,
        "Index must contain an artifacts mapping.",
      );
    else if (index) {
      for (const a of artifacts) {
        const entry = index.artifacts[a.id];
        if (
          !record(entry) ||
          entry.path !== a.id ||
          !same(dependencyList(entry.depends_on), a.dependsOn)
        )
          report(
            diagnostics,
            "index-disagreement",
            indexPath,
            `Index disagrees with root README for ${a.id}.`,
          );
      }
      for (const id of Object.keys(index.artifacts))
        if (!byId.has(id))
          report(
            diagnostics,
            "index-disagreement",
            indexPath,
            `Indexed artifact ${id} has no discovered root README.`,
          );
    }
  }
  const allElements = new Map(
    artifacts.flatMap((a) => a.elements.map((e) => [e.id, e])),
  );
  for (const a of artifacts)
    for (const consumer of a.elements) {
      const { data, body } = frontMatter(
          consumer.markdown,
          consumer.file,
          diagnostics,
        ),
        documents = [data];
      for (const token of marked.lexer(body))
        if (token.type === "code" && ["yaml", "yml"].includes(token.lang))
          documents.push(yaml(token.text, consumer.file, diagnostics));
      for (const document of documents) {
        if (!record(document) || !Object.hasOwn(document, "references"))
          continue;
        if (!Array.isArray(document.references)) {
          report(
            diagnostics,
            "invalid-reference",
            consumer.file,
            "references must be an array.",
          );
          continue;
        }
        for (const ref of document.references) {
          if (
            !record(ref) ||
            typeof ref.artifact !== "string" ||
            typeof ref.element !== "string" ||
            typeof ref.requires !== "string" ||
            !ref.requires.trim() ||
            (Object.hasOwn(ref, "status") &&
              !["established", "proposed"].includes(ref.status))
          ) {
            report(
              diagnostics,
              "invalid-reference",
              consumer.file,
              "Reference requires artifact, element, requires, and a valid status.",
            );
            continue;
          }
          const owner = byId.get(ref.artifact),
            status = ref.status || "established";
          const targetSource =
            status === "proposed"
              ? typeof ref.change === "string" &&
                /^change-[^/\\]+$/.test(ref.change)
                ? `change:${ref.change}`
                : null
              : owner?.currentVersion
                ? `version:${owner.currentVersion}`
                : null;
          const safe = safeElementPath(ref.element),
            targetId =
              targetSource && safe
                ? elementId(ref.artifact, targetSource, ref.element)
                : null;
          const resolved = Boolean(targetId && allElements.has(targetId));
          const message = !safe
            ? "Element path must stay within a knowledge snapshot."
            : !owner
              ? "Target artifact does not exist."
              : !targetSource
                ? "Target has no unambiguous declared source."
                : !resolved
                  ? "Target element does not exist in the declared source."
                  : null;
          references.push({
            id: `${consumer.id}:${references.length}`,
            consumer: consumer.id,
            consumerArtifact: a.id,
            consumerSource: consumer.source,
            artifact: ref.artifact,
            element: ref.element,
            reason: ref.requires,
            status,
            targetSource,
            targetId,
            resolved,
            diagnostic: message,
          });
          if (!resolved)
            report(
              diagnostics,
              safe ? "unresolved-reference" : "unsafe-reference",
              consumer.file,
              `${ref.artifact}/${ref.element}: ${message}`,
            );
        }
      }
    }
  checkCycles(effectiveEdges(edges), "established", diagnostics);
  checkCycles(effectiveEdges(edges, true), "planning", diagnostics);
  return { repository, artifacts, edges, references, diagnostics };
}
