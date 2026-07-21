# Deploy — Lexuri Validação

> Como colocar o MVP no ar. Atualizado em 2026-07-21.

---

## Onde roda

- **Host:** Vercel — projeto `lexuri-validacao`
- **URL de produção:** https://lexuri-validacao.vercel.app
- **Conta:** natsouzax (`.vercel/project.json` guarda o link)
- **Sem GitHub conectado:** o deploy é feito **direto da máquina** pela CLI da
  Vercel (não há `git push` — os commits ficam locais no repositório).

## Serviços externos (já configurados na Vercel)

| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Banco + Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Rotas server-side |
| `OPENAI_API_KEY` | Traduzir/definir palavra (tap-to-translate, tradutor flutuante) |

O `lrclib.net` (usado só nos scripts locais de geração de lição) **não** é
necessário em produção — as lições são estáticas em `data/featured-lessons/`.

---

## Passo a passo

```bash
# 1. Garantir que o build passa localmente
npm run build

# 2. Deploy de produção (sobe a pasta atual pra Vercel)
npm run deploy        # = vercel --prod
```

Pronto. O `vercel --prod` empacota, sobe e publica em
lexuri-validacao.vercel.app. Não precisa de git.

### Pré-requisitos (uma vez só)
- Estar logado: `vercel whoami` (senão `vercel login`)
- Projeto linkado: já está (`.vercel/project.json`). Se sumir: `vercel link`.

---

## Banco de dados (Supabase)

As migrations vivem em `supabase/migrations/`. A 0024 (MVP: song_progress,
takeaways, user_verses, profiles.study_level/brain_map) **já foi aplicada**.
Para aplicar novas:

```bash
npm run db:migrate    # = supabase db push
```

Depois do deploy, conferir no Supabase → Authentication → URL Configuration
se `https://lexuri-validacao.vercel.app` está nas **Redirect URLs** (senão o
login OAuth/callback falha).

---

## Rollback

A Vercel guarda todos os deployments. Para voltar: dashboard do projeto →
aba Deployments → no deployment anterior, "Promote to Production" (1 clique).

---

## Opcional — conectar GitHub (deploy automático)

Hoje o deploy é manual pela CLI. Se quiser deploy automático a cada push:

```bash
# criar repo no GitHub (privado), então:
git remote add origin git@github.com:<user>/lexuri-validacao.git
git push -u origin master
# depois, no dashboard da Vercel: Settings → Git → conectar o repo
```

A partir daí cada `git push` dispara um deploy. Enquanto não fizer isso, use
`npm run deploy`.

---

## Pendências conhecidas

- **Under the Bridge** está em manutenção (fora do catálogo) — legenda ASR
  corrompida. Re-sincronizar com `npm run resync:batch3` (precisa acessar
  lrclib.net) e remover `maintenance: true` de `data/feed-items.json`.
