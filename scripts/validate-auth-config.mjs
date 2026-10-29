import nextEnv from "@next/env";
import { authConfigurationErrors } from "./auth-configuration.mjs";
nextEnv.loadEnvConfig(process.cwd(), false);
const testBuild = process.env.GSC_AUTH_BUILD_MODE === "test" && !process.argv.includes("--require-auth");
const errors = authConfigurationErrors(process.env, { testBuild });
if (errors.length) {
  console.error("Auth build configuration is incomplete; no deployable build will be produced.");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(testBuild ? "MOCK AUTH BUILD — for automated tests only. Never deploy out/." : "Public Auth build configuration is present. Real CAPTCHA, email delivery, redirects and permissions still require verification.");
