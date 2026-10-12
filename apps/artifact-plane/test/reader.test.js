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
