import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRunner} from '../integration/opencode/transport.js';

const node = script => createRunner({command: process.execPath, args: ['-e', script]});
test('transport sends JSON over stdin without interpolating shell metacharacters', async () => {
  const run = node('let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>process.stdout.write(s));');
  try {assert.deepEqual(await run({command: '$(exit 1); | & "'}), {command: '$(exit 1); | & "'});}
  finally {run.close();}
});
for (const [name, script] of [
  ['invalid JSON', 'process.stdout.write("noise");'],
  ['array JSON', 'process.stdout.write("[]");'],
  ['nonzero exit', 'process.stdout.write("{}");process.exitCode=1;'],
  ['oversized output', 'process.stdout.write(" ".repeat(65537));'],
  ['broken pipe', 'process.stdin.destroy();process.exit(1);'],
]) test(`transport fails open on ${name}`, async () => {
  const run = node(script);try {assert.deepEqual(await run({}), {});} finally {run.close();}
});
test('transport tolerates stderr while preserving valid denial output', async () => {
  const output = {hookSpecificOutput: {permissionDecision: 'deny', permissionDecisionReason: 'Reserved'}};
  const run = node(`process.stderr.write("observer unavailable");process.stdout.write(${JSON.stringify(JSON.stringify(output))});`);
  try {assert.deepEqual(await run({}), output);} finally {run.close();}
});
test('transport fails open on missing binary, request limit, timeout and unload', async () => {
  const missing = createRunner({command: '/missing/artifact-plane'});
  assert.deepEqual(await missing({}), {});missing.close();
  const tooBig = node('process.stdout.write(JSON.stringify({unexpected:true}));');
  assert.deepEqual(await tooBig({text: 'x'.repeat(1024 * 1024)}), {});tooBig.close();
  const run = node('setInterval(()=>{},1000);');
  assert.deepEqual(await run({}, {timeout: 30}), {});
  const pending = run({});run.close();assert.deepEqual(await pending, {});assert.deepEqual(await run({}), {});
});
