# Deploy — Lexuri Validação

> Processo revisado em 2026-08-11.

## Produção

- Vercel project: `lexuri-validacao`
- Canonical URL: <https://lexuri-validacao.vercel.app>
- Linked account: `natsouzax`
- Runtime: Node 24.x (declared in `package.json`)
- Deployment source: current local working directory through Vercel CLI

The repository has a GitHub remote, but this project's established release path
is still the Vercel CLI. A production deployment is not proof that the Git
working tree was committed, so commit and tag first.

## Required production environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Database and Auth URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/SSR user client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only quotas, deletion, and administrative access |
| `OPENAI_API_KEY` | Translation, generation, and speech transcription |

`NEXT_PUBLIC_APP_URL` is optional for local maintenance/transcript helpers. Static
curated lessons do not need transcript provider keys at runtime.

Preview and Development environments are separate in Vercel. If using a preview
deployment, configure its environment variables and add that exact callback URL
to Supabase Auth; preferably use an isolated Supabase project for destructive E2E tests.

## Release commands

```bash
supabase db push --dry-run
npm run db:migrate
npm run db:status
npm run deploy
```

`npm run deploy` runs `npm run check:release` before `vercel --prod`.

## Post-deploy smoke

```text
/             -> 200
/login        -> 200
/register     -> 200
/privacy      -> 200
/terms        -> 200
/dashboard    -> 307 to /login while signed out
/api/feedback -> 401 while signed out
```

Then run the authenticated flow in `beta-test-runbook.md`.

## Rollback

Vercel dashboard → Deployments → select the previous known-good deployment →
Promote to Production. Do not manually reverse migrations; ship an explicit
forward migration if database behavior must change.

## External dashboard checks

- Supabase Auth: canonical Redirect URL and intended email-confirmation setting.
- OpenAI project: enforced spend limit and alerts.
- Vercel: Production environment names, Node runtime, logs, and deployment alias.
