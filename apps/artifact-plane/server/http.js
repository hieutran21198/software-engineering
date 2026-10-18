import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { exploreRepository } from "./reader.js";
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
const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const security = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};
function json(res, status, data) {
  res.writeHead(status, {
    ...security,
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(data));
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
  const getKnowledge=()=>knowledge??=createKnowledgeService();
  const observation=options.repositoryObservation||{};
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
      if (["/api/explore", "/api/runtime/query", "/api/repository/query", "/api/flows/query", "/api/review/query", "/api/impact/query"].includes(url.pathname)) {
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
        if(url.pathname==='/api/review/query')return json(res,200,await getReviews().query(body));
        if(url.pathname==='/api/impact/query')return json(res,200,await getImpact().query(body));
        if(url.pathname==='/api/flows/query')return json(res,200,await getFlows().query(body));
        if(url.pathname==='/api/repository/query')return json(res,200,await queryRepository(body));
        return json(res, 200, await exploreRepository(body?.path));
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
      json(res, e.status || 500, {
        error: e.status ? e.message : "The repository could not be explored.",
      });
    }
  });
  const close=server.close.bind(server);
  server.close=(...args)=>{runtime.close();repositories.close();flows?.close();if(!options.impactService)impact?.close();return close(...args);};
  server.runtime = runtime;
  server.repositories=repositories;
  return server;
}
