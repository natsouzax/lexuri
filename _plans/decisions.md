# Decisões Arquiteturais — Lexuri

> Log de decisões relevantes. Formato: data + decisão + motivo + alternativas rejeitadas.

---

## 2026-06-20

### Middleware em arquivo separado `proxy.ts`
**Decisão:** Mantido como está — `middleware.ts` re-exporta de `proxy.ts`
**Motivo:** O conteúdo de `proxy.ts` foi gerado por IA e estava correto; a falta era apenas do ponto de entrada `middleware.ts`
**Alternativa rejeitada:** Mesclar tudo em `middleware.ts` e deletar `proxy.ts` — seria refatoração sem ganho

### Páginas legais como Server Components inline
**Decisão:** `/terms` e `/privacy` como Server Components com conteúdo inline (sem componente separado)
**Motivo:** Conteúdo estático, sem lógica — não justifica extrair componente. Segue padrão de `about/page.tsx`

### Documentação em `_docs/` e planos em `_plans/`
**Decisão:** Separar análises técnicas históricas (`_docs/`) de planos ativos (`_plans/`)
**Motivo:** Análises são snapshot de um momento; planos são documentos vivos
**Alternativa rejeitada:** Pasta `docs/` única — misturaria histórico com roadmap ativo

---

## Decisões Anteriores (inferidas do código)

### Tailwind v4 sem shadcn/Radix
**Decisão:** CSS puro em `globals.css` + Tailwind como utilitário de reset
**Motivo:** Controle total do design system; evita dependência de componentes terceiros que conflitam com a paleta custom

### Supabase Auth em vez de NextAuth
**Decisão:** Supabase SSR Auth com `@supabase/ssr`
**Motivo:** Supabase já é o banco — Auth integrado elimina uma dependência e um serviço externo

### SM-2 implementado do zero (`lib/srs.ts`)
**Decisão:** Algoritmo próprio, sem biblioteca
**Motivo:** SM-2 é simples (20 linhas), bibliotecas adicionariam overhead sem benefício; facilita testes unitários

### Gamificação server-side only
**Decisão:** Pontos calculados apenas no servidor (`/api/gamification/award`)
**Motivo:** Evita manipulação client-side dos pontos. O trigger de banco é um stub intencional.

### Offline via IndexedDB + Service Worker próprio
**Decisão:** `public/sw.js` escrito manualmente
**Motivo:** Workbox adicionaria ~30KB; o caso de uso é simples (cache estático + fila de mutações)

---

## 2026-07-21 — Pivô: MVP de Validação (músicas)

### Escopo cortado ao osso
**Decisão:** Remover todo o aparato SaaS (gamificação, Stripe, Spotify, Music Lab, onboarding 9 passos, placement, analytics, notifications, e-mails, LMS, offline). Rotas restantes: landing, auth, /level, /feed, /feed/[id], /flashcards, /review.
**Motivo:** O objetivo é validar a hipótese "aprender inglês com música gera engajamento e retenção" — todo o resto era ruído de produto de venda.

### Catálogo estático curado (13 músicas)
**Decisão:** Só lições pré-geradas com sync e chunks auditados (auditoria 2026-07-21). Excluídas: believer (transcript vazio), sweet-child-o-mine (sync errada), californication (legenda truncada), come-together/in-my-life/yesterday (maintenance) e os 3 vídeos (fora da hipótese).
**Motivo:** Zero custo de IA/scraping em runtime; qualidade garantida pro grupo de teste.

### Revisão: ciclo fixo D1/D2/D3 por música (sai SM-2 do fluxo)
**Decisão:** Day 1 = flashcards leitura; Day 2 = jogo da memória; Day 3 = fill-in-the-gaps + takeaways. SM-2 permanece só como coluna legada na tabela flashcards.
**Motivo:** Alinhado à hipótese e mensurável; SM-2 por card é otimização prematura pra validação.

### Glossário só com escrita ativa
**Decisão:** Palavra nenhuma entra automaticamente; o glossário são os takeaways que o usuário escreve no Day 3. A cada 2 takeaways, um verso é gerado (música do usuário).
**Motivo:** Valida aprendizado ativo — métrica central da pesquisa.

### Banco: migration 0024 aditiva, sem drop
**Decisão:** Novas tabelas song_progress, takeaways, user_verses + colunas study_level/brain_map em profiles. Tabelas SaaS antigas NÃO dropadas.
**Motivo:** O projeto Supabase ("Lexuri") pode ser compartilhado com o app principal. Candidatas a drop futuro (decisão do Natan): subscriptions, plans, coupons, weekly_usage, user_points, points_events, badges, notifications, email_preferences, analytics_events, songs, spotify_tokens, youtube_transcript_cache, feed_lessons, feed_lesson_chunks.
**Aplicar:** `npm run db:migrate` (push bloqueado pra execução automática).

### Deploy: Cloudflare only
**Decisão:** Removidos vercel.json, railway.json, .vercel/. Fica wrangler + OpenNext.
**Motivo:** Um alvo só; consistente com os outros projetos Lexuri.
