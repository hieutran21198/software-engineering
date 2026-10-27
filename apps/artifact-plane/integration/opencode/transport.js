import {spawn} from 'node:child_process';

const MAX_INPUT = 1024 * 1024, MAX_OUTPUT = 64 * 1024;

// One executable and explicit arguments. Stderr is drained, never retained: the
// hook can report observer trouble there while still returning a policy denial.
export function createRunner({command = 'artifact-plane', args = ['hook']} = {}) {
  const children = new Map();
  let closed = false;
  const run = (input, {timeout = 8000} = {}) => new Promise(resolve => {
    let text;
    try {text = JSON.stringify(input);} catch {resolve({});return;}
    if (closed || Buffer.byteLength(text) > MAX_INPUT) {resolve({});return;}
    let child;
    try {child = spawn(command, args, {stdio: ['pipe', 'pipe', 'pipe'], shell: false, windowsHide: true});}
    catch {resolve({});return;}
    let failed = false, size = 0, chunks = [];
    const kill = () => {
      failed = true;child.kill('SIGKILL');
      child.stdin.destroy();child.stdout.destroy();child.stderr.destroy();
    };
    children.set(child, kill);
    const timer = setTimeout(kill, timeout);
    child.on('error', () => {failed = true;});
    child.stdin.on('error', () => {failed = true;});
    child.stderr.on('data', () => {});
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_OUTPUT) {chunks = [];kill();}
      else if (!failed) chunks.push(chunk);
    });
    child.on('close', code => {
      clearTimeout(timer);children.delete(child);
      if (failed || code !== 0) {resolve({});return;}
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        resolve(value && typeof value === 'object' && !Array.isArray(value) ? value : {});
      } catch {resolve({});}
    });
    child.stdin.end(text);
  });
  run.close = () => {
    closed = true;
    return Promise.all([...children].map(([child, kill]) => new Promise(done => {
      child.once('close', done);kill();
    })));
  };
  return run;
}
