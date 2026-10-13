import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fixtureRepository} from './fixtures.js';
const prefix='docs/artifacts/demo/changes/change-live/';
export async function runtimeFixture(){
 const files=new Map([
 ['docs/artifacts/demo/README.md','# Demo\n\n## Current established version\n\nNone.\n\n## Established dependencies\n\nNone.\n'],
 [prefix+'README.md','# Live'],[prefix+'tasks/README.md','---\ntasks: [a.md, b.md, join.md]\n---\n# Plan'],
 [prefix+'tasks/a.md','---\nid: a\ndepends_on: []\n---\n# Task A\n\n- [ ] Behavior'],
 [prefix+'tasks/b.md','---\nid: b\ndepends_on: []\n---\n# Task B'],
 [prefix+'tasks/join.md','---\nid: join\ndepends_on: [a,b]\n---\n# Join'],
 ['docs/artifacts/units-of-work/live/README.md','---\nunit_of_work: live\nchanges:\n  - artifact: demo\n    change: change-live\nacceptance:\n  - id: checks\n    criterion: Checks pass.\nevidence: []\n---\n# Live execution'],
 ['evidence.md','# Evidence\n\n## Checks\n\nBehavior suite passed.']]);
 const f=await fixtureRepository(files),stateDir=await mkdtemp(join(tmpdir(),'plane-runtime-'));
 return {...f,stateDir,cleanup:async()=>{await f.cleanup();await rm(stateDir,{recursive:true,force:true});}};
}
export const bind=(store,root,task='a.md',session='session',agent='')=>store.bind({root,artifact:'demo',change:'change-live',task,session,agent,unit:'live'});
