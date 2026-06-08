# Plano de Lançamento — Lexuri
> Análise de pré-lançamento para grupo de teste (professora + alunos), sem domínio próprio.
> Gerado em 07/06/2026 — baseado em análise completa do código-fonte.

---

## Contexto

O objetivo é lançar o Lexuri para um grupo pequeno de validação — uma professora e seus alunos — usando a URL do serviço de hospedagem diretamente (ex: `lexuri-eta.vercel.app`), sem comprar domínio. Nenhuma funcionalidade comercial precisa funcionar para essa validação.

---

## 1. Configuração e Variáveis de Ambiente

### O que está configurado

O `.env.local` já contém todas as variáveis necessárias para funcionar:

| Variável | Status | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Presente | Projeto Supabase real configurado |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Presente | Chave anon válida |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Presente | Chave de serviço para operações admin |
| `OPENAI_API_KEY` | ✅ Presente | Necessária para geração de flashcards e análise de chunks |
| `NEXT_PUBLIC_APP_URL` | ✅ Presente | Aponta para `lexuri-eta.vercel.app` |
| `RESEND_API_KEY` | ✅ Presente | E-mails transacionais |
| `GENIUS_API_KEY` | ✅ Presente | Busca de letras musicais |
| `STRIPE_SECRET_KEY` | ⚠️ Chave de teste | Stripe em modo test — adequado para validação |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Necessita webhook ativo | Webhook não funciona sem URL pública registrada no Stripe |
| `LMS_API_URL` | ⬜ Vazia | Feature desabilitada automaticamente (retorna 501) |
| `CRON_SECRET` | ⚠️ Valor fraco | `my-cron-secret-2026` — adequado para teste, mudar em produção real |

### ⚠️ Atenção crítica: `.env.local` no repositório

O `.gitignore` exclui arquivos `.env*` corretamente. Porém, **o arquivo `.env.local` contém chaves de API reais** (OpenAI, Stripe, Supabase service role, Resend, Genius). Essas chaves **não devem ir para o repositório**. Ao fazer deploy no Vercel, as variáveis devem ser configuradas manualmente no painel (Settings → Environment Variables), nunca via commit.

### Para deploy no Vercel

Copiar todas as variáveis do `.env.local` para o painel do Vercel e atualizar:

```
NEXT_PUBLIC_APP_URL=https://<url-real-do-vercel>.vercel.app
```

O `STRIPE_WEBHOOK_SECRET` precisará ser atualizado com o webhook criado para a URL pública do Vercel.

---

## 2. Build de Produção

### Stack e versões

| Dependência | Versão | Status |
|---|---|---|
| Next.js | 16.2.6 | ✅ Versão atual |
| React | 19.2.4 | ✅ Versão atual |
| TypeScript | ^5 | ✅ OK |
| Tailwind CSS | ^4 | ✅ OK |
| `@supabase/ssr` | ^0.10.3 | ✅ Versão correta para App Router |
| `@distube/ytdl-core` | ^4.16.12 | ⚠️ Veja abaixo |

### `next.config.ts` está vazio

