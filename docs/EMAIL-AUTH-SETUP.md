# Email registration: setup and release

This feature is prepared for `timeweb-static`, Timeweb static hosting, and Supabase.
No production database, provider, SMTP, CAPTCHA setting, merge, or deployment is
performed by these instructions or by building the website. Owner approval is
required before applying the migration or changing production settings.

## What is implemented

`/signup/`, `/login/`, `/forgot-password/`, `/verify-email/`, `/auth/confirm/`,
`/auth/verified/`, and `/reset-password/` are static pages. The homepage modal uses
the same forms. Sign-up collects only the requested separate names, age,
nationality, gender, email, password/confirmation and terms agreement. Google and
Telegram controls are absent; provider settings and existing callback compatibility
remain untouched. Native searchable nationality suggestions include country names,
Stateless and Other / not listed.

Each Auth submission passes a one-use Turnstile token to Supabase. The browser does
not verify CAPTCHA or hold its secret. Without a site key or completed challenge,
requests fail closed. Resends have a 60-second browser-session cooldown; Supabase
rate limits remain the actual abuse control. Generic responses avoid confirming
whether an address is registered. Verification links require an explicit click to
avoid consumption by email scanners, are removed from browser history after being
captured, and only allow same-origin `next` destinations.

Age is an integer snapshot, recorded when supplied or changed, not a birth date.
This collects less identifying information than a full date of birth and does not
introduce an eligibility/minimum-age restriction. It becomes stale over time; the
member can update it. No age is inferred for legacy members. Passwords go only to
Supabase Auth, never to profiles, application logs, or SQL migrations.

## Build variables

Set these in the actual build environment or an ignored `.env.local`. Never
commit `.env.local` or paste secrets into chat. Static hosting cannot inject these
after upload, and Timeweb does not load `vercel.json` automatically.

| Variable | Where to obtain it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings: HTTPS project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key, not service-role/secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile widget's public site key |

Google/Telegram flags are unused by the new email interface. `CRON_SECRET` and
Supabase management tokens are not needed by this static application. Build-time
validation refuses non-publishable Supabase keys. `npm run build:auth-production`
requires all three public variables but does not establish live readiness.

## Database migration — approval required

Review and apply `supabase/migrations/20261029090000_email_registration_profiles.sql`
to a staging project with the full existing migration history first. The migration:

- Adds nullable first_name, surname, age, age_recorded_at, nationality, gender,
  email, terms_accepted_at, and terms_version to existing profiles. Existing
  profiles, onboarding state, and admin role rows remain intact.
- Copies submitted registration metadata to the profile during the trusted Auth
  insert trigger. Auth metadata also contains those submitted fields; only profile
  updates change the displayed stored details afterward. Metadata never grants roles.
- Creates new accounts as members, including allowlisted emails; it removes automatic
  admin promotion on signup. Existing admin authorization's allowlist + protected role
  rule is preserved. Any new admin assignment is a separate approved operation.
- Mirrors authoritative Auth email changes into profiles. Users cannot write the
  mirrored email, terms records, or recorded-age timestamp through profile grants.
- Adds own-profile editable fields through additive column grants; existing RLS
  still limits edits to the owner.
- Adds restrictive verified-user policies for member tables, avatar storage,
  storage writes and private realtime reads. Admin helper/RPC authorization also
  requires the trusted `auth.users.email_confirmed_at` state. Public content reads
  remain available. These guards are not replaced by client-side role checks.

**Confirm email must be enabled in Supabase.** Disabling it auto-confirms users;
no database test of email_confirmed_at can distinguish auto-confirmation from an
actual email click. The UI signs out an immediate signup session as a safeguard,
but this does not replace the Dashboard setting. Existing users without confirmed
email will need verification before using protected features.

Back up before any approved production migration. Do not drop columns or rewrite
old migrations as a rollback. Review auth triggers/grants against the real deployed
schema; local PostgreSQL tests use fixtures for Supabase-managed schemas.

## Supabase Dashboard — manual configuration

1. Authentication → Providers → Email: enable email/password and Confirm email.
   Check password policy and use Supabase's request/email rate limits. Do not change
   Google provider settings just because the button was removed.
2. Authentication → URL Configuration: Site URL
   `https://galstyansspeakingclub.ru`. Allow the canonical
   `https://galstyansspeakingclub.ru/auth/callback/` destination and the recovery
   query variant `?next=%2Freset-password%2F`. Add narrow approved staging/local
   callback URLs, including their query variants. Confirm actual returned redirect
   URLs in staging; prefer a narrowly scoped `/auth/callback/**` pattern if required
   by the project's URL matching. The app preserves the canonical apex domain for
   www visitors and never follows a user-supplied external destination.
