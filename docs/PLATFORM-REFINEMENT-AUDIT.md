# Public platform refinement

Base: `timeweb-static` at `044d5f242c3f172ed989d7275970aeaf93a3b8de`, which already includes merged PR #7. Working branch: `codex/platform-help-policy-refinement`. This work reuses PR #7’s viewer provider, dashboard fixes and avatar preparation rather than reimplementing them.

## Root causes and changes

| Area | Finding | Implementation |
| --- | --- | --- |
| Contact / How It Works | Server components used the static guest viewer, even when the header showed a signed-in member. | Browser-aware content uses the shared viewer, a neutral loading state and member/admin actions. Event participation links remain available. |
| Theme surfaces | Some card variants used `--ink` (a foreground token) as a background; other sections retained literal white. | Semantic surface roles cover Membership, How It Works, Contact, legal pages, cards and controls. Source-level legacy text colors are replaced with theme tokens, not hidden with clipping or text strokes. |
| Contrast | Low-contrast text remained on Home, About, Questions, Membership and auth forms. | Separate accent text from brand fills, use contrasting button text, improve control boundaries, and preserve full-opacity read notifications. Numeric token tests enforce 4.5:1 normal-text and 3:1 essential-boundary targets. |
| Authentication forms | Standalone forms had no h1; the security widget forced dark mode. | A contextual h1 is used on standalone auth pages and h2 inside the existing dialog; Turnstile follows the theme automatically. |
| Notifications | The bell froze the initial empty array while the root viewer enriched data asynchronously. Read changes were only local to one header. | Derive rows from incoming notifications with local successful-read overrides. Share successful read events with the root viewer so navigation retains state. No new notification writes, recipients or permissions are introduced. |
| Loyalty | The live schema and redemption code support `expires_at`, but display queries/counts omitted it. | Read expiry where already permitted and filter unavailable/expired rewards consistently in member/admin summaries. No reward record, issuance period or database rule is changed. |
| FAQ | 30 English-only entries lacked key self-service answers; language-derived IDs would be unsafe for Cyrillic. | 53 reviewed bilingual entries in eight categories, stable IDs, search over both questions and answers, filter pressed states, semantic heading/button accordions, Arrow/Home/End controls and reduced-motion support. |
| Legal pages | Brief text omitted data flows and unresolved operator facts; Cookies conflated technologies and mentioned unverified usage analytics. | Full proposed EN/RU revisions, structured sections/contents, source-based storage inventory, explicit review status and unset effective dates. Original published wording/dates and acceptance version are preserved. |
| Public copy | Membership/process copy exposed implementation jargon or unimplemented tiers as engineering status. | Describe available user actions and clearly label features that are not offered; do not invent benefits. |

## FAQ review

Every prior question/answer was read. Overlapping “earn a free visit,” “loyalty rule” and “where to see progress” explanations were consolidated into separate rule/progress/redemption tasks. Fixed price, duration, weekly schedule, venue, refund deadline, automatic seat reservation and absolute-beginner suitability are not invented. New coverage includes email verification/recovery, legacy identities, photos, deletion requests, guest versus account practice, synchronization, payment-status distinctions, cancellation versus refunds, expiry and privacy controls.

Categories: About the club; English level; Meetups; Member account; Booking and payments; Loyalty; Website features; Privacy and security. Every authored question, answer and action label has a paired Russian version. The help center uses source-reviewed bilingual content; existing CMS/database records are untouched, and an English-only CMS item is not silently presented as translated content.

## Route review

| Routes | Verification |
| --- | --- |
| Home, About, Meetups, Questions, How It Works, Community, FAQ, Contact, Membership | Both themes, automated WCAG A/AA scans and static hydration. Contact/process and existing CTA regressions exercise guest/member/admin states. |
| Privacy, Terms, Cookies | Both themes, full EN/RU section pairing, contents/links, preserved published dates/text and prominent unapproved-draft status. |
| Login, Signup, Forgot Password | Both themes and accessibility scans, plus the existing verification/recovery/CAPTCHA/duplicate-account suite. |
| Account and Admin | Both themes and accessibility scans; existing data/permission/bulk-attendance/profile/upload regressions; expiry display boundaries. |
| Confirmation, callback, verified, reset, onboarding and other static exports | Existing auth suite loads every export and exercises token, PKCE, recovery and session boundaries. |
| Notification popover, account menu, auth modal and mobile drawer | Active-theme checks, delayed data and successful-read navigation regressions; modal/popover accessibility scans. |

