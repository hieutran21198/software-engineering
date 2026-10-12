import {
  mkdtemp,
  mkdir,
  writeFile,
  rm,
  readdir,
  readFile,
  lstat,
} from "node:fs/promises";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

export const rootReadme = (name, version, dependencies = []) =>
  `---\ncurrent_version: ${version || "null"}\ndepends_on: ${JSON.stringify(dependencies)}\n---\n# ${name}\n\n${name} knowledge.\n`;
export const element = (artifact, path, extra = "") =>
  `# Login rules\n\n\`\`\`yaml\nreferences:\n  - artifact: ${artifact}\n    element: ${path}\n    requires: identity format\n${extra}\`\`\`\n`;

// B1-B6 share this source fixture. B7 uses the same repository in browser tests.
export function sourceFixture() {
  return new Map([
    ["docs/artifacts/tenant/README.md", rootReadme("Tenant", "1.0.0")],
    [
      "docs/artifacts/authentication/README.md",
      rootReadme("Authentication", "1.0.0", ["tenant"]),
    ],
    ["docs/artifacts/initial/README.md", rootReadme("Initial", null)],
    [
      "docs/artifacts/dag.yaml",
      "artifacts:\n  tenant: {path: tenant, depends_on: []}\n  authentication: {path: authentication, depends_on: [tenant]}\n  initial: {path: initial, depends_on: []}\n",
    ],
    [
      "docs/artifacts/tenant/versions/1.0.0/specifications/identity.md",
      "# Identity\n\nStable identity rules.",
    ],
    [
      "docs/artifacts/authentication/versions/1.0.0/specifications/login.md",
      element("tenant", "specifications/identity.md"),
    ],
    [
      "docs/artifacts/authentication/changes/change-login/README.md",
      "# Login change",
    ],
    [
      "docs/artifacts/authentication/changes/change-login/specifications/login.md",
      element("tenant", "specifications/missing.md"),
    ],
    [
      "docs/artifacts/authentication/changes/change-login/dependencies.yaml",
      "artifact: authentication\nadd: [initial]\nremove: [tenant]\n",
    ],
    [
      "docs/artifacts/initial/changes/change-initial/README.md",
      "# Initial change",
    ],
    [
      "docs/artifacts/initial/changes/change-initial/specifications/new.md",
      "# Proposed initial knowledge",
    ],
  ]);
}

export function git(root, ...args) {
  return execFileSync(
    "git",
    ["-c", "core.fsmonitor=false", "-C", root, ...args],
    {
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    },
  ).trim();
}
export async function fixtureRepository(files = sourceFixture()) {
  const root = await mkdtemp(join(tmpdir(), "artifact-plane-"));
  for (const [path, contents] of files) {
    await mkdir(join(root, path, ".."), { recursive: true });
    await writeFile(join(root, path), contents);
  }
  git(root, "init", "-q", "-b", "main");
  git(root, "add", ".");
  git(
    root,
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "-qm",
    "fixture",
  );
  await writeFile(join(root, "untracked.txt"), "Preserve this file.");
  return { root, cleanup: () => rm(root, { recursive: true, force: true }) };
}
export async function fingerprint(root) {
  const result = {};
  async function walk(dir) {
    for (const name of (await readdir(dir)).sort()) {
      const path = join(dir, name);
      const stat = await lstat(path);
      if (stat.isDirectory()) await walk(path);
      else if (stat.isFile())
        result[relative(root, path)] = (await readFile(path)).toString(
          "base64",
        );
    }
  }
  await walk(root);
  return result;
}

export function orderingFixture() {
  const files = new Map([
    ["docs/artifacts/knowledge/README.md", rootReadme("Knowledge", "1.0.0")],
    ["docs/artifacts/knowledge/changes/change-next/README.md", "# Next change"],
  ]);
  const paths = [
    "tasks/10-validation.md",
    "decisions/choice.md",
    "tasks/2-reader.md",
    "tasks/README.md",
    "specifications/contract.md",
    "requirements/need.md",
    "tasks/nested/10-detail.md",
    "tasks/nested/2-detail.md",
  ];
  for (const source of ["changes/change-next", "versions/1.0.0"]) {
    for (const path of paths)
      files.set(
        `docs/artifacts/knowledge/${source}/${path}`,
        `# ${path}\n\nKnowledge ${source}.`,
      );
  }
  files.set(
    "docs/artifacts/knowledge/changes/change-next/specifications/contract.md",
    element("knowledge", "requirements/need.md"),
  );
  return files;
}
