# Instructions for AI coding agents

## Start before editing

1. Read [INDEX.md](INDEX.md) and the relevant sections of [КАРТА_ПРОЕКТА.md](КАРТА_ПРОЕКТА.md).
2. Inspect the actual source, current branch, repository status and relevant tests. Documentation and historical incident reports can be stale; do not trust them blindly or infer production state from Git history.
3. Identify the smallest set of files that owns the requested behavior. Make minimal, targeted changes; preserve unrelated functionality, existing work and documentation. Do not refactor broadly or regenerate assets as a side effect.
4. For repository changes, create a separate branch from current `timeweb-static` and open a PR targeting it. Do not modify `main` or backup branches. Never merge or deploy without explicit approval.

## Preserve data and security

- Never expose credentials, passwords, tokens, SMTP secrets, private keys, personal data or production dumps in source, logs, test fixtures, screenshots, docs or PRs. Use public-variable names and synthetic examples, not real values. `NEXT_PUBLIC_*` is browser-visible.
- Never modify production databases, schema, RLS, grants, Auth settings or Storage configuration without explicit authorization for the concrete action. Local migrations/tests do not authorize production changes. Do not run blanket `db push`, operator SQL, old migrations or restore scripts as routine validation.
- Never delete existing user accounts or member data. Preserve UUIDs, identities, bookings, attendance/payment records, rewards, permissions and relationships. Do not recreate accounts to fix login issues.
- UI role checks and redirects are presentation only. Keep authoritative authorization in DB policies/grants and guarded RPCs; do not derive administrator privileges from user-editable metadata or frontend email lists. Do not weaken RLS to suppress errors.
- Inspect legacy profile compatibility before changing selects. Do not treat missing optional columns as permission to migrate production. Preserve private avatar paths and bucket visibility.
- Privacy protection defaults closed. Do not disable it to make a test pass. Deliberately use the matching isolated mock build; frontend guards do not close direct Supabase Auth/API access.

## Architecture boundaries

- Current application is Next.js static export: edit `src/app`, components, hooks and helpers. There are no active Next.js API route handlers at the documented baseline. Do not add server-only runtime features without reviewing hosting compatibility.
- Root `index.html`/`app.js`/`styles.css` are a separate implementation; do not patch them instead of the active Next.js source or remove them without checking consumers.
- Verify script contents before running them. Some diagnostics contact live services, browser suites overwrite `out/` and tracked preview images, and mock builds are not deployable.
- Do not alter environment, DNS, hosting, SMTP, deployment settings or external accounts as an incidental fix. Production merge/deployment always needs approval.

## Validate and document

- Run appropriate checks before proposing changes; select commands from the map's test matrix. For documentation-only work, verify paths/anchors, command names, scope and consistency; a production build is not needed just to validate Markdown.
- For auth, authorization, booking or sync changes, include meaningful negative and preservation tests. For UI changes check mobile, light/dark and relevant EN/RU states. Chromium iPhone emulation is not physical Safari verification.
- Do not claim a test, live login, API restriction, backup or deployment succeeded unless actually verified. Report failures, missing configuration and limits explicitly; never substitute a mock result for production evidence.
- Update INDEX.md and the relevant map sections when routes, architecture, responsibilities, configuration names or file locations change. Link existing runbooks instead of duplicating their full contents. Record the inspected baseline and distinguish source facts, historical records and unverified live state.
- Final report: describe the change, validation, material risks/limits and PR link. Do not merge or deploy automatically.
