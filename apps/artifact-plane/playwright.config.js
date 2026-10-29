import { defineConfig } from "@playwright/test";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
process.env.ARTIFACT_PLANE_TEST_STATE_DIR ||= mkdtempSync(join(tmpdir(), "plane-browser-runtime-"));
process.env.ARTIFACT_PLANE_STATE_DIR = process.env.ARTIFACT_PLANE_TEST_STATE_DIR;
// The suite never reads the personal agent settings: the server gets an empty configuration directory.
process.env.ARTIFACT_PLANE_TEST_CONFIG_DIR ||= mkdtempSync(join(tmpdir(), "plane-browser-config-"));
// A separate port lets parallel worktrees run the suite at the same time.
const port = process.env.PLAYWRIGHT_PORT || "4311";
export default defineConfig({
  testDir: "./test/browser",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm start",
    url: `http://127.0.0.1:${port}`,
    // Knowledge commits need an author; fixtures have no Git configuration.
    env: { PORT: port, ARTIFACT_PLANE_STATE_DIR: process.env.ARTIFACT_PLANE_TEST_STATE_DIR, ARTIFACT_PLANE_CONFIG_DIR: process.env.ARTIFACT_PLANE_TEST_CONFIG_DIR, GIT_AUTHOR_NAME: "Plane Test", GIT_AUTHOR_EMAIL: "plane-test@example.invalid", GIT_COMMITTER_NAME: "Plane Test", GIT_COMMITTER_EMAIL: "plane-test@example.invalid" },
    reuseExistingServer: false,
  },
});
