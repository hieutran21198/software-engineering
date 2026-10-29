import { createServer, STATUS_CODES } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { existsSync, realpathSync } from "node:fs";
import { resolve, relative, isAbsolute, sep, extname, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { exploreRepository } from "./reader.js";
import { exploreResponse } from "./explore-response.js";
import {repositoryService, registeredSourceFingerprint} from './repository-events.js';
import {createFlowService} from './flow-index.js';
import {createReviewService} from './change-review.js';
import {createImpactService} from './impact.js';
import {readFlowRepository} from './flow-reader.js';
import {queryRepository} from './repository-query.js';
import { runtimeService } from "./runtime-api.js";
import {createKnowledgeService} from './knowledge-operations.js';
import {knowledgeGit} from './knowledge-git.js';
import {errorBody as editError} from './knowledge-writer.js';
import {createSettingsService, SettingsError} from './agent-settings.js';
import {createRunnerClient, errorStatus, RunnerError} from './runner-client.js';
import {forwardRelayRequest, forwardRelayUpgrade, relayRoute, RELAY_SILENT} from './terminal-relay.js';
import pkg from "../package.json" with { type: "json" };
// A bundled server.mjs has dist/ beside it; a source checkout has it beside server/.
export const distDirectory = (directory) => existsSync(join(directory, "dist")) ? join(directory, "dist") : resolve(directory, "../dist");
// The real path, so that the containment check compares like with like: on
// Windows a module path can hold 8.3 short names that realpath expands.
const DIST = (dir => {try {return realpathSync.native(dir);} catch {return dir;}})(distDirectory(dirname(fileURLToPath(import.meta.url))));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
// The workbench policy frames only pages of its own origin: the embedded terminal.
const security = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};
// Responses of the terminal relay route: only a workbench page of this origin can frame them,
// and the ttyd page keeps its own scripts (specifications/agent-orchestration.md: Embedded terminal).
const relaySecurity = {...security, "Content-Security-Policy": "frame-ancestors 'self'"};
// Serialize first: a reply that cannot be serialized fails before its headers are sent.
function json(res, status, data, headers = security) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    ...headers,
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(body);
}
// The JSON error reply to a refused WebSocket upgrade, on the raw socket.
function refuseUpgrade(socket, status, error, headers = security) {
  const body = JSON.stringify({error});
  const fields = {...headers, "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body), Connection: "close"};
  socket.end(`HTTP/1.1 ${status} ${STATUS_CODES[status]}\r\n${Object.entries(fields).map(([name, value]) => `${name}: ${value}`).join("\r\n")}\r\n\r\n${body}`);
}
export function createAppServer(options = {}) {
  const runtime = runtimeService(options);
  // One impact service answers /api/impact/query, the delegated flow impact operation and the packet field.
  let impact=options.impactService;
  // The impact service reads knowledge through the flow service's fingerprint-cached load.
  const sharedLoad=(path,settings)=>{const service=getFlows();return service.load?service.load(path,settings):readFlowRepository(path,settings);};
  const getImpact=()=>impact??=createImpactService({stateDir:options.stateDir,roots:options.flowRoots||[],loader:sharedLoad});
  let flows=options.flowService;
  const getFlows=()=>flows??=(createFlowService({stateDir:options.stateDir,roots:options.flowRoots||[],impactService:getImpact()}));
  let reviews=options.reviewService;
  const getReviews=()=>reviews??=createReviewService({roots:options.reviewRoots||options.flowRoots||[],impactService:getImpact()});
  let knowledge=options.knowledgeService;
  const getKnowledge=()=>knowledge??=createKnowledgeService({channel:'person'});
  // The settings service starts on the first settings route, so other routes never read the settings file.
  let settings=options.settingsService;
  // The runner client connects on its first use; the settings query reads the runner availability without a start.
  let runner=options.runnerClient;
  const getRunner=()=>runner??=createRunnerClient({stateDir:options.stateDir});
  const getSettings=()=>settings??=createSettingsService({stateDir:options.stateDir,configDir:options.configDir,roots:options.flowRoots||[],runner:()=>getRunner().availability()});
  const observation=options.repositoryObservation||{};
  // The open relay WebSockets of each session. The runner stops ttyd 10 minutes after the count
  // of every server reaches 0; it forgets the count of a server whose connection closes.
  const viewers=new Map(),relaySockets=new Set();
  const countViewer=(session,change)=>{
    const count=(viewers.get(session)??0)+change;
    if(count)viewers.set(session,count);else viewers.delete(session);
    const client=getRunner();
    if(client.connected)client.call('relayViewers',{session,count}).catch(()=>{});
  };
  // The relay socket of a running terminal session; the runner starts ttyd on the first view.
  const relaySocketOf=async session=>(await getRunner().call('relay',{session})).socket;
  const repositories=repositoryService({...observation,sample:async(root,settings)=>{const base=observation.sample?await observation.sample(root,settings):await settings.base(settings);return registeredSourceFingerprint(root,base,[...(flows?.observedSources(root)||[]),...(reviews?.observedSources(root)||[])],settings);}});
  const server = createServer(async (req, res) => {
    try {
      const host = `127.0.0.1:${req.socket.localPort}`;
      if (
        req.headers.host !== host ||
        (req.headers.origin && req.headers.origin !== `http://${host}`) ||
        req.headers["sec-fetch-site"] === "cross-site"
      )
        return json(res, 403, { error: "Use the local application origin." });
      const url = new URL(req.url, `http://${host}`);
      // The identity of a Plane server (specifications/ui-discovery.md: Identity route).
      if (url.pathname === "/api/plane") {
        if (req.method !== "GET") return json(res, 405, {error: "Use GET for the identity."});
        return json(res, 200, {name: "artifact-plane", version: pkg.version});
      }
      // The embedded terminal: ttyd pages forwarded to the relay socket (Embedded terminal).
      const relaySession = relayRoute(url.pathname);
      if (relaySession !== undefined) {
        if (req.method !== "GET") return json(res, 405, {error: "Use GET for the terminal."}, relaySecurity);
        if (relaySession === null) return json(res, 404, {error: "The session is unknown."}, relaySecurity);
        let socket;
        try {socket = await relaySocketOf(relaySession);}
        catch (error) {if (error instanceof RunnerError) return json(res, errorStatus(error.code), {error: error.message}, relaySecurity);throw error;}
        try {await forwardRelayRequest(req, res, socket, relaySecurity);}
        catch {return json(res, 503, {error: RELAY_SILENT}, relaySecurity);}
        return;
      }
      if(url.pathname==='/api/repository/events'){
        if(req.method!=='GET')return json(res,405,{error:'Use GET for events.'});
        if([...url.searchParams.keys()].some(k=>k!=='path')||url.searchParams.getAll('path').length!==1)return json(res,400,{error:'Supply one repository path.'});
        await repositories.subscribe(req,res,security,url.searchParams.get('path'));return;
      }
      if (url.pathname === "/api/runtime/events") {
        if (req.method !== "GET") return json(res, 405, {error: "Use GET for events."});
        if (!runtime.subscribe(req, res, security)) return json(res, 429, {error: "Too many observation clients."});
        return;
      }
      if (url.pathname === "/api/knowledge/edit" || url.pathname === "/api/knowledge/git") {
        if (req.method !== "POST") return json(res, 405, {error: "Use POST to edit knowledge."});
        if (req.headers["content-type"]?.split(";")[0].trim() !== "application/json") return json(res, 415, {error: "Send application/json."});
        const chunks = [];let size = 0;
        for await (const chunk of req) {size += chunk.length;if (size > 2 * 1024 * 1024) return json(res, 413, {error: "Request is too large."});chunks.push(chunk);}
        let body;
        try {body = JSON.parse(Buffer.concat(chunks).toString("utf8"));} catch {return json(res, 400, {error: "Request must contain valid JSON."});}
        try {return json(res, 200, url.pathname === "/api/knowledge/edit" ? await getKnowledge().apply(body) : await knowledgeGit(body));}
        catch (error) {const {status, body: payload} = editError(error);return json(res, status, payload);}
      }
      if (["/api/explore", "/api/runtime/query", "/api/repository/query", "/api/flows/query", "/api/review/query", "/api/impact/query", "/api/settings/query", "/api/settings/save", "/api/settings/check"].includes(url.pathname)) {
        if (req.method !== "POST")
          return json(res, 405, { error: "Use POST to explore a repository." });
        if (
          req.headers["content-type"]?.split(";")[0].trim() !==
          "application/json"
        )
          return json(res, 415, { error: "Send application/json." });
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 16384)
            return json(res, 413, { error: "Request is too large." });
          chunks.push(chunk);
        }
        let body;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          return json(res, 400, { error: "Request must contain valid JSON." });
        }
        if (url.pathname === "/api/runtime/query") {
          if (typeof body?.path !== "string" || !body.path || body.context !== undefined && typeof body.context !== "string") return json(res, 400, {error: "Supply a repository path and optional context ID."});
          return json(res, 200, runtime.query(body.path, body.context));
        }
        if(url.pathname.startsWith('/api/settings/')){
          try{const service=getSettings();return json(res,200,url.pathname==='/api/settings/query'?await service.query(body):url.pathname==='/api/settings/save'?service.save(body):await service.check(body));}
          catch(error){if(error instanceof SettingsError)return json(res,error.status,{...error.body,error:error.message});throw error;}
        }
        if(url.pathname==='/api/review/query')return json(res,200,await getReviews().query(body));
        if(url.pathname==='/api/impact/query')return json(res,200,await getImpact().query(body));
        if(url.pathname==='/api/flows/query')return json(res,200,await getFlows().query(body));
        if(url.pathname==='/api/repository/query')return json(res,200,await queryRepository(body));
        return json(res, 200, exploreResponse(await exploreRepository(body?.path)));
      }
      if (!["GET", "HEAD"].includes(req.method))
        return json(res, 405, { error: "Method is not supported." });
      // Serve only the application's built files. Repository files have no route.
      let name;
      try {
        name = decodeURIComponent(url.pathname);
      } catch {
        return json(res, 400, { error: "Invalid URL." });
      }
      if (name.includes("\0") || name.includes("\\"))
        return json(res, 404, { error: "Not found." });
      const path = resolve(DIST, `.${name === "/" ? "/index.html" : name}`);
      const rel = relative(DIST, path);
      if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel))
        return json(res, 404, { error: "Not found." });
      let content;
      try {
        const target = await realpath(path),
          targetRel = relative(DIST, target);
        if (
          targetRel === ".." ||
          targetRel.startsWith(`..${sep}`) ||
          isAbsolute(targetRel)
        )
          return json(res, 404, { error: "Not found." });
        content = await readFile(target);
      } catch {
        return json(res, 404, {
          error: "Not found. Run npm run build before starting the app.",
        });
      }
      res.writeHead(200, {
        ...security,
        "Content-Type": mime[extname(path)] || "application/octet-stream",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (e) {
      // After the headers are sent, only this connection can fail; the server keeps running.
      if (res.headersSent) return void res.destroy();
      json(res, e.status || 500, {
        error: e.status ? e.message : "The repository could not be explored.",
      });
    }
  });
  // The WebSocket of the embedded terminal. An upgrade needs the workbench Host and an Origin
  // equal to the workbench origin; ttyd closes a WebSocket whose Origin differs from Host.
  server.on("upgrade", async (req, socket, head) => {
    socket.on("error", () => {});
    try {
      const host = `127.0.0.1:${socket.localPort}`;
      if (req.headers.host !== host || req.headers.origin !== `http://${host}` || req.headers["sec-fetch-site"] === "cross-site")
        return refuseUpgrade(socket, 403, "Use the local application origin.");
      const session = relayRoute(new URL(req.url, `http://${host}`).pathname);
      if (session === undefined || req.method !== "GET") return refuseUpgrade(socket, 404, "Not found.");
      if (session === null) return refuseUpgrade(socket, 404, "The session is unknown.", relaySecurity);
      const path = await relaySocketOf(session);
      if (socket.destroyed) return;
      await forwardRelayUpgrade(req, socket, head, path, {
        open: () => {relaySockets.add(socket);countViewer(session, 1);},
        close: () => {relaySockets.delete(socket);countViewer(session, -1);},
      });
    } catch (error) {
      if (!socket.destroyed) refuseUpgrade(socket, error instanceof RunnerError ? errorStatus(error.code) : 503, error instanceof RunnerError ? error.message : RELAY_SILENT, relaySecurity);
    }
  });
  const close=server.close.bind(server);
  server.close=(...args)=>{for(const socket of relaySockets)socket.destroy();runtime.close();repositories.close();flows?.close();if(!options.impactService)impact?.close();if(!options.runnerClient)runner?.close();return close(...args);};
  server.runner=getRunner;
  server.runtime = runtime;
  server.repositories=repositories;
  return server;
}
export function startServer(label = "Artifact Plane") {
  const port = Number(process.env.PORT || 4310);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("PORT must be between 1 and 65535.");
  const server = createAppServer();
  server.listen(port, "127.0.0.1", () =>
    console.log(`${label}: http://127.0.0.1:${port}`),
  );
  server.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  return server;
}
