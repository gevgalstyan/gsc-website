import { spawnSync } from "node:child_process";
const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", env: { ...process.env, GSC_AUTH_BUILD_MODE: "production" } });
if (result.error) { console.error(`Build process could not run (${result.error.code ?? "unknown"}).`); process.exit(1); }
process.exit(result.status ?? 1);
