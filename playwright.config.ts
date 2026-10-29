import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/auth", testMatch: process.env.GSC_AUTH_TEST_FIXTURE ? "auth-configuration.spec.ts" : "email-auth.spec.ts", fullyParallel: false, workers: 1, timeout: 30000,
  use: { baseURL: "http://127.0.0.1:4173", headless: true, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {} },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: "python3 -m http.server 4173 --bind 127.0.0.1 --directory out", url: "http://127.0.0.1:4173", reuseExistingServer: false },
});
