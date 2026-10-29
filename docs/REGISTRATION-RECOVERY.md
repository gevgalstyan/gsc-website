# Registration blocked: production recovery checklist

## What the reported messages mean

The previous "Secure sign-in is being configured" message is rendered when the
compiled `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is empty. Clicking Sign Up then stops at
the client-side CAPTCHA guard, before Supabase Auth is called. No verification
email is requested at that stage. A missing public key does not establish whether
a CAPTCHA secret or SMTP is configured in the Supabase Dashboard.

`NEXT_PUBLIC_*` values are embedded by `next build`. Adding runtime variables to a
static server, editing `vercel.json`, or restarting Timeweb cannot repair an
already-built artifact. Configure the system that actually performs the build,
then rebuild. Deployment remains a separate approval-required action.

## 1. Configure the real build environment

Use Node.js 24 and set all three public variables in Timeweb's build environment,
or in ignored `.env.local` on the machine that builds the upload:

| Variable | Required value/source |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The project's HTTPS origin from Supabase settings |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The same project's public `sb_publishable_` key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | The real public site key of your production Turnstile widget |

The repository already contains public Supabase settings in `vercel.json`; validate
that they belong to the intended project before reusing them. This task reused
those two existing public settings in the ignored local `.env.local` only. The
Turnstile site key was not available. No key values are printed by the check tools.

Never put the CAPTCHA secret, SMTP password, or Supabase service-role key in
`NEXT_PUBLIC_*` variables, the static upload, Git, or chat. The build rejects
non-publishable Supabase keys, known Turnstile test keys, mocked Auth settings,
and missing variables. `npm run build` now enforces this by default; it no longer
silently creates a production artifact with broken email access.

## 2. Configure the matching Turnstile widget and Supabase secret

In Cloudflare Turnstile, create or locate a managed widget. Its allowed hostnames
must include the actual address users visit: `galstyansspeakingclub.ru`,
`www.galstyansspeakingclub.ru`, and any explicitly approved Timeweb staging hostname.
Use its public **site key** in the build variable above.

In Supabase Authentication → Attack Protection / CAPTCHA Protection, enable
Cloudflare Turnstile and enter that widget's **secret key there only**. Do not turn
off CAPTCHA to make signup pass. Allow `challenges.cloudflare.com` in script/frame
CSP rules. Test a real challenge, an expired/rejected token and mobile rendering;
a public site key alone does not prove server-side CAPTCHA is configured.

## 3. Confirm Supabase Auth settings and return URLs

Verify in the Dashboard (this task could not retrieve live settings):

- Email/password provider enabled; new user signup enabled.
- **Confirm email enabled**. Auto-confirmed signup does not send the required
  verification email. The application now reports this condition instead of
  falsely displaying Check your email.
- Site URL: `https://galstyansspeakingclub.ru`.
- Redirect allowlist covers the canonical `/auth/callback/` path and its query
  variants, including `?next=%2Faccount%2F` and
  `?next=%2Freset-password%2F`. A narrowly scoped
  `https://galstyansspeakingclub.ru/auth/callback/**` pattern can cover these;
  verify the exact redirects on staging. Add only approved staging/local origins.
- The web host preserves query strings during canonical-domain and trailing-slash
  redirects and serves the exported callback/confirmation directories directly.

Google controls remain absent from the interface. Existing provider settings are
not changed by this fix. Do not use the broad management update script as a quick
fix: it can change provider/SMTP settings in addition to templates.

## 4. Configure and test actual email delivery

For open registration to club members, configure a custom SMTP provider in Supabase
Auth. Supabase's default email service restricts recipients and sending limits;
a successful team-address test does not establish delivery to ordinary members.
Verify sender address/domain, SMTP host/port/user/password and the provider's
SPF/DKIM/DMARC records. SMTP credentials stay in Supabase or an approved secret
store, never the frontend. Inspect Auth and SMTP-provider logs for actual failures,
without sharing tokens or passwords.

