import test from "node:test";
import assert from "node:assert/strict";
import { buildSnapshot, relationships } from "../src/model.js";
import { sourceFixture, rootReadme, element } from "./fixtures.js";

const snapshot = (files) => buildSnapshot(files);

test("B1-B5: versions, changes, proposed edges, and reference resolution", () => {
  const view = snapshot(sourceFixture());
  const initial = view.artifacts.find((a) => a.id === "initial");
  assert.equal(initial.currentVersion, null);
  assert.equal(initial.activeChange, "change-initial");
  assert.equal(initial.elements[0].source, "change:change-initial");
  assert.ok(
    view.edges.some(
      (e) =>
        e.source === "tenant" &&
        e.target === "authentication" &&
        e.status === "established",
    ),
  );
  assert.ok(
    view.edges.some(
      (e) => e.source === "tenant" && e.status === "proposed-remove",
    ),
  );
  assert.ok(
    view.edges.some(
      (e) => e.source === "initial" && e.status === "proposed-add",
    ),
  );
  assert.equal(
    view.references.find((r) => r.consumerSource === "version:1.0.0").resolved,
    true,
  );
  assert.equal(
    view.references.find((r) => r.consumerSource === "change:change-login")
      .resolved,
    false,
  );
  assert.ok(view.diagnostics.some((d) => d.code === "unresolved-reference"));
  assert.deepEqual(
    relationships("authentication", view.edges).upstream.direct,
    ["tenant"],
  );
  assert.deepEqual(
    relationships("authentication", view.edges, true).upstream.direct,
    ["initial"],
  );
  assert.deepEqual(relationships("tenant", view.edges).downstream.direct, [
    "authentication",
  ]);
});

test("does not choose newest snapshot; resolves explicitly proposed sources", () => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/tenant/versions/2.0.0/specifications/new.md",
    "# New",
  );
  files.set("docs/artifacts/tenant/changes/change-next/README.md", "# Next");
  files.set(
    "docs/artifacts/tenant/changes/change-next/specifications/new.md",
    "# Proposed new",
  );
  files.set(
    "docs/artifacts/authentication/changes/change-login/specifications/proposed.md",
    element(
      "tenant",
      "specifications/new.md",
      "    status: proposed\n    change: change-next\n",
    ),
  );
  const view = snapshot(files);
  assert.equal(
    view.artifacts.find((a) => a.id === "tenant").currentVersion,
    "1.0.0",
  );
  assert.ok(
    !view.artifacts
      .find((a) => a.id === "tenant")
      .elements.some((e) => e.source === "version:2.0.0"),
  );
  const proposed = view.references.find((r) => r.status === "proposed");
  assert.equal(proposed.targetSource, "change:change-next");
  assert.equal(proposed.resolved, true);
});

test("cycles, missing artifacts, and index disagreement remain inspectable", () => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/tenant/README.md",
    rootReadme("Tenant", "1.0.0", ["authentication", "absent"]),
  );
  const view = snapshot(files);
  for (const code of ["cycle", "missing-artifact", "index-disagreement"])
    assert.ok(
      view.diagnostics.some((d) => d.code === code),
      code,
    );
  assert.equal(view.artifacts.length, 3);
  assert.ok(
    !relationships("tenant", view.edges).upstream.transitive.includes("tenant"),
  );
});

test("conflicting metadata, multiple changes, and malformed YAML produce diagnostics", () => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/tenant/README.md",
    rootReadme("Tenant", "1.0.0") + "\n## Current version\n\n2.0.0\n",
  );
  files.set(
    "docs/artifacts/authentication/changes/change-other/README.md",
    "# Other",
  );
  files.set(
    "docs/artifacts/initial/changes/change-initial/dependencies.yaml",
    "artifact: [broken",
  );
  const view = snapshot(files);
  for (const code of ["ambiguous-version", "multiple-changes", "invalid-yaml"])
    assert.ok(
      view.diagnostics.some((d) => d.code === code),
      code,
    );
  assert.equal(
    view.artifacts.find((a) => a.id === "tenant").currentVersion,
    null,
  );
  assert.equal(
    view.artifacts.find((a) => a.id === "authentication").activeChange,
    null,
  );
});

test("supports documented Markdown sections and fenced YAML, rejects unsafe element paths", () => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/tenant/README.md",
    "# Tenant\n\n## Current established version\n\n[1.0.0](versions/1.0.0/)\n\n## Established dependencies\n\nNone.\n",
  );
  files.set(
    "docs/artifacts/authentication/README.md",
    "# Authentication\n\n## Current version\n\n`1.0.0`\n\n## Dependencies\n\n- [Tenant](../tenant/README.md)\n",
  );
  files.set(
    "docs/artifacts/authentication/versions/1.0.0/specifications/unsafe.md",
    element("tenant", "../../secret.md"),
  );
  const view = snapshot(files);
  assert.equal(
    view.artifacts.find((a) => a.id === "tenant").currentVersion,
    "1.0.0",
  );
  assert.ok(view.edges.some((e) => e.source === "tenant"));
  assert.equal(
    view.references.find((r) => r.element === "../../secret.md").resolved,
    false,
  );
  assert.ok(view.diagnostics.some((d) => d.code === "unsafe-reference"));
});

test("transitive reachability and proposed cycles are independent of established graph", () => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/initial/README.md",
    rootReadme("Initial", null, ["authentication"]),
  );
  const view = snapshot(files);
  assert.deepEqual(relationships("tenant", view.edges).downstream.transitive, [
    "authentication",
    "initial",
  ]);
  assert.ok(
    view.diagnostics.some(
      (d) => d.code === "cycle" && d.message.includes("planning"),
    ),
  );
});

test("invalid proposal payloads and invalid reference statuses are diagnosed", () => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/initial/changes/change-initial/dependencies.yaml",
    "false",
  );
  files.set(
    "docs/artifacts/authentication/versions/1.0.0/specifications/invalid.md",
    element("tenant", "specifications/identity.md", '    status: ""\n'),
  );
  const view = snapshot(files);
  assert.ok(view.diagnostics.some((d) => d.code === "invalid-proposal"));
  assert.ok(view.diagnostics.some((d) => d.code === "invalid-reference"));
});

test("metadata examples inside fenced code blocks do not override root declarations", () => {
  const files = sourceFixture();
  files.set(
    "docs/artifacts/tenant/README.md",
    rootReadme("Tenant", "1.0.0") +
      "\n```markdown\n## Current version\n\n2.0.0\n\n## Dependencies\n\n- authentication\n```\n",
  );
  const view = snapshot(files);
  assert.equal(
    view.artifacts.find((a) => a.id === "tenant").currentVersion,
    "1.0.0",
  );
  assert.ok(!view.diagnostics.some((d) => d.code === "ambiguous-version"));
});
