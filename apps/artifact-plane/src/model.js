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
// In-place artifacts keep one working knowledge tree; legacy artifacts keep
// snapshot copies. Readers detect the layout per artifact.
export const KNOWLEDGE_KINDS = ["requirements", "specifications", "decisions"];
export const WORKING = "working";
export function detectLayout(files, id) {
  const prefix = `${BASE}${id}/`;
  for (const path of files.keys())
    if (path.startsWith(prefix) && KNOWLEDGE_KINDS.includes(path.slice(prefix.length).split("/")[0]) && path.slice(prefix.length).includes("/"))
      return "in-place";
  return "legacy";
}
// Element source of an artifact's current knowledge, by layout.
export const currentSource = (artifact) =>
  artifact?.layout === "in-place" ? WORKING : artifact?.currentVersion ? `version:${artifact.currentVersion}` : null;
const info = (ds, code, path, message) => ds.push({ code, path, message, severity: "info" });
// The first level-1 heading outside front matter and code fences, or null.
export function headingTitle(markdown = "") {
  let fence = null;
  for (const line of markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").split(/\r?\n/)) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) fence = fence ? (marker[1][0] === fence[0] && marker[1].length >= fence.length ? null : fence) : marker[1];
    else if (!fence) {
      const heading = line.match(/^ {0,3}#[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/);
      if (heading) return heading[1].trim();
    }
  }
  return null;
}
// Pages show documents by title; a document without a heading shows its file name.
export const documentTitle = (markdown, path) => headingTitle(markdown) || path.split("/").at(-1).replace(/\.md$/, "");
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
// The identity record of an in-place artifact is front matter only.
function parseIdentity(id, path, data, body, ds) {
  const version =
    record(data) && Object.hasOwn(data, "current_version")
      ? data.current_version === null
        ? null
        : typeof data.current_version === "string" && VERSION.test(data.current_version)
          ? data.current_version
          : undefined
      : undefined;
  const deps = record(data) && Object.hasOwn(data, "depends_on") ? dependencyList(data.depends_on) : [];
  if (version === undefined || deps === undefined)
    report(ds, "invalid-identity", path, "The identity record needs front matter with current_version (a semantic version or null) and an optional depends_on list of artifact IDs.");
  return {
    id,
    layout: "in-place",
    title: marked.lexer(body).find((t) => t.type === "heading" && t.depth === 1)?.text || id,
    currentVersion: version ?? null,
    dependsOn: deps ?? [],
    publicationReviews: record(data) ? data.publication_reviews : undefined,
    activeChange: null,
    activeDeclaration: [],
    changes: [],
    elements: [],
  };
}
export function parseArtifact(id, markdown, ds = [], layout = "legacy") {
  const path = `${BASE}${id}/README.md`,
    { data, body } = frontMatter(markdown, path, ds);
  if (layout === "in-place") return { ...parseIdentity(id, path, data, body, ds), readme: markdown };
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
    layout: "legacy",
    title:
      marked.lexer(body).find((t) => t.type === "heading" && t.depth === 1)
        ?.text || id,
    readme: markdown,
    currentVersion: consistent(versions) ? versions[0] : null,
    dependsOn: consistent(deps) ? deps[0] : [],
    activeChange: null,
    activeDeclaration: sections(body, ["active change"]),
    changes: [],
    elements: [],
  };
}
const VERSION_RECORD = /^versions\/(\d+\.\d+\.\d+)\/README\.md$/;
const COPIED = /^changes\/(change-[^/]+)\/(?:requirements|specifications|decisions)\//;
function inPlaceArtifact(a, files, baseline, diagnostics, known = []) {
  const prefix = `${BASE}${a.id}/`,
    copied = new Set(known),
    versions = [];
  for (const [path, markdown] of files) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length),
      version = rest.match(VERSION_RECORD),
      copy = rest.match(COPIED);
    if (version) {
      const { data } = frontMatter(markdown, path, []);
      versions.push({ version: version[1], sourceChange: record(data) && typeof data.source_change === "string" ? data.source_change : null, path });
    }
    if (copy) copied.add(copy[1]);
  }
  a.versions = versions.sort((x, y) => x.version.localeCompare(y.version, undefined, { numeric: true }));
  for (const change of a.changes) {
    change.layout = copied.has(change.name) ? "legacy" : "in-place";
    change.version = versions.find((v) => v.sourceChange === change.name)?.version ?? null;
  }
  const open = a.changes.filter((c) => c.layout === "in-place" && !c.version);
  if (open.length === 1) a.activeChange = open[0].name;
  else if (open.length > 1)
    report(diagnostics, "multiple-changes", `${prefix}changes`, "Multiple open change records; no active change was selected.");
  if (copied.size)
    info(diagnostics, "retained-legacy-change", `${prefix}changes`, `Retained legacy change records with copied knowledge: ${[...copied].sort().join(", ")}.`);
  for (const v of versions) {
    const change = a.changes.find((c) => c.name === v.sourceChange);
    const knowledge = [...files.keys()].some((p) => p.startsWith(`${prefix}versions/${v.version}/`) && KNOWLEDGE_KINDS.includes(p.slice(`${prefix}versions/${v.version}/`.length).split("/")[0]));
    if (knowledge && change?.layout === "in-place")
      report(diagnostics, "version-knowledge-copy", v.path, "An in-place version record must not contain knowledge directories.");
  }
  // The working tree is proposed; protected-ref facts are established.
  const working = { version: a.currentVersion, dependsOn: a.dependsOn };
  a.baseline = baseline
    ? { state: baseline.state, ref: baseline.ref ?? null, layout: baseline.layout ?? null, reason: baseline.reason ?? null }
    : { state: "unread", ref: null, layout: null, reason: "No protected-ref baseline was read." };
  if (baseline?.state === "available") {
    a.currentVersion = baseline.currentVersion;
    a.dependsOn = baseline.dependsOn;
  }
  a.proposedVersion = working.version !== a.currentVersion ? working.version : null;
  a.proposedDependsOn = working.dependsOn;
  if (working.version && !versions.some((v) => v.version === working.version))
    report(diagnostics, "missing-version", prefix, `Current version ${working.version} has no version record.`);
  a.removedKnowledge = baseline?.state === "available" ? [...(baseline.removed || [])] : [];
  for (const [path, markdown] of files) {
    if (!path.startsWith(prefix)) continue;
    const rest = path.slice(prefix.length),
      change = rest.match(/^changes\/(change-[^/]+)\/(.+)$/);
    if (KNOWLEDGE_KINDS.includes(rest.split("/")[0]) && safeElementPath(rest))
      a.elements.push({
        id: elementId(a.id, WORKING, rest),
        logicalId: `${a.id}:${rest}`,
        artifact: a.id,
        path: rest,
        source: WORKING,
        state: baseline?.state === "available" ? baseline.status?.get(path) || "added" : "unknown",
        title: documentTitle(markdown, rest),
        markdown,
        file: path,
      });
    else if (change && safeElementPath(change[2]) && a.changes.some((c) => c.name === change[1]))
      a.elements.push({
        id: elementId(a.id, `change:${change[1]}`, change[2]),
        artifact: a.id,
        path: change[2],
        source: `change:${change[1]}`,
        title: documentTitle(markdown, change[2]),
        markdown,
        file: path,
      });
  }
  a.elements = orderElements(a);
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
// options.layouts overrides layout detection per artifact. options.baselines
// supplies protected-ref facts for in-place artifacts, read by the server.
// options.copied names changes with copied knowledge that a scan did not load.
export function buildSnapshot(files, repository = {}, inputDiagnostics = [], options = {}) {
  const diagnostics = [...inputDiagnostics];
  const artifacts = [...files]
    .filter(([p]) => /^docs\/artifacts\/[^/]+\/README\.md$/.test(p) && p !== "docs/artifacts/units-of-work/README.md")
    .map(([p, content]) => {
      const id = p.split("/")[2];
      return parseArtifact(id, content, diagnostics, options.layouts?.[id] || detectLayout(files, id));
    })
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
      title: headingTitle(files.get(`${prefix}changes/${name}/README.md`) || ""),
      readme: files.get(`${prefix}changes/${name}/README.md`) || "",
    }));
    if (a.layout === "in-place") {
      inPlaceArtifact(a, files, options.baselines?.[a.id], diagnostics, options.copied?.[a.id]);
      for (const source of a.dependsOn) {
        edges.push({ source, target: a.id, status: "established" });
        if (!a.proposedDependsOn.includes(source)) edges.push({ source, target: a.id, status: "proposed-remove" });
      }
      for (const source of a.proposedDependsOn)
        if (!a.dependsOn.includes(source)) edges.push({ source, target: a.id, status: "proposed-add" });
      for (const source of new Set([...a.dependsOn, ...a.proposedDependsOn]))
        if (!byId.has(source))
          report(diagnostics, "missing-artifact", `${prefix}README.md`, `Dependency artifact ${source} does not exist.`);
      continue;
    }
    if (a.activeDeclaration.length) {
      const links = [];
      for (const text of a.activeDeclaration) marked.walkTokens(marked.lexer(text), token => {
        if (token.type !== "link") return;
        const match = token.href.match(/^(?:\.\/)?changes\/(change-[^/\\\s]+)\/README\.md$/);
        if (match) links.push(match[1]);
        else links.push(null);
      });
      if (a.activeDeclaration.length === 1 && links.length === 1 && changes.has(links[0]) && !links[0].includes("..")) a.activeChange = links[0];
      else report(diagnostics, "invalid-active-change", prefix + "README.md", "Active change must link to one existing owned change README.");
    } else if (changes.size === 1) a.activeChange = [...changes][0];
    if (changes.size > 1 && !a.activeChange)
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
            title: documentTitle(markdown, elementPath),
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
    if (a.layout === "in-place") {
      info(diagnostics, "legacy-proposal-ignored", path, "dependencies.yaml is legacy-only; edit depends_on in the identity record instead.");
      continue;
    }
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
      const inPlace = artifacts.filter((a) => a.layout === "in-place").map((a) => a.id);
      if (inPlace.length)
        info(diagnostics, "legacy-index-ignored", indexPath, `dag.yaml is legacy-only and is ignored for in-place artifacts: ${inPlace.join(", ")}.`);
      for (const a of artifacts) {
        if (a.layout === "in-place") continue;
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
        if (!byId.has(id) && !inPlace.length)
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
      if (a.layout !== "in-place") for (const token of marked.lexer(body))
        if (token.type === "code" && ["yaml", "yml"].includes(token.lang) && /(?:\breferences\s*:|["\']references["\']\s*:)/.test(token.text))
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
          const owner = byId.get(ref.artifact);
          let status = ref.status || "established";
          const targetSource =
            owner?.layout === "in-place"
              ? WORKING
              : status === "proposed"
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
          // In-place selectors have no effect; the target's bytes decide the label.
          if (owner?.layout === "in-place" && resolved) {
            const state = allElements.get(targetId).state;
            status = state === "added" || state === "modified" ? "proposed" : state === "unchanged" ? "established" : status;
          }
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
  // Dependency explanations: the consumer's references that target the actual
  // supplier in the consumer snapshot selected by the edge status. No reason
  // is inferred from status or prose; an empty list means not documented.
  for (const edge of edges) {
    const consumer = byId.get(edge.target);
    const selected = consumer?.layout === "in-place"
      ? [WORKING]
      : edge.status === "proposed-add"
        ? [consumer?.activeChange && `change:${consumer.activeChange}`]
        : [currentSource(consumer)];
    edge.declaration = consumer?.layout !== "in-place" && edge.status !== "established" && consumer?.activeChange
      ? `${BASE}${edge.target}/changes/${consumer.activeChange}/dependencies.yaml`
      : `${BASE}${edge.target}/README.md`;
    const seen = new Set();
    edge.explanations = references
      .filter((r) => r.consumerArtifact === edge.target && r.artifact === edge.source && selected.includes(r.consumerSource))
      .map((r) => ({
        consumer: r.consumer,
        consumerPath: allElements.get(r.consumer)?.path ?? null,
        source: allElements.get(r.consumer)?.file ?? null,
        supplier: r.targetId,
        element: r.element,
        reason: r.reason,
        selector: { status: r.status, source: r.targetSource },
        resolved: r.resolved,
        diagnostic: r.diagnostic,
      }))
      .filter((x) => {
        const key = JSON.stringify([x.consumer, x.element, x.reason, x.selector]);
        return !seen.has(key) && seen.add(key);
      });
  }
  checkCycles(effectiveEdges(edges), "established", diagnostics);
  checkCycles(effectiveEdges(edges, true), "planning", diagnostics);
  // Diagnostics name the layout of the artifact they apply to.
  for (const d of diagnostics) {
    const owner = typeof d.path === "string" ? byId.get(d.path.slice(BASE.length).split("/")[0]) : null;
    if (owner && d.path.startsWith(BASE)) d.layout ??= owner.layout;
  }
  return { repository, artifacts, edges, references, diagnostics };
}
