# Authentication and administrator repair

## Findings and evidence

- The email form calls Supabase `auth.signUp` with the Turnstile token and checks `error` before accepting the response. A completed Turnstile widget proves only that the browser obtained a token; Supabase still validates it.
- Supabase intentionally obscures existing confirmed accounts. Depending on Auth settings, signup can return an obfuscated user and no error without creating an account or sending an email. This includes an address already used with Google. We deliberately do not branch the UI on `identities.length`, probe account existence, or claim delivery based on HTTP 200.
- The revised message says **Request received**, acknowledges Supabase accepted the request, and explains that account creation/email delivery are not confirmed. It offers recovery for an existing account. SDK errors, missing user responses, CAPTCHA failures, SMTP errors, and unexpected auto-confirm sessions do not show this acceptance state.
- An expired PKCE callback previously could reuse a session already stored in the browser. It now requires the code exchange itself to succeed and rejects explicit query/fragment errors.
- Admin member details linked to nonexistent `/admin/members/:id` pages. Details now render inside the exported `/admin/` page. Refresh now reloads Supabase data instead of only refreshing the static Next.js route.
- Bulk check-in previously upserted existing attendance with `unpaid`, potentially changing payment/loyalty records. It now selects only missing attendance and uses database `ON CONFLICT DO NOTHING` through Supabase `ignoreDuplicates`, including protection against another administrator recording attendance concurrently. Existing attendance is never overwritten by bulk check-in.
- Attendance payment serialization, async form reset handling, and month/year attendance statistics are corrected. Existing meetup, booking, rewards, announcements, content, and audit functionality remain in place.

## Live inspection on 2026-10-30

All three public variables are present and pass production validation. The read-only public Auth settings endpoint was reachable: email signup is enabled and email auto-confirm is disabled (confirmation required). This is not an SMTP or CAPTCHA-secret verification.

There is no connected Supabase management integration, management token, service-role credential, or database connection in this workspace. Actual user UUIDs, roles, Auth audit logs, custom SMTP, sender verification, and production migration state could not be inspected. No live signup, recovery, email sending, account creation, or production mutation was performed. The live homepage and signup page returned HTTPS 200. A read-only inspection of the 11 signup JavaScript assets found the expected project URL, publishable key, and Turnstile site key, and the older “Check your email” heading. This confirms the deployed assets contain the expected public configuration and a signup call; it does not prove that the reported browser action reached Auth. The unshipped build-status endpoint currently returns HTML with HTTP 200 (a static-host fallback), rather than the JSON marker. The diagnostic now reports that accurately instead of calling it a network/TLS failure.

## Diagnose the reported signup privately

1. Open browser Developer Tools → Network, select the production signup request to the configured project `/auth/v1/signup`. Do not share request bodies, CAPTCHA tokens, passwords, Authorization headers, or HAR files.
2. Record the time, project hostname, HTTP status, and sanitized Auth error code. A missing request means a frontend validation/CAPTCHA/network problem. An error response means signup failed; the UI must stay on the form. An HTTP 500 may be surfaced by the SDK without a structured Auth error code; the UI handles HTTP status as well as code. A 2xx response can still be an enumeration-protected response for an existing account and is not proof of email delivery.
3. Match the timestamp in Supabase Authentication logs and email/provider logs. If no request appears, compare the deployed bundle's project configuration with the intended Supabase project. Check browser content blockers/network failures. Do not weaken CAPTCHA to test.
4. Privately inspect Authentication → Users for the existing Google address, including its UUID and identities. An unchanged existing account need not produce a new row. Do not delete/recreate it.
5. Test with a fresh, consenting mailbox that has never belonged to the project, using a real Turnstile challenge. Check the Supabase result, account row, Auth logs, Resend event, and actual inbox/spam receipt. Only receipt plus a successful verification proves the full flow. An Auth hook/database trigger failure can also prevent account creation; investigate its logged error without dropping triggers or policies.

## Required provider and hosting configuration

Timeweb must build with these public variables (all are embedded at build time):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

Use `npm ci` and `npm run build:auth-production`; deploy only `out/`, after approval. Never deploy the test artifact created by `test:auth:build` or `test:auth:configuration`. Check `out/auth-build-status.json`: mode must be `production`. No Next.js server, API routes, middleware authorization, or service-role key is required by these changes.

Supabase Dashboard:

