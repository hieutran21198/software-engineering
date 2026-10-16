const TYPES = [
  ["requirements", "Requirements"],
  ["specifications", "Specifications"],
  ["decisions", "Decisions"],
  ["tasks", "Tasks"],
];
const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const compare = (a, b) => natural.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
export const typeKey = (artifact, type, source) => JSON.stringify(source ? [artifact, source, type] : [artifact, type]);
export const elementType = (element) => element.path.split("/")[0];

// One ordering rule supplies the API, canvas, and inspector.
export function elementGroups(artifact) {
  const rank = (source) =>
    source === "working" || source === `version:${artifact.currentVersion}`
      ? 0
      : source === `change:${artifact.activeChange}`
        ? 1
        : 2;
  return TYPES.map(([type, label]) => {
    const elements = artifact.elements.filter((e) => elementType(e) === type);
    const sources = [...new Set(elements.map((e) => e.source))].sort(
      (a, b) => rank(a) - rank(b) || compare(a, b),
    );
    return {
      type,
      label,
      count: elements.length,
      sources: sources.map((source) => ({
        source,
        label: source === "working"
          ? "Working knowledge"
          : source.startsWith("version:")
          ? `Current version · ${source.slice(8)}`
          : `${source === `change:${artifact.activeChange}` ? "Active change" : "Change candidate"} · ${source.slice(7)}`,
        elements: elements
          .filter((e) => e.source === source)
          .sort(
            (a, b) =>
              Number(b.path === `${type}/README.md`) -
                Number(a.path === `${type}/README.md`) ||
              compare(a.path, b.path),
          ),
      })),
    };
  }).filter((group) => group.count > 0);
}
export const orderElements = (artifact) =>
  elementGroups(artifact).flatMap((group) =>
    group.sources.flatMap((source) => source.elements),
  );

export const historyKey = (artifact, source = "histories") => JSON.stringify([artifact, source]);
// A single source-aware control list keeps canvas and inspector in sync.
export function knowledgeGroups(artifact, expanded) {
  const result = [];
  function types(source, prefix = "") {
    const filtered = { ...artifact, elements: artifact.elements.filter(e => e.source === source) };
    for (const group of elementGroups(filtered)) {
      const key = typeKey(artifact.id, group.type, source.startsWith("change:") ? source : undefined);
      result.push({ ...group, key, label: group.label, ariaLabel: prefix + group.label,
        open: expanded.has(key), depth: prefix ? 2 : 0 });
    }
  }
  if (artifact.layout === "in-place") types("working");
  else if (artifact.currentVersion) types("version:" + artifact.currentVersion);
  if (artifact.changes.length) {
    const key = historyKey(artifact.id);
    result.push({ key, label: "Change histories", ariaLabel: "Change histories", count: artifact.changes.length,
      open: expanded.has(key), sources: [], depth: 0 });
    if (expanded.has(key)) for (const change of [...artifact.changes].sort((a,b) => compare(a.name,b.name))) {
      const source = "change:" + change.name, changeKey = historyKey(artifact.id, source);
      result.push({ key: changeKey, label: change.name, ariaLabel: change.name,
        count: artifact.elements.filter(e => e.source === source).length,
        open: expanded.has(changeKey), sources: [], depth: 1 });
      if (expanded.has(changeKey)) types(source, change.name + " · ");
    }
  }
  return result;
}
