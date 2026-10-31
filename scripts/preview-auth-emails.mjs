/** Optional local preview tool; never required by the website's build/runtime. */
import { spawnSync } from "node:child_process";
const executable = process.env.GSC_GO_EXECUTABLE || "go";
const version = spawnSync(executable, ["version"], { encoding: "utf8" });
if (version.error || version.status !== 0 || !/^go version go\d/.test(version.stdout ?? "")) {
  console.error("Email previews need a Go compiler. Install Go or set GSC_GO_EXECUTABLE to its trusted executable path. No email or remote setting was changed.");
  process.exit(1);
}
const result = spawnSync(executable, ["run", "scripts/render-auth-email-previews.go"], { stdio: "inherit" });
process.exit(result.error ? 1 : result.status ?? 1);