O arquivo não tem configuração alguma. Isso é válido, mas **pode causar problema** com a dependência `@distube/ytdl-core` (usada para download de áudio como fallback do Whisper), pois módulos Node.js nativos às vezes precisam de `serverExternalPackages` ou `experimental.esmExternals`. Se o build falhar por causa de ytdl, adicionar:

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ['@distube/ytdl-core', 'youtubei.js'],
}
```

### Arquivos de debug na raiz

Há 14 arquivos `*-player-script.js` na raiz do projeto. São artefatos temporários do player do YouTube — o `.gitignore` já os exclui (`*-player-script.js`), mas eles não devem ir para deploy. O Vercel os ignorará, mas poluem o diretório local.

### `proxy.ts` na raiz — **BUG CRÍTICO**

O arquivo `proxy.ts` contém o middleware de autenticação completo (proteção de rotas, verificação de onboarding, redirecionamentos). **Porém não existe um `middleware.ts` na raiz que o importe e exporte.** No Next.js, o middleware precisa estar em `middleware.ts` na raiz para funcionar. Tal como está, **toda a proteção de rotas está desabilitada** — qualquer usuário não autenticado pode acessar `/youtube`, `/flashcards`, etc.

**Ação necessária antes do lançamento:**
Criar `middleware.ts` na raiz importando e re-exportando o conteúdo de `proxy.ts`:

```ts
// middleware.ts (criar na raiz)
export { proxy as middleware, config } from './proxy'
```

Ou consolidar o conteúdo diretamente em `middleware.ts`.

---

## 3. Banco de Dados (Supabase)

### 9 migrations — estado geral: ✅ sólido

Todas as 9 migrations estão bem estruturadas com RLS ativo em todas as tabelas:

| Migration | Tabela(s) | RLS | Status |
|---|---|---|---|
| 0001 | `flashcards` | ✅ | OK |
| 0002 | `profiles`, `onboarding` | ✅ | OK — trigger auto-cria profile no signup |
| 0003 | `native_language` (coluna) | — | OK |
| 0004 | `subscriptions` | ✅ | OK |
| 0005 | `analytics_events` | ✅ | OK |
| 0006 | `notifications` | ✅ | Realtime precisa ser habilitado manualmente no Supabase |
| 0007 | `user_stats`, `points_history`, `badges`, `user_badges` | ✅ | OK — badges seed incluído |
| 0008 | `email_reminders` (coluna em `profiles`) | — | OK |
| 0009 | `feed_items` | ✅ | OK — seed com 19 itens incluído |

### Pontos de atenção

**Realtime nas notificações:** A migration 0006 tem o comando para habilitar Realtime comentado:
```sql
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```
Para notificações em tempo real funcionarem, esse comando precisa ser executado no Supabase dashboard (SQL Editor). Não bloqueia o lançamento se notificações não forem usadas.

**Trigger `upsert_user_stats_on_review`:** A função criada em 0007 é um stub vazio (`RETURN NEW` sem lógica). Os pontos são creditados pela API (`/api/gamification/award`), não pelo trigger, então isso é intencional — mas é confuso.

**`user_stats` sem INSERT policy:** A tabela `user_stats` tem políticas de SELECT e UPDATE, mas não de INSERT. A criação do primeiro registro de stats de um usuário precisa usar o `service_role` (admin client), o que a API já faz corretamente.

**Migrations não foram aplicadas automaticamente:** As migrations são arquivos SQL locais. É necessário verificar se elas foram aplicadas no projeto Supabase em produção. No Supabase dashboard: Database → Migrations.

---

## 4. Autenticação

### Fluxo completo — ✅

O fluxo de autenticação está implementado integralmente:

- **Cadastro:** email + senha com validação robusta (mínimo 8 chars, maiúscula, número, símbolo); suporte a OAuth (Google e GitHub)
- **Verificação de e-mail:** página de confirmação com reenvio de link
- **Login:** email/senha + OAuth
- **Esqueci senha / Reset:** fluxo completo via Supabase
- **Logout e sessões ativas:** listagem e revogação em Settings
- **Exclusão de conta:** endpoint e página implementados

### Redirect URLs — ⚠️ Atenção

O callback de auth está em `/api/auth/callback`. Para funcionar em produção:
1. No **Supabase Dashboard → Authentication → URL Configuration**, adicionar a URL do Vercel em `Redirect URLs`:
   ```
   https://<url-do-vercel>.vercel.app/api/auth/callback
   ```
2. O `NEXT_PUBLIC_APP_URL` no Vercel deve bater com essa URL.

### OAuth (Google e GitHub) — ⚠️ Configuração adicional

Para Google e GitHub OAuth funcionar, cada provider precisa ser habilitado no Supabase Dashboard (Authentication → Providers) com as credenciais de app criadas no Google Cloud Console e GitHub Developer Settings respectivamente. Para o lançamento de teste com alunos, **o OAuth não é obrigatório** — cadastro por e-mail é suficiente.

### Middleware ausente — **BUG CRÍTICO** (já mencionado acima)

Sem `middleware.ts`, o proteção de rotas não funciona. O código do middleware está em `proxy.ts` mas não está sendo executado.

---

## 5. Funcionalidades — Análise por Área

### ✅ Prontas e estáveis

| Feature | Descrição |
|---|---|
| **YouTube Studio** | Core feature. Transcrição, player sincronizado, coleta de palavras, análise de chunks com IA, geração de flashcards |
| **Music Lab** | Busca de letras no Genius + mesma pipeline de análise do YouTube |
| **SRS Review** | Algoritmo SM-2 fiel com interface de flipcard, sessão completa |
| **Feed curado** | 19 itens (TED Talks + músicas) com níveis CEFR A1–C1 |
| **Gamificação** | Pontos, streak, badges, leaderboard (funcional mas sem design system) |
| **Onboarding** | 4 etapas: idioma nativo, nível CEFR, objetivos, confirmação |
| **Auth completo** | Todos os fluxos implementados |
| **Settings** | Perfil, senha, sessões, exclusão de conta |

### ⚠️ Funcionais mas com ressalvas

| Feature | Problema |
|---|---|
| **Leaderboard** | Funcional, mas usando estilos inline (não usa o design system do app) — visual inconsistente |
| **Reports** | Mesma situação — KPIs funcionam, mas visual dessincronizado do restante |
| **Notificações** | Backend pronto, mas Realtime não habilitado no Supabase (ver seção 3) |
| **Offline Mode** | Service Worker em `public/sw.js`, mas registro não confirmado no layout raiz — pode não estar ativo |

### ❌ Features que devem ser desabilitadas ou ignoradas no lançamento inicial

| Feature | Motivo |
|---|---|
| **Stripe / Billing** | Pagamentos em modo test. A **página de Billing existe e funciona em test mode**, mas para o grupo de validação (professora + alunos) a funcionalidade de pagamento não faz sentido ainda. Idealmente desabilitar o link de Billing na sidebar ou deixar como está (não prejudica o teste) |
| **LMS Integration** | Endpoint retorna 501 automaticamente (LMS_API_URL vazio) — não há UI frontend, não há risco |
| **Export CSV/Anki** | Listada como feature Pro na pricing page, mas não implementada no código |
| **Páginas /terms e /privacy** | Referenciadas no formulário de cadastro, mas não existem como páginas no app. O link está em `target="_blank"` — o usuário verá um 404 ao clicar. Para o teste, não é bloqueante mas é feio |

---

## 6. Testes

### Cobertura existente

Há 3 arquivos de testes com Vitest:

| Arquivo | O que testa | Qualidade |
|---|---|---|
| `gamification.test.ts` | `calcReviewPoints` e `streakBonus` | ✅ Boa cobertura de casos-limite |
| `payments-webhook.test.ts` | Verificação de assinatura Stripe (mock) | ⚠️ Testa apenas o mock, não a rota real |
| `analytics.test.ts` | Validação da lista de eventos permitidos | ⚠️ Testa uma constante, não a rota |

### Estado de execução

**Os testes não rodam no ambiente Linux de análise** por incompatibilidade de binário nativo:
```
Cannot find native binding: @rolldown/binding-linux-x64-gnu
```
Isso ocorre porque o `node_modules` foi instalado no Windows e os binários nativos do Vite/Rolldown são específicos por plataforma. **No Windows (ambiente de desenvolvimento do projeto), os testes devem passar normalmente.** O erro é de ambiente, não de código.

Para verificar localmente:
```bash
npm test
```

### Cobertura de teste geral

A cobertura é baixa — cobre gamificação (a mais crítica), mas não cobre: auth, flashcard CRUD, SRS, YouTube transcript, chunk analysis. Para o lançamento de teste com grupo pequeno, isso é aceitável.

---

## 7. Deploy Gratuito Sem Domínio

### Comparativo de plataformas

| Plataforma | Plano Gratuito | Next.js App Router | Cold start | Banco | Recomendação |
|---|---|---|---|---|---|
| **Vercel** | ✅ Tier Hobby | ✅ Nativo | Rápido | Supabase externo | ⭐ Melhor opção |
| **Railway** | ⚠️ $5 crédito/mês | ✅ Via Dockerfile | Rápido (container) | Supabase externo | Segunda opção |
| **Render** | ✅ Gratuito | ⚠️ Via Docker | Lento (~30s) | Supabase externo | Não recomendado para MVP |

### Recomendação: Vercel (Hobby)

**Por quê:**
- Suporte nativo ao Next.js (mesma empresa). App Router, Server Components, API Routes — tudo funciona sem configuração extra.
- Deploy automático via `git push`.
- URL pública automática: `lexuri-eta.vercel.app` (já configurada no `.env.local`).
- SSL automático, CDN global, sem custo.
- Limites do plano Hobby são mais que suficientes para um grupo de teste pequeno: 100GB bandwidth/mês, funções serverless incluídas.

**Limitações do plano Hobby:**
- Funções serverless têm timeout de 10s. A rota `/api/youtube/transcript` com fallback Whisper (download de áudio) pode estourar esse limite em vídeos longos. Para o teste inicial com a professora, usar vídeos curtos (< 10 min) mitiga o risco.
- Sem SLA.

### Passos para deploy no Vercel

1. Push do código para um repositório GitHub/GitLab
2. Importar o repositório em `vercel.com`
3. Configurar todas as variáveis de ambiente (do `.env.local`) no painel do Vercel
4. Atualizar `NEXT_PUBLIC_APP_URL` com a URL gerada pelo Vercel
5. No Supabase, adicionar a URL do Vercel em Authentication → Redirect URLs
6. No Stripe, criar um webhook apontando para `https://<url>.vercel.app/api/payments/webhook` e atualizar `STRIPE_WEBHOOK_SECRET`
7. Aplicar as migrations no Supabase (se ainda não aplicadas)

