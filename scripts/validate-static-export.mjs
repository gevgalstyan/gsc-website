import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("out");
const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
let checked = 0;
const assets = new Set();
for (const route of Object.keys(manifest.routes)) {
  // Next's virtual global error boundary has no separately exported URL.
  if (route === "/_global-error") continue;
  const relative = route === "/" ? "index.html" : route.includes(".") ? route.slice(1) : `${route.slice(1)}/index.html`;
  const content = await readFile(path.join(root, relative), "utf8");
  assert.ok(content.length > 0, `Empty export: ${route}`);
  if (relative.endsWith(".html")) {
    assert.match(content, /<html\b/i, `Missing HTML: ${route}`);
    assert.match(content, /<title>[^<]+<\/title>/i, `Missing title: ${route}`);
    for (const match of content.matchAll(/(?:src|href)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
      if (match[1].startsWith("/_next/") || /\.(?:jpg|png|svg|webp|ico)$/.test(match[1])) assets.add(match[1]);
    }
  }
  checked++;
}
for (const asset of assets) await access(path.join(root, decodeURIComponent(asset)));
await access(path.join(root, "404.html"));
console.log(`Validated ${checked} exported routes, 404.html, and ${assets.size} local assets. This checks artifacts, not live Supabase behavior.`);
