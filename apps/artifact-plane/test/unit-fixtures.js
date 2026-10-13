import {rootReadme} from './fixtures.js';
export const unitPath = 'docs/artifacts/units-of-work/tenant-login/README.md';
export const unitTask = (id, depends = []) => `---\nid: ${id}\ndepends_on: ${JSON.stringify(depends)}\n---\n# ${id}\n\n- [x] Verify behavior\n\n## Evidence\n\nBehavior checks passed. All required knowledge and implementation changes are in this repository.\n`;
export function unitBrief(members = [['tenant','change-login'],['authentication','change-login']], evidence = true) {
  return `---\nunit_of_work: tenant-login\nchanges:\n${members.map(([artifact,change])=>`  - artifact: ${artifact}\n    change: ${change}\n`).join('')}acceptance:\n  - id: login\n    criterion: Members can sign in and nonmembers are denied.\n  - id: integration\n    criterion: Combined login contracts pass.\n    integration: true\nevidence: ${evidence?'':'[]'}\n${evidence?`  - criterion: login\n    method: Run login checks.\n    result: passed\n    source: docs/artifacts/authentication/versions/1.0.0/tasks/api.md#evidence\n  - criterion: integration\n    method: Review the combined contracts.\n    result: passed\n    source: ${unitPath}#combined-checks\n`:''}---\n\n# Tenant login\n\n## Purpose\n\nAllow tenant members to sign in.\n\n## Scope\n\nInclude tenant and authentication contracts. Exclude unrelated capabilities.\n\n## Combined checks\n\nCombined tenant and authentication checks passed in this fixture.\n`;
}
export function unitFixture({delivered=true, retained=true}={}) {
  const records=new Map([[unitPath,unitBrief()]]);
  for (const artifact of ['tenant','authentication']) {
    records.set(`docs/artifacts/${artifact}/README.md`,rootReadme(artifact,delivered?'1.0.0':null,artifact==='authentication'?['tenant']:[]));
    for(const source of [...(retained?['changes/change-login']:[]),...(delivered?['versions/1.0.0']:[])]){
      const prefix=`docs/artifacts/${artifact}/${source}/`;
      records.set(`${prefix}README.md`,`${source.startsWith('versions')?'---\nsource_change: change-login\n---\n':''}# Login outcome\n`);
      records.set(`${prefix}tasks/README.md`,'---\ntasks: [api.md, ui.md, integration.md]\n---\n# Plan');
      records.set(`${prefix}tasks/api.md`,unitTask('api'));
      records.set(`${prefix}tasks/ui.md`,unitTask('ui'));
      records.set(`${prefix}tasks/integration.md`,unitTask('integration',['api','ui']));
    }
  }
  return records;
}
