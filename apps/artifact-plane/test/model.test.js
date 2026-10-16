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

// In-place layout: identity from front matter only, working elements, open
// changes derived from version records, and legacy index files ignored.
import { inPlaceFixture, mixedFixture, identity, versionRecord, sourceFixture as legacyFixture } from "./fixtures.js";
test("L1: in-place identity comes from front matter only and Markdown declarations are ignored", () => {
  const view = buildSnapshot(inPlaceFixture());
  const tenant = view.artifacts.find((a) => a.id === "tenant");
  assert.equal(tenant.layout, "in-place");
  assert.equal(tenant.currentVersion, "1.0.0");
  assert.deepEqual(tenant.dependsOn, []);
  assert.deepEqual(view.edges.map(({ source, target, status }) => ({ source, target, status })), [{ source: "tenant", target: "authentication", status: "established" }]);
  assert.deepEqual(view.edges[0].explanations.map((x) => [x.consumerPath, x.element, x.reason, x.resolved]), [["specifications/login.md", "specifications/identity.md", "identity format", true]]);
  assert.ok(!view.diagnostics.some((d) => d.severity !== "info"), JSON.stringify(view.diagnostics));
  const login = view.artifacts.find((a) => a.id === "authentication").elements.find((e) => e.path === "specifications/login.md");
  assert.equal(login.source, "working");
  assert.equal(login.logicalId, "authentication:specifications/login.md");
  assert.equal(login.state, "unknown");
});
test("L1: a missing or malformed identity record is invalid without prose fallback", () => {
  for (const readme of ["# Tenant\n\n## Current version\n\n1.0.0\n", "---\ncurrent_version: one\n---\n# Tenant\n", "---\ncurrent_version: 1.0.0\ndepends_on: tenant\n---\n# Tenant\n"]) {
    const files = inPlaceFixture();
    files.set("docs/artifacts/tenant/README.md", readme);
    const view = buildSnapshot(files), tenant = view.artifacts.find((a) => a.id === "tenant");
    assert.ok(view.diagnostics.some((d) => d.code === "invalid-identity" && d.path === "docs/artifacts/tenant/README.md"), readme);
    assert.equal(tenant.layout, "in-place");
    assert.ok(tenant.currentVersion === null || readme.includes("depends_on: tenant"));
  }
});
test("L1: open changes derive from version records; copied-knowledge changes are retained legacy records", () => {
  const files = inPlaceFixture();
  files.set("docs/artifacts/authentication/changes/change-old/README.md", "# Old");
  files.set("docs/artifacts/authentication/changes/change-old/specifications/login.md", "# Copied");
  files.set("docs/artifacts/authentication/changes/change-login/dependencies.yaml", "artifact: authentication\nadd: [tenant]\nremove: []\n");
  files.set("docs/artifacts/dag.yaml", "artifacts:\n  tenant: {path: tenant, depends_on: [authentication]}\n");
  const view = buildSnapshot(files), auth = view.artifacts.find((a) => a.id === "authentication");
  assert.equal(auth.activeChange, "change-login");
  assert.deepEqual(auth.changes.map((c) => [c.name, c.layout, c.version]), [["change-initial", "in-place", "1.0.0"], ["change-login", "in-place", null], ["change-old", "legacy", null]]);
  const codes = view.diagnostics.map((d) => [d.code, d.severity]);
  assert.deepEqual(codes.filter(([, s]) => s !== "info"), []);
  for (const code of ["retained-legacy-change", "legacy-proposal-ignored", "legacy-index-ignored"]) assert.ok(codes.some(([c]) => c === code), code);
  assert.equal(view.edges.length, 1);
  files.set("docs/artifacts/authentication/changes/change-second/README.md", "# Second");
  assert.ok(buildSnapshot(files).diagnostics.some((d) => d.code === "multiple-changes"));
});
test("L1: knowledge directories under an in-place version record are reported", () => {
  const files = inPlaceFixture();
  files.set("docs/artifacts/tenant/versions/1.0.0/specifications/identity.md", "# Copy");
  const view = buildSnapshot(files);
  assert.ok(view.diagnostics.some((d) => d.code === "version-knowledge-copy" && d.path === "docs/artifacts/tenant/versions/1.0.0/README.md"));
  files.delete("docs/artifacts/tenant/versions/1.0.0/README.md");
  assert.ok(buildSnapshot(files).diagnostics.some((d) => d.code === "missing-version"));
});
test("L1: in-place references use front matter only; selectors have no effect", () => {
  const files = inPlaceFixture();
  files.set("docs/artifacts/authentication/specifications/fenced.md", "# Example\n\n```yaml\nreferences:\n  - artifact: tenant\n    element: specifications/missing.md\n    requires: example\n```\n");
  const view = buildSnapshot(files);
  assert.equal(view.references.length, 1);
  const [ref] = view.references;
  assert.equal(ref.resolved, true);
  assert.equal(ref.targetSource, "working");
  assert.equal(ref.status, "proposed");
  assert.ok(!view.diagnostics.some((d) => d.code === "unresolved-reference"));
});
test("L1: protected-ref baselines separate established and proposed facts", () => {
  const files = inPlaceFixture();
  files.set("docs/artifacts/authentication/README.md", identity("Authentication", "1.1.0", []));
  files.set("docs/artifacts/authentication/versions/1.1.0/README.md", versionRecord("change-login"));
  const status = new Map([["docs/artifacts/tenant/specifications/identity.md", "modified"]]);
  const view = buildSnapshot(files, {}, [], { baselines: {
    authentication: { state: "available", ref: "refs/heads/main", currentVersion: "1.0.0", dependsOn: ["tenant"], status: new Map(), removed: ["docs/artifacts/authentication/specifications/old.md"] },
    tenant: { state: "available", ref: "refs/heads/main", currentVersion: "1.0.0", dependsOn: [], status, removed: [] },
  } });
  const auth = view.artifacts.find((a) => a.id === "authentication");
  assert.equal(auth.currentVersion, "1.0.0");
  assert.equal(auth.proposedVersion, "1.1.0");
  assert.equal(auth.activeChange, null);
  assert.deepEqual(auth.removedKnowledge, ["docs/artifacts/authentication/specifications/old.md"]);
  assert.deepEqual(view.edges.map((e) => e.status), ["established", "proposed-remove"]);
  assert.equal(auth.elements.find((e) => e.path === "specifications/login.md").state, "added");
  assert.equal(view.references[0].status, "proposed");
});
test("L7: mixed repositories read both layouts; legacy results are unchanged", () => {
  const view = buildSnapshot(mixedFixture());
  const tenant = view.artifacts.find((a) => a.id === "tenant"), auth = view.artifacts.find((a) => a.id === "authentication");
  assert.equal(tenant.layout, "legacy");
  assert.equal(auth.layout, "in-place");
  assert.equal(view.references[0].targetSource, "version:1.0.0");
  assert.equal(view.references[0].resolved, true);
  const legacy = buildSnapshot(legacyFixture());
  assert.ok(legacy.artifacts.every((a) => a.layout === "legacy"));
});
