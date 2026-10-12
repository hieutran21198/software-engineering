import test from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot } from "../src/model.js";
import { orderingFixture } from "./fixtures.js";

test("B8: type-first, source-first, README-first, natural order is independent of discovery order", () => {
  const files = orderingFixture();
  const a = buildSnapshot(files).artifacts[0];
  const expected = [];
  for (const paths of [
    ["requirements/need.md"],
    ["specifications/contract.md"],
    ["decisions/choice.md"],
    [
      "tasks/README.md",
      "tasks/2-reader.md",
      "tasks/10-validation.md",
      "tasks/nested/2-detail.md",
      "tasks/nested/10-detail.md",
    ],
  ]) {
    for (const source of ["version:1.0.0", "change:change-next"])
      for (const path of paths) expected.push(`${source}/${path}`);
  }
  assert.deepEqual(
    a.elements.map((e) => `${e.source}/${e.path}`),
    expected,
  );
  const reverse = buildSnapshot(new Map([...files].reverse())).artifacts[0];
  assert.deepEqual(
    reverse.elements.map((e) => e.id),
    a.elements.map((e) => e.id),
  );
});
