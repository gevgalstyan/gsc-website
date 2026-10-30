# Email verification repair and branded Auth emails

## What is established, and what remains unknown

The reported iPhone screen is the static `/auth/callback/` page. Both production callback and confirmation pages return HTTP 200; the callback's no-slash URL returns a 308 to the slash URL **preserving its query**. This read-only test used a fake diagnostic code and made no Auth requests. It found no evidence that the standard Timeweb path redirect drops the query.

The exact failing email URL shape and production Auth logs were not available. The user reports receiving an email through Resend. That is evidence of that user's receipt, not an independently verified complete registration/confirmation session. The actual incident's root cause **cannot yet be uniquely established**: expired/used token, scanner consumption, missing browser-local PKCE state, malformed link, or Dashboard template/redirect configuration remain distinguishable possibilities. No live templates were read or changed, and no live token was opened.

There are two confirmed implementation findings:

1. The browser client uses `flowType: "pkce"`. The installed Supabase SDK reads `${storageKey}-code-verifier` from local browser storage during `exchangeCodeForSession`. With clean storage, the **real SDK** returns `pkce_code_verifier_not_found` **before any exchange request**. The previous callback showed “invalid or expired” for this condition. A default `ConfirmationURL` email that returns a PKCE code therefore needs the original browser/storage; another device, an iPhone mail browser, cleared storage, or changing between `www` and the canonical origin can lose that state. This condition is reproduced automatically; it has not been confirmed as the specific incident's URL format.
2. The repository already contained direct token-hash templates, but those files do not update Dashboard settings by themselves. The observed generic email and callback screen are insufficient evidence to prove which production template is active. Scanner-safe templates need to be installed explicitly and tested with a new email; previously issued links do not change.

## The repaired flows

- New templates use Supabase-supported `{{ .SiteURL }}` and `{{ .TokenHash }}` to open the static `/auth/confirm/` page. It calls `verifyOtp({ token_hash, type })` **only after a visible confirmation click**, without relying on the registration browser's PKCE verifier. Opening/prefetching the landing page sends no verification request. Normal email scanners that fetch or preview links cannot consume this token via a GET. A scanner that executes JavaScript and deliberately activates buttons is beyond that protection; do not claim absolute scanner immunity.
- `/auth/callback/` also accepts token-hash links through the same click-to-confirm component. OAuth/same-browser PKCE and existing implicit `#access_token`/`refresh_token` links remain supported. Legacy recovery fragments are recognized even without `next`.
- The callback differentiates missing browser verifier, explicit access denial, missing/incomplete credentials, transient service failure, and expired/already-used links. Supabase may return the same error for expiration and reuse; we do not invent a distinction it cannot prove. Errors never become success just because another session already existed.
- Tokens/codes are removed from browser history after capture. Auth routes already set `Referrer-Policy` metadata to `no-referrer`; no credential or raw Auth error text is logged. Configure Timeweb/CDN access-log query redaction for Auth routes where supported, because a query-based link necessarily reaches the host. Never paste a real link/HAR into an issue or PR.
- The exported member dashboard now exposes a working logout action; the old reusable dashboard-header component was not mounted on that static page. Logout removes the session and protected pages redirect afterward.
- Browser-storage denial fails closed with guidance instead of crashing or silently falling back to an ephemeral session. Protected member/admin features still require verified Supabase authorization.
- Secure email-change first confirmation may succeed without a session; it now explains the possible second confirmation instead of falsely calling the link expired. Magic-link/invitation emails keep their supported Supabase verification types. Invitations lead to choosing a password.
- Password recovery uses a recovery token, verified session, password confirmation, `auth.updateUser`, and logout afterward. Existing Google members add a password to their **existing UUID** through recovery. No email-based merges, account recreation, role assignment, or production database mutation occurs.

## Template deliverables

Canonical definitions: `supabase/auth-email-config.mjs`. Generate synchronized paste-ready files with `npm run emails:generate`; check them with `npm run emails:check`.

