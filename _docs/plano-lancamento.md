# Plano de Lançamento — Lexuri

> Análise de pré-lançamento para grupo de teste (professora + alunos).
> Gerado em 07/06/2026

---

## Status do Middleware (RESOLVIDO)

`middleware.ts` criado na raiz re-exportando `proxy.ts`. Proteção de rotas ativa.

---

## Checklist mínimo para lançar

- [x] Criar `middleware.ts` na raiz
- [ ] Fazer push para GitHub e conectar ao Vercel
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Atualizar `NEXT_PUBLIC_APP_URL` com URL real do Vercel
- [ ] Adicionar URL do Vercel no Supabase → Authentication → Redirect URLs
- [ ] Verificar/aplicar as 9 migrations no Supabase
- [ ] Testar build (`npm run build`) localmente antes do push
- [x] Criar páginas `/terms` e `/privacy`

---

## Variáveis de Ambiente (deploy Vercel)

| Variável | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ |
| `OPENAI_API_KEY` | ✅ |
| `NEXT_PUBLIC_APP_URL` | ⚠️ Atualizar para URL do Vercel |
| `RESEND_API_KEY` | ✅ |
| `GENIUS_API_KEY` | ✅ |
| `STRIPE_SECRET_KEY` | ⚠️ Modo test |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Necessita webhook ativo |

---

## Banco de Dados — 9 Migrations

Todas com RLS ativo. Verificar se foram aplicadas no Supabase:
`Database → Migrations` no dashboard.

**Atenção:** Habilitar Realtime para notificações:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

---

## Build de Produção

Se `ytdl-core` causar falha no build, adicionar ao `next.config.ts`:
```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['@distube/ytdl-core', 'youtubei.js'],
}
```

---

## Estimativa

Com o checklist acima, app online para o grupo de teste em **1–2 horas de trabalho**.
