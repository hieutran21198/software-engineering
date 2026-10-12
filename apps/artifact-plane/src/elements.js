const TYPES = [
  ["requirements", "Requirements"],
  ["specifications", "Specifications"],
  ["decisions", "Decisions"],
  ["tasks", "Tasks"],
];
const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const compare = (a, b) => natural.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
export const typeKey = (artifact, type) => JSON.stringify([artifact, type]);
export const elementType = (element) => element.path.split("/")[0];

// One ordering rule supplies the API, canvas, and inspector.
export function elementGroups(artifact) {
  const rank = (source) =>
    source === `version:${artifact.currentVersion}`
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
        label: source.startsWith("version:")
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
