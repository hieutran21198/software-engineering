// Reduce only task prerequisites. Establishment gates retain their own semantics.
export function prerequisiteView(edges, showAll = false) {
 if(showAll)return edges;
 const tasks=edges.filter(e=>!e.kind||e.kind==='task'),next=new Map();
 for(const e of tasks){if(!next.has(e.source))next.set(e.source,[]);next.get(e.source).push(e);}
 const visiting=new Set(),seen=new Set();
 function cyclic(id){if(visiting.has(id))return true;if(seen.has(id))return false;visiting.add(id);for(const e of next.get(id)||[])if(cyclic(e.target))return true;visiting.delete(id);seen.add(id);return false;}
 if([...next.keys()].some(cyclic))return edges;
 return edges.filter(edge=>{
  if(edge.kind&&edge.kind!=='task')return true;
  const visited=new Set(),queue=[edge.source];
  while(queue.length){const id=queue.pop();if(visited.has(id))continue;visited.add(id);for(const e of next.get(id)||[]){if(e===edge)continue;if(e.target===edge.target)return false;queue.push(e.target);}}
  return true;
 });
}