| Dashboard email type | HTML file under `supabase/templates/` | Subject |
| --- | --- | --- |
| Confirm signup | `verification.html` | Welcome to Galstyan’s Speaking Club! Verify your email |
| Reset password | `password-reset.html` | Reset your Galstyan’s Speaking Club password |
| Change email address | `email-change.html` | Confirm your GSC account email change |
| Magic link | `magic-link.html` | Your secure GSC sign-in link |
| Invite user | `invitation.html` | You’re invited to Galstyan’s Speaking Club |
| Reauthentication | `reauthentication.html` | Your GSC account security code |
| Password changed notification | `password-changed.html` | Your GSC password was changed |

Each has a matching `.txt` reference alternative and an entry in `subjects.json`. Supabase's standard Dashboard exposes HTML content, not a separate supported plaintext field; these text files are review/reference alternatives, not a claim that a multipart text part was installed. Check received MIME in real mail clients. Do not invent Management API plaintext fields or send a second duplicate email through Resend.

These are **Supabase Auth templates transported by Resend SMTP**, not application-generated messages. No Resend API key or SMTP password is needed in the frontend. The Supabase Go template variables used are `.SiteURL`, `.TokenHash`, `.Token`, `.Data`/its `first_name` metadata, and `.NewEmail`. Built-in Go `with` handles missing or nil metadata. Supabase's HTML template context escapes the name and email; do not use an unescaped `html` filter. Go HTML/template rendering tests verify escaping with an HTML-like name.

The design uses the existing `/gsc-logo.jpg`, readable text branding when images are blocked, email-safe fonts, inline table layout, an Outlook conditional 600px container, navy `#07101c`, and the website's orange `#ff5a1f`. Only the welcome/verification email includes club benefits. Security emails stay focused on the requested action.

Reauthentication is a **code**, not a token-hash sign-in link: `.Token` must be entered into the sensitive-action form that requested it. The template does not invent a `reauthentication` token-hash verification type. The present UI does not enable a new magic-link signup, email-change form, invitation service, reauthentication feature, or security-notification delivery setting merely by supplying its template. Install/use optional templates only for supported, intentionally enabled provider flows.

## Dashboard installation — manual configuration still required

Do this only after the frontend change is reviewed and approved for deployment. No Dashboard change has been made by this task.

1. In Supabase **Authentication → URL Configuration**, set Site URL to `https://galstyansspeakingclub.ru` (no trailing slash). The requested production redirect rule `https://galstyansspeakingclub.ru/**` covers the static callback and query destinations. If `www` is supported, explicitly allow `https://www.galstyansspeakingclub.ru/**` as well. Production email links should use the canonical Site URL; Vercel is a preview environment only. Do not replace Site URL with a Vercel preview.
2. In **Authentication → Email / Templates** (Dashboard wording may vary), open **Confirm signup**, paste `verification.html`, and set its subject from `subjects.json`. Save. Repeat for **Reset password**, **Change email address**, and any optional email types actually in use. The logo and public footer are ordinary static URLs; the one-time action contains a dynamic **TokenHash**, never a hardcoded token or the default `ConfirmationURL`.
3. For confirmation, verify the action renders as `https://galstyansspeakingclub.ru/auth/confirm/?token_hash=<redacted>&type=signup&next=%2Faccount%2F`. Recovery must use `type=recovery&next=%2Freset-password%2F`. Do not change these to `/auth/callback/?code=...` or append a raw one-time token to a public preview. `SiteURL` must be the trusted canonical origin. Do not substitute client-provided arbitrary redirect URLs into the template.
4. Keep the Email provider and **Confirm email** enabled. Keep Turnstile enabled with its secret only in Supabase, its corresponding real public site key in the build environment, and the production host in the Cloudflare widget's allowed hostnames. Nothing in this patch disables CAPTCHA or changes the Google provider/identities.
5. Verify custom Resend SMTP host/port/username/password and an authorized sender on a DNS-verified domain in Supabase. Review Auth logs alongside Resend delivery events. Existing receipt does not prove all sender restrictions, bounce handling, or recipients work. No SMTP credential is changed here.
6. Inspect Auth token expiry and rate limits. Avoid lengthening expiry or disabling security to conceal errors. Issue a **fresh** confirmation/recovery email after installing the templates; already-consumed codes and old emails cannot be repaired retroactively.
7. Do not run the former broad SMTP/Google-update script expecting a remote patch. `scripts/update-supabase-auth-email-config.mjs` now **only stages a template-only JSON payload in `/tmp`** for review; it does not read credentials, contact the API, change SMTP/OAuth/redirects, or enable optional features.

