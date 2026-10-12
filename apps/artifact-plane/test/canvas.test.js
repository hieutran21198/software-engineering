import test from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot } from "../src/model.js";
import { canvasGraph } from "../src/canvas.js";
import { typeKey, historyKey } from "../src/elements.js";
import { sourceFixture } from "./fixtures.js";

test("B7: expanded element groups and reference endpoints preserve artifact edges", () => {
  const view = buildSnapshot(sourceFixture());
  const closed = canvasGraph(view, new Set());
  assert.equal(closed.nodes.filter((n) => n.type === "artifact").length, 3);
  assert.equal(closed.nodes.filter((n) => n.type === "element").length, 0);
  const open = canvasGraph(
    view,
    new Set(["authentication", "tenant"]),
    false,
    new Set([
      typeKey("authentication", "specifications"),
      historyKey("authentication"), historyKey("authentication", "change:change-login"), typeKey("authentication", "specifications", "change:change-login"),
      typeKey("tenant", "specifications"),
    ]),
  );
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
  const collapsedTarget = canvasGraph(
    view,
    new Set(["authentication"]),
    false,
    new Set([typeKey("authentication", "specifications"), historyKey("authentication"), historyKey("authentication", "change:change-login"), typeKey("authentication", "specifications", "change:change-login")]),
  );
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

test("B8-B9: type groups start closed, ordered visible records use compact positions, hidden targets route through artifact", async () => {
  const { orderingFixture } = await import("./fixtures.js");
  const view = buildSnapshot(orderingFixture());
  const collapsed = canvasGraph(view, new Set(["knowledge"]));
  assert.equal(collapsed.nodes.filter((n) => n.type === "element").length, 0);
  const artifact = collapsed.nodes.find((n) => n.type === "artifact");
  assert.deepEqual(
    artifact.data.groups.map((g) => g.label),
    ["Requirements", "Specifications", "Decisions", "Tasks", "Change histories"],
  );
  assert.deepEqual(
    artifact.data.groups.map((g) => g.count),
    [1, 1, 1, 5, 1],
  );
  const open = canvasGraph(
    view,
    new Set(["knowledge"]),
    false,
    new Set([
      typeKey("knowledge", "tasks"),
      typeKey("knowledge", "specifications"), historyKey("knowledge"), historyKey("knowledge", "change:change-next"), typeKey("knowledge", "specifications", "change:change-next"), typeKey("knowledge", "tasks", "change:change-next"),
    ]),
  );
  const records = open.nodes.filter((n) => n.type === "element");
  assert.deepEqual(
    records.map((n) => n.data.element.id),
    view.artifacts[0].elements
      .filter((e) => ["tasks", "specifications"].includes(e.path.split("/")[0]))
      .sort((a,b) => Number(a.source.startsWith("change:")) - Number(b.source.startsWith("change:")))
      .map((e) => e.id),
  );
  for (const n of records) assert.equal(n.style.height, 52);
  for (let i = 1; i < records.length; i++)
    assert.ok(records[i].position.y - records[i - 1].position.y >= 60);
  assert.ok(
    open.edges.some(
      (e) => e.id.startsWith("reference:") && e.source === "artifact:knowledge",
    ),
  );
  assert.equal(
    collapsed.edges.filter((e) => e.id.startsWith("reference:")).length,
    0,
  );
});
