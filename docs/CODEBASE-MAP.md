# Galstyan’s Speaking Club — Codebase Map

This guide is for the club owner and anyone new to the project. It explains where features live, which code runs in the browser or on the server, and which areas need extra care.

## 1. Project Overview

| Part | Technology | What it does |
| --- | --- | --- |
| Frontend | Next.js 16, React 19, TypeScript | Renders the public website, member account, and admin dashboard. |
| Backend | Next.js Server Components and route handlers | Checks sessions, loads protected data, and handles booking/auth endpoints. |
| Database | PostgreSQL through Supabase | Stores members, meetups, bookings, attendance, rewards, questions, notifications, and editable content. |
| Authentication | Supabase Auth | Supports Google OAuth and email/password accounts. |
| File storage | Supabase Storage | Stores private member avatars and public site media. |
| Hosting | Vercel | Builds and serves the Next.js application. |
| Production | `https://galstyansspeakingclub.ru` | The real public domain. |

The application uses the Next.js App Router. Files in `src/app` define URLs. Server Components load protected information before HTML is sent, while files marked `"use client"` provide browser interaction.

### Risk labels used in this guide

- **LOW** — copy, documentation, or isolated visual styling.
- **MEDIUM** — shared UI or navigation; mistakes may affect several pages.
- **HIGH** — authentication, bookings, loyalty, timezone conversion, or admin operations.
- **CRITICAL** — database migrations, RLS policies, triggers, grants, or production credentials.

## 2. Directory Map

### `src/app`

**Type:** Frontend and backend  
**Risk:** MEDIUM overall; HIGH for `account`, `admin`, `auth`, and `api`

Contains the App Router pages and server endpoints. A `page.tsx` creates a page, a `route.ts` creates an HTTP endpoint, `layout.tsx` creates the shared document shell, and `sitemap.ts`/`robots.ts` create search-engine files.

### `src/components`

**Type:** Frontend  
**Risk:** MEDIUM; HIGH for auth, booking, profile, and admin components

Contains reusable and interactive UI: the header, authentication dialog, booking button, member controls, admin dashboard, content editor, question deck, and shared public-page structure.

### `src/hooks`

**Type:** Frontend state and synchronization  
**Risk:** HIGH

Contains `use-question-state.ts`, which synchronizes guest question history in local storage with signed-in account rows in Supabase.

### `src/lib`

**Type:** Shared frontend/backend helpers  
**Risk:** MEDIUM to HIGH

Contains Supabase clients, session/viewer loading, Moscow timezone conversion, public data loaders, SEO helpers, question types, avatar preparation, and admin access helpers.

### `src/data`

**Type:** Static frontend data  
**Risk:** MEDIUM

Contains `questions.json`, the bundled conversation-question library. Keep its IDs stable because progress and favorites refer to them.

### `supabase/migrations`

**Type:** Database  
**Risk:** **CRITICAL**

Contains the ordered SQL history for tables, functions, triggers, indexes, grants, storage policies, and RLS. Never edit an already-applied migration to change production. Add and review a new migration instead.

### `supabase`

**Type:** Authentication configuration  
**Risk:** HIGH

Contains branded Supabase Auth email templates and the production callback allowlist. It does not contain SMTP or provider secrets.

### `public`

**Type:** Frontend assets  
**Risk:** LOW

Contains images and other files served directly from the site root, including the logo and social preview. Replacing a file at the same path changes every page that references it.

### `docs`

**Type:** Documentation  
**Risk:** LOW

Contains this map plus SEO and social-content notes. Documentation does not run in production.

### `scripts`

**Type:** Tooling and external configuration  
**Risk:** HIGH

Contains question validators and the script that updates Supabase Auth email, SMTP, URL, and Google provider settings. Configuration scripts can change production even though they are not part of the website runtime.

### Root-level legacy static files

**Type:** Legacy frontend  
**Risk:** MEDIUM

