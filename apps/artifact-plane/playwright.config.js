import { defineConfig } from "@playwright/test";
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
process.env.ARTIFACT_PLANE_TEST_STATE_DIR ||= mkdtempSync(join(tmpdir(), "plane-browser-runtime-"));
process.env.ARTIFACT_PLANE_STATE_DIR = process.env.ARTIFACT_PLANE_TEST_STATE_DIR;
export default defineConfig({
  testDir: "./test/browser",
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4311",
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:4311",
    env: { PORT: "4311", ARTIFACT_PLANE_STATE_DIR: process.env.ARTIFACT_PLANE_TEST_STATE_DIR },
    reuseExistingServer: false,
  },
});
