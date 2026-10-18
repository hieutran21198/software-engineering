// Synthetic repositories for the impact index and service tests.
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {stringify} from 'yaml';
import {git,rootReadme} from './fixtures.js';

export const flowDoc=flow=>'---\n'+stringify({flow})+'---\n# '+flow.title+'\n';
export const unitDoc=unit=>'---\n'+stringify(unit)+'---\n# '+unit.unit_of_work+'\n';
export function impactFiles(){
  const login={id:'login',artifact:'a',title:'Login',trigger:'A member signs in.',outcome:'A session exists.',entry_steps:['check'],
    steps:[{id:'check',title:'Check identity',supports:['contract','code','checks']},{id:'issue',title:'Issue session',supports:['code']},{id:'audit',title:'Audit',supports:['helper']}],
    transitions:[{from:'check',to:'issue',condition:'Identity is valid.'},{from:'issue',to:'audit'}],
    support:[
      {id:'contract',kind:'element',artifact:'a',element:'specifications/contract.md',requires:'Define the identity rules.',basis:'documented'},
      {id:'code',kind:'implementation',path:'src/check.js',symbol:'check',requires:'Check the identity.',basis:'static'},
      {id:'checks',kind:'test',path:'test/check.test.js',requires:'Exercise the check.',basis:'static'},
      {id:'helper',kind:'implementation',path:'src/util.js',requires:'Format the audit line.',basis:'static'}],
    participants:[{id:'identity',artifact:'a',model:'identity',requires:'Supply the identity.'}]};
  const report={id:'report',artifact:'b',title:'Report',trigger:'A report is requested.',outcome:'A report exists.',entry_steps:['read'],
    steps:[{id:'read',title:'Read the consumer contract',supports:['consumer']},{id:'reuse',title:'Reuse login',supports:['login']}],transitions:[{from:'read',to:'reuse'}],
    support:[{id:'consumer',kind:'element',artifact:'b',element:'specifications/consumer.md',requires:'Read the consumer rules.',basis:'documented'},{id:'login',kind:'flow',artifact:'a',flow:'login',requires:'Reuse the login journey.',basis:'documented'}]};
  return new Map([
    ['docs/artifacts/a/README.md',rootReadme('A','1.0.0')],
    ['docs/artifacts/b/README.md',rootReadme('B','1.0.0',['a'])],
    ['docs/artifacts/c/README.md',rootReadme('C','1.0.0',['a'])],
    ['docs/artifacts/a/specifications/contract.md','---\nmodels:\n  - id: identity\n    title: Identity\n    description: The identity of a member.\n    sources: [specifications/identity.md]\n---\n# Contract\n\nUse `entry_steps` and `depends_on` in the `login_rule` section.\n\n## Rules\n\nThe identity_format is stable.\n'],
    ['docs/artifacts/a/specifications/identity.md','# Identity\n\nThe identity model.\n'],
    ['docs/artifacts/a/specifications/flows/login.md',flowDoc(login)],
    ['docs/artifacts/a/changes/change-x/README.md','# Change x\n'],
    ['docs/artifacts/b/specifications/consumer.md','---\nreferences:\n  - artifact: a\n    element: specifications/contract.md\n    requires: The identity rules that reports apply.\n---\n# Consumer\n'],
    ['docs/artifacts/b/specifications/flows/report.md',flowDoc(report)],
    ['docs/artifacts/c/specifications/alone.md','# Alone\n\nNo reference to a.\n'],
    ['docs/artifacts/units-of-work/outcome/README.md',unitDoc({unit_of_work:'outcome',changes:[{artifact:'a',change:'change-x'}],affected_flows:[{artifact:'a',flow:'login',effect:'modify'},{artifact:'a',flow:'ghost',effect:'create'}],flow_assessment:'Login changes; ghost is new.',acceptance:[{id:'done',criterion:'Works.'}],evidence:[]})],
    ['src/util.js','export function helper(){return 1;}\nexport function other(){return 2;}\n'],
    ['src/check.js',"import {helper} from './util.js';\nexport function check(){return helper();}\nexport const unrelated=1;\n"],
    ['src/index.js',"export {check as verify} from './check.js';\n"],
    ['src/app.js',"import {verify} from './index.js';\nexport const run=()=>verify();\n"],
    ['src/only-unrelated.js',"import {unrelated} from './check.js';\nexport const value=unrelated;\n"],
    ['src/styles.css','body{margin:0}\n'],
    ['src/main.jsx',"import './styles.css';\nimport {run} from './app.js';\nexport const App=()=><b>{run()}</b>;\n"],
    ['src/broken.js',"import {check} from './check.js';\nexport function x( {\n"],
    ['src/vocab.js','export function identityFormat(){const identity_format="login_rule";return identity_format;}\n'],
    ['test/check.test.js',"import {check} from '../src/check.js';\nexport const t=check;\n"],
    ['docs/bundle/page.md','# Page\n\nIdentical copy.\n'],
    ['mirror/page.md','# Page\n\nIdentical copy.\n'],
  ]);
}
export async function impactRepository(files=impactFiles()){
  const root=await mkdtemp(join(tmpdir(),'plane-impact-'));
  const write=async(path,contents)=>{await mkdir(dirname(join(root,path)),{recursive:true});await writeFile(join(root,path),contents);};
  for(const [path,contents] of files)await write(path,contents);
  git(root,'init','-q','-b','main');
  const commit=message=>{git(root,'add','-A');git(root,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm',message,'--allow-empty');};
  commit('fixture');
  // History: a.js and b.js change together three times, c.js once with a.js, one bulk commit.
  for(let i=0;i<3;i++){await write('hist/a.js',`export const a=${i};\n`);await write('hist/b.js',`export const b=${i};\n`);commit('pair '+i);}
  await write('hist/a.js','export const a=9;\n');await write('hist/c.js','export const c=1;\n');commit('a with c');
  for(let i=0;i<65;i++)await write(`bulk/f${i}.txt`,'bulk\n');commit('bulk');
  const stateDir=await mkdtemp(join(tmpdir(),'plane-impact-state-'));
  return {root,stateDir,write,commit,cleanup:()=>Promise.all([rm(root,{recursive:true,force:true}),rm(stateDir,{recursive:true,force:true})])};
}