- Email provider and user signup enabled; **Confirm email enabled**.
- Site URL: `https://galstyansspeakingclub.ru`.
- Allow the exact production callback `https://galstyansspeakingclub.ru/auth/callback/` (including legitimate `next` query destinations when configuring matching rules); configure any intentionally supported preview domains separately. Avoid unrestricted redirect wildcards.
- Enable Turnstile bot protection and enter its **secret** only in Supabase. The widget site key belongs in the build environment. Cloudflare widget hostnames must include the canonical production host and any supported `www` host.
- Configure custom SMTP for production. With Resend, use its current documented SMTP host/port, username `resend`, and an SMTP/API credential entered only into Supabase's SMTP password field. Use a verified sender domain and its authorized From address, not an unverified test sender. Complete the provider's DNS verification (SPF/DKIM and appropriate DMARC) and remove sandbox recipient restrictions through proper provider configuration. Confirm Resend logs show Supabase SMTP submissions before diagnosing inbox filtering. No outgoing events alone does not prove a particular SMTP fault.
- Review Auth email rate limits, SMTP limits, templates, hooks, and logs. Never run the older broad Auth configuration script without reviewing every provider/SMTP field it modifies.

Apply the reviewed templates/config from `supabase/auth-email-config.mjs` and `supabase/templates/verification.html` through the Dashboard. Confirmation link:

```
https://galstyansspeakingclub.ru/auth/confirm/?token_hash={{ .TokenHash }}&type=signup&next=%2Faccount%2F
```

Recovery link:

```
https://galstyansspeakingclub.ru/auth/confirm/?token_hash={{ .TokenHash }}&type=recovery&next=%2Freset-password%2F
```

The callback consumes one-time credentials explicitly, clears them from the URL, and restricts destinations to the same site. Password updates require a verified Supabase session and Supabase authorization; the UI does not authorize the change by an email address or query parameter. Expired links must be renewed. An already authenticated verified account may change its own password through Supabase; it cannot reset a different account merely by changing the form URL.

## Existing Google accounts: preserve identity and history

Use **Forgot password** for the account's verified Google email. After receiving and consuming the recovery link, set a password using `auth.updateUser({ password })` on that authenticated account. Supabase updates the existing user; it does not require deleting accounts or copying profile rows. Verify that its UUID remains unchanged and that bookings, attendance, loyalty, and roles remain attached to that UUID. Test this with an owner-controlled existing Google account before wider rollout.

A successful-looking signup response must not be used to infer identity linking. We do not merge records by email and do not invoke an Admin API to set arbitrary passwords. Manual `linkIdentity` is for adding a supported OAuth identity while authenticated, and is not required to set a password on the same verified account. If different UUIDs already exist, stop and investigate privately; this PR does not merge or delete them. Google sign-in controls remain removed as requested; provider-side settings and existing identities are untouched.

## Administrator inspection and approval

Existing authorization uses both trusted database roles in `public.user_roles` and the existing three-email database allowlist; verified Auth state is required. Frontend controls do not grant access. RLS, protected role triggers, and SECURITY DEFINER RPC authorization remain authoritative. The member directory checks `app_private.is_admin()` before reading `auth.users`; ordinary members cannot call it to enumerate users or send announcements. No new role policy or service-role browser access is introduced.

1. Project owner runs `supabase/operations/inspect-administrator-accounts.sql` privately. It shows the actual existing UUID, role, verification, providers, and record counts for the three requested addresses. Missing/unverified/ambiguous accounts must be resolved before assignment. No live results have been obtained in this workspace.
2. After reviewing those UUIDs and obtaining approval, use `supabase/operations/assign-reviewed-administrators.sql`. Replace each placeholder with the inspected UUID for the matching account. It requires a project-owner SQL session without an end-user JWT, locks and checks the trusted verified account, and changes only `user_roles`. It neither creates users nor modifies profiles/bookings/attendance/loyalty. Existing admins remain admins. Normal role/audit triggers run.
3. The default operation ends with **ROLLBACK**. Preview the result, verify all three rows, and change that final statement to COMMIT only after explicit approval. Re-run inspection afterward. Never place this operator script in automatic migration/deployment hooks.

There is **no new schema migration** in this repair. The earlier `20261029090000_email_registration_profiles.sql` must still be reviewed against production migration history and approved if not already applied. It adds profile fields and confirmation requirements; do not blindly replay it or older migrations. Back up and review privately before any production migration. This repair does not establish which migrations are currently applied.

