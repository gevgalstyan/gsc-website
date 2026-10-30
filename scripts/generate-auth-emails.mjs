/** Generate paste-ready Supabase templates locally. Never changes provider settings. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { authEmails } from "../supabase/auth-email-config.mjs";
const check = process.argv.includes("--check");
await mkdir("supabase/templates", { recursive: true });
const outputs = authEmails.flatMap((email) => [[`supabase/templates/${email.file}.html`, email.html], [`supabase/templates/${email.file}.txt`, email.text]]);
outputs.push(["supabase/templates/subjects.json", JSON.stringify(Object.fromEntries(authEmails.map(({ file, subject }) => [file, subject])), null, 2)+"\n"]);
for (const [path, content] of outputs) {
  if (check) {
    if (await readFile(path, "utf8") !== content) throw new Error(`Generated email is stale: ${path}`);
  } else await writeFile(path, content);
}
console.log(`${check ? "Checked" : "Generated"} ${authEmails.length} HTML/text template pairs and subjects. No remote configuration changed.`);
