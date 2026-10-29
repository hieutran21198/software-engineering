// A fake Antigravity CLI (`agy`) for tests. It runs no model and contacts no server.
// FAKE_AGY_CONFIG_FILE names a JSON file: {log?, lines?: [text], stderr?: text,
// exit?: number, delayMs?: number}. `agy models` waits `delayMs`, writes `stderr`
// (default "Fetching available models..."), then the `lines` to standard output, and
// exits with `exit`. Every run appends {argv, cwd, cwdMode, stdin} to `log`. Other
// commands exit with status 2. A wrapper script answers `--version`.
import {appendFileSync, readFileSync, statSync} from 'node:fs';

const config = JSON.parse(readFileSync(process.env.FAKE_AGY_CONFIG_FILE, 'utf8'));
const argv = process.argv.slice(2);
let stdin = '';
try {stdin = readFileSync(0, 'utf8');} catch {}
if (config.log) appendFileSync(config.log, JSON.stringify({argv, cwd: process.cwd(), cwdMode: statSync('.').mode & 0o777, stdin}) + '\n');
if (argv[0] !== 'models') {
 process.stderr.write(`unknown command ${argv[0]}\n`);
 process.exit(2);
}
setTimeout(() => {
 process.stderr.write(config.stderr ?? 'Fetching available models...\n');
 process.stdout.write((config.lines || []).map(line => line + '\n').join(''));
 process.exit(config.exit ?? 0);
}, config.delayMs || 0);
