import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdir, symlink, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exploreRepository } from "../server/reader.js";
import { fixtureRepository, fingerprint, git } from "./fixtures.js";

test("B6: real Git/Markdown reads preserve files and Git state, refresh rereads", async (t) => {
  const fixture = await fixtureRepository();
  t.after(fixture.cleanup);
  const before = await fingerprint(fixture.root),
    status = git(fixture.root, "status", "--porcelain=v1");
  const view = await exploreRepository(fixture.root);
  assert.equal(view.repository.branch, "main");
  assert.equal(view.repository.dirty, true);
  assert.equal(view.artifacts.length, 3);
  await exploreRepository(fixture.root);
  assert.deepEqual(await fingerprint(fixture.root), before);
  assert.equal(git(fixture.root, "status", "--porcelain=v1"), status);
  const path = join(
    fixture.root,
    "docs/artifacts/tenant/versions/1.0.0/specifications/identity.md",
  );
  await writeFile(path, "# Updated identity");
  assert.ok(
    (await exploreRepository(fixture.root)).artifacts
      .find((a) => a.id === "tenant")
      .elements[0].markdown.includes("Updated"),
  );
});
test("escaping symlinks cannot leak contents and valid records remain inspectable", async (t) => {
  const fixture = await fixtureRepository();
  t.after(fixture.cleanup);
  const outside = await mkdtemp(join(tmpdir(), "plane-outside-"));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await writeFile(join(outside, "secret.md"), "# DO NOT LEAK");
  await symlink(
    join(outside, "secret.md"),
    join(
      fixture.root,
      "docs/artifacts/tenant/versions/1.0.0/specifications/escape.md",
    ),
  );
  await mkdir(join(fixture.root, "docs/artifacts/tenant/changes"), {
    recursive: true,
  });
  await symlink(
    outside,
    join(fixture.root, "docs/artifacts/tenant/changes/change-escape"),
  );
  const view = await exploreRepository(fixture.root);
  assert.ok(view.diagnostics.some((d) => d.code === "unsafe-path"));
  assert.ok(!JSON.stringify(view).includes("DO NOT LEAK"));
  assert.equal(view.artifacts.length, 3);
});
test("invalid roots, missing ADD directory, and nested paths return typed errors", async (t) => {
  await assert.rejects(exploreRepository("relative"), (e) => e.status === 400);
  await assert.rejects(
    exploreRepository("/does/not/exist/plane"),
    (e) => e.status === 404,
  );
  const fixture = await fixtureRepository();
  t.after(fixture.cleanup);
  await mkdir(join(fixture.root, "subdir"));
  await assert.rejects(
    exploreRepository(join(fixture.root, "subdir")),
    (e) => e.status === 422,
  );
  await rm(join(fixture.root, "docs"), { recursive: true });
  await assert.rejects(
    exploreRepository(fixture.root),
    (e) => e.status === 404,
  );
});

test("knowledge symlinks cannot expose Git metadata", async (t) => {
  const fixture = await fixtureRepository();
  t.after(fixture.cleanup);
  await symlink(
    join(fixture.root, ".git/config"),
    join(
      fixture.root,
      "docs/artifacts/tenant/versions/1.0.0/specifications/git.md",
    ),
  );
  const view = await exploreRepository(fixture.root);
  assert.ok(
    !view.artifacts
      .find((a) => a.id === "tenant")
      .elements.some((e) => e.path === "specifications/git.md"),
  );
  assert.ok(view.diagnostics.some((d) => d.code === "unsafe-path"));
});

import { scanRepository } from "../server/reader.js";
import { inPlaceFixture, mixedFixture, transitionRepository } from "./fixtures.js";
test("L1/L2: in-place scans read root knowledge and protected-ref baselines without changing bytes", async (t) => {
  const fixture = await fixtureRepository(inPlaceFixture());
  t.after(fixture.cleanup);
  const before = await fingerprint(fixture.root);
  const { snapshot, baselines } = await scanRepository(fixture.root);
  const auth = snapshot.artifacts.find((a) => a.id === "authentication");
  assert.equal(auth.layout, "in-place");
  assert.equal(auth.baseline.state, "available");
  assert.equal(baselines.authentication.layout, "in-place");
  assert.deepEqual([...new Set(auth.elements.filter((e) => e.source === "working").map((e) => e.state))], ["unchanged"]);
  assert.equal(snapshot.references[0].status, "established");
  assert.equal(auth.activeChange, "change-login");
  assert.ok(auth.elements.some((e) => e.source === "change:change-login" && e.path === "tasks/README.md"));
  assert.deepEqual(await fingerprint(fixture.root), before);
});
test("L2: a transition branch compares in-place knowledge with the legacy snapshot on main", async (t) => {
  const fixture = await transitionRepository();
  t.after(fixture.cleanup);
  const { snapshot } = await scanRepository(fixture.root);
  const tenant = snapshot.artifacts[0];
  assert.equal(tenant.baseline.layout, "legacy");
  assert.equal(tenant.currentVersion, "1.0.0");
  assert.equal(tenant.proposedVersion, "1.1.0");
  assert.deepEqual(Object.fromEntries(tenant.elements.filter((e) => e.source === "working").map((e) => [e.path, e.state])), { "specifications/identity.md": "unchanged", "specifications/new.md": "added" });
  assert.deepEqual(tenant.removedKnowledge, ["docs/artifacts/tenant/versions/1.0.0/specifications/retired.md"]);
  assert.ok(!snapshot.diagnostics.some((d) => d.severity !== "info"), JSON.stringify(snapshot.diagnostics));
});
test("L2: missing or disagreeing protected refs leave established in-place knowledge unknown", async (t) => {
  const fixture = await fixtureRepository(inPlaceFixture());
  t.after(fixture.cleanup);
  git(fixture.root, "branch", "master");
  await writeFile(join(fixture.root, "docs/artifacts/tenant/specifications/identity.md"), "# Changed");
  git(fixture.root, "checkout", "-q", "master");
  git(fixture.root, "-c", "user.name=F", "-c", "user.email=f@example.invalid", "commit", "-qam", "diverge");
  let { snapshot } = await scanRepository(fixture.root);
  assert.equal(snapshot.artifacts.find((a) => a.id === "tenant").baseline.state, "unknown");
  assert.ok(snapshot.diagnostics.some((d) => d.code === "baseline-disagreement"));
  git(fixture.root, "checkout", "-q", "--detach");
  git(fixture.root, "branch", "-q", "-D", "main", "master");
  ({ snapshot } = await scanRepository(fixture.root));
  assert.ok(snapshot.diagnostics.some((d) => d.code === "missing-protected-ref"));
  assert.ok(snapshot.artifacts.every((a) => a.baseline.state === "unknown"));
});
test("L7: mixed repositories load both layouts and keep legacy version knowledge", async (t) => {
  const fixture = await fixtureRepository(mixedFixture());
  t.after(fixture.cleanup);
  const { snapshot, files } = await scanRepository(fixture.root);
  assert.deepEqual(snapshot.artifacts.map((a) => [a.id, a.layout]), [["authentication", "in-place"], ["tenant", "legacy"]]);
  assert.ok(files.has("docs/artifacts/tenant/versions/1.0.0/specifications/identity.md"));
  assert.equal(snapshot.references[0].resolved, true);
});
