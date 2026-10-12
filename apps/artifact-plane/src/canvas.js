import { elementGroups, typeKey } from "./elements.js";
import dagre from "@dagrejs/dagre";
import { effectiveEdges } from "./graph.js";
const artifactNodeId = (id) => `artifact:${id}`;
const elementNodeId = (id) => `element:${id}`;

// Layout only outer groups. Child positions stay relative to their artifact.
export function canvasGraph(
  snapshot,
  expanded,
  planning = false,
  expandedTypes = new Set(),
) {
  const outer = [],
    children = [],
    edges = [],
    layoutEdges = [];
  const byId = new Map(snapshot.artifacts.map((a) => [a.id, a]));
  for (const a of snapshot.artifacts) {
    const open = expanded.has(a.id),
      groups = [];
    let y = 104;
    if (open)
      for (const group of elementGroups(a)) {
        const shown = expandedTypes.has(typeKey(a.id, group.type));
        const header = { ...group, open: shown, y, headings: [] };
        groups.push(header);
        y += 34;
        if (shown)
          for (const source of group.sources) {
            header.headings.push({ label: source.label, y });
            y += 24;
            for (const e of source.elements) {
              children.push({
                id: elementNodeId(e.id),
                type: "element",
                parentId: artifactNodeId(a.id),
                extent: "parent",
                data: { element: e },
                position: { x: 16, y },
                style: { width: 328, height: 52 },
              });
              y += 60;
            }
          }
        y += 8;
      }
    outer.push({
      id: artifactNodeId(a.id),
      type: "artifact",
      data: { artifact: a, open, groups },
      position: { x: 0, y: 0 },
      style: {
        width: open ? 360 : 280,
        height: open ? Math.max(156, y + 10) : 112,
      },
    });
  }
  const visibleElements = new Set(children.map((n) => n.id));
  function missing(id, label) {
    if (!outer.some((n) => n.id === id))
      outer.push({
        id,
        type: "missing",
        data: { label },
        position: { x: 0, y: 0 },
        style: { width: 260, height: 100 },
      });
    return id;
  }
  const selected = effectiveEdges(snapshot.edges, planning);
  for (const e of selected) {
    const source = byId.has(e.source)
      ? artifactNodeId(e.source)
      : missing(
          `missing-artifact:${e.source}`,
          `Missing artifact: ${e.source}`,
        );
    const target = artifactNodeId(e.target);
    const removal =
      !planning &&
      snapshot.edges.some(
        (p) =>
          p.status === "proposed-remove" &&
          p.source === e.source &&
          p.target === e.target,
      );
    const status = removal ? "proposed-remove" : e.status;
    const color =
      status === "proposed-add"
        ? "#10b981"
        : status === "proposed-remove"
          ? "#f28c82"
          : "#8b9bb4";
    edges.push({
      id: `dependency:${e.source}:${e.target}`,
      source,
      target,
      type: "smoothstep",
      label:
        status === "proposed-add"
          ? "addition proposed"
          : removal
            ? "removal proposed"
            : "",
      style: {
        stroke: color,
        strokeWidth: 2,
        ...(status !== "established" ? { strokeDasharray: "6 5" } : {}),
      },
      markerEnd: { type: "arrowclosed", color },
      data: { status },
      zIndex: 0,
    });
    layoutEdges.push([source, target]);
  }
  for (const ref of snapshot.references) {
    if (!visibleElements.has(elementNodeId(ref.consumer))) continue;
    const consumer = elementNodeId(ref.consumer);
    const prerequisite = !ref.resolved
      ? missing(
          `missing-reference:${ref.id}`,
          `Unresolved: ${ref.artifact}/${ref.element}`,
        )
      : visibleElements.has(elementNodeId(ref.targetId))
        ? elementNodeId(ref.targetId)
        : artifactNodeId(ref.artifact);
    const color = !ref.resolved
      ? "#f28c82"
      : ref.status === "proposed"
        ? "#10b981"
        : "#9f94ff";
    edges.push({
      id: `reference:${ref.id}`,
      source: prerequisite,
      target: consumer,
      type: "smoothstep",
      label: ref.resolved ? "reference" : "unresolved",
      style: { stroke: color, strokeWidth: 1.5, strokeDasharray: "3 4" },
      markerEnd: { type: "arrowclosed", color },
      data: { reference: ref },
      zIndex: 2,
    });
    if (!ref.resolved)
      layoutEdges.push([prerequisite, artifactNodeId(ref.consumerArtifact)]);
  }
  const graph = new dagre.graphlib.Graph()
    .setGraph({
      rankdir: "LR",
      nodesep: 55,
      ranksep: 110,
      marginx: 30,
      marginy: 30,
    })
    .setDefaultEdgeLabel(() => ({}));
  for (const node of outer)
    graph.setNode(node.id, {
      width: node.style.width,
      height: node.style.height,
    });
  for (const [source, target] of layoutEdges)
    if (graph.hasNode(source) && graph.hasNode(target))
      graph.setEdge(source, target);
  dagre.layout(graph);
  for (const node of outer) {
    const position = graph.node(node.id);
    node.position = {
      x: position.x - node.style.width / 2,
      y: position.y - node.style.height / 2,
    };
  }
  return { nodes: [...outer, ...children], edges };
}
