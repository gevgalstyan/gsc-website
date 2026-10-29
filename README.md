# Galstyan’s Speaking Club

Production website for Galstyan’s Speaking Club, built with Next.js, React, TypeScript, Supabase, and Vercel.

Start with the owner-friendly [Codebase Map](docs/CODEBASE-MAP.md) to find features, routes, database tables, risk levels, and the safest file to edit for common changes.

## Local checks

```bash
npm run lint
npm run type-check
npm run build
```

Copy `.env.example` when setting up a local environment. Never commit secret values.

## Email registration and static hosting

See [Email Auth setup](docs/EMAIL-AUTH-SETUP.md) for the required Supabase migration,
Turnstile, SMTP/templates, redirects, automated tests and approval gates.
Production email access is not ready until those settings and live flows are verified.

For blocked Sign Up / missing CAPTCHA, follow the [production registration recovery checklist](docs/REGISTRATION-RECOVERY.md).
The default production build requires all three public Auth settings; `vercel.json` is not a Timeweb environment configuration.
Run `npm run auth:check` for read-only, value-redacting diagnostics.
