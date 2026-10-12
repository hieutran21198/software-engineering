import test from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot } from "../src/model.js";
import { canvasGraph } from "../src/canvas.js";
import { sourceFixture } from "./fixtures.js";

test("B7: expanded element groups and reference endpoints preserve artifact edges", () => {
  const view = buildSnapshot(sourceFixture());
  const closed = canvasGraph(view, new Set());
  assert.equal(closed.nodes.filter((n) => n.type === "artifact").length, 3);
  assert.equal(closed.nodes.filter((n) => n.type === "element").length, 0);
  const open = canvasGraph(view, new Set(["authentication", "tenant"]));
  assert.equal(open.nodes.filter((n) => n.type === "element").length, 3);
  assert.ok(
    open.edges.some(
      (e) => e.id.startsWith("reference:") && e.source.startsWith("element:"),
    ),
  );
  assert.ok(open.nodes.some((n) => n.type === "missing"));
  assert.equal(
    open.edges.filter((e) => e.id.startsWith("dependency:")).length,
    closed.edges.length,
  );
  for (const node of open.nodes)
    assert.ok(
      Number.isFinite(node.position.x) && Number.isFinite(node.position.y),
    );
  for (const node of open.nodes.filter((n) => n.parentId))
    assert.ok(
      open.nodes.findIndex((n) => n.id === node.parentId) <
        open.nodes.indexOf(node),
    );
  const collapsedTarget = canvasGraph(view, new Set(["authentication"]));
  assert.ok(
    collapsedTarget.edges.some(
      (e) => e.id.startsWith("reference:") && e.source === "artifact:tenant",
    ),
  );
  const planning = canvasGraph(view, new Set(), true);
  assert.ok(
    !planning.edges.some((e) => e.id === "dependency:tenant:authentication"),
  );
  assert.ok(
    planning.edges.some((e) => e.id === "dependency:initial:authentication"),
  );
});
