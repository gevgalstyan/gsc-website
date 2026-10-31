# Member and administrator dashboard repair

## Production cause established on 2026-10-31

The production REST API was probed with the **public publishable key, no user JWT, and `limit=0`**. No member rows were requested or returned. Results:

| Profile field | Observed response |
| --- | --- |
| `first_name`, `surname`, `age`, `nationality`, `gender`, `email` | HTTP 400 / PostgreSQL `42703` (undefined column) |
| Original profile fields including `id`, `display_name`, `avatar_path`, `onboarding_completed` | Recognized; anonymous access denied (`42501`) |
| `user_roles.user_id`, `user_roles.role` | Recognized; anonymous access denied (`42501`) |

The earlier Auth/admin change added the six optional registration fields to the admin profile SELECT. These are defined in `supabase/migrations/20261029090000_email_registration_profiles.sql`, but the live schema currently lacks them. The query failed before it could return any authorized profiles, and the all-or-nothing loader blocked the workspace. The member personal-details query requested the same absent fields, explaining its generic unavailable notice.

This is evidence of the **schema/query mismatch**, not proof of which migration commands have or have not run. Migration history, live admin identities/roles, column grants, RLS policies, and the Storage bucket cannot be fully inspected with an anonymous/public key. The environment has no bound management token, service-role key, database connection, or signed-in administrator session. No attempt was made to log in as a user without their credentials.

## Repair and authorization boundaries

- The admin loader first requests the extended profile fields. **Only** `42703` or PostgREST `PGRST204` triggers a second query using the original profile columns. Both are normal authenticated Supabase requests under the same RLS policies. Permission, missing-table, network, and authentication errors never trigger a permissive fallback or fake successful data.
- Existing admin role detection and the database-protected `admin_member_directory` RPC are unchanged. A client-provided email never grants privileges. Existing database roles, users, profiles, bookings, attendance, loyalty, and Storage policies are not changed by this PR.
- Core administrative tools can load against the legacy schema; a visible banner explains that optional registration fields still require review. Missing values are not backfilled with invented data or written into member records.
- Errors now distinguish schema, authorization, missing table, and transient failures. The state screen has readable navigation, a login route, and a real retry that rechecks session/role and loads data again. The existing loaded workspace, member details, meetups, bookings, attendance, rewards, notifications, content, and audit features remain available subject to their original database permissions.
- Member personal details display an honest compatibility notice instead of a generic error when those fields are missing. Main profile settings still work. Missing profile records are reported for owner investigation, never recreated automatically. Profile/photo linking only reports success when an actual profile row was updated.

**Deployment status:** these changes are tested locally and prepared for review. They are not proof that the deployed production admin works. The frontend must be deployed after approval and an existing administrator must verify access against real RLS. Optional personal fields remain unavailable until an approved schema update is applied and verified.

## Member navigation, language, and layout

The exported account page did not mount the existing member-header component. The new shared dashboard navigation is present through loading/error/success states and links to the logo/homepage, Home, Speaking Club Meetups, English Questions, and My Account. Logout is explicit. Mobile navigation is an accessible disclosure with an expanded state, Escape dismissal, keyboard focus styles, and 44px controls. Ordinary navigation retains the existing Supabase session.

There was **no site-wide language-selection mechanism** in the repository to reuse. A shared English/Russian preference is integrated into the dashboard header, persisted in `gsc-language`, and used by member section headings and the loyalty card. It is not an isolated switch attached to the card, and does not claim to translate the entire public website or every existing profile-field label.

The loyalty display still uses the existing rule: only `status=attended` and `payment_status=paid` count. No-shows, unpaid and free-reward visits do not count. Available database rewards keep the seventh visit unlocked. No loyalty calculation is written back to the database. Six readable indicators plus a seventh free-meetup indicator fit small screens without overflow. Attended-visit counts also exclude no-shows.

Dashboard surfaces use explicit dark navy tokens and orange accents, scoped so public pages retain their theme. Typography, spacing, forms, state panels, and admin controls are readable at the requested 320/375/390/430/768/desktop widths. The admin's ineffective global light-mode switch is removed from this fixed-dark workspace; public website theme preferences are not modified.

## iPhone profile-photo findings and fix

The previous pipeline rejected files solely because `File.type` was empty or not JPEG/PNG/WebP, before its HEIC-specific error could run. It also required canvas WebP output and rejected browsers that returned a different supported format. These are reproducible code compatibility defects. The actual failing user's photo/browser and live Storage policies were unavailable, so the precise reported iPhone failure cannot be uniquely attributed to one of them.

The new pipeline:

