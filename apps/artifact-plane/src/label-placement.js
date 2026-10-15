const overlaps=(a,b,gap=10)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
// Deterministic nearby lanes, followed by guaranteed clear space above the graph.
export function placeLabels(labels,nodes){
 const occupied=[...nodes],result=[];
 for(const label of labels){
  const base={...label,x:label.x-label.width/2,y:label.y-label.height/2};let chosen;
  const stepX=label.width+24,stepY=label.height+20;
  for(let ring=0;ring<9&&!chosen;ring++)for(let dy=-ring;dy<=ring&&!chosen;dy++)for(let dx=-ring;dx<=ring&&!chosen;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==ring)continue;
   const candidate={...base,x:base.x+dx*stepX,y:base.y+dy*stepY};if(!occupied.some(r=>overlaps(candidate,r)))chosen=candidate;
  }
  if(!chosen)chosen={...base,y:Math.min(0,...occupied.map(r=>r.y))-label.height-24};
  result.push(chosen);occupied.push(chosen);
 }
 return result;
}
