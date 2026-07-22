# Módulo Álbum — desenho (proposta, não implementado)

> Ideia: em vez de músicas soltas, o aluno percorre um **álbum conceitual
> inteiro** (que conta história e faz pensar — Pink Floyd, Green Day…),
> fazendo o ciclo de 3 dias de cada faixa + um ciclo global do álbum, e no
> fim ganha uma "faixa dela", composta a partir da jornada — como se fosse
> uma música de álbum de verdade.

---

## Por que encaixa no que já existe

O motor atual já é 80% disso, só que por música:
- `song_progress` — ciclo D1/D2/D3 por faixa
- `takeaways` — aprendizados escritos pelo usuário
- `user_verses` — a cada 2 takeaways nasce 1 verso ("a música do usuário")

O álbum é a **mesma mecânica num escopo maior**: várias faixas + uma camada
de progresso do álbum por cima + a compilação final dos versos numa peça
única (a "faixa do usuário" daquele álbum).

---

## Conteúdo é o gargalo (não o código)

Cada faixa de verdade custa horas de curadoria: buscar letra sincronizada,
corrigir sync (a gente sentiu isso corrigindo 13 músicas soltas), rodar a
análise de chunks. Um álbum multiplica isso por 6-10 faixas **antes** de
saber se a ideia engaja.

**Estratégia:** começar com um **mini-álbum** (uma seleção curta e coesa,
não o álbum inteiro) reaproveitando faixas já sincronizadas, validar o
engajamento, e só então curar um álbum completo.

Rodar `npm run check:albums` (na máquina do Natan — lrclib bloqueado no
ambiente do assistente) pra ter os dados reais: quantas faixas de cada
candidato têm letra sincronizada, duração, densidade de linhas.

---

## Critérios de escolha (não é "álbum bom", é "bom pra ESTE app")

| Critério | Por quê |
|---|---|
| **Faixas cantadas ≥ instrumentais** | Instrumental toca mas não vira lição. Dark Side tem ~4 faixas quase sem letra. |
| **Linguagem B1-B2** | Metallica/rap denso e rápido afasta o learner. Green Day, S&G, Taylor Swift funcionam. |
| **Dicção clara** | Letra cantada devagar e articulada > gritada/arrastada. |
| **História/tema que faça pensar** | O pedido do Natan — álbum conceitual, narrativo. |
| **Cobertura no lrclib** | Sem letra sincronizada, a faixa não entra (ou vira trabalho manual enorme). |
| **Tamanho pra prototipar** | 4-6 faixas cantadas no primeiro álbum. |

---

## Três trilhas: um álbum por nível (básico / intermediário / avançado)

Como as músicas soltas, os álbuns espelham os 3 níveis do app — cada
learner tem um álbum-jornada no seu nível. O tipo `Album` tem `level`, e a
vitrine `/albums` agrupa por nível.

| Nível | Álbum | Status |
|---|---|---|
| 🌱 Básico | *a definir* — candidatos: Beatles "A Hard Day's Night", Bob Marley "Exodus" | rodar check:albums |
| 🌿 Intermediário | **American Idiot** (Green Day) | ✅ infra pronta, faltam faixas |
| 🌳 Avançado | *a definir* — OK Computer (tema máximo, C1) ou Arctic Monkeys | dados já coletados |

Nota sobre **básico**: o critério inverte — prioriza linguagem simples e
dicção clara sobre densidade. Álbum conceitual "que faz pensar" é raro em
A1-A2; melhor um álbum de vocabulário cotidiano claro (Beatles inicial) ou
temas simples e positivos (Marley). O `check:albums` mede densidade/sync,
mas NÃO dificuldade — a escolha de básico é mais editorial que dos números.

---

## Dados do check:albums (rodado 2026-07-22) — futuros candidatos

Todos com 100% de sync no lrclib. A métrica que decide é **linhas/min**
(densidade de conteúdo por minuto — baixa = muita música pra pouca letra).

