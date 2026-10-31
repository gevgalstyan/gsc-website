import { expect, test } from "@playwright/test";
test("missing build configuration never asks visitors to solve an absent CAPTCHA or sends Auth requests", async ({ page }) => {
  let requests = 0;
  await page.route("**/*", (route) => {
    if (route.request().url().startsWith("http://127.0.0.1:4173/")) return route.continue();
    requests++; return route.abort();
  });
  await page.goto("/signup/");
  await expect(page.getByText(/Registration and sign-in are temporarily unavailable/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Up", exact: true })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Contact the club", exact: true })).toHaveAttribute("href", "/contact/");
  await page.locator("form").evaluate((form: HTMLFormElement) => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  await expect(page.getByText("Please complete the security check before continuing.", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Check your email" })).toHaveCount(0);
  expect(requests).toBe(0);
});
