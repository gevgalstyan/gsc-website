# Static-site audit and repair

Target: `timeweb-static`. Working branch: `codex/site-audit-repair`.

## Findings and repairs

| Area | Root cause | Repair |
| --- | --- | --- |
| Public authentication | Static `getViewer()` always returned a guest; individual components restored sessions independently and waited for optional queries. | One root browser viewer provider supplies live display state to every header and CTA. Session restoration has a neutral loading state. Profile/role/notification enrichment is deferred and cannot turn a signed-in member into a guest. Protected operations still use verified users and RLS. |
| Login/signup | Auth forms did not distinguish an existing member from a guest. | Existing members get a dashboard action. Homepage auth dialogs open only after guest state is resolved. Recovery and verification flows retain their existing behavior. |
| Booking UI | A button could retain the initial guest-era booking state after the member's booking arrived. | Key booking controls by member and server booking status so the correct state is restored. |
| Admin profiles | The live project's `profiles` table lacks `first_name`, `surname`, `age`, `nationality`, `gender`, and `email`. | Keep the schema-only fallback to existing profile columns and expose its explanation as an expandable admin diagnostic. Permission/network failures remain visible errors. Members use the main profile editor when optional personal fields are unavailable. |
| Admin avatars | The loader always supplied an empty signed-avatar map. | Load permitted private signed images after core data; Storage failures cannot block administration. Existing Storage policies remain authoritative. |
| Dashboard layout | Minimum grid tracks and small fixed typography conflicted with narrow screens. | Flexible tracks, wrapping controls, readable labels, tablet/mobile layouts and consistent panel spacing. |
| Themes | The dashboard stylesheet overrode theme tokens with a permanent dark palette; auth form CSS also hard-coded dark surfaces. | Reuse global theme tokens, including embedded profile details, inputs and notifications. Add dashboard theme controls and allow theme switching when Safari blocks localStorage writes. |
| Loyalty | The card's kicker remained English in Russian mode; admin paid-visit counts used a legacy boolean. | Translate the complete loyalty card and use attended/paid status for admin totals. No reward rules or ledgers are changed. |
| iPhone photos | HEIC signatures were rejected before Safari could decode them; the 5 MB source limit rejected many camera originals. | Try native decoding for recognized HEIC/HEIF, accept sources up to 20 MB, encode a bounded JPEG before uploading, and retain the 5 MB upload limit. Unsupported decoders give an explicit JPEG fallback. Existing private object paths, constraints and policies are preserved. An ambiguous profile-update failure never deletes a stable avatar object. |
| Member dates | Booking dates used the device's timezone. | Display club dates in Europe/Moscow with an MSK label. |

## Data and access safety

No live records, database schema, policies, roles, auth configuration, buckets or objects were changed. The live inspection queried schema metadata and avatar bucket/policy metadata only. Existing migration history remains unchanged. In particular, the registration-profile migration already in this branch has **not** been applied to production as part of this PR.

UI viewer roles are presentation only. Admin data still requires `getUser`, `user_roles`, the existing directory RPC and database RLS. No metadata is used to grant permissions. SQL regression fixtures run in isolated PGlite databases, not production.

## Reproducing validation

Run builds sequentially; configuration tests also build and share `.next`/`out`.

```sh
npm ci --ignore-scripts
npm run lint
npm run type-check
npm run validate:questions
npm run validate:translations
npm run test:auth
npm run emails:check
npm run test:auth:configuration
npm run test:auth:build
npm run test:auth:browser
npm run test:audit:browser
```

The test builds deliberately embed an isolated mocked backend and CAPTCHA test key. **Never deploy their `out/` artifact.** The production build requires the real public Supabase/CAPTCHA environment variables and rejects mocked configuration.

The audit browser suite covers 320 px, 375 px mobile emulation and 1440 px desktop, guest/member/admin presentation, slow optional data, legacy profile columns, all admin tabs, both themes, loyalty translations and JPEG preparation/upload. Existing auth tests additionally cover 390, 430, 768 and 1280 px, verification, recovery, password updates, permissions, logout, Storage denial and persisted avatar paths.

## Verification limits

- Live `auth:check` and anonymous `dashboard:check-schema` cannot run from this checkout without the public production build variables. Metadata inspection through the connected project independently confirmed the missing optional profile fields and the private bucket's JPEG/PNG/WebP allowance and 5 MB limit.
- Email preview/browser tooling requires a Go compiler, which is absent here. Template generation consistency is checked independently by `emails:check` and unit tests.
- Native WebKit cannot launch because the environment lacks its system libraries and cannot install them. Mobile Chromium emulation is not a physical iPhone/Safari test. Native HEIC success therefore remains a real-device verification item; unsupported-browser errors and JPEG/PNG upload behavior are tested.
- Actual CAPTCHA rejection, email receipt and authenticated operations against production remain live verification items. No test signs into or writes to a real member account.