| Álbum | Faixas | Min | Média linhas/min | Leitura |
|---|---|---|---|---|
| **Green Day — American Idiot** | 13 | ~58 | ~10 | ✅ ESCOLHIDO (mini de 5) — narrativo, acessível, denso |
| **Taylor Swift — folklore** | 16 | ~62 | ~12 | Densíssimo e uniforme; ótimo pedagogicamente. 16 faixas = curadoria grande. Menos "sobre o mundo". |
| **The Beatles — Sgt. Pepper's** | 13 | ~39 | ~10 | Ícone; densidade boa. "Within You Without You" (5.3) e "A Day in the Life" (6.0) mais esparsas. Linguagem surreal em algumas. |
| **Radiohead — OK Computer** | 12 | ~53 | ~7 | Tema máximo (alienação/tecnologia), MAS densidade baixa e irregular: metade das faixas < 6 linhas/min ("The Tourist" 2.6, "Electioneering" 3.9). Dicção difícil. Melhor pra nível avançado. |
| **Arctic Monkeys — debut** | 11 | ~35 | ~13 | Densidade alta e narrativo, MAS gíria + sotaque de Sheffield forte → desafiador pra learner. Bom pra um "álbum avançado". |

**Leitura rápida pra quando formos expandir:**
- Próximo depois do American Idiot: **Sgt. Pepper's** (prestígio + densidade
  equilibrada) ou **folklore** (melhor pedagogia, se topar curar 16 faixas).
- **OK Computer**: guardar pra uma trilha "avançada" — tema é o mais forte
  de todos, mas a densidade baixa (7/min) significa muito instrumental/
  atmosférico pra pouca lição. Faria sentido como álbum de nível C1.
- **Arctic Monkeys**: idem — "álbum avançado" por causa do sotaque/gíria.

---

## Candidatos pré-selecionados (verificar com check:albums)

- **Pink Floyd — Wish You Were Here**: pequeno, tema forte (ausência, Syd
  Barrett, crítica à indústria). Risco: 2 faixas longas multi-parte + muito
  instrumental → poucas faixas "de lição".
- **Pink Floyd — Dark Side of the Moon** (exemplo do Natan): tema riquíssimo
  (tempo/dinheiro/loucura/morte), linguagem acessível. Risco: ~4 faixas
  instrumentais diluem o "álbum de lições".
- **Green Day — American Idiot**: narrativa de ópera-rock, linguagem punk
  acessível, dicção clara. Forte candidato — mas 13 faixas (curar um
  subconjunto).
- **Simon & Garfunkel — Bridge over Troubled Water**: dicção cristalina,
  reflexivo, ótimo pra learner. Menos "conceitual", mais coletânea.
- **Taylor Swift — folklore**: storytelling em 3ª pessoa, cobertura lrclib
  excelente, linguagem acessível. Muito bom pedagogicamente; menos "faz
  pensar sobre o mundo", mais narrativa pessoal.

Recomendação inicial pra prototipar: **um mini-álbum de 4-5 faixas cantadas**
de um desses (provável: American Idiot ou Dark Side sem os instrumentais),
decidido pelos números do `check:albums`.

---

## Desenho técnico

### Conteúdo estático (como as lições)
```
data/albums/
  dark-side-of-the-moon.ts   → { album_id, title, artist, theme,
                                  cover, track_ids: string[] (ordem),
                                  instrumental_ids: string[] }
```
As faixas cantadas continuam sendo `StaticLesson` em `data/featured-lessons/`
(reuso total do pipeline). O álbum só referencia os `feed_item_id` na ordem.

### Banco (migration nova, aditiva)
```
album_progress
  user_id, album_id,
  started_at,
  album_day1_done_at, album_day2_done_at, album_day3_done_at
  -- o progresso POR faixa continua em song_progress (reuso)

user_album_songs
  id, user_id, album_id,
  compiled_text,          -- a "faixa do usuário" = versos das faixas juntos
  verse_ids uuid[],       -- referencia user_verses usados
  created_at
```