This environment has no callable Supabase management integration or bound management/database credential. SMTP, active Dashboard template bodies, expiry/allowlist settings, Auth logs, and production account identities/roles were not inspected. Only public project configuration and HTTP paths can be inspected without additional authorized access. No administrator SQL is executed; the previously prepared review/rollback-only procedure remains separate.

## Static Timeweb release

Build-time public variables remain `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Keep secret/service-role/SMTP keys out of `NEXT_PUBLIC_*`. Run `npm ci`, checks, and `npm run build:auth-production`; deploy `out/` only after approval. No Next.js server route, server action, middleware, or new database migration is introduced.

Confirm that `/auth/confirm/`, `/auth/callback/`, `/auth/verified/`, `/reset-password/`, `/verify-email/`, and `/login/` resolve to the exported pages. Static slash redirects must preserve query parameters; canonical host redirects must preserve fragments for legacy links. Exclude Auth URLs from destructive link rewrites or analytics query capture. An HTML fallback at a nonexistent build-status JSON path is not a successful JSON readiness check.

## Local previews and test commands

`npm run emails:preview` uses a genuine Go compiler (standard library only) to render the actual Go HTML/text templates into `/tmp/gsc-email-previews`. The executable named `go` initially installed in this workspace was not a Go compiler; a checksum-verified official toolchain was downloaded into `/tmp` solely for testing. No cloud environment draft was changed or published. With a normal Go installation, simply use the npm command; in this session use `GSC_GO_EXECUTABLE=/tmp/gsc-go-toolchain/go/bin/go npm run emails:preview`. The wrapper verifies it is a Go compiler and fails clearly if unavailable.

Serve previews with `python3 -m http.server 4174 --bind 127.0.0.1 --directory /tmp/gsc-email-previews`, then open `/index.html`. All preview hashes/codes are fake. `npm run test:emails:browser` starts its own local preview server; do not leave the manual server running on that port during tests.

Run email/browser tests with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` in this workspace. They verify desktop and iPhone-sized Chromium rendering, image-blocked readability, CTA URLs, and no horizontal overflow. Review PNGs under `docs/email-previews/`; the logo is loaded from the existing local repository asset. Blocked-image evidence is retained in ignored test results. These are **not** native Gmail/Apple Mail/Outlook rendering tests or email delivery tests. The table/inline/Outlook markup is designed for compatibility, but native clients still require acceptance.

## Approval-gated manual acceptance

- Brand-new, owner-controlled mailbox: register with a real Turnstile challenge; confirm the new Auth row and Resend event; receive the email; preview without using the token; click in Safari on another device; explicitly verify; log in and reach the member dashboard.
- Expired and reused links: helpful recovery actions, no false success. Request a fresh link and ensure old emails cannot restore access. Check both Safari and the iPhone mail app's browser.
- Recovery on another device: receive reset email, explicitly confirm, set matching new password, log in. Test expired/reused recovery and absent/blocked browser storage.
- Owner-controlled existing Google account: same UUID/profile/bookings/attendance/loyalty/admin role before and after adding a password. Never delete/recreate users or automatically merge email matches.
- Same-browser OAuth PKCE and legacy implicit callback compatibility, logout/session restoration, unverified/member/admin access controls.
- Personalized/fallback/long-name emails in actual Gmail, Apple Mail, and Outlook, with images enabled/blocked, correct sender, readable CTA, and the expected canonical URL.
- Inspect the actual failing old link's **path and parameter names only**, and correlate its time with Auth logs. Never share token/code values. This evidence is required to close the incident's precise root-cause diagnosis.

## Final validation — 2026-10-30