`index.html`, `app.js`, `styles.css`, and the root legal HTML files are an older static-site implementation. The current production Next.js app lives under `src`. Do not edit the legacy files expecting a Next.js production page to change.

## 3. Route Map

| URL | Main file | Purpose | Risk |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx`, `src/components/home-page.tsx` | Homepage, featured meetups, questions, and auth-aware CTAs | MEDIUM |
| `/about` | `src/app/about/page.tsx` | Public club/host story | LOW |
| `/meetups` | `src/app/meetups/page.tsx` | Published meetup list and booking entry | HIGH |
| `/questions` | `src/app/questions/page.tsx` | Full question library experience | MEDIUM |
| `/how-it-works` | `src/app/how-it-works/page.tsx` | Public meetup process | LOW |
| `/community` | `src/app/community/page.tsx` | Public community page | LOW |
| `/faq` | `src/app/faq/page.tsx` | Published FAQ content | LOW |
| `/contact` | `src/app/contact/page.tsx` | Contact links and location information | LOW |
| `/membership` | `src/app/membership/page.tsx` | Membership explanation | LOW |
| `/account` | `src/app/account/page.tsx` | Protected member dashboard | HIGH |
| `/admin` | `src/app/admin/page.tsx`, `src/components/admin-dashboard.tsx` | Protected administration workspace | HIGH |
| `/admin/members/[id]` | `src/app/admin/members/[id]/page.tsx` | Protected single-member history | HIGH |
| `/auth/*` | `src/app/auth` | OAuth callback, email confirmation, and logout | HIGH |
| `/api/meetups/[id]/book` | `src/app/api/meetups/[id]/book/route.ts` | Booking and cancellation endpoint | HIGH |
| `/api/admin/revalidate` | `src/app/api/admin/revalidate/route.ts` | Refreshes pages after CMS publishing | HIGH |
| `/api/public-content` | `src/app/api/public-content/route.ts` | Cached public meetups/content payload | MEDIUM |
| `/api/cron/supabase-health` | `src/app/api/cron/supabase-health/route.ts` | Secret-protected database health check | HIGH |

## 4. Feature Map

### Authentication

**Risk:** HIGH

- Google OAuth and email/password form: `src/components/auth-dialog.tsx`
- Auth-aware public viewer state: `src/lib/viewer.ts`
- Browser Supabase Auth client: `src/lib/supabase/client.ts`
- Server Supabase Auth client: `src/lib/supabase/server.ts`
- Safe callback URL builder: `src/lib/auth-redirect.ts`
- Google OAuth code callback: `src/app/auth/callback/route.ts`
- Branded email confirmation page: `src/app/auth/confirm/page.tsx`
- Email token verification: `src/app/auth/confirm/complete/route.ts`
- Password reset page/form: `src/app/reset-password/page.tsx`, `src/components/password-reset-form.tsx`
- Logout endpoint: `src/app/auth/signout/route.ts`
- Cookie refresh boundary: `src/proxy.ts`, `src/lib/supabase/proxy.ts`
- Branded Auth emails: `supabase/auth-email-config.mjs`
- Production Auth/provider update script: `scripts/update-supabase-auth-email-config.mjs`

Authorization must come from the verified session and `user_roles`. Display-name or avatar metadata may be used for presentation, but never to grant admin access.

### Auth flow diagrams

Google login:

```text
User
  → Google
  → Supabase OAuth callback
  → /auth/callback
  → Supabase session cookie
  → /account
```

Email signup:

```text
User
  → Register in AuthDialog
  → Supabase Auth
  → Verification email
  → /auth/confirm
  → Token verification
  → Supabase session / account
```

### Member Dashboard

**Risk:** HIGH

- Server-side data loading and summaries: `src/app/account/page.tsx`
- Responsive member header and account menu: `src/components/member-dashboard-header.tsx`
- Profile fields and avatar upload: `src/components/profile-form.tsx`
- Avatar validation/cropping: `src/lib/avatar-image.ts`
- Booking/cancellation control: `src/components/meetup-booking-button.tsx`
- Notifications: `src/components/notification-bell.tsx`

The dashboard reads profile, booking, attendance, reward, question, and notification rows in parallel. Its loyalty numbers are a display of database records, not the authoritative reward calculation.

### Meetups

**Risk:** HIGH

- Public meetup page: `src/app/meetups/page.tsx`
- Homepage meetup cards: `src/components/home-page.tsx`
- Published meetup loader: `src/lib/public-content.ts`
- Booking/cancellation UI: `src/components/meetup-booking-button.tsx`
- Booking/cancellation API: `src/app/api/meetups/[id]/book/route.ts`
- Admin creation/editing: `src/components/admin-dashboard.tsx`
- Timezone and booking-state helpers: `src/lib/meetup-time.ts`
- Database capacity and booking guards: `supabase/migrations/20260723131156_phase_1_member_meetups_loyalty.sql` and `supabase/migrations/20260824193758_fix_member_booking_capacity_guard.sql`

The API authenticates the member and asks Supabase to insert or cancel a row. Database RLS, constraints, and triggers remain the final authority for ownership, booking windows, duplicate bookings, and capacity.

### Meetup business flow

```text
Admin publishes meetup
  → member sees published meetup
  → member books
  → booking appears in admin dashboard
  → member attends
  → admin records attendance and payment status
  → database reconciles loyalty progress
  → free reward unlocks after 6 qualifying paid attended visits
  → the next qualifying free visit redeems that reward
```

### Admin

**Risk:** HIGH in TypeScript; CRITICAL where SQL policies are involved

- Admin access gate and consolidated data load: `src/app/admin/page.tsx`
- Main dashboard actions: `src/components/admin-dashboard.tsx`
- Single-member detail view: `src/app/admin/members/[id]/page.tsx`
- Defense-in-depth email allowlist: `src/lib/admin.ts`
- Member directory RPC and admin RLS: `supabase/migrations/20260726215248_add_member_admin_dashboard.sql`
- Meetups, attendance, payment, roles, rewards, questions: `src/components/admin-dashboard.tsx`
- Content, FAQs, media, revisions, and site settings: `src/components/content-editor.tsx`

Admin access requires all of the following: a valid Supabase session, an allowlisted email, an `admin` row in `user_roles`, and database policies that allow the operation.

### Loyalty

**Risk:** HIGH in UI; CRITICAL in SQL

- Member loyalty display: `src/app/account/page.tsx`
- Admin attendance and reward controls: `src/components/admin-dashboard.tsx`
- Automatic reward reconciliation: `supabase/migrations/20260726215248_add_member_admin_dashboard.sql`
- Free reward redemption and payment normalization: `supabase/migrations/20260817090000_complete_meetup_business_flow.sql`

A qualifying visit is attendance marked `attended` and `paid`. Six qualifying visits create an available loyalty reward. The next free meetup uses and redeems an available reward. Do not calculate or grant rewards in browser code; database triggers own that rule.

### Questions

**Risk:** MEDIUM; HIGH for account synchronization

- Bundled library: `src/data/questions.json`
- Types and category lists: `src/lib/questions.ts`
- Public question UI: `src/components/question-deck.tsx`
- Guest/account progress and favorites: `src/hooks/use-question-state.ts`
- Published admin-added questions: `src/lib/managed-questions.ts`
- Admin question controls: `src/components/admin-dashboard.tsx`
- Data validators: `scripts/validate-questions.mjs`, `scripts/validate-translations.mjs`
- Account-state schema and RLS: `supabase/migrations/20260726205652_add_question_account_state.sql`

Guests keep history and favorites in browser local storage. On first sign-in, unsynchronized guest IDs are merged into the member’s database rows. Russian translations remain optional.

### Content Editor and Site Settings

**Risk:** HIGH in UI; CRITICAL in SQL

- Admin editor: `src/components/content-editor.tsx`
- Published content loader: `src/lib/site-content.ts`
- Revalidation endpoint: `src/app/api/admin/revalidate/route.ts`
- Content/FAQ/revision/media schema and RPCs: `supabase/migrations/20260819090000_structured_site_content_editor.sql`

There is no separate `site_settings` table. Global editable settings are keyed rows in `site_content`. Draft values are private; public pages read enabled published values and retain code fallbacks when content is unavailable.

### SEO

**Risk:** LOW for copy; MEDIUM for shared defaults

- Global metadata and canonical URL helpers: `src/lib/seo.ts`
- Root metadata and social preview: `src/app/layout.tsx`
- Per-page editable metadata: `src/lib/site-content.ts` and each public page’s `generateMetadata`
- Structured data component: `src/components/structured-data.tsx`
- Site-wide organization/website schemas: `src/lib/seo.ts`
- Sitemap: `src/app/sitemap.ts`
- Robots rules: `src/app/robots.ts`
- Public SEO routes: the public `page.tsx` files listed in the route map

Protected account, admin, auth, and API routes are excluded from search indexing.

### Supabase

**Risk:** HIGH for client/session helpers; CRITICAL for migrations and RLS

- Browser client: `src/lib/supabase/client.ts`
- Server client: `src/lib/supabase/server.ts`
- Cookie/session refresh: `src/lib/supabase/proxy.ts`, `src/proxy.ts`
- Shared network timeout: `src/lib/supabase/fetch.ts`
- Database migrations: `supabase/migrations`
- Private avatar bucket: `profile-avatars`
- Public editor-media bucket: `site-media`
- Auth email templates: `supabase/auth-email-config.mjs`

The browser and server clients use the publishable key. RLS is what limits each user’s access. A service-role key must never be exposed to browser code or committed to this repository.

### Email / Auth Emails

**Risk:** HIGH

Supabase Auth sends confirmation, recovery, magic-link, invitation, email-change, reauthentication, and password-change messages. The branded HTML lives in `supabase/auth-email-config.mjs`. `scripts/update-supabase-auth-email-config.mjs` applies the templates and configures Supabase to send through Resend SMTP.

Environment variable names used by the project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`
- `NEXT_PUBLIC_TELEGRAM_AUTH_ENABLED`
- `CRON_SECRET`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `RESEND_SMTP_PASSWORD`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

Store values in approved local/Vercel/Supabase secret settings. Never put access tokens, provider secrets, SMTP passwords, database passwords, or service-role keys in source or documentation.

### Timezone

**Risk:** HIGH

- Canonical helper: `src/lib/meetup-time.ts`
- Admin datetime-local serialization: `src/components/admin-dashboard.tsx`
- Public meetup formatting: `src/app/meetups/page.tsx`
- Homepage meetup formatting: `src/components/home-page.tsx`
- Database columns: `meetups.starts_at`, `ends_at`, `booking_opens_at`, and `booking_closes_at`

All admin-entered meetup dates and times are **Europe/Moscow wall-clock values**. `datetime-local` has no timezone, so `meetupWallTimeToIso` attaches the Moscow meaning and converts it to a UTC ISO instant before Supabase receives it. PostgreSQL stores these columns as `timestamptz` instants. `instantToMeetupWallTime` reconstructs Moscow wall time for admin editing, and `Intl.DateTimeFormat` displays member times with `timeZone: "Europe/Moscow"`.

Example:

```text
Admin enters: 2026-08-25 19:30 Europe/Moscow
Stored instant: 2026-08-25T16:30:00.000Z
Member sees: 19:30 Europe/Moscow
```

Booking availability compares real instants: `booking_opens_at <= now < booking_closes_at`, then checks capacity. Never manually add three hours to a stored ISO timestamp.

## 5. Database Map

All tables below exist in the current Supabase schema. Access descriptions summarize the active RLS model; migrations are the exact source of truth.

| Table | Purpose and relationships | Main readers / writers | Access |
| --- | --- | --- | --- |
| `profiles` | One member profile per Supabase Auth user (`id` matches `auth.users.id`). | Account/admin read; member profile form writes safe fields; auth trigger creates. | Member reads/updates own row; admins can read members. |
| `user_roles` | Authoritative `member` or `admin` role for each Auth user. | Viewer/admin access checks read; protected admin controls write. | Member can read own role; admin management is policy/trigger protected. |
| `meetups` | Meetup details, Moscow timezone label, capacity, price, status, and booking windows. | Public/member pages and admin dashboard read; admins write. | Public sees published rows; authenticated admin policies control management. |
| `meetup_bookings` | Reservation joining a meetup to an Auth user; retains cancellation history. | Booking API, account, and admin dashboard. | Members read/create/cancel their own; admins read/manage under RLS. |
| `attendance` | Authoritative attended/no-show/cancelled and payment state for a member/meetup/booking. | Account/admin read; admins record. | Members read safe own history; writes are admin-only. |
| `loyalty_rewards` | Automatic six-visit reward ledger and redemption state. | Account/admin read; database triggers reconcile and redeem. | Members read own rewards; direct business writes are restricted. |
| `special_rewards` | Manually issued non-loyalty rewards for a member. | Account/admin read; admins issue/manage. | Members read own; admins manage. |
| `attendance_admin_notes` | Private notes separated from member-visible attendance. | Admin dashboard only. | Admin-only. |
| `special_reward_admin_notes` | Private notes for special rewards. | Admin dashboard only. | Admin-only. |
| `admin_audit_log` | Append-only record of protected admin changes. | Admin dashboard reads; triggers write. | Admin read; browser clients do not insert directly. |
| `question_progress` | Explored question IDs per Auth user. | Question-state hook and account/admin summaries. | Members manage own rows; admins may read under dashboard policy. |
| `question_favorites` | Favorite question IDs per Auth user. | Question-state hook and account/admin summaries. | Members manage own rows; admins may read under dashboard policy. |
| `notifications` | In-app alerts for meetup publishing, booking changes, and member events. | Notification bell, account, and admin dashboard. | Members read/update own `read_at`; admins have controlled visibility. |
| `managed_questions` | Admin-created public conversation questions. | Public question loader and admin dashboard. | Public reads published rows; admins manage. |
| `site_content` | Keyed draft/published website copy, SEO fields, and global settings. | Public content loader and content editor. | Public reads enabled published values; admins manage drafts/publishing. |
| `site_faq_items` | Ordered draft/published FAQ entries. | FAQ page and content editor. | Public reads enabled published entries; admins manage. |
| `site_content_revisions` | Page snapshots used for content history and restore. | Content editor and publishing RPCs. | Admin-only. |
| `media_assets` | Metadata for files uploaded to the public `site-media` bucket. | Content editor and public content references. | Admin manages metadata; public can read the referenced public asset. |

Two older tables, `user_profiles` and `user_question_history`, also exist in the live public schema but are not referenced by the current Next.js application. They should be treated as legacy data until a separate, reviewed cleanup confirms whether they can be retired.

### Important database relationships

```text
auth.users
  ├── profiles
  ├── user_roles
  ├── question_progress
  ├── question_favorites
  ├── notifications
  ├── meetup_bookings ──→ meetups
  ├── attendance ───────→ meetups / meetup_bookings
  ├── loyalty_rewards ──→ attendance / meetup_bookings
  └── special_rewards
```

## 6. Quick Change Guide

| If you want to change… | Go here first | Risk / note |
| --- | --- | --- |
| Homepage text | Admin content editor; authored fallbacks in `src/components/home-page.tsx` | LOW for copy |
| About page | Admin content editor; `src/app/about/page.tsx` | LOW |
| Meetup cards/UI | `src/app/meetups/page.tsx`, `src/components/home-page.tsx` | MEDIUM |
| Booking rules | SQL booking functions/triggers in `supabase/migrations`; API adapter in `src/app/api/meetups/[id]/book/route.ts` | HIGH / CRITICAL |
| Meetup capacity | Booking/capacity migrations, especially `20260824193758_fix_member_booking_capacity_guard.sql` | CRITICAL |
| Meetup date display | `src/lib/meetup-time.ts` and meetup page components | HIGH |
| Loyalty rules | Loyalty reconciliation/redemption SQL migrations | HIGH / CRITICAL |
| Member dashboard UI | `src/app/account/page.tsx`, `src/components/member-dashboard-header.tsx` | MEDIUM / HIGH |
| Profile or avatar UI | `src/components/profile-form.tsx`, `src/lib/avatar-image.ts` | MEDIUM |
| Admin behavior | `src/components/admin-dashboard.tsx`, `src/app/admin/page.tsx`, related RLS | HIGH / CRITICAL |
| Editable content workflow | `src/components/content-editor.tsx`, structured content migration | HIGH / CRITICAL |
| Question wording | `src/data/questions.json` or Admin managed questions | MEDIUM; keep IDs stable |
| Question categories/filters | `src/lib/questions.ts`, `src/components/question-deck.tsx` | MEDIUM |
| Google login | `src/components/auth-dialog.tsx`, callback route, provider script, and Supabase provider settings | HIGH |
| Auth email branding | `supabase/auth-email-config.mjs` | HIGH |
| Auth email/SMTP deployment | `scripts/update-supabase-auth-email-config.mjs` plus secure environment settings | HIGH |
| Navigation | `src/components/header.tsx`, `src/lib/site-data.ts` | MEDIUM |
| Colors and spacing | `src/app/globals.css`, `src/app/business-flow.css` | LOW to MEDIUM |
| Logo | `public/gsc-logo.jpg` and metadata references in `src/app/layout.tsx` / email config | LOW |
| Social preview image | `public/social-preview.jpg`, `src/app/layout.tsx` | LOW |
| SEO title/description | Admin content editor, page `generateMetadata`, `src/lib/seo.ts` | LOW to MEDIUM |
| Sitemap or indexing | `src/app/sitemap.ts`, `src/app/robots.ts` | MEDIUM |
| City wording | Admin content editor and public page fallbacks | LOW |

## 7. Areas That Are Risky to Change

### CRITICAL

- Any file in `supabase/migrations`
- RLS policies, grants, security-definer functions, and database triggers
- Capacity counters and booking guards
- Loyalty reconciliation and reward redemption functions
- Production secret values or OAuth/SMTP credentials

### HIGH

- `src/lib/meetup-time.ts`
- `src/app/api/meetups/[id]/book/route.ts`
- `src/components/admin-dashboard.tsx`
- `src/components/auth-dialog.tsx`
- `src/lib/viewer.ts` and Supabase session helpers
- `src/hooks/use-question-state.ts`
- `scripts/update-supabase-auth-email-config.mjs`

### MEDIUM

- Shared navigation and account menus
- Public meetup and question components
- Content editor UI and page revalidation
- Global CSS and responsive breakpoints
- Shared SEO defaults

### LOW

- Documentation
- Isolated public copy
- Small spacing or color changes with visual review
- Static public images when dimensions and filenames are preserved

## 8. Safe Working Rules

1. Run `npm run lint`, `npm run type-check`, and `npm run build` before pushing.
2. Run `npm run validate:questions` and `npm run validate:translations` after editing the bundled question library.
3. Test logged-out, member, and admin views after changing authentication-aware UI.
4. Test both booking creation and cancellation after changing meetup code.
5. Test a Moscow admin time through storage and public display after changing timezone code.
6. Never bypass RLS by trusting browser-submitted user IDs or roles.
7. Never place secret values in `NEXT_PUBLIC_*` variables, source files, documentation, screenshots, or issue comments.
8. Treat migrations as permanent history. Add a reviewed follow-up migration instead of rewriting applied SQL.