---

## 8. Priorização — Bloqueante vs. Nice-to-Have

### 🔴 Bloqueante (impede funcionamento correto)

| Item | Problema | Solução |
|---|---|---|
| **`middleware.ts` ausente** | Proteção de rotas não funciona — usuários não autenticados acessam páginas protegidas | Criar `middleware.ts` que re-exporte o conteúdo de `proxy.ts` |
| **Redirect URL no Supabase** | Cadastro e login OAuth retornam erro se a URL não estiver na allowlist | Adicionar URL do Vercel em Supabase → Authentication → Redirect URLs |
| **Variáveis de ambiente no Vercel** | App não funciona sem as variáveis | Copiar todas do `.env.local` para o painel do Vercel |
| **Migrations aplicadas no Supabase** | Sem as tabelas, todas as features quebram | Verificar e aplicar em Supabase Dashboard → SQL Editor |

### 🟡 Importante mas não bloqueante para o teste

| Item | Problema | Impacto |
|---|---|---|
| **Páginas `/terms` e `/privacy` ausentes** | Link no cadastro leva a 404 | Baixo — alunos provavelmente não clicarão |
| **Webhook Stripe** | Stripe em modo test sem webhook registrado — pagamentos não atualizam status | Zero impacto para validação sem pagamento |
| **Realtime de notificações** | Comando SQL não executado no Supabase | Feature de notificações não funciona em tempo real |
| **`next.config.ts` vazio** | Pode falhar no build com ytdl | Testar o build; adicionar `serverExternalPackages` se necessário |

