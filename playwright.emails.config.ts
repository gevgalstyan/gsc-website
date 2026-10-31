import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/emails", workers: 1, fullyParallel: false,
  use: { baseURL: "http://127.0.0.1:4174", headless: true, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {} },
  projects: [{ name: "desktop", use: { viewport: { width: 1000, height: 900 } } }, { name: "iphone", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
  webServer: { command: "python3 -m http.server 4174 --bind 127.0.0.1 --directory /tmp/gsc-email-previews", url: "http://127.0.0.1:4174", reuseExistingServer: false },
});