- **17 unit/database tests passed**, including the real SDK missing-PKCE-verifier regression, error classification, synchronized template definitions, public-config/redirect validation, and the existing full-migration/RLS/legacy-account-preservation regression.
- **60 desktop/mobile Auth browser checks passed**, including registration, CAPTCHA forwarding/failure, scanner-safe mount, clean-browser token verification, same-browser PKCE, implicit recovery, expired/reused links, password reset, Google-account password setup without signup, partial email change, session restoration, logout, blocked storage, all public static routes, member/admin controls, profiles, and non-destructive attendance handling. Auth/Turnstile responses are mocked and isolated from production.
- **16 email-preview browser checks passed**, with desktop/iPhone-sized layouts, correct action URLs, escaped/fallback names, no horizontal overflow, and image-blocked readability. Four review screenshots use the existing local logo.
- **7 template types × 4 metadata scenarios rendered successfully as HTML and text** using a checksum-verified official Go compiler. Scenarios cover named, unnamed, nil-metadata, and HTML-like names.
- **4 missing-configuration browser checks passed**. `emails:check`, lint, type checking, question/translation validators, and diff checks passed.
- **Production static export passed**, with 27 prerender-manifest entries including metadata/internal routes. The final output reports `mode: production`, with both public Auth configuration flags true. Test artifacts were replaced by the production build; no deploy occurred.
- **Read-only Auth readiness remains incomplete**: public settings are reachable and confirm email signup enabled/confirmation required, but privileged settings/logs/templates and actual end-to-end delivery/permissions remain unverified. The current live build-status path returns HTML instead of the not-yet-deployed JSON marker.

Initial test runs exposed the missing logout control, a returning-member fixture that incorrectly triggered onboarding, and an overly strict fixture assertion about the SDK's nullable PKCE fields on password update. These were corrected; the full final suite passed. No remaining automated failures are being hidden as successful live tests.

The branch contains the previously reviewed, still-unmerged configuration/admin repairs from PRs #3/#4 as dependencies, plus this verification/email work. The PR targets `timeweb-static`; no main, backup, or production branch was changed.

## Files changed in the verification/email repair commit

- `README.md`
- `docs/AUTH-ADMIN-REPAIR.md`
- `docs/BRANDED-AUTH-EMAILS.md`
- `docs/EMAIL-AUTH-SETUP.md`
- `docs/REGISTRATION-RECOVERY.md`
- `docs/email-previews/README.md`
- `docs/email-previews/password-reset-desktop.png`
- `docs/email-previews/password-reset-iphone.png`
- `docs/email-previews/verification-desktop.png`
- `docs/email-previews/verification-iphone.png`
- `package.json`
- `playwright.emails.config.ts`
- `scripts/auth-configuration.mjs`
- `scripts/generate-auth-emails.mjs`
- `scripts/preview-auth-emails.mjs`
- `scripts/render-auth-email-previews.go`
- `scripts/update-supabase-auth-email-config.mjs`
- `src/app/account/page.tsx`
- `src/app/auth/callback/page.tsx`
- `src/app/auth/confirm/page.tsx`
- `src/components/email-auth-form.tsx`
- `src/components/email-link-confirmation.tsx`
- `src/lib/auth-link.ts`
- `src/lib/supabase/client.ts`
- `supabase/auth-email-config.mjs`
- `supabase/templates/email-change.html`
- `supabase/templates/email-change.txt`
- `supabase/templates/invitation.html`
- `supabase/templates/invitation.txt`
- `supabase/templates/magic-link.html`
- `supabase/templates/magic-link.txt`
- `supabase/templates/password-changed.html`
- `supabase/templates/password-changed.txt`
- `supabase/templates/password-reset.html`
- `supabase/templates/password-reset.txt`
- `supabase/templates/reauthentication.html`
- `supabase/templates/reauthentication.txt`
- `supabase/templates/subjects.json`
- `supabase/templates/verification.html`
- `supabase/templates/verification.txt`
- `tests/auth/email-auth.spec.ts`
- `tests/emails/email-preview.spec.ts`
- `tests/unit/auth-configuration.test.mjs`
- `tests/unit/auth-emails.test.mjs`
- `tests/unit/auth-link.test.ts`
- `tests/unit/pkce-browser.test.mjs`
