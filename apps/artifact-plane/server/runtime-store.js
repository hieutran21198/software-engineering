import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, openSync, closeSync, realpathSync, existsSync, statSync, readFileSync } from 'node:fs';
import { resolve, dirname, relative, isAbsolute, join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { randomUUID, createHash } from 'node:crypto';
import { exploreRepository } from './reader.js';

export const FRESHNESS_MS = 10 * 60 * 1000;
const terminal = new Set(['done','failed','interrupted','superseded']);
const safeName = v => typeof v === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(v);
const label = v => typeof v === 'string' ? v.replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,160) : null;
const inside = (root,p) => { const r=relative(root,p); return !r || (!r.startsWith('..'+ '/') && r!=='..' && !isAbsolute(r)); };
export const digest = value => createHash('sha256').update(value).digest('hex');
function git(root,args) { return execFileSync('git',['-c','core.fsmonitor=false','-C',root,...args],{encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore'],env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim(); }
function canonical(p) { p=resolve(p); let parent=p; const suffix=[]; while(!existsSync(parent)){suffix.unshift(parent.split('/').at(-1));const next=dirname(parent);if(next===parent)throw Error('Invalid runtime path');parent=next;} return join(realpathSync(parent),...suffix); }
export function repositoryIdentity(root,{allowNested=false}={}) {
 root=realpathSync(root);const top=realpathSync(git(root,['rev-parse','--show-toplevel']));
 if(root!==top&&!allowNested)throw Error('Select a Git worktree root');
 const common=realpathSync(git(root,['rev-parse','--path-format=absolute','--git-common-dir']));
 const roots=git(root,['worktree','list','--porcelain','-z']).split('\0').filter(l=>l.startsWith('worktree ')).map(l=>canonical(l.slice(9)));
 return {root:top,common,roots};
}
function guardDirectory(dir,roots=[]) {
 const p=canonical(dir);if(roots.some(root=>inside(canonical(root),p)))throw Error('Runtime store must be outside repositories and worktrees');
 let parent=p;while(!existsSync(parent))parent=dirname(parent);
 try { const top=git(parent,['rev-parse','--show-toplevel']);if(top&&inside(canonical(top),p))throw Error('Runtime store must be outside repositories and worktrees'); }
 catch(e){if(e.message==='Runtime store must be outside repositories and worktrees')throw e;}
 return p;
}
export function defaultStateDir() { return process.env.ARTIFACT_PLANE_STATE_DIR || join(process.env.XDG_STATE_HOME || join(homedir(),'.local/state'),'artifact-plane'); }
export function taskSignature(task) { return digest(JSON.stringify([task.id,task.path,task.title,task.dependsOn,task.body])); }
function capturedNode(n) {
 if(n.kind==='gate')return {id:n.id,kind:n.kind,artifact:n.artifact,change:n.change,title:n.title,external:n.external,establishmentEvidence:{state:'unknown',reasons:['Recorded context does not verify establishment.'],sources:[]}};
 return {id:n.id,kind:'task',artifact:n.artifact,change:n.change,title:n.title,source:n.source,task:{id:n.task.id,path:n.task.path,title:n.task.title,dependsOn:n.task.dependsOn,checked:n.task.checked,unchecked:n.task.unchecked,signature:taskSignature(n.task)}};
}
export function observedAttempt(attempt,now=Date.now(),connected=true) {
 const baseState=attempt.lastObservedState||attempt.state;
 const stale=['processing','blocked'].includes(baseState)&&(!connected||now-attempt.updatedAt>FRESHNESS_MS);
 return {...attempt,state:stale?'unknown':attempt.state,lastObservedState:baseState,stale:stale||attempt.stale,elapsedMs:Math.max(0,(attempt.endedAt||now)-attempt.startedAt)};
}
export class RuntimeStore {
 constructor({stateDir=defaultStateDir(),roots=[],create=true}={}) {
  this.dir=guardDirectory(stateDir,roots);this.path=join(this.dir,'runtime.sqlite');
  if(!create&&!existsSync(this.path)){this.db=null;return;}
  if(create){
   if(existsSync(this.dir)&& (statSync(this.dir).mode & 0o077))throw Error('Use a private runtime directory (0700)');
   mkdirSync(this.dir,{recursive:true,mode:0o700});
  }
  // Containment must also hold for a pre-existing database symlink.
  if(existsSync(this.path)&&canonical(this.path)!==this.path)throw Error('Runtime database must not be a symlink');
  if(create&&!existsSync(this.path)){try{closeSync(openSync(this.path,'wx',0o600));}catch(error){if(error.code!=='EEXIST')throw error;}}
  if(existsSync(this.path)&& (statSync(this.path).mode & 0o077))throw Error('Runtime database must be private (0600)');
  this.db=new DatabaseSync(this.path,{readOnly:!create});
  // Schema reads can contend with another process recovering the WAL.
  this.db.exec('PRAGMA busy_timeout=2000;');
  const version=Number(this.db.prepare('PRAGMA user_version').get().user_version);
  if(version>1){this.db.close();throw Error('Unsupported newer runtime schema');}
  if(!create&&version!==1){this.db.close();throw Error('Runtime schema unavailable');}
  if(create){
   this.db.exec('PRAGMA journal_mode=WAL;');
   if(!version)this.db.exec(`BEGIN; CREATE TABLE IF NOT EXISTS repositories(id TEXT PRIMARY KEY, common TEXT UNIQUE, root TEXT);
    CREATE TABLE IF NOT EXISTS contexts(id TEXT PRIMARY KEY, repository TEXT, digest TEXT, capturedAt INTEGER, json TEXT);
    CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY, repository TEXT, context TEXT, task TEXT, session TEXT, agent TEXT, json TEXT);
    CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE, attempt TEXT, session TEXT, agent TEXT, kind TEXT, json TEXT);
    PRAGMA user_version=1; COMMIT;`);
   
  }
  for(const row of this.db.prepare('SELECT root,common FROM repositories').all())guardDirectory(this.dir,[row.root,row.common]);
 }
 close(){this.db?.close();}
 sequence(){return this.db?Number(this.db.prepare('SELECT coalesce(max(seq),0) AS n FROM events').get().n):0;}
 repository(root,register=false){
  const identity=repositoryIdentity(root);guardDirectory(this.dir,identity.roots);
  if(!this.db)return null;
  let repo=this.db.prepare('SELECT * FROM repositories WHERE common=?').get(identity.common);
  if(!repo&&register){repo={id:randomUUID(),common:identity.common,root:identity.roots[0]||identity.root};this.db.prepare('INSERT INTO repositories VALUES(?,?,?)').run(repo.id,repo.common,repo.root);}
  return repo;
 }
 async bind({root,unit=null,artifact,change,task,session,agent=''}) {
  if(!safeName(artifact)||!safeName(change)||unit!==null&&!safeName(unit)||!label(session)||typeof agent!=='string')throw Error('Invalid binding identity');
  const snapshot=await exploreRepository(root),worktree=snapshot.workflow.worktrees.find(w=>w.selected);
  let nodes,edges;
  if(unit){const u=worktree.unitsOfWork.find(u=>u.id===unit);if(u?.implementationGraph.state!=='available')throw Error('Unit implementation graph unavailable');({nodes,edges}=u.implementationGraph);}
  else {const c=worktree.changes.find(c=>c.artifact===artifact&&c.name===change);if(c?.taskGraph?.state!=='available')throw Error('Task graph unavailable');
   nodes=c.taskGraph.tasks.map(t=>({id:JSON.stringify([artifact,change,t.path]),kind:'task',artifact,change,title:t.title,source:t.path,task:t}));
   const ids=new Map(nodes.map(n=>[n.task.id,n.id]));edges=c.taskGraph.edges.map(e=>({source:ids.get(e.source),target:ids.get(e.target),kind:'task'}));}
  const selected=nodes.find(n=>n.kind==='task'&&n.artifact===artifact&&n.change===change&&(n.source===task||n.source.endsWith('/tasks/'+task)));
  if(!selected)throw Error('Task is not a listed member');
  const repo=this.repository(root,true),safeNodes=nodes.map(capturedNode);
  const graphDigest=digest(JSON.stringify([unit,safeNodes.map(n=>[n.kind,n.artifact,n.change,n.source,n.task?.signature]),edges.map(e=>[e.source,e.target,e.kind])]));
  let context=this.db.prepare('SELECT json FROM contexts WHERE repository=? AND digest=?').get(repo.id,graphDigest);
  const now=Date.now();context=context?JSON.parse(context.json):{id:randomUUID(),repository:repo.id,unit,root:realpathSync(root),revision:snapshot.repository.head,digest:graphDigest,capturedAt:now,nodes:safeNodes,edges};
  const attempt={id:randomUUID(),repository:repo.id,context:context.id,task:selected.id,session:label(session),agent:label(agent)||'',artifact,change,path:selected.source,signature:taskSignature(selected.task),state:'unknown',startedAt:now,updatedAt:now,endedAt:null,activity:'Bound; waiting for observed activity'};
  this.db.exec('BEGIN IMMEDIATE');try{
   this.db.prepare('INSERT OR IGNORE INTO contexts VALUES(?,?,?,?,?)').run(context.id,repo.id,graphDigest,now,JSON.stringify(context));
   for(const row of this.db.prepare('SELECT json FROM attempts WHERE session=? AND agent=?').all(attempt.session,attempt.agent)){
    const old=JSON.parse(row.json);if(!old.endedAt){old.state='superseded';old.endedAt=now;this.saveAttempt(old);}}
   this.db.prepare('INSERT INTO attempts VALUES(?,?,?,?,?,?,?)').run(attempt.id,repo.id,context.id,attempt.task,attempt.session,attempt.agent,JSON.stringify(attempt));
   this.insertEvent({id:randomUUID(),attempt:attempt.id,session:attempt.session,agent:attempt.agent,kind:'bind',observedAt:now});
   this.db.exec('COMMIT');
  }catch(e){this.db.exec('ROLLBACK');throw e;}
  return {repository:repo.id,context:context.id,attempt:attempt.id};
 }
 saveAttempt(a){this.db.prepare('UPDATE attempts SET json=? WHERE id=?').run(JSON.stringify(a),a.id);}
 insertEvent(e){return this.db.prepare('INSERT OR IGNORE INTO events(id,attempt,session,agent,kind,json) VALUES(?,?,?,?,?,?)').run(e.id,e.attempt||null,e.session,e.agent||'',e.kind,JSON.stringify(e));}
 observe(input){
  if(!label(input.session_id)||!label(input.hook_event_name))throw Error('Invalid lifecycle event');
  const e={id:label(input.event_id)||randomUUID(),session:label(input.session_id),agent:label(input.agent_id)||'',kind:label(input.hook_event_name),turn:label(input.turn_id),tool:label(input.tool_name),model:label(input.model),agentType:label(input.agent_type),observedAt:Date.now()};
  if(['SubagentStart','SubagentStop'].includes(e.kind)&&!e.agent)throw Error('Subagent ID required');
  const supported=new Set(['SessionStart','UserPromptSubmit','PreToolUse','PostToolUse','PermissionRequest','Stop','Interrupt','SessionEnd','SubagentStart','SubagentStop']);
  if(!supported.has(e.kind))throw Error('Unsupported lifecycle event');
  this.db.exec('BEGIN IMMEDIATE');try{
   const row=this.db.prepare('SELECT json FROM attempts WHERE session=? AND agent=? ORDER BY rowid DESC LIMIT 1').get(e.session,e.agent);
   const a=row?JSON.parse(row.json):null;e.attempt=a?.id||null;
   if(Number(this.insertEvent(e).changes)&&a&&!terminal.has(a.state)){
    const matching=!a.turn||e.turn===a.turn;
    if(e.kind==='UserPromptSubmit'){a.turn=e.turn;a.state=e.turn?'processing':'unknown';a.endedAt=null;}
    else if(['PreToolUse','PostToolUse'].includes(e.kind)){if(!a.turn&&e.turn)a.turn=e.turn;if(!e.turn||e.turn!==a.turn)a.state='unknown';else {a.state='processing';a.endedAt=null;}}
    else if(e.kind==='PermissionRequest'&&matching)a.state=e.turn?'blocked':'unknown';
    else if(['Stop','SubagentStop'].includes(e.kind)&&matching){a.state=e.turn?'validating':'unknown';a.endedAt=e.observedAt;}
    else if(e.kind==='Interrupt'&&matching){a.state=e.turn?'interrupted':'unknown';a.endedAt=e.observedAt;}
    else if(e.kind==='SessionEnd'){if(a.state!=='validating')a.state='unknown';a.endedAt=e.observedAt;}
    if(matching||['UserPromptSubmit','SessionEnd'].includes(e.kind)){a.updatedAt=e.observedAt;a.activity=e.tool?e.kind+': '+e.tool:e.kind;a.model=e.model||a.model;this.saveAttempt(a);}
   }
   this.db.exec('DELETE FROM events WHERE attempt IS NULL AND seq NOT IN (SELECT seq FROM events WHERE attempt IS NULL ORDER BY seq DESC LIMIT 10000)');
   this.db.exec('COMMIT');return e;
  }catch(err){this.db.exec('ROLLBACK');throw err;}
 }
 report({attempt,state,method,source,root,reason}){
  if(!['validated','failed','blocked','execution-returned'].includes(state))throw Error('Unsupported report');
  const row=this.db.prepare('SELECT json FROM attempts WHERE id=?').get(attempt);if(!row)throw Error('Unknown attempt');const a=JSON.parse(row.json);
  if(state==='validated'){
   if(!label(method)||typeof source!=='string'||!source.endsWith('.md')&&!source.includes('.md#'))throw Error('Validation method and Markdown evidence required');
   const repo=this.repository(root);if(repo?.id!==a.repository)throw Error('Evidence repository mismatch');
   const [file,fragment]=source.split('#');if(isAbsolute(file)||file.includes('\\')||file.split('/').some(p=>!p||p==='..'||p==='.'))throw Error('Unsafe evidence path');
   const target=realpathSync(join(root,file));if(!inside(realpathSync(root),target))throw Error('Evidence outside repository');
   const content=readFileSync(target,'utf8');let detail=content.replace(/^---\n[\s\S]*?\n---\n/,'');
   if(fragment){const lines=detail.split('\n');const i=lines.findIndex(l=>/^#+ /.test(l)&&l.replace(/^#+ /,'').toLowerCase().replace(/[^a-z0-9 -]/g,'').replace(/ /g,'-')===fragment);if(i<0)throw Error('Evidence heading missing');detail=lines.slice(i+1).join('\n').split(/\n#+ /)[0];}
   if(!detail.replace(/^#+ .*$/gm,'').trim())throw Error('Evidence details missing');a.validation={method:label(method),source,reported:true};
  }
  const now=Date.now();a.state={validated:'done',failed:'failed',blocked:'blocked','execution-returned':'validating'}[state];a.updatedAt=now;a.activity=label(reason)||'Explicit '+state+' report';if(state!=='blocked')a.endedAt=now;
  this.db.exec('BEGIN IMMEDIATE');try{this.saveAttempt(a);this.insertEvent({id:randomUUID(),attempt:a.id,session:a.session,agent:a.agent,kind:'report:'+state,observedAt:now});this.db.exec('COMMIT');}catch(e){this.db.exec('ROLLBACK');throw e;}return a;
 }
 query(root,{now=Date.now()}={}){
  const repo=this.repository(root);if(!repo)return {repository:null,contexts:[],attempts:[],events:[],sequence:this.sequence()};
  const contexts=this.db.prepare('SELECT json FROM contexts WHERE repository=? ORDER BY capturedAt DESC').all(repo.id).map(r=>{const c=JSON.parse(r.json);return {...c,sourceMissing:!existsSync(c.root)};});
  const attempts=this.db.prepare('SELECT json FROM attempts WHERE repository=?').all(repo.id).map(r=>observedAttempt(JSON.parse(r.json),now));
  const events=this.db.prepare('SELECT seq,json FROM events WHERE attempt IN (SELECT id FROM attempts WHERE repository=?) ORDER BY seq DESC LIMIT 1000').all(repo.id).reverse().map(r=>({...JSON.parse(r.json),sequence:Number(r.seq)}));
  return {repository:repo.id,contexts,attempts,events,sequence:this.sequence()};
 }
}
