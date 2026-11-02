# Project index — Galstyan’s Speaking Club

Start here, then read the relevant section of [КАРТА_ПРОЕКТА.md](КАРТА_ПРОЕКТА.md) and the actual source. Contributor safety rules: [AGENTS.md](AGENTS.md).

Verified against `timeweb-static` commit `8ccf183a3d42e311a231480009cf146e2adb1a95` on 2026-11-02. This describes repository code, not proof of the current deployment, DNS, Auth settings or applied database schema. Update this baseline when architecture changes.

## Architecture at a glance

- English conversation club: public information/practice, member profiles/bookings/history/rewards, administrator workspace and content editing.
- [package.json](package.json): Next.js 16.3.1 App Router, React 19.2.4, TypeScript 5.7.2, Supabase JS 2.110.8, Lucide icons; ESLint, Playwright/Axe and PGlite tests. Versions come from the manifest; use [package-lock.json](package-lock.json) for installation.
- [next.config.ts](next.config.ts): **static export**, trailing slashes, unoptimized images. App Router server components render at build time; there are no `src/app/**/route.ts` handlers in this baseline. Auth and data mutations go from the browser to Supabase, not a Next.js backend.
- [src/app/layout.tsx](src/app/layout.tsx) wraps routes with the shared browser viewer and privacy notice; loads theme initialization, metadata and four global CSS layers.
- [src/lib/supabase/client.ts](src/lib/supabase/client.ts): singleton browser client, localStorage session, PKCE, explicit callback exchange; [fetch.ts](src/lib/supabase/fetch.ts) handles timeout/abort and application privacy guards.
- Authorization belongs to PostgreSQL RLS, grants, triggers and guarded RPCs in [supabase/migrations](supabase/migrations). A client redirect or hidden button is not a security boundary.
- Timeweb static hosting is the documented target. [vercel.json](vercel.json) remains platform-specific configuration; it does not configure Timeweb or prove where the live site is hosted. No deployment workflow is checked into `.github/workflows` at this baseline.

## Directory navigation

| Location | Responsibility |
|---|---|
| [src/app](src/app) | Routes, layouts, metadata, global CSS |
| [src/components](src/components) | Public UI, auth, dashboards, content editor, question deck |
| [src/hooks](src/hooks) | Shared viewer, language preference, question state/sync |
| [src/lib](src/lib) | Domain rules, browser transport, validation, data types and static fallbacks |
| [src/data/questions.json](src/data/questions.json) | Bundled question library; IDs are persistent references |
| [public](public) | Public assets copied into the exported site |
| [supabase/migrations](supabase/migrations) | SQL history: schema, RLS, grants, functions, triggers, Storage |
| [supabase/operations](supabase/operations) | Explicit operator procedures, not automatically applied migrations |
| [supabase/templates](supabase/templates) | Generated Auth mail HTML/text/subjects; canonical definitions elsewhere |
| [scripts](scripts) | Build gates, read-only diagnostics, content validators, mail generation/preview |
| [tests](tests) | Unit/SQL plus auth, audit, refinement, privacy and email browser suites |
| [docs](docs) | Existing investigations, operational guides and privacy review |

Root [index.html](index.html), [app.js](app.js), [styles.css](styles.css) and standalone legal HTML are a separate static implementation, not the source used by `npm run build`. Do not edit them expecting to change Next.js routes, or delete them without checking external consumers. Generated build/dependency directories are not part of this map.

## Pages and entry points

