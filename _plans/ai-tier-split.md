# AI Tier Split — Plano de Implementação

> Status: **PENDENTE** — Implementar quando usuário confirmar "implementação"
> Criado: 2026-06-20

---

## Objetivo

Diferenciar o uso de IA por plano para controlar custos e criar incentivo de upgrade.

---

## Modelo de Limites (semanal, reset toda segunda-feira)

| Tier | Modelo | Limite semanal | Reset |
|---|---|---|---|
| **Free** | GPT-4o (Premium AI) | 5 análises | Toda segunda |
| **Free** | GPT-4o-mini (Standard AI) | 5 análises | Toda segunda |
| **Pro** | GPT-4o | Ilimitado | — |
| **Pro** | GPT-4o-mini | Ilimitado | — |

*"Análise" = 1 chamada de chunk detection ou flashcard batch generation*

---

## O que conta como uso

- `POST /api/llm/chunks` — chunk detection (usa GPT-4o)
- `POST /api/llm/flashcards-batch` — geração de flashcards (usa GPT-4o-mini)
- `POST /api/llm/flashcard` — flashcard único (usa GPT-4o-mini)

Não contam: quiz, vocabulary, hard-words (custo baixo / sem gating necessário)

---

## Implementação Técnica

### 1. Tabela de controle (nova migration)

```sql
CREATE TABLE ai_usage (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_tier TEXT NOT NULL CHECK (model_tier IN ('premium', 'standard')),
  week_start DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, model_tier, week_start)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own usage" ON ai_usage FOR SELECT USING (auth.uid() = user_id);
```

### 2. Função helper (lib/ai-usage.ts)

```ts
export async function checkAndIncrementAIUsage(
  userId: string,
  tier: 'premium' | 'standard',
  isPro: boolean
): Promise<{ allowed: boolean; remaining: number }>
```

- Se `isPro`: retorna `{ allowed: true, remaining: Infinity }`
- Senão: verifica contagem na semana atual, incrementa, retorna remaining

### 3. Middleware nas rotas

Antes do processamento em cada rota de LLM:
```ts
const { allowed, remaining } = await checkAndIncrementAIUsage(userId, 'premium', isPro)
if (!allowed) return NextResponse.json({ error: 'weekly_limit_reached', remaining: 0 }, { status: 429 })
```

### 4. UI de feedback

- Badge no botão "Detect Chunks": `3 left this week`
- Ao atingir limite: modal de upsell com CTA para `/plans`

---

## Dependências

- Tabela `subscriptions` já existe e tem `status` + `plan`
- `SUPABASE_SERVICE_ROLE_KEY` já disponível para operações admin
- Stripe webhook já atualiza `subscriptions` corretamente

---

## Ordem de implementação

1. Criar migration `0010_ai_usage.sql`
2. Criar `lib/ai-usage.ts`
3. Plugar nas 3 rotas de LLM
4. Adicionar contador de uso na UI (YouTube e Music Lab)
5. Criar modal de upsell
