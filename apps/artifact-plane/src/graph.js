const unique = (v) => [...new Set(v)].sort();
export function effectiveEdges(edges, planning = false) {
  const removed = new Set(
    edges
      .filter((e) => e.status === "proposed-remove")
      .map((e) => `${e.source}\0${e.target}`),
  );
  return edges.filter((e) =>
    planning
      ? (e.status === "established" &&
          !removed.has(`${e.source}\0${e.target}`)) ||
        e.status === "proposed-add"
      : e.status === "established",
  );
}
export function relationships(id, edges, planning = false) {
  const selected = effectiveEdges(edges, planning),
    result = {};
  for (const direction of ["upstream", "downstream"]) {
    const next = (node) =>
      unique(
        selected
          .filter(
            (e) => e[direction === "upstream" ? "target" : "source"] === node,
          )
          .map((e) => e[direction === "upstream" ? "source" : "target"]),
      );
    const seen = new Set([id]),
      queue = [...next(id)];
    while (queue.length) {
      const node = queue.shift();
      if (seen.has(node)) continue;
      seen.add(node);
      queue.push(...next(node));
    }
    seen.delete(id);
    result[direction] = {
      direct: next(id).filter((n) => n !== id),
      transitive: [...seen].sort(),
    };
  }
  return result;
}