Use `supabase/templates/verification.html` for the signup email, or the prepared
values in `supabase/auth-email-config.mjs`. The verification link points to:

```
https://galstyansspeakingclub.ru/auth/confirm/?token_hash={{ .TokenHash }}&type=signup&next=%2Faccount%2F
```

Recovery links use `type=recovery` and the reset-password destination. Do not point
email templates at the removed server `/auth/confirm/complete` route. The existing
static pages verify the one-time token with Supabase, show verification success,
and provide resend/error recovery actions. Successful API acceptance is not proof
of email receipt: confirm delivery in a designated test inbox and spam folder.

## 5. Verify the profile migration and authorization

The existing `20261029090000_email_registration_profiles.sql` migration must be
reviewed/applied on staging before any approved production application if it has
not already been applied. This fix adds no new database migration and does not
apply migrations. The existing migration stores separate names, age snapshot,
nationality, gender and mirrored Auth email, and enforces verified-member access.
Existing roles, profiles and dashboard functions must be preserved.

An owner can inspect column/policy inventory without exposing member data:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('first_name','surname','age','nationality','gender','email',
                      'terms_accepted_at','terms_version','age_recorded_at');
select schemaname, tablename, policyname from pg_policies
where policyname = 'verified_member_required';
```

Column presence alone is not enough: test own-profile edits, cross-user denial,
unverified denial and admin/non-admin authorization with staging users.

## 6. Read-only diagnostics and reproducible tests

`npm run auth:check` checks build-variable presence, public Supabase Auth settings,
and the deployed `auth-build-status.json` marker. If a securely configured
`SUPABASE_ACCESS_TOKEN` is already available, it also reads management settings
without printing secrets. Without it, SMTP/CAPTCHA-secret/redirect settings require
Dashboard verification. The optional `--repository-public-config` argument permits
a read-only comparison using existing public repository values; it does not
configure the Timeweb build. The check honors the configured proxy, preserves TLS
verification, makes no writes, and never sends an email.

Current cloud checks found a missing Turnstile site key. Live Supabase and website
requests were blocked by network access; no usable Supabase management credential
or callable connector was available. The repository declares a Supabase MCP server,
but it is not connected as a usable tool in this session; authenticate/enable that
connection if you want the agent to inspect settings securely. Dashboard checks
remain an alternative without sharing credentials. Network requirements are saved in the cloud draft,
which must be applied through environment settings before retrying. Cloud settings
are separate from Timeweb build variables and publishing the website.

Run:

```
npm ci
npm run test:auth
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:auth:configuration
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:auth:browser
npm run lint
npm run type-check
npm run validate:questions
npm run validate:translations
```

Configuration tests build missing-CAPTCHA and missing-Supabase fixtures, assert
that no Auth request is sent, then restore a normal **mocked** build for the full
browser suite. The suite covers valid/invalid signup, mismatched passwords,
CAPTCHA, confirmation, unverified/verified login, recovery, SMTP restrictions,
auto-confirmed signup, profile edits, mobile layout and exported pages. SQL/RLS
checks use isolated local PostgreSQL fixtures; these are not live Supabase tests.
Install Playwright Chromium if a system executable is unavailable.

**Never deploy a test artifact.** It has `mode: "test"` in
`out/auth-build-status.json`. With real public settings supplied, build a fresh
release using `npm run build:auth-production`; this forces production validation
even if test-mode variables were accidentally inherited. Confirm that the marker
reports production mode and both configuration flags true. These flags establish
presence, not successful CAPTCHA or email delivery. Upload only `out/` after
explicit approval; do not merge or deploy automatically.

Before release, demonstrate a real successful challenge, rejected challenge,
verification email arriving in the test inbox, working verification link, denied
unverified login, verified dashboard/profile access, recovery email/password
change, and existing member/admin permission checks. Record failures honestly.
