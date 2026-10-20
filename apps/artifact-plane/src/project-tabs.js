export const storageKey='artifact-plane.project-tabs.v1';
const absolute=p=>typeof p==='string'&&p.startsWith('/')&&!p.includes('\0');
export function readWorkspace(storage){try{const raw=storage.getItem(storageKey);if(!raw)return {projects:[],activeProject:null};const data=JSON.parse(raw);if(data?.version!==1||!Array.isArray(data.projects))throw Error('Invalid workspace');const projects=[...new Set(data.projects.filter(absolute))];return {projects,activeProject:projects.includes(data.activeProject)?data.activeProject:null};}catch{return {projects:[],activeProject:null,warning:'Project tabs could not be restored. You can still open projects.'};}}
// The `repository` address parameter selects the restored tab with that path, or adds one after the restored tabs.
export function addressWorkspace({projects,activeProject},repository){if(!absolute(repository))return {projects,activeProject};return {projects:projects.includes(repository)?projects:[...projects,repository],activeProject:repository};}
export function writeWorkspace(storage,tabs,activeId){const projects=[...new Set(tabs.map(t=>t.path).filter(absolute))],activeProject=tabs.find(t=>t.id===activeId)?.path||null;try{storage.setItem(storageKey,JSON.stringify({version:1,projects,activeProject}));return '';}catch{return 'Project tabs could not be saved. You can continue exploring in this session.';}}
export function closeTab(tabs,activeId,id,empty){const index=tabs.findIndex(t=>t.id===id),remaining=tabs.filter(t=>t.id!==id);if(!remaining.length)return {tabs:[empty],activeId:empty.id};return {tabs:remaining,activeId:activeId===id?remaining[Math.min(index,remaining.length-1)].id:activeId};}

export function projectLabels(tabs){
 const basename=path=>path?.split('/').filter(Boolean).at(-1)||'New project';
 return tabs.map(tab=>{
  const name=basename(tab.path),others=tabs.filter(t=>t.id!==tab.id&&t.path&&basename(t.path)===name);
  if(!tab.path||!others.length)return name;
  const parts=tab.path.split('/').filter(Boolean).slice(0,-1);
  for(let depth=1;depth<=parts.length;depth++){
   const suffix=parts.slice(-depth).join('/');
   if(others.every(t=>t.path.split('/').filter(Boolean).slice(0,-1).slice(-depth).join('/')!==suffix))return `${name} · ${suffix}`;
  }
  return `${name} · ${tab.path}`;
 });
}
