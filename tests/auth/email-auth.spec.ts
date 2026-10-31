import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
const pageErrors = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }) => expect(pageErrors.get(page) ?? []).toEqual([]));
const backend = "https://gsc-auth-test.supabase.co";
const user = { id: "22222222-2222-2222-2222-222222222222", aud: "authenticated", role: "authenticated", email: "member@example.invalid", email_confirmed_at: "2026-10-29T00:00:00Z", created_at: "2026-10-29T00:00:00Z", app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {} };
const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now()/1000)+3600, aud: "authenticated", role: "authenticated" })).toString("base64url")}.test-signature`;
const session = { access_token: jwt, refresh_token: "test-refresh-not-real", token_type: "bearer", expires_in: 3600, user };
async function captcha(page: Page) { await page.getByRole("button", { name: "Complete test CAPTCHA", exact: true }).click(); }
async function registration(page: Page) {
  await page.getByLabel("First name", { exact: true }).fill("Ani");
  await page.getByLabel("Surname", { exact: true }).fill("Test");
  await page.getByLabel("Age", { exact: true }).fill("0");
  await page.getByLabel("Nationality", { exact: true }).fill("Armenia");
  await page.getByLabel("Gender", { exact: true }).selectOption("Prefer not to say");
  await page.getByLabel("Email address", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
  await page.getByLabel("Confirm password", { exact: true }).fill("TestPassword123!");
  await page.getByRole("checkbox").check();
}
test.beforeEach(async ({ page }) => {
  pageErrors.set(page, []); page.on("pageerror", (error) => pageErrors.get(page)?.push(error.message));
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith("http://127.0.0.1:4173")) return route.continue();
    if (url.startsWith("https://challenges.cloudflare.com/turnstile/v0/api.js")) return route.fulfill({ contentType: "application/javascript", body: `window.turnstile={render:(el,opts)=>{const b=document.createElement('button');b.type='button';b.textContent='Complete test CAPTCHA';b.onclick=()=>opts.callback('mock-captcha-token');el.append(b);return 'test-widget'},remove:()=>{}};` });
    if (url.startsWith(backend)) {
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
      return route.fulfill({ status: 200, json: [] });
    }
    return route.abort();
  });
});
test("registration validates all fields, preserves privacy, sends CAPTCHA, and prevents duplicates", async ({ page }) => {
  let calls = 0;
  await page.route(`${backend}/auth/v1/signup**`, async (route) => {
    calls++; const data = route.request().postDataJSON();
    expect(data.data.first_name).toBe("Ani"); expect(data.data.surname).toBe("Test"); expect(data.data.age).toBe(0);
    expect(data.data.terms_accepted).toBe(true); expect(data.data.role).toBeUndefined(); expect(data.gotrue_meta_security.captcha_token).toBe("mock-captcha-token");
    await new Promise((r) => setTimeout(r, 200));
    await route.fulfill({ json: { user: { ...user, email_confirmed_at: null }, session: null } });
  });
  await page.goto("/signup/");
  await expect(page.getByText(/Continue with Google/)).toHaveCount(0);
  await captcha(page); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByText("Enter your first name.", { exact: true })).toBeVisible(); expect(calls).toBe(0);
  await registration(page);
  await page.getByLabel("Confirm password", { exact: true }).fill("mismatch"); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByText("Passwords do not match.", { exact: true })).toBeVisible(); expect(calls).toBe(0);
  await page.getByLabel("Confirm password", { exact: true }).fill("TestPassword123!");
  await page.getByRole("button", { name: "Show password", exact: true }).click(); await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign Up", exact: true }).evaluate((el: HTMLButtonElement) => { el.click(); el.click(); });
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible(); expect(calls).toBe(1);
  await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test("login and recovery pass CAPTCHA and handle unconfirmed accounts", async ({ page }) => {
  await page.route(`${backend}/auth/v1/token**`, async (route) => {
    expect(route.request().postDataJSON().gotrue_meta_security.captcha_token).toBe("mock-captcha-token");
    await route.fulfill({ status: 400, headers: { "x-supabase-api-version": "2024-01-01", "access-control-expose-headers": "X-Supabase-Api-Version" }, json: { code: "email_not_confirmed", msg: "Email not confirmed" } });
  });
  await page.goto("/login/"); await page.getByLabel("Email address").fill(user.email); await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
  await expect(page.getByRole("button", { name: "Log In", exact: true })).toBeDisabled(); await captcha(page);
  await page.getByRole("button", { name: "Log In", exact: true }).click(); await expect(page.getByText(/Please verify your email/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend verification email", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await page.route(`${backend}/auth/v1/recover**`, async (route) => {
    expect(route.request().postDataJSON().gotrue_meta_security.captcha_token).toBe("mock-captcha-token");
    expect(route.request().url()).toContain("redirect_to=");
    await route.fulfill({ json: {} });
  });
  await page.getByLabel("Email address").fill(user.email); await captcha(page); await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
});
test("verification displays success and blocks external next destinations", async ({ page }) => {
  await page.route(`${backend}/auth/v1/verify**`, async (route) => { expect(route.request().postDataJSON().type).toBe("signup"); await route.fulfill({ json: session }); });
  await page.route(`${backend}/auth/v1/user**`, (route) => route.fulfill({ json: user }));
  await page.goto("/auth/confirm/?token_hash="+"x".repeat(30)+"&type=signup&next=https://attacker.invalid/");
  await expect(page).not.toHaveURL(/token_hash/);
  await page.getByRole("button", { name: "Verify Email", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Email verified", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open my member dashboard" })).toHaveAttribute("href", "/account/");
});
test("invalid verification and reset links provide recovery actions", async ({ page }) => {
  await page.goto("/auth/confirm/?token_hash=invalid&type=signup");
  await expect(page.getByRole("heading", { name: "Verification link incomplete" })).toBeVisible();
  await page.goto("/reset-password/"); await expect(page.getByText(/This reset link is invalid or expired/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute("href", "/forgot-password/");
});
test("recovery verification allows matching password update then requires login", async ({ page }) => {
  await page.route(`${backend}/auth/v1/verify**`, (route) => route.fulfill({ json: session }));
  let updates = 0;
  await page.route(`${backend}/auth/v1/user**`, async (route) => {
    if (route.request().method() === "PUT") { updates++; expect(route.request().postDataJSON().password).toBe("NewPassword123!"); }
    await route.fulfill({ json: user });
  });
  await page.route(`${backend}/auth/v1/logout**`, (route) => route.fulfill({ status: 204 }));
  await page.goto("/auth/confirm/?token_hash="+"r".repeat(30)+"&type=recovery"); await page.getByRole("button", { name: "Continue to reset password" }).click();
  await page.getByLabel("New password", { exact: true }).fill("NewPassword123!"); await page.getByLabel("Confirm password", { exact: true }).fill("mismatch");
  await page.getByRole("button", { name: "Update password" }).click(); await expect(page.getByText("Passwords do not match.")).toBeVisible(); expect(updates).toBe(0);
  await page.getByLabel("Confirm password", { exact: true }).fill("NewPassword123!"); await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText(/Your password has been updated/)).toBeVisible(); expect(updates).toBe(1);
  await expect(page.getByRole("link", { name: "Log In", exact: true })).toBeVisible();
});
test("verification resend enforces cooldown and forwards the security token", async ({ page }) => {
  await page.clock.install(); let requests = 0;
  await page.route(`${backend}/auth/v1/resend**`, async (route) => {
    requests++; const body = route.request().postDataJSON(); expect(body.type).toBe("signup"); expect(body.gotrue_meta_security.captcha_token).toBe("mock-captcha-token"); await route.fulfill({ json: {} });
  });
  await page.goto("/verify-email/"); await page.getByLabel("Email address").fill(user.email); await captcha(page); await page.getByRole("button", { name: "Send verification email" }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible(); await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  await captcha(page); await page.clock.fastForward(61000);
  await page.getByRole("button", { name: "Resend verification email", exact: true }).click(); expect(requests).toBe(2);
});
test("successful email login goes to a same-site member destination", async ({ page }) => {
  await page.route(`${backend}/rest/v1/profiles**`, (route) => route.fulfill({ json: { id: user.id, display_name: "Test member", onboarding_completed: true, created_at: user.created_at } }));
  await page.route(`${backend}/auth/v1/token**`, (route) => route.fulfill({ json: session }));
  await page.route(`${backend}/auth/v1/user**`, (route) => route.fulfill({ json: user }));
  await page.goto("/login/?next=//attacker.invalid/"); await page.getByLabel("Email address").fill(user.email); await page.getByLabel("Password", { exact: true }).fill("TestPassword123!"); await captcha(page); await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:4173\/account\//);
});
test("CAPTCHA failures are friendly and require a new token", async ({ page }) => {
  await page.route(`${backend}/auth/v1/signup**`, (route) => route.fulfill({ status: 400, json: { error_code: "captcha_failed", msg: "Failed" } }));
  await page.goto("/signup/"); await registration(page); await captcha(page); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByText("The security check failed. Please complete it again and retry.")).toBeVisible(); await expect(page.getByRole("button", { name: "Sign Up", exact: true })).toBeDisabled();
});
test("signup stays within a narrow mobile viewport and supports reduced motion", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 800 }); await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/signup/");
  await expect(page.getByLabel("First name", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("signup-mobile.png"), fullPage: true });
});

test("all static exports load with browser hydration and local assets", async ({ page }) => {
  const manifest = JSON.parse(await readFile(".next/prerender-manifest.json", "utf8"));
  for (const route of Object.keys(manifest.routes)) {
    if (route === "/_global-error") continue;
    const target = route === "/" || route.includes(".") ? route : route + "/";
    const response = await page.goto(target, { waitUntil: "networkidle" });
    expect(response?.status(), route).toBe(200);
    if (!route.includes(".")) expect(await page.locator("body").innerText(), route).not.toBe("");
  }
});
test("a broken CAPTCHA widget fails closed with a friendly message", async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js**", (route) => route.fulfill({ contentType: "application/javascript", body: "window.turnstile={render:()=>{throw new Error('test widget failure')},remove:()=>{}};" }));
  await page.goto("/signup/"); await expect(page.getByText("The security check could not start. Please reload and try again later.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Up", exact: true })).toBeDisabled();
});
test("auto-confirmed signup never falsely promises a verification email", async ({ page }) => {
  await page.route(`${backend}/auth/v1/signup**`, (route) => route.fulfill({ json: session }));
  await page.route(`${backend}/auth/v1/logout**`, (route) => route.fulfill({ status: 204 }));
  await page.goto("/signup/"); await registration(page); await captcha(page); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByText(/Email verification is unavailable right now/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Request received" })).toHaveCount(0);
});
test("SMTP recipient restrictions give an actionable error, not a false email success", async ({ page }) => {
  await page.route(`${backend}/auth/v1/signup**`, (route) => route.fulfill({ status: 400, json: { error_code: "email_address_not_authorized", msg: "Recipient restricted" } }));
  await page.goto("/signup/"); await registration(page); await captcha(page); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByText("Email access is unavailable right now. Please contact the club for help.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Request received" })).toHaveCount(0);
});
test("verified members retain their dashboard and can save only requested profile fields", async ({ page }) => {
  const profile = { id: user.id, display_name: "Existing member", first_name: "Ani", surname: "Test", age: 20, nationality: "Armenia", gender: "Prefer not to say", email: user.email, onboarding_completed: true, created_at: user.created_at };
  await page.route(`${backend}/auth/v1/token**`, (route) => route.fulfill({ json: session }));
  await page.route(`${backend}/auth/v1/user**`, (route) => route.fulfill({ json: user }));
  let updates = 0;
  await page.route(`${backend}/rest/v1/profiles**`, async (route) => {
    if (route.request().method() === "PATCH") {
      updates++; const fields = route.request().postDataJSON();
      expect(fields.first_name).toBe("Updated"); expect(fields.surname).toBe("Test"); expect(fields.age).toBe(20);
      expect(fields.email).toBeUndefined(); expect(fields.role).toBeUndefined();
      await route.fulfill({ json: { id: user.id } });
    } else await route.fulfill({ json: profile });
  });
  await page.goto("/login/"); await page.getByLabel("Email address").fill(user.email); await page.getByLabel("Password", { exact: true }).fill("TestPassword123!"); await captcha(page); await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page).toHaveURL(/\/account\//);
  const details = page.getByRole("region", { name: "Personal details" });
  await expect(details.getByLabel("First name", { exact: true })).toHaveValue("Ani");
  await details.getByLabel("First name", { exact: true }).fill("Updated"); await details.getByRole("button", { name: "Save personal details" }).click();
  await expect(details.getByText("Personal details saved.")).toBeVisible(); expect(updates).toBe(1);
});

test("duplicate or Google signup response stays private and offers existing-account recovery", async ({ page }) => {
  await page.route(`${backend}/auth/v1/signup**`, (route) => route.fulfill({ json: { user: { ...user, identities: [] }, session: null } }));
  await page.goto("/signup/"); await registration(page); await captcha(page); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Request received" })).toBeVisible();
  await expect(page.getByText(/does not confirm that an account was created or an email was sent/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password", exact: true })).toHaveAttribute("href", "/forgot-password/");
  await expect(page.getByText(/already exists/i)).toHaveCount(0);
});
test("signup network and SMTP errors never report success", async ({ page }) => {
  await page.route(`${backend}/auth/v1/signup**`, (route) => route.fulfill({ status: 500, json: { error_code: "unexpected_failure", msg: "Error sending confirmation email" } }));
  await page.goto("/signup/"); await registration(page); await captcha(page); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByText(/authentication service could not complete/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Request received" })).toHaveCount(0);
  await page.route(`${backend}/auth/v1/signup**`, (route) => route.fulfill({ json: { user: null, session: null } }));
  await captcha(page); await page.getByRole("button", { name: "Sign Up", exact: true }).click();
  await expect(page.getByText(/incomplete response/)).toBeVisible();
});
test("expired recovery token does not allow a password change", async ({ page }) => {
  let writes = 0;
  await page.route(`${backend}/auth/v1/verify**`, (route) => route.fulfill({ status: 403, json: { error_code: "otp_expired", msg: "Expired" } }));
  await page.route(`${backend}/auth/v1/user**`, async (route) => { if (route.request().method() === "PUT") writes++; await route.fulfill({ json: user }); });
  await page.goto("/auth/confirm/?token_hash="+"r".repeat(30)+"&type=recovery");
  await page.getByRole("button", { name: "Continue to reset password" }).click();
  await expect(page.getByText(/This link has expired or has already been used/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Request a new reset email" })).toHaveAttribute("href", "/forgot-password/");
  expect(writes).toBe(0);
});

const meetup = { id: "44444444-4444-4444-4444-444444444444", title: "Saturday conversations", description: "Practice", starts_at: "2027-01-01T15:00:00Z", ends_at: "2027-01-01T17:00:00Z", timezone: "Europe/Moscow", location_name: "Club", capacity: 12, price_minor: 50000, currency: "RUB", status: "published", is_public: true, confirmed_booking_count: 2 };
const otherId = "33333333-3333-3333-3333-333333333333";
async function adminLogin(page: Page, role = "admin") {
  await page.route(`${backend}/auth/v1/token**`, (route) => route.fulfill({ json: session }));
  await page.route(`${backend}/auth/v1/user**`, (route) => route.fulfill({ json: user }));
  await page.route(`${backend}/rest/v1/user_roles**`, (route) => route.fulfill({ json: new URL(route.request().url()).searchParams.has("user_id") ? { role } : [{ user_id: user.id, role, updated_at: user.created_at }] }));
  await page.route(`${backend}/rest/v1/rpc/admin_member_directory`, (route) => route.fulfill({ json: [{ user_id: user.id, email: user.email, email_verified: true, joined_at: user.created_at, last_sign_in_at: user.created_at }] }));
  await page.route(`${backend}/rest/v1/profiles**`, (route) => route.fulfill({ json: [{ id: user.id, display_name: "Ani Test", first_name: "Ani", surname: "Test", age: 20, nationality: "Armenia", gender: "Prefer not to say", created_at: user.created_at }] }));
  await page.route(`${backend}/rest/v1/meetups**`, (route) => route.fulfill({ json: [meetup] }));
  await page.route(`${backend}/rest/v1/meetup_bookings**`, (route) => route.fulfill({ json: [user.id, otherId].map((id, index) => ({ id: `booking-${index}`, user_id: id, meetup_id: meetup.id, status: "confirmed", booked_at: user.created_at })) }));
  await page.route(`${backend}/rest/v1/attendance**`, (route) => route.fulfill({ json: [{ id: "existing-paid", user_id: user.id, meetup_id: meetup.id, status: "attended", is_paid: true, payment_status: "paid", recorded_at: user.created_at }] }));
  await page.goto("/login/?next=/admin/"); await page.getByLabel("Email address").fill(user.email); await page.getByLabel("Password", { exact: true }).fill("TestPassword123!"); await captcha(page); await page.getByRole("button", { name: "Log In", exact: true }).click();
}
test("admin member details and refresh work on static hosting; bulk check-in preserves payments", async ({ page }) => {
  await adminLogin(page);
  await expect(page.getByRole("heading", { name: "Club overview" })).toBeVisible();
  await page.getByRole("button", { name: "Details", exact: true }).click();
  const details = page.getByRole("region", { name: "Member details" });
  await expect(details.getByText("Armenia", { exact: true })).toBeVisible();
  await expect(details.getByText(/1 of 6 paid visits/)).toBeVisible();
  await page.getByRole("button", { name: "Refresh data", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Club overview" })).toBeVisible();
  await page.getByRole("button", { name: "Mark attendance", exact: true }).click();
  let inserts = 0;
  await page.route(`${backend}/rest/v1/attendance**`, async (route) => {
    if (route.request().method() === "POST") {
      inserts++; expect(route.request().headers().prefer).toContain("resolution=ignore-duplicates");
      const payload = route.request().postDataJSON(); expect(payload).toHaveLength(1); expect(payload[0].user_id).toBe(otherId);
      await route.fulfill({ json: [{ ...payload[0], id: "new-attendance", recorded_at: user.created_at }] });
    } else await route.fulfill({ json: [] });
  });
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Check in all", exact: true }).click();
  await expect(page.getByText("Bulk check-in completed.")).toBeVisible(); expect(inserts).toBe(1);
});
test("ordinary member admin entry never loads directory or administrator datasets", async ({ page }) => {
  let directoryCalls = 0;
  await page.route(`${backend}/rest/v1/rpc/admin_member_directory`, async (route) => { directoryCalls++; await route.fulfill({ status: 403, json: {} }); });
  await adminLogin(page, "member");
  // Override the directory handler added by the helper; members must never reach it.
  await page.route(`${backend}/rest/v1/rpc/admin_member_directory`, async (route) => { directoryCalls++; await route.fulfill({ status: 403, json: {} }); });
  await expect(page).toHaveURL(/\/(account|onboarding)\/?/); expect(directoryCalls).toBe(0);
});

test("an expired callback never reuses a signed-in session to accept a reset link", async ({ page }) => {
  await page.route(`${backend}/rest/v1/profiles**`, route => route.fulfill({json:{id:user.id,display_name:"Existing member",onboarding_completed:true,created_at:user.created_at}}));
  await page.route(`${backend}/auth/v1/token**`, (route) => route.fulfill({ json: session }));
  await page.route(`${backend}/auth/v1/user**`, (route) => route.fulfill({ json: user }));
  await page.goto("/login/"); await page.getByLabel("Email address").fill(user.email); await page.getByLabel("Password", { exact: true }).fill("TestPassword123!"); await captcha(page); await page.getByRole("button", { name: "Log In", exact: true }).click();
  await expect(page).toHaveURL(/\/account\//);
  await page.goto("/auth/callback/?error=access_denied&error_code=otp_expired&next=/reset-password/");
  await expect(page.getByText(/This link has expired or has already been used/)).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback\/$/);
  await page.route(`${backend}/auth/v1/token**`, (route) => route.fulfill({ status: 400, json: { error_code: "bad_code_verifier", msg: "Invalid" } }));
  await page.goto("/auth/callback/?code=expired-test-code&next=/reset-password/");
  await expect(page.getByText(/browser where you started/)).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/callback\/$/);
});
test("recovery email errors never claim an email was sent", async ({ page }) => {
  await page.route(`${backend}/auth/v1/recover**`, (route) => route.fulfill({ status: 500, json: { error_code: "unexpected_failure", msg: "Error sending recovery email" } }));
  await page.goto("/forgot-password/"); await page.getByLabel("Email address").fill(user.email); await captcha(page); await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByText(/authentication service could not complete/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Request received" })).toHaveCount(0);
});
test("admin errors name the unavailable dataset and allow a fresh retry", async ({ page }) => {
  await adminLogin(page);
  await expect(page.getByRole("heading", { name: "Club overview" })).toBeVisible();
  await page.route(`${backend}/rest/v1/rpc/admin_member_directory`, (route) => route.fulfill({ status: 403, json: { message: "Denied" } }));
  await page.getByRole("button", { name: "Refresh data", exact: true }).click();
  await expect(page.getByText(/Unable to load: member directory/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Club overview" })).toHaveCount(0);
  await page.route(`${backend}/rest/v1/rpc/admin_member_directory`, (route) => route.fulfill({ json: [] }));
  await page.getByRole("button", { name: "Retry loading dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Club overview" })).toBeVisible();
});

test("a fresh browser diagnoses missing PKCE storage without treating it as token expiry", async ({ page }) => {
  let exchanges=0;
  await page.route(`${backend}/auth/v1/token**`, async route => { exchanges++; await route.fulfill({status:400,json:{error_code:"bad_code_verifier"}}); });
  await page.goto("/auth/callback/?code=fake-confirmation-code");
  await expect(page.getByText(/browser where you started/)).toBeVisible();
  await expect(page).not.toHaveURL(/code=/); expect(exchanges).toBe(0);
});
test("fresh-browser token-hash confirmation resists prefetch and works without PKCE storage",async ({page})=>{
  let verifies=0;
  await page.route(`${backend}/auth/v1/verify**`,async route=>{
    verifies++; expect(route.request().postDataJSON().token_hash).toBe("c".repeat(64)); await route.fulfill({json:session});
  });
  await page.route(`${backend}/auth/v1/user**`,route=>route.fulfill({json:user}));
  await page.goto("/auth/confirm/?token_hash="+"c".repeat(64)+"&type=signup");
  await expect(page.getByRole("button",{name:"Verify Email",exact:true})).toBeVisible();
  await page.waitForTimeout(150); expect(verifies).toBe(0); // mounting and rendering never consumes the token
  await expect(page).not.toHaveURL(/token_hash/);
  await page.getByRole("button",{name:"Verify Email",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Email verified",exact:true})).toBeVisible(); expect(verifies).toBe(1);
  await page.reload(); await expect(page.getByRole("heading",{name:"Email verified",exact:true})).toBeVisible(); // session restoration
});
test("token-hash callback alias and reused links expose safe recovery actions",async ({page})=>{
  let verifies=0;
  await page.route(`${backend}/auth/v1/verify**`,async route=>{verifies++;await route.fulfill({status:403,json:{error_code:"otp_expired",msg:"Expired"}});});
  await page.goto("/auth/callback/?token_hash="+"d".repeat(64)+"&type=signup");
  expect(verifies).toBe(0); await page.getByRole("button",{name:"Verify Email",exact:true}).click();
  await expect(page.getByText(/expired or has already been used/)).toBeVisible();
  await expect(page.getByRole("link",{name:"Request a new verification email",exact:true})).toHaveAttribute("href","/verify-email/");
  await expect(page.getByRole("link",{name:"Log In",exact:true})).toBeVisible();
});
test("secure email change acknowledges a first confirmation without claiming a session",async ({page})=>{
  await page.route(`${backend}/auth/v1/verify**`,route=>route.fulfill({json:{message:"Confirmation accepted",session:null,user:null}}));
  await page.goto("/auth/confirm/?token_hash="+"e".repeat(64)+"&type=email_change");
  await page.getByRole("button",{name:"Confirm email change",exact:true}).click();
  await expect(page.getByText(/confirmation was recorded/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Confirm email change",exact:true})).toHaveCount(0);
});
test("same-browser PKCE callbacks and legacy recovery sessions remain compatible",async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem("sb-gsc-auth-test-auth-token-code-verifier",JSON.stringify("fake-browser-verifier")));
  let exchanges=0;
  await page.route(`${backend}/auth/v1/token**`,async route=>{
    exchanges++;expect(route.request().postDataJSON().code_verifier).toBe("fake-browser-verifier");await route.fulfill({json:session});
  });
  await page.route(`${backend}/auth/v1/user**`,route=>route.fulfill({json:user}));
  await page.goto("/auth/callback/?code=fake-same-browser-code");
  await expect(page.getByRole("heading",{name:"Email verified",exact:true})).toBeVisible(); expect(exchanges).toBe(1);
  await page.goto(`/auth/callback/#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=recovery`);
  await expect(page).toHaveURL(/\/reset-password\/$/);
  await expect(page.getByLabel("New password",{exact:true})).toBeVisible();
});
test("an existing Google member can set a password on the same user without signing up again",async ({page})=>{
  const google={...user,app_metadata:{provider:"google",providers:["google"]}};
  let signups=0;let updates=0;
  await page.route(`${backend}/auth/v1/signup**`,async route=>{signups++;await route.abort();});
  await page.route(`${backend}/auth/v1/verify**`,route=>route.fulfill({json:{...session,user:google}}));
  await page.route(`${backend}/auth/v1/user**`,async route=>{
    if(route.request().method()==="PUT"){updates++;expect(route.request().postDataJSON()).toMatchObject({password:"GoogleMemberPassword123!"});expect(route.request().postDataJSON().email).toBeUndefined();}
    await route.fulfill({json:google});
  });
  await page.route(`${backend}/auth/v1/logout**`,route=>route.fulfill({status:204}));
  await page.goto("/auth/confirm/?token_hash="+"g".repeat(64)+"&type=recovery");
  await page.getByRole("button",{name:"Continue to reset password"}).click();
  await page.getByLabel("New password",{exact:true}).fill("GoogleMemberPassword123!");await page.getByLabel("Confirm password",{exact:true}).fill("GoogleMemberPassword123!");
  await page.getByRole("button",{name:"Update password",exact:true}).click();
  await expect(page.getByText(/Your password has been updated/)).toBeVisible();expect(updates).toBe(1);expect(signups).toBe(0);
});
test("logout clears the persisted session and protects the member dashboard again",async ({page})=>{
  await page.route(`${backend}/auth/v1/token**`,route=>route.fulfill({json:session}));
  await page.route(`${backend}/auth/v1/user**`,route=>route.fulfill({json:user}));
  await page.route(`${backend}/rest/v1/profiles**`,route=>route.fulfill({json:{id:user.id,display_name:"Existing member",onboarding_completed:true,created_at:user.created_at}}));
  await page.route(`${backend}/auth/v1/logout**`,route=>route.fulfill({status:204}));
  await page.goto("/login/");await page.getByLabel("Email address").fill(user.email);await page.getByLabel("Password",{exact:true}).fill("TestPassword123!");await captcha(page);await page.getByRole("button",{name:"Log In",exact:true}).click();
  await expect(page).toHaveURL(/\/account\//);
  await page.getByRole("button",{name:"Log out",exact:true}).click();
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
  expect(await page.evaluate(()=>localStorage.getItem("sb-gsc-auth-test-auth-token"))).toBeNull();
  await page.goto("/account/");await expect(page).not.toHaveURL(/\/account\/?$/);
});
test("blocked browser storage gives recovery guidance without consuming a token",async ({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Storage blocked","SecurityError");}});});
  let verifies=0;await page.route(`${backend}/auth/v1/verify**`,async route=>{verifies++;await route.abort();});
  await page.goto("/auth/confirm/?token_hash="+"s".repeat(64)+"&type=signup");
  await page.getByRole("button",{name:"Verify Email",exact:true}).click();
  await expect(page.getByText(/Allow storage for this site/)).toBeVisible();expect(verifies).toBe(0);
});