### Fluxo do usuário
```
1. Abre o álbum → tracklist com progresso de cada faixa (0-3 dias)
   + barra de progresso do álbum + instrumentais tocáveis (sem lição)

2. Faz o fluxo normal de cada faixa cantada:
   ouvir → D1 flashcards → D2 memória → D3 gaps + takeaways
   (o motor de versos já roda por faixa)

3. Quando TODAS as faixas fecham o ciclo → desbloqueia o
   "Álbum Cycle" (D1/D2/D3 GLOBAL):
   - Day 1 do álbum: revisão mista das palavras de todas as faixas
   - Day 2 do álbum: jogo da memória com o vocabulário do álbum inteiro
   - Day 3 do álbum: fill-in-the-gaps de trechos-chave + reflexão final
     sobre o TEMA do álbum ("o que Dark Side te fez pensar sobre tempo?")

4. Final: a "faixa do usuário" — os versos gerados em todas as faixas são
   compilados numa peça única (user_album_songs), apresentada como a
   última faixa do "álbum dela", com o tema do álbum como fio condutor.
```

### Telas
- `/albums` — vitrine de álbuns (poucos, curados)
- `/albums/[id]` — capa, tema, tracklist com progresso, botão do ciclo global
- Reusa `/feed/[id]` (faixa) e `/review/[songId]` (ciclo por faixa)
- `/albums/[id]/cycle` — o ciclo global D1/D2/D3
- `/albums/[id]/song` — a faixa compilada do usuário

---

## Visão futura (só arquitetura, não implementar agora)

O Natan quer que "música vire música de verdade": voz da pessoa, ritmo,
melodia. Nada aqui trava isso — a `compiled_text` (letra da faixa do usuário)
é o insumo. No futuro:
- **Voz**: `MediaRecorder` grava a pessoa cantando/lendo os versos → Supabase
  Storage. Comparação de pronúncia é um serviço separado.
- **Melodia/ritmo**: geração musical (fora de escopo) recebe a `compiled_text`
  + um "mood" do álbum. A tabela `user_album_songs` já guarda o texto e a
  referência aos versos — é o contrato pra essa camada futura.
- `profiles.brain_map` (placeholder já existente) pode registrar a evolução
  ao longo dos álbuns.

---

## Ordem sugerida quando for implementar

1. `npm run check:albums` → escolher o mini-álbum pelos dados
2. Curar/sincronizar as 4-5 faixas (reuso do pipeline atual)
3. `data/albums/` + migration `album_progress`/`user_album_songs`
4. Telas `/albums` e `/albums/[id]` (reusando o fluxo de faixa existente)
5. Ciclo global do álbum + faixa compilada
6. Testar engajamento com o grupo antes de curar um álbum completo

---

## STATUS (2026-07-22) — infra pronta, faltam as faixas

Escolhido: **American Idiot (Green Day)** — mini-álbum de 5 faixas
(American Idiot, Holiday, Boulevard of Broken Dreams, Wake Me Up When
September Ends, Whatsername).

**Já implementado e no build:**
- `lib/album.ts` (tipos, registro, gating do ciclo global)
- `data/albums/american-idiot.ts` (metadados, tema, faixas — sem letra)
- Migration `0025_albums.sql` (album_progress, user_album_songs) — APLICAR
- APIs `/api/albums/[id]/progress` e `/api/albums/[id]/song`
- Telas `/albums`, `/albums/[id]`, `/albums/[id]/cycle`, `/albums/[id]/song`
- Nav "Albums" (sidebar + topo) + rota protegida no middleware
- `FeedItem.album` marca faixas de álbum e as tira do catálogo avulso

**Falta (só o Natan pode fazer — lrclib bloqueado no ambiente do assistente):**
1. Aplicar a migration: `npm run db:migrate`
2. Preencher os `youtube_id` das 5 faixas em
   `scripts/generate-album-tracks.ts` (pegar da URL do YouTube)
3. Rodar `node --env-file=.env.local --import=tsx scripts/generate-album-tracks.ts`
   → gera as StaticLessons + entradas no feed-items
4. Adicionar os imports das 5 faixas em `data/featured-lessons/index.ts`
5. Conferir sync de cada faixa (como fizemos com as músicas soltas)

Enquanto as faixas não são curadas, o álbum aparece na vitrine mas as
faixas mostram "Coming soon" e o ciclo global fica travado (correto).
