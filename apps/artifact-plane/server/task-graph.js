import { parseDocument } from 'yaml';

const taskId = value => typeof value === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(value);
const taskPath = value => typeof value === 'string' && value.endsWith('.md') && !value.includes('\\') && !value.includes('\0') && !value.startsWith('/') && !/^[A-Za-z]:/.test(value) && value.split('/').every(part => part && part !== '.' && part !== '..') && value !== 'README.md';
function metadata(markdown) {
  if (!/^---\r?\n/.test(markdown)) return { value: {} };
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { error: true };
  try {
    const document = parseDocument(match[1]);
    const value = document.toJS() ?? {};
    if (document.errors.length || !value || typeof value !== 'object' || Array.isArray(value)) return { error: true };
    return { value };
  } catch { return { error: true }; }
}
// Consume scanner records only: this module never reads files or Git.
export function buildTaskGraph(files, prefix, checklist, unsafePaths = new Set()) {
  const graph = { state: 'available', tasks: [], edges: [], diagnostics: [] };
  const report = (code, path, message) => graph.diagnostics.push({ code, path, message });
  const planPath = `${prefix}tasks/README.md`;
  if (unsafePaths.has(planPath)) report('malformed-plan', planPath, 'Plan path leaves the task directory.');
  const plan = metadata(files.get(planPath) || '');
  if (plan.error) report('malformed-plan', planPath, 'Plan front matter must be a valid YAML mapping without duplicate keys.');
  if (graph.diagnostics.length) return { ...graph, state: 'invalid' };
  if (!Object.hasOwn(plan.value, 'tasks')) return { ...graph, state: 'unavailable' };
  if (!Array.isArray(plan.value.tasks)) {
    report('malformed-plan', planPath, 'Plan tasks must be a list of task paths.');
    return { ...graph, state: 'invalid' };
  }
  const paths = new Set(), ids = new Map();
  for (const path of plan.value.tasks) {
    if (!taskPath(path) || paths.has(path)) { report('malformed-plan', planPath, 'Task paths must be unique, safe Markdown paths relative to tasks/.'); continue; }
    paths.add(path);
    const fullPath = `${prefix}tasks/${path}`;
    if (unsafePaths.has(fullPath)) { report('malformed-plan', fullPath, 'Task path leaves the task directory.'); continue; }
    const markdown = files.get(fullPath);
    if (markdown === undefined) { report('missing-task', fullPath, 'Listed task is missing or unreadable.'); continue; }
    const parsed = metadata(markdown), value = parsed.value;
    const valid = !parsed.error && taskId(value.id) && Array.isArray(value.depends_on) && value.depends_on.every(taskId);
    const record = { id: valid ? value.id : null, path: fullPath, title: markdown.match(/^#\s+(.+)$/m)?.[1] || path, dependsOn: valid ? value.depends_on : [], body: markdown, ...checklist(markdown) };
    graph.tasks.push(record);
    if (!valid) { report('malformed-task', fullPath, 'Task front matter requires a valid id and depends_on list without duplicate YAML keys.'); continue; }
    if (ids.has(record.id)) report('duplicate-task-id', fullPath, `Task ID ${record.id} is not unique.`);
    else ids.set(record.id, record);
  }
  const edges = [];
  for (const task of graph.tasks.filter(task => task.id !== null)) {
    const prerequisites = new Set();
    for (const id of task.dependsOn) {
      if (prerequisites.has(id)) report('duplicate-prerequisite', task.path, `Prerequisite ${id} is repeated.`);
      prerequisites.add(id);
      if (id === task.id) report('self-dependency', task.path, `Task ${id} depends on itself.`);
      if (!ids.has(id)) report('unknown-prerequisite', task.path, `Prerequisite ${id} is not a listed task.`);
      else edges.push({ source: id, target: task.id });
    }
  }
  const visiting = new Set(), visited = new Set();
  function cycle(id) {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const prerequisite of ids.get(id).dependsOn) if (ids.has(prerequisite) && cycle(prerequisite)) return true;
    visiting.delete(id); visited.add(id); return false;
  }
  if ([...ids.keys()].some(cycle)) report('task-cycle', planPath, 'Task prerequisites contain a cycle.');
  if (graph.diagnostics.length) graph.state = 'invalid';
  else graph.edges = edges;
  return graph;
}