Responsive checks cover 320, 375, 390, 430, 768, 1024 and 1440 px. Existing account tests also cover 1280 px. Mobile screenshots of FAQ, policies, Membership and How It Works were visually inspected in light/dark mode. These are Chromium/browser emulations, not physical iPhone verification.

## Social link verification

Existing destinations were checked by page retrieval on 1 November 2026; HTTP status alone was not treated as proof of a working profile.

| Service | Result |
| --- | --- |
| Instagram | HTTP 200 and page title matched `@galstyansspeakingclub`. No replacement handle invented. |
| Threads | HTTP 200 and page title matched Galstyan’s Speaking Club. Existing `threads.net` URL redirects to `https://www.threads.com/@galstyansspeakingclub`; the source now uses that verified destination. |
| Telegram | HTTP 200 with a “Site Unavailable” page in this environment. Verification is inconclusive; the established official URL is preserved. |
| VK | HTTP 200 with a “Site Unavailable” page in this environment. Verification is inconclusive; the existing URL is preserved. |

No login, message or post was made to any service.

## Validation

Run builds sequentially; the configuration regression script also builds and restores `out/`.

| Command executed | Result |
| --- | --- |
| `npm ci --ignore-scripts` | Passed. |
| `npm run lint` | Passed. |
| `npm run type-check` | Passed. |
| `npm run validate:questions` | Passed; 2,000 bundled questions and stable IDs/levels retained. |
| `npm run validate:translations` | Passed; the existing 100 question translations are unchanged. |
| `npm run test:auth` | 25 unit/isolated SQL tests passed. |
| `npm run test:auth:configuration` | Both missing-setting fixtures passed, four browser cases total; mock artifact restored. |
| `npm run test:auth:build` | Next static test build passed. No production credentials used. |
| `npm run test:auth:browser` | 74 auth/browser regressions passed. |
| `npm run test:audit:browser` | 12 previous audit/browser regressions passed. |
| `npm run test:refinement:browser` | 48 new refinement/browser tests passed, including axe and numeric contrast checks. |
| `npm run emails:check` | Seven generated HTML/text pairs and subjects match. |
| `GSC_GO_EXECUTABLE=/tmp/gsc-go-runtime/go/bin/go npm run emails:preview` | Seven email types × four name cases rendered/validated, using an official checksum-verified Go 1.27.3 download; no email sent. |
| `npm run test:emails:browser` | 16 email/browser tests passed. |
| `npm run validate:static` | 26 static HTML documents and 419 local link destinations validated. |
| `git diff --check` | Passed. |

The resend regression also now waits for its asynchronous request counter, fixing a test-only race rather than adding arbitrary delays.

There are 179 passing unit/browser/isolated-SQL cases across the suites above; repeated runs are not counted as additional cases. Automated accessibility success describes the tested pages/states and does not certify universal WCAG compliance.

## Limits and release considerations

- `npm run build:auth-production` correctly refuses to build without the three existing public production settings. `npm run auth:check` and `npm run dashboard:check-schema` also report missing public settings. No new production environment variable is introduced. Restore the actual production build configuration before making a release artifact.
- **Never deploy the test `out/`**: it deliberately embeds an isolated backend and CAPTCHA test key. Production build gates remain intact; the verified static output structure remains compatible with Timeweb’s static hosting.
- Native WebKit launch was attempted and failed because system libraries are missing. Physical Safari/HEIC success and actual email/CAPTCHA delivery remain live checks, not passing results.
- Read-only connected-project inspection verified the Paris region, missing optional profile columns, reward expiry support, redemption/reconciliation definitions and existing expiry SELECT permission. No private member rows, records, settings, policies, buckets or Auth identities were read or changed.
- No new migration is required for these application changes. The optional existing registration-profile migration remains unapplied; see the separate review instructions before any schema action.
- The legal revisions cannot be treated as finalized policies. Read [the owner/legal requirements](LEGAL-REVIEW-REQUIREMENTS.md), resolve the facts and legal bases, and explicitly approve an effective date/version before adoption. Existing terms acceptance and published text remain available.
- No merge or deployment has been performed. `main`, `backup-before-static` and `timeweb-static` are not written by this work.
