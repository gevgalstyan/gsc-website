/** Regression tests for missing static build settings; produces MOCK artifacts only. */
import { spawnSync } from "node:child_process";
let code = 0;
try {
  for (const fixture of ["missing-captcha", "missing-supabase"]) {
    const env = { ...process.env, GSC_AUTH_TEST_FIXTURE: fixture };
    for (const script of ["test:auth:build", "test:auth:browser"]) {
      const result = spawnSync("npm", ["run", script], { stdio: "inherit", env });
      if (result.status !== 0) { code = result.status ?? 1; throw new Error(`Configuration fixture failed: ${fixture}`); }
    }
  }
} catch (error) { console.error(error.message); code ||= 1; }
finally {
  // Restore the normal mocked fixture for the complete browser suite. Still not deployable.
  const restored = spawnSync("npm", ["run", "test:auth:build"], { stdio: "inherit", env: { ...process.env, GSC_AUTH_TEST_FIXTURE: "" } });
  if (restored.status !== 0) code = restored.status ?? 1;
}
process.exitCode = code;
