/** Legacy entry point: stages a template-only payload for review, with no remote writes.
 * SMTP, CAPTCHA, OAuth identities, Site URL, and account settings must be reviewed separately.
 */
import { writeFile } from "node:fs/promises";
import { authEmailConfig } from "../supabase/auth-email-config.mjs";
const path = "/tmp/gsc-auth-email-templates.json";
await writeFile(path, JSON.stringify(authEmailConfig, null, 2)+"\n", { mode: 0o600 });
console.log(`Prepared template-only settings for review at ${path}. No provider or Dashboard settings changed. See docs/BRANDED-AUTH-EMAILS.md for installation.`);
