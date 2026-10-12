// Sequence edges describe reading order, never completion or dependencies.
export function workflowGraph(workflow, selection) {
  const nodes = [], edges = [];
  let y = 0;
  for (const worktree of workflow?.worktrees || []) {
    const id = JSON.stringify([worktree.path]);
    const height = worktree.changes.length ? 128 + worktree.changes.length * 176 : 200;
    nodes.push({id, type:'worktree', position:{x:0,y}, style:{width:1204,height}, selected:id===selection, data:{worktree}});
    worktree.changes.forEach((change,index)=>{
      const row = JSON.stringify([worktree.path,change.artifact,change.name]);
      nodes.push({id:row,type:'change',parentId:id,extent:'parent',position:{x:20,y:120+index*176},style:{width:1164,height:40},selected:row===selection,data:{worktree,change}});
      change.steps.forEach((step,i)=>{
        const phase = JSON.stringify([worktree.path,change.artifact,change.name,step.name]);
        nodes.push({id:phase,type:'phase',parentId:id,extent:'parent',position:{x:20+i*166,y:172+index*176},style:{width:148,height:92},selected:phase===selection,data:{worktree,change,step}});
        if(i) edges.push({id:phase+'-sequence',source:JSON.stringify([worktree.path,change.artifact,change.name,change.steps[i-1].name]),target:phase,type:'straight',style:{stroke:'#687894'}});
      });
    });
    y += height+48;
  }
  return {nodes,edges};
}
export function workflowSelection(workflow,id) {
  return id ? workflowGraph(workflow,id).nodes.find(node=>node.id===id) : null;
}
