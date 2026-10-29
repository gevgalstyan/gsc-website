import { spawnSync } from "node:child_process";
const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", env: { ...process.env, GSC_AUTH_BUILD_MODE: "production" } });
process.exit(result.status ?? 1);