1. Enforces 5 MiB and non-empty input.
2. Detects JPEG, PNG and WebP signatures, including picker files with no MIME or misleading filenames. A genuine JPEG transcoded by iOS is accepted even if its name still ends in `.HEIC`. Renaming arbitrary bytes to `.jpg` does not bypass validation; the browser must also decode the image before upload.
3. Identifies ISO HEIC/HEIF signatures and gives an explicit supported fallback: export/share from iPhone Photos as **Most Compatible / JPEG**, then choose that file. This PR does not pretend to decode HEIC or add a large browser codec dependency. Camera → Formats → Most Compatible can be selected for future JPEG captures if desired.
4. Crops and compresses to JPEG, with a supported PNG/WebP fallback if supplied by the canvas. It uses the resulting Blob's actual MIME type. This avoids making WebP encoding a condition of successful Safari upload. Loading feedback is an indeterminate preparing/uploading state, not an invented percentage.
5. Preserves the existing private object key `<user UUID>/avatar.webp`. That historical filename is required by existing Storage policies; the object now contains a MIME-typed JPEG (or supported canvas fallback). The existing bucket allows JPEG/PNG/WebP. Changing to an arbitrary `.jpg` key would fail those exact-path policies, so no policy relaxation or public bucket is introduced. Supabase serves the object's stored MIME, not merely its filename extension.
6. Reports validation, Storage authorization, network, and saving failures near the photo control. Signed URLs are obtained through the authenticated SDK; the stable path persists on the profile and is signed again after refresh. Neither real signed URLs nor credential values are logged.

A failed operation after an upload may have stored the object even if refreshing its URL failed; the message asks the user to refresh and check instead of falsely asserting nothing happened. Actual Safari/Apple Photos testing and a real authorized upload remain required; iPhone-sized Chromium alone does not prove Safari compatibility.

## Branded authentication emails

The existing seven templates remain synchronized. The shared header is now dark navy with an orange divider and the existing logo. Confirmation, password-reset and email-change templates are in `supabase/templates/`; recovery uses the requested “Reset Your Password” heading and password-reset copy/action. Dynamic Supabase token-hash links, first-name escaping/fallback, and explicit website confirmation remain intact.

**A frontend deploy or GitHub merge does not install Supabase templates.** In Supabase Authentication → Emails → Templates, paste the reviewed HTML and corresponding subject from `supabase/templates/subjects.json` into Confirm signup, Reset password and Change email address (only if supported/enabled). Do not disable CAPTCHA, email confirmation, or secure email change. Optional magic-link/invitation/reauthentication/security-notification flows are not enabled by copying their template.

See [full email installation instructions](BRANDED-AUTH-EMAILS.md) and [email previews](email-previews/README.md). No SMTP key, Resend API key or template was applied to production by this task. Local previews/rendering tests are not evidence of new real email receipt.

## Exact inspection and migration instructions

### Restore core admin functionality without a schema change

1. Review this PR and run the checks. Its schema-only fallback needs **no new SQL migration**.
2. After explicit deployment approval, build with the three real public Auth variables using `npm ci` and `npm run build:auth-production`; deploy the resulting `out/` to Timeweb static hosting. Do not deploy an output marked `mode:test`.
3. Log in as an existing administrator. Verify the workspace loads, the legacy-profile banner appears, and member profiles, bookings, attendance, loyalty and existing actions are authorized. Test a member account separately and verify direct privileged requests are denied.
4. If a permission or required-table error remains, stop and inspect it. The fallback deliberately does not mask those failures.

### Private database inspection (read-only)

Project owner runs `supabase/operations/inspect-dashboard-schema.sql` privately in Supabase SQL Editor. It shows profile/role schemas, RLS flags/policies/grants, trusted existing admin UUIDs/roles and the private photo bucket configuration. Do not post results publicly. Inspect `supabase_migrations.schema_migrations` separately if that history table exists. The public `npm run dashboard:check-schema` command is a zero-row preflight, not a substitute for an administrator test.

### Enable the optional personal fields only after approval

The exact existing migration is:

`supabase/migrations/20261029090000_email_registration_profiles.sql`

It adds nullable personal fields, trusted email/profile triggers and verified-member policies. It is broader than adding columns and must be reviewed in full against current production history. It preserves existing user IDs and existing roles; do not replace it with an email-based automatic admin promotion. Do **not** blindly replay it if any part has already been applied; column additions are not idempotent. Take the provider's supported backup/snapshot and test against a staging copy first.

After explicit approval, the owner applies the reviewed migration through their normal Supabase migration workflow or SQL Editor. Verify the complete transaction committed, PostgREST recognizes the new schema, profile columns/grants/policies are correct, and existing users/roles/history remain unchanged. Then reload the dashboards; the compatibility banner should disappear and optional fields should load. This task does not execute this migration or any administrator-assignment SQL.

For photos, confirm the existing `profile-avatars` bucket is private, permits JPEG/PNG/WebP up to 5 MiB, and has the exact own-user `<uid>/avatar.webp` SELECT/INSERT/UPDATE/DELETE policies. Compare the existing avatar migration `20260726214531_add_profile_avatar_storage.sql` and later verified/admin policies with current history; do not replay the entire migration or make the bucket public as a shortcut.