3. Review RLS, the deployed migration history, storage buckets (`profile-avatars`
   private; `site-media` public reads with admin writes), existing admin rows, and
   RPC grants. Test cross-user and non-admin denial using staging accounts.

## Cloudflare Turnstile + Supabase CAPTCHA — manual configuration

1. Create a managed Turnstile widget for the canonical and www hostnames and approved
   staging hostnames. Use the public site key for NEXT_PUBLIC_TURNSTILE_SITE_KEY.
2. In Supabase Authentication → Attack Protection / CAPTCHA Protection, select
   Cloudflare Turnstile and enter the **secret key there only**. Enable protection.
   Neither the website nor a NEXT_PUBLIC variable should contain the secret.
3. Allow `challenges.cloudflare.com` for scripts and frames in the site's CSP and
   relevant cloud network settings. Preserve HTTPS and TLS verification.
4. Test a real successful challenge and a rejected/expired challenge for sign-up,
   login, recovery, and supported resend requests. Check keyboard operation.
   A mocked widget in automated tests is not evidence that CAPTCHA is active.

## Email templates and delivery — manual configuration

Copy `supabase/templates/verification.html` into Authentication → Email Templates →
Confirm signup. It uses the existing logo/branding and the following link shape:

```
https://galstyansspeakingclub.ru/auth/confirm/?token_hash={{ .TokenHash }}&type=signup&next=%2Faccount%2F
```

`supabase/auth-email-config.mjs` also prepares recovery, invite and other templates.
Recovery uses type=recovery and next=/reset-password; the static verification page
verifies the token and opens `/reset-password/`. Do not use the removed server
`/auth/confirm/complete` endpoint. Do not run the management update script without
approval; it can change provider and SMTP settings as well as templates.

Configure custom SMTP with a verified sender/domain through Supabase (for example,
Resend's SMTP credentials). Store the SMTP password only in Supabase or the approved
secret store. Configure the sender's SPF/DKIM/DMARC and check real inbox/spam delivery.
Send the latest link only; tokens are single-use and can expire. Test same-device
PKCE email redirects and the token-hash template in another browser/device.

## Verification commands

```
npm ci
npm run test:auth
npm run test:auth:build
npx playwright install chromium
npm run test:auth:browser
npm run lint
npm run type-check
npm run validate:questions
npm run validate:translations
```

In Codex Cloud, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` when the
system Chromium is available. Browser tests serve `out/` using Python 3 and mock
all Supabase/Turnstile traffic; no production users, emails, or database writes are
created. `test:auth` tests validation and the full SQL migration history in PGlite
with fixtures for managed Auth/Storage/Realtime schemas, including RLS, non-escalation,
legacy admin preservation and trusted email synchronization.

**Never publish the test build.** `test:auth:build` intentionally bakes in fake
Supabase settings and a CAPTCHA test key. After tests, run
`npm run build:auth-production` with the three real public settings. Upload only
the resulting `out/` contents after approval, preserving directory indexes and
query strings, and verifying direct URLs on Timeweb. Do not use `next start`.

Before claiming readiness, a human must test real delivery, confirmation/resends,
expired/reused links, CAPTCHA rejection, login/logout, recovery, member profile edits,
bookings, admin/non-admin permissions, and cross-user isolation against staging.
Then approve any production migration/configuration and deployment separately.

## Exact files changed in this feature

```text
.env.example
README.md
docs/EMAIL-AUTH-SETUP.md
package-lock.json
package.json
playwright.config.ts
scripts/build-auth-test.mjs
scripts/validate-auth-config.mjs
src/app/account/page.tsx
src/app/auth/callback/page.tsx
src/app/auth/confirm/page.tsx
src/app/auth/layout.tsx
src/app/auth/verified/page.tsx
src/app/forgot-password/page.tsx
src/app/login/page.tsx
src/app/onboarding/page.tsx
src/app/privacy/page.tsx
src/app/reset-password/page.tsx
src/app/robots.ts
src/app/signup/page.tsx
src/app/verify-email/page.tsx
src/components/admin-client-page.tsx
src/components/auth-captcha.tsx
src/components/auth-dialog.tsx
src/components/auth-password-input.tsx
src/components/auth-profile-fields.tsx
src/components/email-auth-form.tsx
src/components/email-auth.module.css
src/components/meetup-booking-button.tsx
src/components/member-personal-details.tsx
src/components/password-reset-form.tsx
src/components/profile-form.tsx
src/hooks/use-browser-viewer.ts
src/hooks/use-question-state.ts
src/lib/registration.ts
supabase/auth-email-config.mjs
supabase/migrations/20261029090000_email_registration_profiles.sql
supabase/templates/verification.html
tests/auth/email-auth.spec.ts
tests/sql/email-registration.test.mjs
tests/unit/registration.test.ts
```
