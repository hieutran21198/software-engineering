// Derived relations for change impact: imports with named symbols and the top-level
// declarations they reach, Go packages and go:embed targets, identical-content mirrors,
// co-change history and source vocabulary. Kept in impact-index.sqlite beside the flow
// index; disposable, incremental by file identity, never an authority.
import {DatabaseSync} from 'node:sqlite';
import {existsSync,statSync,openSync,closeSync,readFileSync} from 'node:fs';
import {join,dirname,resolve,relative,posix} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import {guardFlowDirectory} from './flow-index.js';
import {defaultStateDir} from './runtime-store.js';
import {gitSlot} from './git-process.js';

const execute=promisify(execFile);
const digest=value=>createHash('sha256').update(value).digest('hex');
const EMPTY_BLOB=/^e69de29bb2d1d6434b8b29ae775ad8c2e48c5391$|^473a0f4c3be8a93681a267e3b1e9a7dcda1185436fe141f7749120a303721813$/;
export const HISTORY_COMMITS=500,HISTORY_BULK=60,VOCABULARY_SHARE=0.12,VOCABULARY_MIN=3;
export const isSourceFile=path=>/\.(m?js|jsx|go)$/.test(path);
export const isTestFile=path=>/(?:^|\/)test\/|\.test\.[cm]?jsx?$|\.spec\.[cm]?jsx?$|_test\.go$/.test(path);
const JsxParser=acorn.Parser.extend(jsx());
const STOP=new Set(['const','return','function','import','export','await','async','this','that','with','from','null','true','false','undefined','string','number','object','array','length','value','values','push','filter','some','every','find','includes','slice','split','join','trim','entries','keys','assert','equal','test','describe','error','message','result','data','path','file','files','name','text','type','kind','source','target','root','repository','artifact','artifacts','knowledge','change','changes','version','versions','element','elements','flow','flows','step','steps','which','when','their','these','those','other','must','should','will','each','only','then','than','into','also','does','have','been','after','before','without','within','between','because','where','while','about','there','under','over','such','same','more','most','less','least','both','either','every','another','first','second','last','next','previous','package','func','range','make','case','default','break','continue','switch','interface','struct','chan','defer','type','var','nil','err']);

