# Análise Completa — Verbly

> Gerado em 06/06/2026

---

## 1. Review Geral da Plataforma

### O que o app faz

**Verbly** é uma plataforma de aprendizado de inglês com IA. O loop central é:

1. O usuário cola um link do YouTube (ou busca música no Genius)
2. O transcript é extraído (via legendas do YouTube ou fallback com OpenAI Whisper)
3. O usuário clica em palavras manualmente **ou** usa IA para detectar *language chunks* (phrasal verbs, idioms, collocations, etc.), com offsets de caracteres e cores por tipo
4. As palavras/chunks selecionados são convertidos em flashcards via GPT-4.1-mini
5. Os flashcards são revisados pelo algoritmo SM-2 (Spaced Repetition)
6. Revisões geram pontos, mantêm streak e desbloqueiam badges

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API Routes (Node.js runtime) |
| Banco de dados | Supabase (Postgres + Auth + RLS + Realtime) |
| IA | OpenAI GPT-4.1-mini (flashcards), GPT-4o (chunk detection), Whisper (transcrição de áudio) |
| Pagamentos | Stripe Checkout + Customer Portal + Webhooks |
| E-mail | Resend + React Email |
| Lyrics | Genius API |
| Testes | Vitest |
| Offline | IndexedDB + Service Worker |

### Arquitetura de rotas (App Router)

```
app/
├── (marketing)/   — landing, pricing, features, about, contact, demo, roadmap
├── (auth)/        — login, register, verify-email, forgot/reset password
└── (app)/         — área autenticada
    ├── feed/          — feed curado por nível CEFR
    ├── youtube/       — YouTube Studio (core feature)
    ├── music/         — busca de letras no Genius
    ├── review/        — sessão SRS + "My Words"
    ├── flashcards/    — listagem de cards
    ├── leaderboard/   — ranking de pontos
    ├── reports/       — KPIs de desempenho
    ├── onboarding/    — lingua nativa, nível CEFR, objetivos
    └── settings/      — profile, password, billing, sessions, delete account
```

### Banco de dados (9 migrations)

```
flashcards       — cards com todos os campos SM-2 (ease_factor, interval, repetitions, next_review)
profiles         — dados do usuário
native_language  — idioma nativo (usado nos prompts de IA)
subscriptions    — plano Stripe ativo
analytics_events — log de eventos
notifications    — notificações com Realtime
user_stats       — pontos, streak, total_reviews, last_active
points_history   — ledger imutável de pontos (idempotente por event_id)
badges / user_badges — sistema de conquistas
feed_items       — conteúdo curado (TED Talks + músicas, CEFR A1–C1)
```

Todas as tabelas têm Row-Level Security ativa.

### Funcionalidades prontas

**YouTube Studio** — transcrição com 3 tentativas (en, en-US, default), fallback para download de áudio + Whisper. Player sincronizado com transcript highlighting em tempo real. Coleta de palavras por clique. Análise de chunks por IA com offsets de caracteres, 8 tipos de chunk, código de cores, importância (high/medium/low), nível CEFR sugerido.

**Music** — busca de letras no Genius, mesma pipeline de chunk analysis do YouTube.

**SRS Review** — algoritmo SM-2 fiel (ease_factor, interval, repetitions). Flipcard com CSS 3D. Botões de qualidade (Again/Hard/Good/Easy = 0/1/3/5). Sessão com progress bar, resumo ao final. "I knew it" sem flip.

**Gamificação** — cálculo puro de pontos (sem confiar no cliente), multiplicadores por qualidade e velocidade, bônus diário, bônus de streak por milestone, cap diário de 2000 pts, badges (6 definidos). Leaderboard semanal/mensal/alltime.

**Pagamentos Stripe** — Checkout Session, Customer Portal, webhook com verificação de assinatura, upsert em `subscriptions`, tratamento de `checkout.session.completed`, `subscription.updated/deleted`, `invoice.payment_failed`.

**Offline Mode** — fila de mutações no IndexedDB, Service Worker (cache-first para estáticos, network-first para API), endpoint `/api/offline/sync` idempotente via `clientId` UUID.

**Analytics** — tracking client-side e server-side, relatório de performance com taxa de acerto, tempo médio, retenção.

**E-mails** — lembretes diários com React Email + Resend.

**Onboarding** — 4 etapas: idioma nativo, nível CEFR, objetivos, confirmação.

**Auth completo** — login, cadastro, verificação de e-mail, esqueci senha, reset de senha, exclusão de conta, listagem de sessões ativas.

