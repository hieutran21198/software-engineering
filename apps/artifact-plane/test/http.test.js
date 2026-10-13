import test from "node:test";
import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { createAppServer } from "../server/http.js";
import { fixtureRepository } from "./fixtures.js";

test("local API response contract and validation reject hostile or malformed requests", async (t) => {
  const fixture = await fixtureRepository();
  t.after(fixture.cleanup);
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (body, headers = {}) =>
    fetch(`${base}/api/explore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
    });
  const response = await request(JSON.stringify({ path: fixture.root }));
  assert.equal(response.status, 200);
  const view = await response.json();
  assert.deepEqual(Object.keys(view).sort(), [
    "artifacts",
    "diagnostics",
    "edges",
    "references",
    "repository",
    "unitsOfWork",
    "workflow",
  ]);
  assert.equal(view.repository.path, fixture.root);
  assert.equal(view.artifacts.length, 3);
  assert.equal((await request("{")).status, 400);
  assert.equal((await request("{}")).status, 400);
  assert.equal(
    (await request("{}", { Origin: "https://foreign.example" })).status,
    403,
  );
  const hostileHost = await new Promise((resolve) => {
    const req = httpRequest(
      `${base}/api/explore`,
      {
        method: "POST",
        headers: {
          Host: "foreign.example",
          "Content-Type": "application/json",
        },
      },
      (res) => {
        res.resume();
        resolve(res.statusCode);
      },
    );
    req.end("{}");
  });
  assert.equal(hostileHost, 403);
  assert.equal(
    (await request("{}", { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal((await request("x".repeat(17000))).status, 413);
  assert.equal((await fetch(`${base}/api/explore`)).status, 405);
  assert.equal((await fetch(`${base}/server/reader.js`)).status, 404);
});
