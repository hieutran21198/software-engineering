// This allowlist is navigation metadata, never authority to read a filesystem path.
export function knowledgeTargets(snapshot,unit){
 const targets=new Map();
 for(const artifact of snapshot?.artifacts||[]){
  const scope={artifact:artifact.id};
  const add=(source,extra={})=>targets.set(source,{source,scope:{...scope,...extra},title:source.split('/').at(-1),parent:'artifact'});
  add(`docs/artifacts/${artifact.id}/README.md`);
  if(artifact.currentVersion)add(`docs/artifacts/${artifact.id}/versions/${artifact.currentVersion}/README.md`);
  if(artifact.proposedVersion)add(`docs/artifacts/${artifact.id}/versions/${artifact.proposedVersion}/README.md`);
  for(const change of artifact.changes||[])add(`docs/artifacts/${artifact.id}/changes/${change.name}/README.md`,{change:change.name});
  for(const element of artifact.elements||[])add(element.file,element.source.startsWith('change:')?{change:element.source.slice(7)}:{});
 }
 if(unit){
  const add=source=>targets.set(source,{source,scope:{unit:unit.unit.id},parent:'unit'});
  add(unit.unit.path);for(const evidence of unit.unit.evidence||[])add(evidence.source.split('#')[0]);
  for(const member of unit.unit.members||[])for(const record of member.knowledge||[])if(record.file||record.path)add(record.file||record.path);
 }
 return targets;
}
export function resolveKnowledgeLink(source,href,targets=new Map()){
 const unavailable=reason=>({kind:'unavailable',reason,destination:String(href||'')});
 if(typeof href!=='string'||!href||typeof source!=='string')return unavailable('No source context is available.');
 let decoded;try{decoded=decodeURIComponent(href);}catch{return unavailable('The destination has invalid encoding.');}
 if(/[\u0000-\u001f\\]/.test(decoded)||decoded.startsWith('/')||/^[a-z][a-z0-9+.-]*:/i.test(decoded)||decoded.includes('?'))return unavailable('External or unsafe destinations cannot be opened here.');
 const [path,fragment,...rest]=decoded.split('#');if(rest.length)return unavailable('The destination has an invalid fragment.');
 const segments=source.split('/').slice(0,-1);
 if(path)for(const part of path.split('/')){if(!part||part==='.')continue;if(part==='..'){if(!segments.length)return unavailable('The destination leaves this repository.');segments.pop();}else segments.push(part);}
 const destination=path?segments.join('/'):source;
 if(segments.some(p=>p==='.git'||p==='.env'||/^(credentials|secrets?|tokens?)(\.|$)/i.test(p)))return unavailable('This source is not permitted.');
 if(!path&&fragment)return {kind:'heading',fragment,destination:source};
 const target=targets.get(destination);if(!target)return unavailable('The destination is not available in the selected knowledge context.');
 return {kind:'source',...target,fragment};
}
