// A fake ttyd 1.7.7 for the terminal relay tests. It never starts a terminal or herdr. A
// wrapper script named `ttyd` on PATH runs it as `node fake-ttyd.mjs <ttyd arguments>`. It
// serves the HTTP and WebSocket shape of the live record of task verify-interfaces on the
// UNIX socket of `--interface`, under `--base-path`:
// - `<base>` answers 302 to `<base>/`, `<base>/` a page, `<base>/token` {"token": ""};
// - an upgrade of `<base>/ws` without an Origin, or with an Origin whose host and port differ
//   from Host, is closed without a status, like `--check-origin`; otherwise it gets 101 with
//   the protocol `tty` and the server bytes SERVER_BYTES.
// The socket gets mode 0660, as ttyd gives it. Each event goes as one JSON line to
// $FAKE_TTYD_DIR/calls.jsonl: {event: 'start', argv, pid}, 'listening', {event: 'http', method,
// url, headers}, {event: 'upgrade', url, headers, rawHeaders, accepted}, {event: 'ws-close', n}
// and {event: 'signal', signal}. The bytes that WebSocket n receives after its request head go
// to $FAKE_TTYD_DIR/ws-<n>.bin. A file $FAKE_TTYD_DIR/fault that holds `exit` makes the start
// exit with status 1; `hang` makes it run without listening. SIGTERM ends the process and
// leaves the socket file.
import {createHash} from 'node:crypto';
import {appendFileSync, chmodSync, existsSync, readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {join} from 'node:path';

export const PAGE = '<!doctype html><title>fake ttyd</title><p>terminal</p>';
// One unmasked binary WebSocket frame with the payload "1fake" (a ttyd title message).
export const SERVER_BYTES = Buffer.from([0x82, 0x05, 0x31, 0x66, 0x61, 0x6b, 0x65]);

// The test imports PAGE and SERVER_BYTES; only the wrapper runs the server.
if (process.argv[1]?.endsWith('fake-ttyd.mjs')) {
 const argv = process.argv.slice(2), dir = process.env.FAKE_TTYD_DIR;
 const log = event => appendFileSync(join(dir, 'calls.jsonl'), JSON.stringify(event) + '\n');
 const option = name => argv[argv.indexOf(name) + 1];
 const base = option('--base-path'), socket = option('--interface');
 log({event: 'start', argv, pid: process.pid});
 process.on('SIGTERM', () => {log({event: 'signal', signal: 'SIGTERM'});process.exit(0);});
 const fault = existsSync(join(dir, 'fault')) ? readFileSync(join(dir, 'fault'), 'utf8').trim() : '';
 if (fault === 'exit') process.exit(1);
 if (fault === 'hang') setInterval(() => {}, 1000);
 else {
  let connections = 0;
  const server = createServer((req, res) => {
   log({event: 'http', method: req.method, url: req.url, headers: req.headers});
   if (req.url === base) {res.writeHead(302, {Location: `${base}/`});return res.end();}
   if (req.url === `${base}/`) {res.writeHead(200, {'Content-Type': 'text/html'});return res.end(PAGE);}
   if (req.url === `${base}/token`) {res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});return res.end('{"token": ""}');}
   res.writeHead(404);res.end();
  });
  server.on('upgrade', (req, sock, head) => {
   let origin = null;
   try {origin = new URL(req.headers.origin).host;} catch {/* missing or malformed */}
   const accepted = req.url === `${base}/ws` && origin !== null && origin === req.headers.host;
   log({event: 'upgrade', url: req.url, headers: req.headers, rawHeaders: req.rawHeaders, accepted});
   if (!accepted) return void sock.destroy();
   const n = ++connections, file = join(dir, `ws-${n}.bin`);
   appendFileSync(file, head);
   sock.on('data', data => appendFileSync(file, data));
   sock.on('close', () => log({event: 'ws-close', n}));
   sock.on('error', () => {});
   const accept = createHash('sha1').update(req.headers['sec-websocket-key'] + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
   sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\nSec-WebSocket-Protocol: tty\r\n\r\n`);
   sock.write(SERVER_BYTES);
  });
  server.listen(socket, () => {chmodSync(socket, 0o660);log({event: 'listening'});});
 }
}
