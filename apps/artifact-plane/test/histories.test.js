import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSnapshot} from '../src/model.js';
import {knowledgeGroups,historyKey,typeKey} from '../src/elements.js';
import {canvasGraph} from '../src/canvas.js';
import {orderingFixture} from './fixtures.js';
test('B11: version-only types and independently collapsed history sources',()=>{
 const snapshot=buildSnapshot(orderingFixture()),a=snapshot.artifacts[0];
 const groups=knowledgeGroups(a,new Set());
 assert.deepEqual(groups.map(g=>g.count),[1,1,1,5,1]);
 assert.ok(groups.slice(0,4).every(g=>g.sources.every(s=>s.source==='version:1.0.0')));
 const keys=new Set([historyKey(a.id),historyKey(a.id,'change:change-next'),typeKey(a.id,'requirements','change:change-next')]);
 const graph=canvasGraph(snapshot,new Set([a.id]),false,keys);
 assert.deepEqual(graph.nodes.filter(n=>n.type==='element').map(n=>n.data.element.source),['change:change-next']);
});
test('owned active declaration beats retained candidates; unsafe, conflicting and code-only links do not',()=>{
 const files=orderingFixture(),root='docs/artifacts/knowledge/README.md',base=files.get(root);
 files.set('docs/artifacts/knowledge/changes/change-old/README.md','# Old');
 files.set(root,base+'\n## Active change\n[Next](changes/change-next/README.md)\n');
 assert.equal(buildSnapshot(files).artifacts[0].activeChange,'change-next');
 for(const declaration of ['[Next](../other/changes/change-next/README.md)','[Next](changes/change-next/README.md)\n[Old](changes/change-old/README.md)','```md\n[Next](changes/change-next/README.md)\n```','[Missing](changes/change-missing/README.md)']) {
  files.set(root,base+'\n## Active change\n'+declaration+'\n');
  const snapshot=buildSnapshot(files);
  assert.equal(snapshot.artifacts[0].activeChange,null);
  assert.ok(snapshot.diagnostics.some(d=>d.code==='invalid-active-change'));
 }
});
