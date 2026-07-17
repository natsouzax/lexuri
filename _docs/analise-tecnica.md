# Análise Completa — Lexuri

> Gerado em 06/06/2026

---

## 1. Review Geral da Plataforma

### O que o app faz

**Lexuri** é uma plataforma de aprendizado de inglês com IA. O loop central é:

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

### Qualidade do código

**Pontos fortes:**
- TypeScript estrito em todo o projeto
- Separação clara entre lógica pura e chamadas ao banco (`gamification.ts` é totalmente testável)
- SM-2 implementado com precisão
- Idempotência bem resolvida no offline sync e no webhook
- RLS ativo em todas as tabelas

**Pontos fracos / incompletos:**
- As páginas `leaderboard` e `reports` usam estilo inline puro
- `proxy.ts` na raiz — **RESOLVIDO**: `middleware.ts` criado
- Sem React Query/SWR — `fetch` raw em todos os componentes
- Tratamento de erros inconsistente
- O registro do Service Worker não está confirmado no layout root

---

## 2. Avaliação para Mobile com Flutter

A arquitetura favorece Flutter. Quase toda a lógica de negócio está em API Routes REST que o app Flutter consumiria sem alterações.

**Esforço estimado total:** ~30–45 dias (1 dev Flutter sênior)

A complexidade está concentrada no YouTube player sincronizado e no Chunk Highlighter.

**Recomendação:** Flutter faz sentido a médio prazo, mas não é a primeira prioridade.

1. **Agora**: Finalizar consistência de UI, rate limiting por plano, converter em PWA
2. **Próximo**: Construir app Flutter (se >500 usuários ativos justificarem)
3. **Nunca**: Reescrever o backend
