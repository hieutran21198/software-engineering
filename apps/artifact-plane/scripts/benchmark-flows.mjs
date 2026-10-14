import { cpus, totalmem, platform } from "node:os";
import { resolve, join } from "node:path";
import { performance } from "node:perf_hooks";
import { existsSync } from "node:fs";
import { defaultStateDir } from "../server/runtime-store.js";
import { createFlowService } from "../server/flow-index.js";
const path = resolve(process.argv[2] || "../..");
const initialIndexExists = existsSync(
  join(defaultStateDir(), "flow-index.sqlite"),
);
const service = createFlowService({ roots: [path] });
const cases = [
  ["Retrieve safe source context with freshness and pagination", "artifact-plane:source-retrieval"],
  ["Switch between independent open project tabs", "artifact-plane:project-tabs"],
  ["Adopt the reusable artifact driven bundle", "artifact-driven:adoption"],
  [
    "Wait for upstream prerequisites before implementing",
    "artifact-driven:dependency-gates",
  ],
  [
    "Revise story knowledge and assess downstream impact",
    "story-driven:revision-impact",
  ],
];
try {
  const results = [];
  for (const [query, expected] of cases) {
    const start = performance.now();
    const result = await service.query({
      path,
      operation: "search",
      query,
      limit: 10,
    });
    results.push({
      query,
      expected,
      rank: result.data.flows.findIndex((f) => f.logicalId === expected) + 1,
      semantic: result.data.semantic,
      milliseconds: performance.now() - start,
      contextBytes: Buffer.byteLength(JSON.stringify(result)),
      freshness: result.freshness,
      completeness: result.completeness,
      diagnostics: result.diagnostics,
      metrics: result.metrics,
    });
  }
  const start = performance.now();
  const impact = await service.query({
    path,
    operation: "impact",
    ids: ["internal/adopt/adopt.go"],
    limit: 100,
  });
  const impactMs = performance.now() - start;
  const expectedConsumers=["artifact-driven:adoption","story-driven:adoption"];
  const returnedConsumers=impact.data.flows.map(f=>f.logicalId);
  const missingConsumers=expectedConsumers.filter(id=>!returnedConsumers.includes(id));
  console.log(
    JSON.stringify(
      {
        initialIndexExists,
        hardware: {
          platform: platform(),
          cpu: cpus()[0]?.model,
          logicalCPUs: cpus().length,
          memoryGiB: totalmem() / 2 ** 30,
        },
        dataset: {
          path,
          selector: "planning",
          flows: (
            await service.query({ path, operation: "search", limit: 100 })
          ).pagination.total,
        },
        results,
        impact: {
          milliseconds: impactMs,
          source:"internal/adopt/adopt.go",expectedConsumers,returnedConsumers,missingConsumers,
          total: impact.pagination.total,
          coverage: impact.data.coverage,
          freshness: impact.freshness,
          completeness: impact.completeness,
        },
      },
      null,
      2,
    ),
  );
  if (missingConsumers.length || impact.freshness!=="fresh" || impact.completeness!=="complete" || results.some((r) => !r.rank || !r.semantic || r.freshness !== "fresh" || r.completeness!=="complete"))
    process.exitCode = 1;
} finally {
  await service.close();
}