## Acceptance before deployment

Automated checks use an isolated mocked Supabase/Turnstile endpoint and an in-memory PostgreSQL-compatible database. They are not live email-delivery evidence.

Manual approval-gated acceptance:

- Fresh-mailbox signup: request result, real CAPTCHA acceptance and rejection, real confirmation email receipt, scanner-safe explicit verification click, unverified login/member denial, verified login/dashboard access.
- Existing confirmed email and Google email: neutral signup response, recovery email receipt, new password, unchanged UUID and all club history/roles.
- Expired/reused confirmation and recovery links; wrong/mismatched password; email/SMTP/CAPTCHA rate limits and errors; mobile form usability.
- All three inspected admin UUIDs can open the dashboard after approved role assignment. Ordinary members cannot read another member's profile/history or perform admin RPCs/meetup/role/notification mutations using direct Supabase requests.
- Admin member details, profile values, meetups, bookings, attendance/payment edits, loyalty, announcement delivery, statistics, and refresh against real approved test data. Bulk check-in must leave existing paid/free/absent attendance and reward history unchanged.
- Record snapshot counts and role assignments before/after any approved database work. No account recreation, automatic email-based merge, production deploy, or merge is authorized by this PR.

## Validation results

On 2026-10-30:

- `npm run test:auth`: **11 passed**. Includes complete migration history in PGlite, verified/own-row RLS, denied member directory/announcements/role changes, preservation of seeded Google identity/bookings/paid attendance/loyalty, and operator-script placeholder/mismatch/rollback/approved-commit behavior.
- `npm run test:auth:browser` with system Chromium and the isolated test build: **44 passed** across desktop and mobile. Includes all exported public routes, registration, privacy-protected duplicate response, errors, CAPTCHA forwarding/failures, confirmation, login, recovery, expired callbacks, dashboard/profile editing, member denial, admin details/refresh/retry, and non-destructive bulk check-in.
- `npm run test:auth:configuration`: **4 passed** across missing-Supabase and missing-Turnstile fixtures.
- `npm run lint`, `npm run type-check`, both question/translation validators, and `git diff --check`: **passed**.
- `npm run build:auth-production`: **passed**, with 27 prerender manifest entries (including metadata/internal routes). The final `out/auth-build-status.json` reports production mode and both configuration flags true. No test fixture remains in the final export.
- `npm run auth:check`: **attention required**, not a full pass. Public variables and public Auth settings verified; management configuration, real delivery, and live permissions unverified. Live build-status URL returns an HTML fallback because the new marker is not deployed.

Early browser failures identified HTTP-500 error-code handling and a fixture's normal onboarding redirect; those were corrected and the full suite passed again. Restricted process/network execution initially prevented subprocesses/proxy access; checks were rerun with the required environment execution permissions. Build wrappers now fail explicitly on process-launch errors instead of trusting an unreliable exit status.

## Exact files in this PR relative to timeweb-static

This branch includes the existing configuration-hardening commit from open PR #3, because it has not yet been merged into the target. Review the overlapping changes together; no changes were made to that PR or its branch.

- `.env.example`
- `README.md`
- `docs/AUTH-ADMIN-REPAIR.md`
- `docs/EMAIL-AUTH-SETUP.md`
- `docs/REGISTRATION-RECOVERY.md`
- `package.json`
- `playwright.config.ts`
- `scripts/auth-configuration.mjs`
- `scripts/build-auth-production.mjs`
- `scripts/build-auth-test.mjs`
- `scripts/check-auth-readiness.mjs`
- `scripts/test-auth-configuration.mjs`
- `scripts/validate-auth-config.mjs`
- `scripts/write-auth-build-status.mjs`
- `src/app/auth/callback/page.tsx`
- `src/components/admin-client-page.tsx`
- `src/components/admin-dashboard.tsx`
- `src/components/auth-captcha.tsx`
- `src/components/email-auth-form.tsx`
- `src/lib/supabase/client.ts`
- `supabase/operations/assign-reviewed-administrators.sql`
- `supabase/operations/inspect-administrator-accounts.sql`
- `tests/auth/auth-configuration.spec.ts`
- `tests/auth/email-auth.spec.ts`
- `tests/sql/email-registration.test.mjs`
- `tests/unit/auth-configuration.test.mjs`