## Manual acceptance before calling production fixed

- Existing administrator: live role/verified session, successful core queries and member details, meetups, bookings, attendance, rewards and notifications; retry after a transient error.
- Ordinary member: no admin directory/actions, no access to another member's profile/photo/history, no role mutation.
- Compare approved before/after record counts and user UUIDs/roles during any separately approved database work. No production writes or baseline snapshots were taken here.
- Navigate to/from Home, Meetups and Questions without logout; verify explicit logout ends the local session.
- At 320/375/390/430/768/desktop, check readable cards/menu/focus, English/Russian loyalty and mixed paid/unpaid/no-show/free-reward history. Confirm no reward progress changed.
- Real iPhone Safari: select a Photos JPEG, a Files JPEG with empty MIME, PNG/WebP and HEIC; verify helpful errors, crop, authorized upload, refresh persistence and private URL access. Check an expired session and a denied upload without making Storage public.
- Install reviewed Supabase templates separately; receive fresh verification and reset emails and complete their flows on an iPhone. Previously issued emails are unchanged.

## Validation results — 2026-10-31

- `npm run test:auth`: **22 passed**, including full existing migration/data-preservation coverage, a legacy schema without the personal-field migration, real admin/member RLS distinctions, private avatar-folder boundaries, photo signatures and loyalty qualification.
- `npm run test:auth:browser` against the isolated static test build: **74 passed** across desktop/mobile. Coverage includes all prior Auth/recovery/admin regressions plus missing-column fallback, no fallback on permission errors, real retry, legacy personal details, viewport widths, shared language, authenticated navigation, MIME/HEIC failures, successful private photo upload/reload and Storage denial without false success.
- Final focused admin visual recheck covers both desktop/mobile after correcting notification-button contrast. Review screenshots use mocked profiles/data only.
- `npm run test:auth:configuration`: **4 passed**. `npm run test:emails:browser`: **16 passed**. Go rendered seven email types × four metadata cases in HTML/text. No real email was sent.
- Lint, TypeScript, question/translation validators, generated-email checks and diff checks: **passed**.
- `npm run build:auth-production`: **passed**. The final export is marked production, with public Supabase/Turnstile configuration present. This is a build result, not a deployment or live administrator test.
- `npm run dashboard:check-schema`: **requires attention**, correctly reporting the six missing optional columns and anonymous read denial. It makes no writes and does not establish admin authorization.

Early browser failures identified a fixture expecting a raw JPEG HTTP body instead of the SDK's multipart Blob upload, a test racing the mobile header before member data loaded, and dark-theme tokens inherited from a light root. These were corrected and the final suite passed. The photo payload itself is verified as JPEG inside the multipart body; existing Storage policy/key boundaries are preserved.

No production database or user records were changed, no migrations or role assignments were run, and no deployment or merge was performed. The combined feature branch starts at the current `timeweb-static` merge of PR #5; it does not replay those earlier changes.

## Exact files changed in this repair

- `README.md`
- `docs/MEMBER-ADMIN-DASHBOARD-REPAIR.md`
- `docs/dashboard-previews/README.md`
- `docs/dashboard-previews/admin-desktop.png`
- `docs/dashboard-previews/admin-mobile.png`
- `docs/dashboard-previews/member-desktop.png`
- `docs/dashboard-previews/member-mobile.png`
- `docs/email-previews/password-reset-desktop.png`
- `docs/email-previews/password-reset-iphone.png`
- `docs/email-previews/verification-desktop.png`
- `docs/email-previews/verification-iphone.png`
- `package.json`
- `scripts/check-dashboard-schema.mjs`
- `src/app/account/page.tsx`
- `src/app/dashboard-experience.css`
- `src/app/layout.tsx`
- `src/components/admin-client-page.tsx`
- `src/components/admin-dashboard.tsx`
- `src/components/dashboard-navigation.tsx`
- `src/components/member-loyalty-card.tsx`
- `src/components/member-personal-details.tsx`
- `src/components/profile-form.tsx`
- `src/hooks/use-dashboard-language.ts`
- `src/lib/avatar-image.ts`
- `src/lib/loyalty-progress.ts`
- `src/lib/profile-schema.ts`
- `supabase/auth-email-config.mjs`
- `supabase/operations/inspect-dashboard-schema.sql`
- `supabase/templates/email-change.html`
- `supabase/templates/invitation.html`
- `supabase/templates/magic-link.html`
- `supabase/templates/password-changed.html`
- `supabase/templates/password-reset.html`
- `supabase/templates/password-reset.txt`
- `supabase/templates/reauthentication.html`
- `supabase/templates/verification.html`
- `tests/auth/email-auth.spec.ts`
- `tests/sql/legacy-dashboard.test.mjs`
- `tests/unit/dashboard-data.test.ts`
