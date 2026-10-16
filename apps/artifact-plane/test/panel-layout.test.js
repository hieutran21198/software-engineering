import test from 'node:test';import assert from 'node:assert/strict';import {panelLayout} from '../src/panel-layout.js';
test('panel widths preserve central space, responsive defaults and drag limits',()=>{
 for(const width of [801,851,900,1150,1440,1920])for(const details of [true,false])for(const left of [null,180,220,420])for(const right of [240,340,640]){
  const p=panelLayout(width,left,right,details);assert.ok(p.sidebar>=180&&p.sidebar<=420);assert.ok(p.inspector>=240&&p.inspector<=640);assert.ok(width-p.sidebar-(details?p.inspector:0)>=300);assert.ok(p.sidebarMax<=420);assert.ok(p.inspectorMax<=640);
 }
 assert.equal(panelLayout(1440,null,340,true).sidebar,220);assert.equal(panelLayout(900,null,340,true).sidebar,180);assert.equal(panelLayout(390,400,640,true).sidebar,125);assert.equal(panelLayout(700,400,640,true).sidebar,150);assert.equal(panelLayout(1440,400,640,true).sidebar,400);
});
