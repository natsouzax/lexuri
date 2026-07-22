# Lexuri — aprender inglês com música

MVP de validação de uma hipótese simples: **aprender inglês ouvindo as músicas que você já ama gera engajamento e retenção.**

O aluno ouve uma música com a letra sincronizada, toca nas palavras que não entende (tradução na hora), salva as que quer aprender, e revisa em sessões curtas ao longo de 3 dias. No fim, os próprios aprendizados compõem uma "música dele".

**Produção:** [lexuri-validacao.vercel.app](https://lexuri-validacao.vercel.app)

> Este NÃO é um SaaS — é um protótipo de pesquisa. Sem venda, sem funil, sem premium. O objetivo é validar a ideia com usuários reais e evoluir a partir de dados.

---

## O fluxo do usuário

```
Registrar → escolher nível (1 clique) → abrir uma música
        ↓
Ouvir com a letra sincronizada (karaokê)
        ↓
Tocar em palavras/chunks → tradução → salvar na biblioteca
        ↓
Ciclo de revisão de 3 dias por música:
  Day 1 — Flashcards (SRS: virar o card, avaliar dificuldade)
  Day 2 — Jogo da memória (parear palavra ↔ tradução)
  Day 3 — Complete a letra + "quais 2 aprendizados te marcaram?"
        ↓
Takeaways viram Glossário · a cada 2 takeaways nasce um verso
        ↓
Verso a verso, o usuário compõe a própria música
```

### Módulo Álbum
Além das músicas soltas, o aluno pode percorrer um **álbum conceitual inteiro** (ex: *American Idiot*, Green Day) — faz o ciclo de 3 dias de cada faixa, depois um **ciclo global do álbum** com uma reflexão sobre o tema, e no fim os versos de todas as faixas compõem a "faixa dele". Álbuns organizados em 3 trilhas: básico / intermediário / avançado.

---

## Principais recursos

| Área | O que faz |
|---|---|
| **Player sincronizado** | Letra em karaokê sincronizada com o vídeo do YouTube |
| **Tap-to-translate** | Tocar em qualquer palavra/chunk → tradução + significado; salva como flashcard |
| **Análise de chunks (IA)** | GPT detecta idioms, phrasal verbs, collocations etc. — densa (~11-22 por 100 palavras), com filtro por tipo |
| **Repetição espaçada (SM-2)** | Os flashcards voltam pouco antes do esquecimento |
| **Ciclo D1/D2/D3** | Três encontros curtos por música, com trava de 1 dia entre etapas |
| **Glossário ativo + versos** | Só entra no glossário o que o usuário escreve; a cada 2, um verso |
| **Tradutor flutuante** | Bolinha 🌐 em qualquer tela: digitar ou selecionar texto → traduzir/ouvir/salvar |
| **Gamificação** | XP, streak, missões diárias, badges, leaderboard |
| **Imersão + i18n** | UI 100% em inglês; o idioma escolhido no popup só traduz o **conteúdo** (letras, chunks, palavras). 13 idiomas nativos suportados |

---

## Arquitetura

- **Conteúdo é estático, progresso é banco.** As lições ("StaticLesson") são arquivos TypeScript pré-gerados em [`data/featured-lessons/`](data/featured-lessons/) — transcript + segments sincronizados + chunks analisados. **Zero scraping e zero IA em runtime** para carregar uma música. A única IA em runtime é traduzir/definir a palavra que o usuário toca.
- **Curadoria offline:** as letras sincronizadas vêm do [lrclib.net](https://lrclib.net) (banco comunitário de LRC) ou de legendas do YouTube; os chunks são gerados por IA. Tudo via scripts em [`scripts/`](scripts/), fora do runtime.
- **Supabase** guarda só o que o usuário produz (palavras salvas, progresso, takeaways, versos, gamificação) — com Row Level Security por usuário.

### Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Estilo | Tailwind v4 + design system próprio (`globals.css`) |
| Banco + Auth | Supabase (Postgres + RLS + Auth) |
| IA | OpenAI — GPT-4o (chunks), GPT-4o-mini (tradução/definição) |
| Letras sincronizadas | lrclib.net (curadoria offline) |
| Animações | Framer Motion |
| Deploy | Vercel |

---

## Rodando localmente

```bash
npm install
npm run dev        # localhost:3000
```

Precisa de um `.env.local` com as chaves (veja `.env.example`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`.

### Banco de dados

```bash
npm run db:migrate     # aplica as migrations do Supabase
```

Migrations em [`supabase/migrations/`](supabase/migrations/) — todas com RLS. As do MVP: `0024` (progresso/takeaways/versos) e `0025` (álbuns).

### Scripts de curadoria (não-runtime)

| Comando | O que faz |
|---|---|
| `npm run check:albums` | Analisa viabilidade de álbuns candidatos (sync no lrclib + densidade) |
| `npm run gen:album` | Gera as lições das faixas de um álbum via lrclib + chunks |
| `npm run regen:chunks` | Re-analisa os chunks das lições sem tocar na sincronização |
| `npm run resync:batch3` | Re-sincroniza músicas específicas via lrclib |

---

## Deploy

```bash
npm run deploy     # = vercel --prod (deploy direto pela CLI)
```

O deploy é feito pela CLI da Vercel (o app roda em `lexuri-validacao`). Detalhes, rollback e como conectar GitHub para deploy automático em [`_plans/deploy.md`](_plans/deploy.md).

---

## Estrutura

```
app/
  (marketing)/     landing de pesquisa + privacy/terms
  (auth)/          login, registro
  (app)/           dashboard, feed, level, music, review, library, albums
  api/             flashcards, progress, takeaways, llm, gamification, albums
components/         player, chunks, review (D1/D2/D3), tradutor flutuante, ui
data/
  featured-lessons/  as lições estáticas (StaticLesson)
  albums/            metadados dos álbuns conceituais
lib/                chunks, srs, gamification, i18n, album, mvp, supabase
scripts/            geração/re-sync de lições (offline)
supabase/migrations/
_plans/             decisões, roadmap, deploy, módulo álbum
```

---

## Documentação viva

O diretório [`_plans/`](_plans/) é a memória do produto:
- [`decisions.md`](_plans/decisions.md) — log de decisões de arquitetura/produto
- [`roadmap.md`](_plans/roadmap.md) — o que está feito e o que falta
- [`deploy.md`](_plans/deploy.md) — como colocar no ar
- [`album-module.md`](_plans/album-module.md) — design do módulo álbum

---

## Licença

Copyright © 2026 Natan Oliveira — todos os direitos reservados. Código visível para portfólio e transparência; não é open source para redistribuição.