**LMS Integration** — endpoint REST para exportar/importar progresso para LMS externo (sem UI frontend).

### Qualidade do código

**Pontos fortes:**
- TypeScript estrito em todo o projeto
- Separação clara entre lógica pura e chamadas ao banco (`gamification.ts` é totalmente testável)
- SM-2 implementado com precisão
- Idempotência bem resolvida no offline sync e no webhook
- RLS ativo em todas as tabelas
- Client admin vs. client de usuário separados corretamente
- `extractJsonText` + `safeJsonParse` para robustez nas respostas do LLM
- Testes para as três peças mais críticas (gamificação, webhook, analytics)

**Pontos fracos / incompletos:**
- As páginas `leaderboard` e `reports` usam estilo inline puro, sem o design system do restante do app (que tem CSS classes como `metrics-row`, `section-title`, `btn-primary`, etc.)
- Vários arquivos `*-player-script.js` na raiz (parecem artifacts de debug temporários)
- `proxy.ts` na raiz — propósito não documentado
- Sem React Query/SWR — `fetch` raw em todos os componentes, repetindo o padrão `apiFetch`
- Tratamento de erros inconsistente — alguns efeitos silenciam erros com `/* silent */`
- `taxa_acerto` no tipo `PerformanceData` está em português (inconsistência)
- O registro do Service Worker não está confirmado no layout root
- Sem internacionalização
- Sem dark mode

---

## 2. Avaliação para Mobile com Flutter

### APIs que já existem e seriam consumidas diretamente

Praticamente toda a lógica do app já está em API Routes REST. O app Flutter consumiria os mesmos endpoints sem alterações:

| Categoria | Endpoints prontos |
|---|---|
| Auth | Supabase Auth SDK (nativo em Flutter) |
| Flashcards | `GET/POST /api/flashcards`, `PUT /api/flashcards/[id]/review` |
| YouTube | `POST /api/youtube/transcript` |
| IA / Chunks | `POST /api/llm/chunks`, `POST /api/llm/flashcards-batch` |
| Gamificação | `POST /api/gamification/award`, `GET /api/gamification/leaderboard` |
| Relatórios | `GET /api/reports/performance` |
| Pagamentos | `POST /api/payments/create-checkout-session`, `POST /api/payments/create-portal-session` |
| Analytics | `POST /api/analytics/track` |
| Offline sync | `POST /api/offline/sync` |
| Feed | `GET /api/feed/items` |
| Music | `GET /api/genius/search` |

O Supabase tem SDK oficial para Flutter com suporte a Auth, Realtime e Postgres. Isso significa que notificações e autenticação podem ser feitos diretamente sem passar pelas API Routes do Next.js.

### O que precisaria ser criado no backend

**Pouco ou nada** precisaria ser criado no backend para funcionalidade básica. Os gaps são:

1. **YouTube Player sincronizado** — a feature de sync de transcript usa o YouTube IFrame API (JavaScript). No Flutter, precisaria de um `WebView` para embutir o player ou usar o pacote `youtube_player_flutter` + lógica de sincronização reimplementada em Dart.

2. **Offline queue** — a fila IndexedDB + Service Worker não existe no mobile. Precisaria reimplementar usando `sqflite` ou `Hive` para queue local + listener de conectividade (`connectivity_plus`). O endpoint `/api/offline/sync` já está pronto para receber.

3. **Chunk Highlighter interativo** — o componente que faz highlighting com offsets de caracteres e detecção de clique por span está em React. No Flutter, precisaria de `RichText` com `TextSpan` clicáveis + lógica de mapeamento de offsets. É trabalhoso mas direto.

4. **Flipcard SRS** — o flipcard com CSS 3D precisa ser reimplementado com `AnimationController` + `Transform` no Flutter. Straightforward.

5. **Service Worker** — inexistente no mobile. Substituído por cache local (Hive/sqflite) + `WorkManager` para sync em background.

### O que precisaria ser criado no backend (novo)

- **Rota de busca de transcrição otimizada para mobile**: o endpoint atual usa `ytdl-core` para download de áudio, o que pode ser pesado para um ambiente serverless mobile-driven. Pode precisar de ajuste de timeout ou de um endpoint separado com streaming.
- **Push notifications**: o sistema atual usa Supabase Realtime (WebSocket). Para mobile, o ideal seria integrar Firebase Cloud Messaging (FCM) — exigiria uma nova route de envio de push e configuração no Supabase.
- **Controle de rate limiting por plano**: atualmente o gating de features pro não está implementado nas rotas (não há verificação de `subscription.status` antes de processar LLM calls). Isso precisaria ser adicionado para evitar uso indevido da API.