### 🟢 Nice-to-have (não urgente para o grupo de teste)

| Item | Impacto |
|---|---|
| Consistência visual de Leaderboard e Reports | Páginas funcionam, só parecem diferentes do resto do app |
| Limpeza dos 14 `*-player-script.js` na raiz | Apenas poluição visual local |
| Rate limiting por plano nas rotas de LLM | Sem usuários pagantes, não há risco real de abuso |
| Registro confirmado do Service Worker | Offline mode pode não funcionar — não crítico para validação |
| Testes com cobertura maior | Para grupo de teste pequeno, o risco é aceitável |
| Dark mode | Qualidade de vida, não funcionalidade |

---

## 9. Resumo Executivo

O Lexuri está **substancialmente pronto** para um lançamento de teste controlado. O core — YouTube Studio, análise de chunks com IA, flashcards SRS, gamificação e onboarding — está funcional e bem implementado.

**Há apenas 1 bug crítico real no código:** o `middleware.ts` ausente, que deixa rotas protegidas abertas. Tudo o mais são configurações de deploy e serviços externos.

**Checklist mínimo para lançar:**

- [ ] Criar `middleware.ts` na raiz (re-exportar de `proxy.ts`)
- [ ] Fazer push para GitHub e conectar ao Vercel
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Atualizar `NEXT_PUBLIC_APP_URL` com URL real do Vercel
- [ ] Adicionar URL do Vercel no Supabase → Authentication → Redirect URLs
- [ ] Verificar/aplicar as 9 migrations no Supabase
- [ ] Testar build (`npm run build`) localmente antes do push

**Estimativa:** Com o checklist acima, o app pode estar online para o grupo de teste em **1–2 horas de trabalho**.
