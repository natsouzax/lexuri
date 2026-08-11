# Plano de lançamento — Lexuri beta

> Checklist operacional revisado em 2026-08-11. A fonte executável é
> [`../_plans/beta-test-runbook.md`](../_plans/beta-test-runbook.md).

## Estado técnico

- Host: Vercel, projeto `lexuri-validacao`.
- URL canônica: <https://lexuri-validacao.vercel.app>.
- Runtime: Node 24.x, Next.js 16.3.0.
- Banco: Supabase com migrations 0001–0034.
- Deploy: CLI Vercel; `npm run deploy` executa o gate local antes de publicar.
- Runtime obrigatório: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.

## Gate obrigatório

- [ ] Working tree revisada, commit e tag de beta criados.
- [ ] `npm run check:release` aprovado.
- [ ] `supabase migration list` alinhado até 0034.
- [ ] Redirect URL canônica conferida no Supabase Auth.
- [ ] Signup por e-mail e configuração de confirmação testados.
- [ ] Limite/alertas de gasto configurados no projeto da OpenAI.
- [ ] Smoke test completo com conta descartável.
- [ ] Autorização de responsável/escola organizada para participantes de 13–17 anos.
- [ ] Métricas e canal de suporte definidos.

## Ordem de publicação

1. Backup/recovery do Supabase conferido.
2. Aplicar migrations com `npm run db:migrate`.
3. Repetir `npm run check:release`.
4. Publicar com `npm run deploy`.
5. Validar rotas públicas, redirecionamento de rota protegida e APIs autenticadas.
6. Executar o smoke test do runbook antes de enviar convites.

## Rollback

Promover o deployment anterior em Vercel → Deployments. As migrations 0031–0034
são aditivas, exceto pela troca da policy pública de feedback por uma policy
autenticada; não fazer rollback de banco sem uma migration explícita.
