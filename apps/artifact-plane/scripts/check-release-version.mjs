// Refuse a Plane release unless the tag plane-v<version> names the package version and
// current_version of docs/artifacts/artifact-plane/README.md. Exit 0 on a match, else 1.
// Usage: node scripts/check-release-version.mjs <tag> [repository root]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const [tag = "", root = fileURLToPath(new URL("../../..", import.meta.url))] = process.argv.slice(2);
const fail = (message) => {console.error(message);process.exit(1);};
const version = /^plane-v(\d+\.\d+\.\d+)$/.exec(tag)?.[1];
if (!version) fail(`The tag ${JSON.stringify(tag)} is not plane-v<major.minor.patch>.`);
const packageVersion = JSON.parse(readFileSync(join(root, "apps/artifact-plane/package.json"), "utf8")).version;
const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(join(root, "docs/artifacts/artifact-plane/README.md"), "utf8"))?.[1] ?? "";
const currentVersion = /^current_version:\s*["']?([^"'\s]+)/m.exec(frontMatter)?.[1];
if (packageVersion !== version) fail(`The package version ${packageVersion} differs from the tag version ${version}.`);
if (currentVersion !== version) fail(`current_version ${currentVersion} of artifact-plane differs from the tag version ${version}.`);
console.log(`The tag ${tag} matches the package version and current_version.`);