Exact routes and page files: [route catalogue](КАРТА_ПРОЕКТА.md#routes).

| Area | Entry points |
|---|---|
| Home and public shell | [page.tsx](src/app/page.tsx), [home-page.tsx](src/components/home-page.tsx), [public-page-shell.tsx](src/components/public-page-shell.tsx) |
| Information | `/about/`, `/how-it-works/`, `/community/`, `/contact/`, `/membership/` |
| Public meetups / practice / help | [meetups](src/app/meetups/page.tsx), [questions](src/app/questions/page.tsx), [FAQ](src/app/faq/page.tsx) |
| Member / admin / onboarding | [account](src/app/account/page.tsx), [admin](src/app/admin/page.tsx), [onboarding](src/app/onboarding/page.tsx) |
| Email access | `/login/`, `/signup/`, `/forgot-password/`, `/verify-email/`, `/reset-password/` |
| Auth links | [callback](src/app/auth/callback/page.tsx), [confirm](src/app/auth/confirm/page.tsx), [verified](src/app/auth/verified/page.tsx) |
| Legal / requests | `/privacy/`, `/terms/`, `/cookies/`, [privacy-requests](src/app/privacy-requests/page.tsx) |
| Search metadata / missing page | [sitemap.ts](src/app/sitemap.ts), [robots.ts](src/app/robots.ts), [not-found.tsx](src/app/not-found.tsx) |

## Feature entry points

| Need | Read first | Detailed map |
|---|---|---|
| Auth / role-sensitive UI | [email-auth-form](src/components/email-auth-form.tsx), [use-browser-viewer](src/hooks/use-browser-viewer.ts) | [Auth and security](КАРТА_ПРОЕКТА.md#auth) |
| Member / admin dashboard | [account page](src/app/account/page.tsx), [admin-client-page](src/components/admin-client-page.tsx), [admin-dashboard](src/components/admin-dashboard.tsx) | [Dashboards](КАРТА_ПРОЕКТА.md#dashboards) |
| Profiles / iPhone photos | [profile-form](src/components/profile-form.tsx), [avatar-image](src/lib/avatar-image.ts) | [Profiles and Storage](КАРТА_ПРОЕКТА.md#profiles) |
| Database / authorization | [migrations](supabase/migrations), [profile-schema](src/lib/profile-schema.ts) | [Database map](КАРТА_ПРОЕКТА.md#database) |
| Meetups / bookings / attendance / loyalty | [meetups-listing](src/components/meetups-listing.tsx), [meetup-time](src/lib/meetup-time.ts), [loyalty-progress](src/lib/loyalty-progress.ts) | [Meetup business flow](КАРТА_ПРОЕКТА.md#meetups) |
| Questions / progress / favorites | [questions](src/lib/questions.ts), [question-deck](src/components/question-deck.tsx), [use-question-state](src/hooks/use-question-state.ts) | [Question library](КАРТА_ПРОЕКТА.md#questions) |
| Notifications | [notification-bell](src/components/notification-bell.tsx), [notification-target](src/lib/notification-target.ts) | [Notifications](КАРТА_ПРОЕКТА.md#notifications) |
| Theme / EN–RU / FAQ / legal text | [theme-toggle](src/components/theme-toggle.tsx), [use-dashboard-language](src/hooks/use-dashboard-language.ts), [faq-data](src/lib/faq-data.ts), [legal-data](src/lib/legal-data.ts) | [Presentation and content](КАРТА_ПРОЕКТА.md#presentation) |
| CMS / media / SEO | [content-editor](src/components/content-editor.tsx), [site-content](src/lib/site-content.ts), [seo](src/lib/seo.ts) | [CMS and static fallbacks](КАРТА_ПРОЕКТА.md#cms) |
| Privacy protection | [privacy-protection](src/lib/privacy-protection.ts), [reviewed operation](supabase/operations/privacy-protection-review.sql) | [Privacy boundary](КАРТА_ПРОЕКТА.md#privacy) |
| Build / tests / deployment | [package.json](package.json), [auth-configuration](scripts/auth-configuration.mjs) | [Validation and deployment](КАРТА_ПРОЕКТА.md#validation) |

## Safe local workflow

1. Read [AGENTS.md](AGENTS.md), identify the feature in the map, inspect current source and tests.
2. Install with `npm ci`. See [.env.example](.env.example) for variable names; never copy actual secrets into documentation, fixtures or logs. Node requirements are not pinned by an `engines` entry; scripts use modern Node flags.
3. Run checks appropriate to the change; see the [test matrix](КАРТА_ПРОЕКТА.md#validation). UI/browser suites need the matching mock export; **never deploy it**.
4. Production export uses `npm run build:auth-production`, writes a non-secret build-status marker and requires real public build settings. Confirm `mode: production` and the intended privacy mode; building does not deploy, configure Auth, apply SQL or install email templates.
5. Open a reviewable PR against `timeweb-static`. Merge, deployment and production database changes require explicit authorization.

## Existing documentation and caveats

- [README](README.md): original onboarding links and commands.
- [Email setup](docs/EMAIL-AUTH-SETUP.md), [registration recovery](docs/REGISTRATION-RECOVERY.md), [branded Auth emails](docs/BRANDED-AUTH-EMAILS.md): operational mail/CAPTCHA/callback instructions.
- [Dashboard repair](docs/MEMBER-ADMIN-DASHBOARD-REPAIR.md), [site audit](docs/SITE-AUDIT-REPAIR.md), [platform refinement](docs/PLATFORM-REFINEMENT-AUDIT.md): historical findings and validation, not fresh live guarantees.
- [Privacy report](docs/privacy/REPORT-RU.md), [production change record](docs/privacy/PRODUCTION-CHANGE-RU.md), [operations](docs/privacy/OPERATIONS-RU.md), [legal review requirements](docs/LEGAL-REVIEW-REQUIREMENTS.md): recorded decisions and unresolved prerequisites. Recheck live status only when the task authorizes it.
- [Older Codebase Map](docs/CODEBASE-MAP.md) is retained for context, but its server-route/Vercel architecture descriptions are outdated for this baseline. Use this index and the verified map below instead of copying those claims.
- Known source inconsistencies and the documentation maintenance checklist: [risks and upkeep](КАРТА_ПРОЕКТА.md#risks).
