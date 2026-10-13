// Sequence edges describe reading order, never completion or dependencies.
export const workflowHistoryKey = path => JSON.stringify([path, 'histories']);
export const workflowChangeKey = (path, change) => JSON.stringify([path, change.artifact, change.name]);
export function orderedHistories(changes) {
  return changes.filter(change => change.history).sort((a, b) =>
    (b.lastCommitAt ?? -1) - (a.lastCommitAt ?? -1)
    || a.artifact.localeCompare(b.artifact)
    || a.name.localeCompare(b.name, 'en', {numeric:true}));
}
export function workflowGraph(workflow, selection, expanded = new Set()) {
  const nodes = [], edges = [];
  let y = 0;
  for (const worktree of workflow?.worktrees || []) {
    const id = JSON.stringify([worktree.path]);
    const parent = {id, type:'worktree', position:{x:0,y}, style:{width:1018,height:200}, selected:id===selection, data:{worktree}};
    nodes.push(parent);
    let offset = 120;
    function changeRow(change, historical = false) {
      const row = workflowChangeKey(worktree.path,change), open = !historical || expanded.has(row);
      nodes.push({id:row,type:'change',parentId:id,extent:'parent',position:{x:20,y:offset},style:{width:978,height:40},selected:row===selection,data:{worktree,change,historical,open,key:row}});
      offset += 52;
      if (!open) return;
      change.steps.forEach((step,i)=>{
        const phase = JSON.stringify([worktree.path,change.artifact,change.name,step.name]);
        nodes.push({id:phase,type:'phase',parentId:id,extent:'parent',position:{x:20+i*166,y:offset},style:{width:148,height:92},selected:phase===selection,data:{worktree,change,step}});
        if(i) edges.push({id:phase+'-sequence',source:JSON.stringify([worktree.path,change.artifact,change.name,change.steps[i-1].name]),target:phase,type:'straight',style:{stroke:'#687894'}});
      });
      offset += 124;
    }
    worktree.changes.filter(change=>!change.history).forEach(change=>changeRow(change));
    const histories = orderedHistories(worktree.changes);
    if (histories.length) {
      const key=workflowHistoryKey(worktree.path), open=expanded.has(key);
      nodes.push({id:key,type:'histories',parentId:id,extent:'parent',position:{x:20,y:offset},style:{width:978,height:36},data:{worktree,key,open,count:histories.length}});
      offset += 48;
      if(open) histories.forEach(change=>changeRow(change,true));
    }
    parent.style.height = Math.max(200,offset+24);
    y += parent.style.height+48;
  }
  return {nodes,edges};
}
// Inspector selection survives collapse because it resolves against the source payload.
export function workflowSelection(workflow,id) {
  if(!id) return null;
  let key;
  try {key=JSON.parse(id);} catch {return null;}
  if(!Array.isArray(key)) return null;
  const worktree=workflow?.worktrees.find(w=>w.path===key[0]);
  if(!worktree) return null;
  if(key.length===1) return {type:'worktree',data:{worktree}};
  const change=worktree.changes.find(c=>c.artifact===key[1] && c.name===key[2]);
  if(!change) return null;
  if(key.length===3) return {type:'change',data:{worktree,change}};
  const step=change.steps.find(s=>s.name===key[3]);
  return step ? {type:'phase',data:{worktree,change,step}} : null;
}
