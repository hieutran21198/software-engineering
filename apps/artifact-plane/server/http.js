import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { resolve, relative, isAbsolute, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { exploreRepository } from "./reader.js";
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
export function createAppServer() {
  return createServer(async (req, res) => {
    try {
      const host = `127.0.0.1:${req.socket.localPort}`;
      if (
        req.headers.host !== host ||
        (req.headers.origin && req.headers.origin !== `http://${host}`) ||
        req.headers["sec-fetch-site"] === "cross-site"
      )
        return json(res, 403, { error: "Use the local application origin." });
      const url = new URL(req.url, `http://${host}`);
      if (url.pathname === "/api/explore") {
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
}