export async function git(root,args,raw=false){
  const release=await gitSlot();
  try{const {stdout}=await execute('git',['-c','core.fsmonitor=false','-c','core.untrackedCache=false','-C',root,...args],{encoding:raw==='bytes'?'buffer':'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},timeout:30000,maxBuffer:64*1024*1024});return raw?stdout:stdout.trim();}
  finally{release();}
}
// Identifier references inside a node, excluding property keys and member names.
function mentions(node){
  const names=new Set();
  const visit=(n,parent,key)=>{
    if(!n||typeof n!=='object')return;
    if(Array.isArray(n)){for(const item of n)visit(item,parent,key);return;}
    if(typeof n.type!=='string'){for(const k of Object.keys(n))visit(n[k],parent,k);return;}
    if(n.type==='Identifier'){
      if(parent?.type==='MemberExpression'&&key==='property'&&!parent.computed)return;
      if(parent?.type==='Property'&&key==='key'&&!parent.computed&&!parent.shorthand)return;
      if((parent?.type==='MethodDefinition'||parent?.type==='PropertyDefinition')&&key==='key'&&!parent.computed)return;
      if(parent?.type==='LabeledStatement'||parent?.type==='BreakStatement'||parent?.type==='ContinueStatement')return;
      if(parent?.type==='ImportSpecifier'||parent?.type==='ExportSpecifier')return;
      names.add(n.name);return;}
    if(n.type==='JSXIdentifier'){if(key==='name'&&parent?.type==='JSXAttribute')return;names.add(n.name);return;}
    for(const k of Object.keys(n)){if(k==='type'||k==='loc'||k==='start'||k==='end'||k==='range')continue;visit(n[k],n,k);}
  };
  visit(node,null,null);return [...names];
}
function patternNames(id,out=[]){
  if(!id)return out;
  if(id.type==='Identifier')out.push(id.name);
  else if(id.type==='ObjectPattern')for(const p of id.properties)patternNames(p.type==='RestElement'?p.argument:p.value,out);
  else if(id.type==='ArrayPattern')for(const e of id.elements)patternNames(e&&e.type==='RestElement'?e.argument:e,out);
  else if(id.type==='AssignmentPattern')patternNames(id.left,out);
  else if(id.type==='RestElement')patternNames(id.argument,out);
  return out;
}
const specName=n=>n.type==='Identifier'?n.name:String(n.value);
// Parse one module: import edges, top-level declarations with mentions, diagnostics.
export function parseModule(text,path=''){
  let ast;
  const options={ecmaVersion:'latest',sourceType:'module',allowHashBang:true,locations:true};
  try{ast=(path.endsWith('.jsx')?JsxParser:acorn.Parser).parse(text,options);}
  catch(first){try{ast=JsxParser.parse(text,options);}catch{return {imports:fallbackImports(text),declarations:[],failed:String(first.message).slice(0,160)};}}
  const imports=[],declarations=[];
  const add=(name,node,exported,exportNames=[],mention=node)=>declarations.push({name,exported,exportNames,mentions:mentions(mention),start:node.loc.start.line,end:node.loc.end.line});
  for(const node of ast.body){
    if(node.type==='ImportDeclaration'){
      const names=node.specifiers.map(s=>s.type==='ImportDefaultSpecifier'?{imported:'default',local:s.local.name}:s.type==='ImportNamespaceSpecifier'?{imported:'*',local:s.local.name}:{imported:specName(s.imported),local:s.local.name});
      imports.push({spec:node.source.value,names:names.length?names:[{imported:'*',local:'*'}],dynamic:false});continue;}
    if(node.type==='ExportAllDeclaration'){imports.push({spec:node.source.value,names:[{imported:'*',local:'*'}],dynamic:false});add('(export all)',node,true,[],node);declarations.at(-1).mentions=['*'];continue;}
    if(node.type==='ExportNamedDeclaration'&&!node.declaration){
      const exportNames=node.specifiers.map(s=>({local:node.source?`(re-export:${specName(s.exported)})`:specName(s.local),exported:specName(s.exported)}));
      if(node.source)imports.push({spec:node.source.value,names:node.specifiers.map(s=>({imported:specName(s.local),local:`(re-export:${specName(s.exported)})`})),dynamic:false});
      declarations.push({name:'(export list)',exported:true,exportNames,mentions:exportNames.map(x=>x.local),start:node.loc.start.line,end:node.loc.end.line});continue;}
    if(node.type==='ExportDefaultDeclaration'){
      const d=node.declaration;const name=d.id?.name||'(default export)';
      declarations.push({name,exported:true,exportNames:[{local:name,exported:'default'}],mentions:mentions(d),start:node.loc.start.line,end:node.loc.end.line});continue;}
    const exported=node.type==='ExportNamedDeclaration';const decl=exported?node.declaration:node;
    if(decl.type==='FunctionDeclaration'||decl.type==='ClassDeclaration'){add(decl.id.name,node,exported,[],decl);continue;}
    if(decl.type==='VariableDeclaration'){for(const d of decl.declarations)for(const name of patternNames(d.id))declarations.push({name,exported,exportNames:[],mentions:mentions(d),start:node.loc.start.line,end:node.loc.end.line});continue;}
    declarations.push({name:'(statement)',exported:false,exportNames:[],mentions:mentions(node),start:node.loc.start.line,end:node.loc.end.line});
  }
  // Dynamic imports and require calls anywhere in the module.
  const visit=n=>{if(!n||typeof n!=='object')return;if(Array.isArray(n)){n.forEach(visit);return;}
    if(n.type==='ImportExpression'&&n.source?.type==='Literal')imports.push({spec:String(n.source.value),names:[{imported:'*',local:'*'}],dynamic:true});
    if(n.type==='CallExpression'&&n.callee?.type==='Identifier'&&n.callee.name==='require'&&n.arguments[0]?.type==='Literal')imports.push({spec:String(n.arguments[0].value),names:[{imported:'*',local:'*'}],dynamic:true});
    for(const k of Object.keys(n))if(k!=='loc')visit(n[k]);};
  visit(ast.body);
  return {imports,declarations,failed:null};
}
function fallbackImports(text){
  const out=[];for(const m of text.matchAll(/(?:import|export)\s+[^'";]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\s*\(\s*['"]([^'"]+)['"]\s*\)/g))out.push({spec:m[1]||m[2]||m[3],names:[{imported:'*',local:'*'}],dynamic:!m[1]});return out;
}
export function vocabulary(text){const ids=new Set();for(const m of text.matchAll(/\b[A-Za-z_][A-Za-z0-9_]{3,}\b/g)){if(!STOP.has(m[0].toLowerCase()))ids.add(m[0]);}return [...ids];}
function globToRegExp(pattern){return new RegExp('^'+pattern.split('/').map(part=>part.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/\*\*/g,'.*').replace(/\*/g,'[^/]*').replace(/\?/g,'[^/]')).join('/')+'(?:/.*)?$');}
function splitJsonObjects(text){const out=[];let depth=0,start=-1,inString=false,escape=false;for(let i=0;i<text.length;i++){const c=text[i];if(inString){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')inString=false;continue;}if(c==='"'){inString=true;continue;}if(c==='{'){if(depth===0)start=i;depth++;}else if(c==='}'){depth--;if(depth===0&&start>=0){out.push(JSON.parse(text.slice(start,i+1)));start=-1;}}}return out;}

export function createImpactIndex({stateDir=defaultStateDir(),roots=[],goCommand='go'}={}){
  const dir=guardFlowDirectory(stateDir,roots),path=join(dir,'impact-index.sqlite');
  if(existsSync(path)&&(statSync(path).mode&0o077))throw Error('Impact database must be private');
  if(!existsSync(path)){try{closeSync(openSync(path,'wx',0o600));}catch(e){if(e.code!=='EEXIST')throw e;}}
  const db=new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=10000; PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS contexts(id TEXT PRIMARY KEY,repository TEXT,worktree TEXT,head TEXT,generation INTEGER,go_available INTEGER,history_head TEXT,built_at TEXT);
  CREATE TABLE IF NOT EXISTS files(context TEXT,path TEXT,identity TEXT,kind TEXT,PRIMARY KEY(context,path));
  CREATE TABLE IF NOT EXISTS imports(context TEXT,from_path TEXT,to_path TEXT,names TEXT,locals TEXT,dynamic INTEGER);
  CREATE INDEX IF NOT EXISTS imports_to ON imports(context,to_path);
  CREATE TABLE IF NOT EXISTS declarations(context TEXT,file TEXT,name TEXT,exported INTEGER,export_names TEXT,mentions TEXT,start INTEGER,end INTEGER);
  CREATE INDEX IF NOT EXISTS declarations_file ON declarations(context,file);
  CREATE TABLE IF NOT EXISTS packages(context TEXT,dir TEXT,imports TEXT,PRIMARY KEY(context,dir));
  CREATE TABLE IF NOT EXISTS embeds(context TEXT,file TEXT,pattern TEXT,target TEXT);
  CREATE TABLE IF NOT EXISTS mirrors(context TEXT,hash TEXT,path TEXT,PRIMARY KEY(context,path));
  CREATE TABLE IF NOT EXISTS history(context TEXT,a TEXT,b TEXT,support INTEGER,total INTEGER,PRIMARY KEY(context,a,b));
  CREATE TABLE IF NOT EXISTS vocabulary(context TEXT,file TEXT,raw TEXT,identifiers TEXT,PRIMARY KEY(context,file));
  CREATE TABLE IF NOT EXISTS diagnostics(context TEXT,path TEXT,code TEXT,message TEXT);`);
  let goAvailable=null,closed=false,serial=Promise.resolve();
  const contextId=(repository,worktree)=>digest(JSON.stringify([repository,worktree]));
  async function goCheck(){if(goAvailable===null){try{await execute(goCommand,['version'],{timeout:10000});goAvailable=true;}catch{goAvailable=false;}}return goAvailable;}
  const seen=new Map();
  async function identities(worktree,knownStatus){
    const map=new Map();
    for(const row of (await git(worktree,['ls-files','-s','-z'],true)).split('\0').filter(Boolean)){const tab=row.indexOf('\t');const [mode,oid,stage]=row.slice(0,tab).split(' ');if(stage!=='0')continue;map.set(row.slice(tab+1),{identity:oid,oid,mode});}
    const status=knownStatus??await git(worktree,['status','--porcelain=v1','-z','--untracked-files=no'],true);
    const entries=status.split('\0').filter(Boolean);
    for(let i=0;i<entries.length;i++){const entry=entries[i];const code=entry.slice(0,2),file=entry.slice(3);if(code[0]==='R'||code[0]==='C')i++;
      if(code.includes('D')){map.delete(file);continue;}
      if(map.has(file)){try{const bytes=readFileSync(resolve(worktree,file));map.set(file,{identity:'dirty:'+digest(bytes),oid:map.get(file).oid,mode:map.get(file).mode});}catch{map.delete(file);}}}
    return map;
  }
  function resolveSpec(tracked,from,spec){if(!spec.startsWith('.'))return null;const base=posix.normalize(posix.join(posix.dirname(from),spec));for(const ext of ['','.js','.jsx','.mjs','/index.js','/index.jsx'])if(tracked.has(base+ext))return base+ext;return null;}
  async function goPackages(worktree,tracked){
    const result={packages:[],embeds:[]};
    if(!await goCheck())return null;
    let listed;try{listed=(await execute(goCommand,['list','-json','./...'],{cwd:worktree,timeout:60000,maxBuffer:64*1024*1024,env:{...process.env,GOFLAGS:'-mod=mod'}})).stdout;}catch{return result;}
    const pkgs=splitJsonObjects(listed).filter(p=>p.Dir);const byPath=new Map(pkgs.map(p=>[p.ImportPath,p]));
    for(const p of pkgs){const dir=relative(worktree,p.Dir).split('\\').join('/')||'.';
      const imports=[];for(const dep of [...new Set([...(p.Imports||[]),...(p.TestImports||[]),...(p.XTestImports||[])])])if(byPath.has(dep)){const target=byPath.get(dep);imports.push({dir:relative(worktree,target.Dir).split('\\').join('/')||'.',test:!(p.Imports||[]).includes(dep)});}
      result.packages.push({dir,imports});
      for(const name of [...(p.GoFiles||[]),...(p.TestGoFiles||[]),...(p.XTestGoFiles||[])]){const file=posix.join(dir,name);let text;try{text=readFileSync(resolve(worktree,file),'utf8');}catch{continue;}
        for(const m of text.matchAll(/^\/\/go:embed\s+(.+)$/gm))for(const pattern of m[1].trim().split(/\s+/)){const re=globToRegExp(posix.join(dir,pattern.replace(/^"|"$/g,'')));for(const t of tracked.keys())if(re.test(t))result.embeds.push({file,pattern,target:t});}}}
    return result;
  }
  async function history(worktree){
    const log=await git(worktree,['log','--all','--no-merges','-n',String(HISTORY_COMMITS),'--date-order','--format=%x01%H','--name-only'],true);
    const counts=new Map(),pairs=new Map();let commits=0;
    for(const chunk of log.split('\x01').filter(Boolean)){const files=[...new Set(chunk.split('\n').slice(1).filter(Boolean))];if(!files.length||files.length>HISTORY_BULK)continue;commits++;
      for(const f of files)counts.set(f,(counts.get(f)||0)+1);
      for(const a of files)for(const b of files)if(a!==b){const k=a+'\0'+b;pairs.set(k,(pairs.get(k)||0)+1);}}
    const rows=[];for(const [k,support] of pairs){if(support<2)continue;const [a,b]=k.split('\0');rows.push({a,b,support,total:counts.get(a)});}
    return {rows,commits};
  }
  async function update(repository,worktree=repository,{head:knownHead,status:knownStatus}={}){
    if(closed)throw Error('Impact index is closed');
    const started=performance.now(),timings={};let measured=started;const mark=k=>{timings[k]=Math.round(performance.now()-measured);measured=performance.now();};
    const id=contextId(repository,worktree);
    const head=knownHead??await git(worktree,['rev-parse','HEAD']).catch(()=>'');
    const statusPrint=knownStatus===undefined?null:digest(knownStatus);
    const last=seen.get(id);
    if(last&&statusPrint!==null&&last.head===head&&last.statusPrint===statusPrint){const row=db.prepare('SELECT generation FROM contexts WHERE id=?').get(id);if(row)return {context:id,generation:row.generation,head,changed:0,removed:0,parsed:0,historyCommits:null,goAvailable:!!goAvailable,timings:{identitiesMs:0,totalMs:Math.round(performance.now()-started)},skipped:true};}
    const current=await identities(worktree,knownStatus);mark('identitiesMs');
    const stored=new Map(db.prepare('SELECT path,identity FROM files WHERE context=?').all(id).map(r=>[r.path,r.identity]));
    const changed=[...current].filter(([p,v])=>stored.get(p)!==v.identity).map(([p])=>p),removed=[...stored.keys()].filter(p=>!current.has(p));
    const context=db.prepare('SELECT * FROM contexts WHERE id=?').get(id);
    const parsed=new Map(),diagnostics=[];
    for(const file of changed){if(!/\.(m?js|jsx)$/.test(file))continue;let text;try{text=readFileSync(resolve(worktree,file),'utf8');}catch(error){diagnostics.push({path:file,code:'unreadable-source',message:error.code||'unreadable'});continue;}
      const result=parseModule(text,file);if(result.failed)diagnostics.push({path:file,code:'parse-failure',message:result.failed});parsed.set(file,result);}
    mark('parseMs');
    const goChanged=!context||changed.some(f=>f.endsWith('.go')||/(^|\/)go\.(mod|sum)$/.test(f))||removed.some(f=>f.endsWith('.go'));
    const go=goChanged?await goPackages(worktree,current):undefined;mark('goMs');
    const hist=!context||context.history_head!==head?await history(worktree):null;mark('historyMs');
    db.exec('BEGIN IMMEDIATE');
    try{
      const del=table=>db.prepare(`DELETE FROM ${table} WHERE context=? AND ${table==='imports'?'from_path':'file'}=?`);
      for(const file of [...changed,...removed]){db.prepare('DELETE FROM files WHERE context=? AND path=?').run(id,file);for(const table of ['imports','declarations','vocabulary'])del(table).run(id,file);db.prepare('DELETE FROM diagnostics WHERE context=? AND path=?').run(id,file);}
      for(const file of changed){const v=current.get(file);db.prepare('INSERT INTO files VALUES(?,?,?,?)').run(id,file,v.identity,isTestFile(file)?'test':isSourceFile(file)?'module':file.endsWith('.md')?'document':'file');
        const result=parsed.get(file);
        if(result){for(const i of result.imports){const to=resolveSpec(current,file,i.spec);if(to)db.prepare('INSERT INTO imports VALUES(?,?,?,?,?,?)').run(id,file,to,JSON.stringify(i.names.map(n=>n.imported)),JSON.stringify(i.names.map(n=>n.local)),i.dynamic?1:0);}
          for(const d of result.declarations)db.prepare('INSERT INTO declarations VALUES(?,?,?,?,?,?,?,?)').run(id,file,d.name,d.exported?1:0,JSON.stringify(d.exportNames),JSON.stringify(d.mentions),d.start,d.end);}
        if(isSourceFile(file)){let text='';try{text=readFileSync(resolve(worktree,file),'utf8');}catch{}db.prepare('INSERT INTO vocabulary VALUES(?,?,?,?)').run(id,file,JSON.stringify(vocabulary(text)),'[]');}}
      for(const d of diagnostics)db.prepare('INSERT INTO diagnostics VALUES(?,?,?,?)').run(id,d.path,d.code,d.message);
      if(go!==undefined){db.prepare('DELETE FROM packages WHERE context=?').run(id);db.prepare('DELETE FROM embeds WHERE context=?').run(id);
        if(go){for(const p of go.packages)db.prepare('INSERT INTO packages VALUES(?,?,?)').run(id,p.dir,JSON.stringify(p.imports));for(const e of go.embeds)db.prepare('INSERT INTO embeds VALUES(?,?,?,?)').run(id,e.file,e.pattern,e.target);}}
      if(changed.length||removed.length||!context){
        db.prepare('DELETE FROM mirrors WHERE context=?').run(id);
        const groups=new Map();for(const [p,v] of current){if(EMPTY_BLOB.test(v.oid))continue;if(!groups.has(v.oid))groups.set(v.oid,[]);groups.get(v.oid).push(p);}
        for(const [hash,paths] of groups){if(paths.length<2||new Set(paths.map(p=>p.split('/')[0])).size<2)continue;for(const p of paths)db.prepare('INSERT INTO mirrors VALUES(?,?,?)').run(id,hash+(current.get(p).identity.startsWith('dirty:')?':diverged':''),p);}
        // Distinctiveness over all source files of the context.
        const rows=db.prepare('SELECT file,raw FROM vocabulary WHERE context=?').all(id);const df=new Map();for(const r of rows)for(const w of JSON.parse(r.raw))df.set(w,(df.get(w)||0)+1);
        const limit=Math.max(VOCABULARY_MIN,rows.length*VOCABULARY_SHARE);
        for(const r of rows)db.prepare('UPDATE vocabulary SET identifiers=? WHERE context=? AND file=?').run(JSON.stringify(JSON.parse(r.raw).filter(w=>df.get(w)<=limit)),id,r.file);}
      if(hist){db.prepare('DELETE FROM history WHERE context=?').run(id);for(const r of hist.rows)db.prepare('INSERT INTO history VALUES(?,?,?,?,?)').run(id,r.a,r.b,r.support,r.total);}
      const generation=(context?.generation||0)+(changed.length||removed.length||hist||go!==undefined?1:0);
      db.prepare('INSERT OR REPLACE INTO contexts VALUES(?,?,?,?,?,?,?,?)').run(id,repository,worktree,head,generation,goAvailable?1:0,head,new Date().toISOString());
      db.exec('COMMIT');mark('writeMs');timings.totalMs=Math.round(performance.now()-started);if(statusPrint!==null)seen.set(id,{head,statusPrint});
      return {context:id,generation,head,changed:changed.length,removed:removed.length,parsed:parsed.size,historyCommits:hist?.commits??null,goAvailable:!!goAvailable,timings};
    }catch(error){db.exec('ROLLBACK');throw error;}
  }
  const relationCache=new Map();
  function relations(repository,worktree=repository){
    const id=contextId(repository,worktree);const context=db.prepare('SELECT * FROM contexts WHERE id=?').get(id);if(!context)return null;
    const cached=relationCache.get(id);if(cached&&cached.generation===context.generation)return cached.value;
    const value=readRelations(id,context);if(relationCache.size>=4)relationCache.delete(relationCache.keys().next().value);relationCache.set(id,{generation:context.generation,value});return value;
  }
  function readRelations(id,context){
    const files=new Map(db.prepare('SELECT path,kind FROM files WHERE context=?').all(id).map(r=>[r.path,r.kind]));
    const imports=db.prepare('SELECT from_path,to_path,names,locals,dynamic FROM imports WHERE context=?').all(id).map(r=>({from:r.from_path,to:r.to_path,names:JSON.parse(r.names),locals:JSON.parse(r.locals),dynamic:!!r.dynamic}));
    const declarations=new Map();for(const r of db.prepare('SELECT file,name,exported,export_names,mentions FROM declarations WHERE context=?').all(id)){if(!declarations.has(r.file))declarations.set(r.file,[]);declarations.get(r.file).push({name:r.name,exported:!!r.exported,exportNames:JSON.parse(r.export_names),mentions:JSON.parse(r.mentions)});}
    const packages=db.prepare('SELECT dir,imports FROM packages WHERE context=?').all(id).map(r=>({dir:r.dir,imports:JSON.parse(r.imports)}));
    const embeds=db.prepare('SELECT file,pattern,target FROM embeds WHERE context=?').all(id);
    const mirrors=new Map(),diverged=new Set();for(const r of db.prepare('SELECT hash,path FROM mirrors WHERE context=?').all(id)){const hash=r.hash.replace(/:diverged$/,'');if(hash!==r.hash)diverged.add(r.path);if(!mirrors.has(hash))mirrors.set(hash,[]);mirrors.get(hash).push(r.path);}
    const history=new Map();for(const r of db.prepare('SELECT a,b,support,total FROM history WHERE context=?').all(id)){if(!history.has(r.a))history.set(r.a,[]);history.get(r.a).push({b:r.b,support:r.support,total:r.total,confidence:+(r.support/r.total).toFixed(2)});}
    const vocabulary=new Map(db.prepare('SELECT file,identifiers FROM vocabulary WHERE context=?').all(id).map(r=>[r.file,JSON.parse(r.identifiers)]));
    const diagnostics=db.prepare('SELECT path,code,message FROM diagnostics WHERE context=?').all(id);
    return {context:id,head:context.head,generation:context.generation,goAvailable:!!context.go_available,files,imports,declarations,packages,embeds,mirrors,diverged,history,vocabulary,diagnostics};
  }
  return {
    path,
    update(repository,worktree,known){const work=serial.then(()=>update(repository,worktree,known));serial=work.catch(()=>{});return work;},
    relations,
    generation(repository,worktree=repository){return db.prepare('SELECT generation FROM contexts WHERE id=?').get(contextId(repository,worktree))?.generation??0;},
    close(){closed=true;return serial.then(()=>db.close());},
  };
}