### Esforço estimado

| Componente | Esforço |
|---|---|
| Setup Flutter + Supabase Auth | Baixo (1–2 dias) |
| Telas de auth (login, register, reset) | Baixo (2–3 dias) |
| Feed + FeedItemCard | Baixo (1–2 dias) |
| Flipcard SRS review | Médio (3–4 dias) |
| Chunk Highlighter interativo | Médio-alto (4–6 dias) |
| YouTube player + sync de transcript | Alto (6–10 dias) |
| Offline queue (sqflite + connectivity) | Médio (3–5 dias) |
| Push notifications (FCM) | Médio (3–4 dias) |
| Pagamentos (Stripe no mobile = `url_launcher` para web checkout) | Baixo-médio (2–3 dias) |
| Gamificação / Leaderboard / Reports | Baixo (2–3 dias, só consumir API) |
| Onboarding | Baixo (1–2 dias) |
| Settings / Billing | Baixo-médio (2–3 dias) |
| **Total estimado** | **~30–45 dias de desenvolvimento** (1 dev Flutter sênior) |

A complexidade está concentrada no YouTube player sincronizado e no Chunk Highlighter — que são as features mais diferenciadas do produto.

---

## 3. Opinião: Flutter é uma boa ideia aqui?

### Prós

**A arquitetura favorece Flutter.** O fato de quase toda a lógica de negócio estar em API Routes REST é exatamente o que torna o projeto "mobile-ready". Não há lógica de negócio presa no frontend React — o Flutter consumiria os mesmos endpoints.

**O Supabase tem excelente suporte Flutter.** Auth, Realtime, queries — tudo tem SDK oficial bem mantido. A migração de `supabase-js` para `supabase-flutter` é direta.

**O produto faz sentido no mobile.** Aprender inglês pelo celular é o caso de uso mais natural. Usuários revisam flashcards no ônibus, ouvem músicas no Spotify, assistem YouTube no celular. A versão web atual já tem `MobileHeader` e `MobileNav`, sinalizando que mobile era uma prioridade desde o início.

**SM-2 é trivial em Dart.** O algoritmo é puro cálculo — portar `lib/srs.ts` para Dart levaria menos de uma hora.

**Offline já está pensado no backend.** O endpoint de sync com idempotência por `clientId` foi claramente projetado pensando em mobile.

### Contras

**O YouTube player sincronizado é o maior risco.** É a feature mais diferenciada e a mais difícil de reimplementar no Flutter. A sincronização entre o tempo do player e o highlighting do transcript usa polling a cada 200ms no JS. No Flutter, ou você usa um `WebView` com comunicação JavaScript (mais frágil) ou reimplementa via `youtube_player_flutter` (que tem limitações no controle preciso de tempo). Pode perder qualidade de UX aqui.

**Código duplicado.** Qualquer mudança no algoritmo de pontuação ou nos prompts de IA precisará ser mantida apenas no backend (o que já é verdade), mas a UI de gamificação, o flipcard e o highlighter existirão em duas bases de código. Isso aumenta custo de manutenção.

**A web ainda importa.** Para desktops e notebooks, o app web é melhor. Manter dois frontends em paralelo dobra o esforço de design e feature delivery.

**Alternativa mais rápida: PWA.** O app já tem Service Worker e layout responsivo. Investir em torná-lo um PWA completo (manifest, ícones, install prompt, push via Web Push API) levaria ~1 semana e entregaria 70% da experiência mobile sem uma segunda codebase. A ausência de acesso à câmera ou BLE não é crítica para este produto.

### Recomendação

**Flutter faz sentido a médio prazo, mas não é a primeira prioridade.**

O caminho recomendado:
1. **Agora**: Finalizar consistência de UI (leaderboard/reports sem estilo inline), adicionar rate limiting por plano, e converter em PWA instalável — isso entrega mobile sem overhead.
2. **Próximo**: Se a tração justificar (e.g., >500 usuários ativos), construir o app Flutter usando os endpoints existentes. A arquitetura atual suporta isso sem refatoração de backend.
3. **Nunca**: Reescrever o backend. Ele está bem estruturado e é compartilhável entre web e mobile.

O risco real não é técnico — é de produto. O YouTube player sincronizado é a feature mais impressionante do Verbly. Se ela ficar inferior no Flutter, o app mobile pode decepcionar exatamente no ponto de maior diferenciação.
