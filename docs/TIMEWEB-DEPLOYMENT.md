# Timeweb static deployment

Deploy from `timeweb-static` through a reviewed feature-branch PR. Preserve `main`
and `backup-before-static`. Do not merge, deploy, run migrations, or run
`scripts/update-supabase-auth-email-config.mjs` without the owner's approval.

## Build and preview

Use Node.js 24 (validated in Codex Cloud) and the committed npm lockfile:

```sh
npm ci --no-audit --no-fund
npm run lint
npm run type-check
npm run validate:questions
npm run validate:translations
npm run build:production
```

`npm run build` permits a public-only build without Supabase configuration.
`build:production` additionally requires the public Supabase configuration and
checks exported routes and local assets. It does not verify live backend access.
For development use `npm run dev`. For an export preview serve `out/` with a static
HTTP server that supports directory index files. `npm start` is not an export
server. Next's build lists 22 prerender entries, including a virtual global error
boundary; the artifact validator checks the actual routes and `404.html`.

Upload only the contents of `out/`, including `_next/` and nested directories.
Do not upload the repository, `.env` files, `node_modules`, or `.next`.
Configure Timeweb directory indexes, HTTPS, and the custom 404 page. Verify that
`/auth/callback/`, `/auth/confirm/`, `/account/`, `/admin/`, and
`/reset-password/` open directly, not only through client navigation.
Use a real HTTP redirect from www to the canonical apex domain where supported;
the existing browser redirect alone does not cover crawlers or non-JS clients.

## Build-time variables

Set these in the build environment or an ignored `.env.local`; never commit it.
Timeweb does not apply `vercel.json`. Static assets cannot read server environment
variables after upload, so rebuild after changing any `NEXT_PUBLIC_` setting.

| Variable | Requirement |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required for member functions; HTTPS project origin |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Required; public `sb_publishable_` key, never a service-role/secret key |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Optional, defaults off; enable after provider and redirects are tested |
| `NEXT_PUBLIC_TELEGRAM_AUTH_ENABLED` | Leave false; the current Telegram control is disabled and integration is unfinished |

The first two settings are public by design. Keep SMTP passwords, provider client
secrets, management tokens and service-role keys outside browser builds entirely.
`CRON_SECRET` is not used by this static branch. `SUPABASE_ACCESS_TOKEN`,
`RESEND_SMTP_PASSWORD`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, and
`SUPABASE_PROJECT_REF` belong only to the optional management configuration script;
they are not runtime requirements and the script changes production settings.

## Manual Supabase prerequisites

An owner must verify the existing settings; this document does not apply them:

- Set the Auth Site URL to `https://galstyansspeakingclub.ru`. Allow the canonical
  `/auth/callback/` destination, including reset-password `next` queries, and
  explicitly approved staging/local callback origins. Prefer narrow allowlists.
- Check email confirmation/recovery templates. The repository templates use
  `/auth/confirm/?token_hash=...&type=...&next=...` and browser `verifyOtp`.
  The removed `/auth/confirm/complete` endpoint must not be used. Check SMTP delivery.
- For Google, configure the provider in Supabase and its Supabase callback in
  Google's console. OAuth provider secrets stay in Supabase, not the website.
- Verify the deployed migration history, including profile onboarding and
  notification/meetup consistency migrations. Do not apply migrations blindly.
- Verify RLS, storage policies for `profile-avatars` and `site-media`, admin role
  assignment, and grants for `admin_member_directory`, `admin_publish_announcement`,
  `publish_site_page`, `discard_site_page_drafts`, and `restore_site_revision`.
  Browser admin visibility is not authorization; database policies must enforce it.

## Static compatibility and acceptance

Registration, email/password login, PKCE Google callbacks, email confirmation,
recovery, logout, onboarding, dashboards, bookings, uploads and admin mutations
have browser Supabase implementations. Build success and rendered shells do not
prove authenticated behavior or database authorization. Use a dedicated staging
project and member/admin accounts to test these flows, including denied non-admin
access, cross-user isolation, capacity limits and duplicate bookings.

Next.js API handlers, server cookies, middleware/proxy, server image optimization,
request-time rendering and ISR cannot run on Timeweb static hosting. This branch
removes server routes and uses unoptimized images. `revalidate` declarations do
not provide scheduled regeneration on static hosting. Published browser content
can update through Supabase, but generated SEO/HTML requires a rebuild. Old
`/api/*`, `/auth/signout`, and `/admin/members/:id` server URLs are unavailable.
External cron monitoring must not target removed health endpoints.

## Release through GitHub

1. Branch from the latest `timeweb-static`; commit only intended source/config/docs.
2. Open a PR targeting `timeweb-static`, run all checks, and preview `out/` on staging.
3. Obtain approval before merging or deploying. Keep automatic deployment disabled
   unless an explicit approval gate protects the production environment.
4. Build the approved commit with the approved public variables. Retain the commit
   SHA and previous artifact, upload `out/`, and verify direct links, assets, 404s,
   confirmation links, login, account, admin permissions and mobile navigation.
5. Roll back by restoring the previous artifact. Database changes require their
   own separately approved plan; a static rollback does not undo database changes.
