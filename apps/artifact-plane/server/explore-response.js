// The response view of POST /api/explore (Deferred exploration in
// specifications/units-of-work.md, ES1 to ES3). It omits the unit data that a
// page loads on demand through POST /api/repository/query. It never changes
// the snapshot: the readers and the runtime binding share complete records.
const artifactGraph = () => ({state:'not-loaded', established:{nodes:[], edges:[]}, planning:{nodes:[], edges:[]}});
const implementationGraph = () => ({state:'not-loaded', nodes:[], edges:[], diagnostics:[]});

function unitView(unit, selected) {
  const view = {...unit, artifactGraph:artifactGraph()};
  if (selected) return view;
  view.implementationGraph = implementationGraph();
  if (Array.isArray(unit.members)) view.members = unit.members.map(member => Array.isArray(member.knowledge)
    ? {...member, knowledge:member.knowledge.map(({markdown, ...record}) => record)}
    : member);
  return view;
}

export function exploreResponse(snapshot) {
  const worktrees = (snapshot.workflow?.worktrees || []).map(worktree => Array.isArray(worktree.unitsOfWork)
    ? {...worktree, unitsOfWork:worktree.unitsOfWork.map(unit => unitView(unit, worktree.selected))}
    : worktree);
  const selected = worktrees.find(worktree => worktree.selected);
  const unitsOfWork = selected?.unitsOfWork || (snapshot.unitsOfWork || []).map(unit => unitView(unit, true));
  return {...snapshot, ...(snapshot.workflow ? {workflow:{...snapshot.workflow, worktrees}} : {}), unitsOfWork};
}
