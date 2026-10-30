import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
const files = ["verification", "password-reset", "email-change", "magic-link", "invitation", "reauthentication", "password-changed"];
const types: Record<string,string> = { verification:"signup", "password-reset":"recovery", "email-change":"email_change", "magic-link":"magiclink", invitation:"invite" };
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => route.request().url().startsWith("http://127.0.0.1:4174") ? route.continue() : route.abort());
});
for (const file of files) test(`${file} is readable with images blocked and has a correct action`, async ({ page }, info) => {
  const response=await page.goto(`/${file}-personalized.html`);
  expect(response?.status()).toBe(200);
  await expect(page.getByText("GALSTYAN’S SPEAKING CLUB",{exact:true})).toBeVisible();
  await expect(page.getByText("Hi Anastasia,",{exact:true})).toBeVisible();
  await expect(page.locator("h1")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const links=await page.locator("a").evaluateAll(nodes => nodes.map(node => (node as HTMLAnchorElement).href));
  for (const link of links) {
    const url=new URL(link); expect(url.origin).toBe("https://galstyansspeakingclub.ru");
    if (url.searchParams.has("token_hash")) {
      expect(url.pathname).toBe("/auth/confirm/"); expect(url.searchParams.get("token_hash")).toBe("a".repeat(64));
      expect(url.searchParams.get("type")).toBe(types[file]); expect(url.searchParams.get("next")).toMatch(/^\/(account|reset-password)\/$/);
    }
  }
  if (types[file]) expect(links.filter(link=>link.includes("token_hash="))).toHaveLength(2);
  if (["verification","password-reset"].includes(file)) {
    await mkdir("docs/email-previews",{recursive:true});
    await page.screenshot({path:info.outputPath(`${file}-images-blocked.png`),fullPage:true});
    // Review screenshots load only the existing repository logo; no remote requests.
    await page.route("https://galstyansspeakingclub.ru/gsc-logo.jpg",route=>route.fulfill({path:"public/gsc-logo.jpg",contentType:"image/jpeg"}));
    await page.reload(); await expect.poll(()=>page.locator("img").evaluate(node=>(node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await page.screenshot({path:`docs/email-previews/${file}-${info.project.name}.png`,fullPage:true});
  }
});
test("missing names fall back naturally and HTML-like names stay text",async ({page})=>{
  await page.goto("/verification-fallback.html"); await expect(page.getByText("Hi there,",{exact:true})).toBeVisible();
  await page.goto("/verification-escaped.html");
  await expect(page.getByText("Hi <img src=x onerror=alert(1)>,",{exact:true})).toBeVisible();
  await expect(page.locator("img[onerror]")).toHaveCount(0);
});
