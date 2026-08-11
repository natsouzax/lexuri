# Revisão pessoal do Glossary — "My own examples"

> Status: MVP implementado localmente; migração do banco e publicação pendentes.
> Origem: sugestão pedagógica da professora, 2026-08-07.

## Implementado no MVP

- atividade **Make it yours** dentro de Review;
- seleção prioritária de expressões ainda sem exemplo e repetição espaçada das já praticadas;
- pergunta pessoal gerada por IA, com alternativas para trocar ou pular;
- validação objetiva do uso da expressão e avaliação assistida de completude;
- edição e confirmação explícita antes do salvamento;
- histórico **My own examples** em cada item do Glossary;
- pontos, feedback visual e missão diária para o novo exercício;
- tabelas isoladas por usuário em `0032_glossary_personal_examples.sql`.

## Objetivo

Transformar o Glossary de uma lista passiva de aprendizados em um registro de
uso pessoal do inglês. Durante as revisões, o aluno recebe uma pergunta sobre a
própria vida, responde com uma frase completa usando a expressão solicitada e
salva a resposta como um exemplo autoral.

```text
Expressão do Glossary
        ↓
Pergunta pessoal usando essa expressão
        ↓
Resposta completa e verdadeira do aluno
        ↓
Validação e possível correção
        ↓
Resposta salva em "My own examples"
        ↓
Expressão volta futuramente para revisão
```

## Experiência proposta

A tela de Review ganha uma atividade chamada **Make it yours** ou
**Use it in your life**. Uma expressão do Glossary é praticada por vez.

Exemplo:

- Expressão: `breaking point`
- Pergunta: "What is your breaking point at work? Use 'breaking point' in your answer."
- Resposta: "My breaking point is when people start shouting instead of talking calmly."
- Resultado: a resposta aceita aparece no Glossary, em **My own examples**.

A atividade deve oferecer:

- pergunta pessoal curta e adequada ao nível do aluno;
- instrução para usar explicitamente a expressão;
- campo de resposta em texto;
- ação **Check my answer**;
- ação **Try another question** ou **Skip**, para evitar perguntas
  desconfortáveis;
- feedback curto e oportunidade de editar antes de salvar.

## Critérios de aceitação da resposta

1. A expressão solicitada foi usada.
2. A resposta desenvolve uma frase com contexto, em vez de apenas `Yes`/`No`.
3. A resposta atende à pergunta.
4. Problemas importantes de gramática ou naturalidade recebem uma sugestão
   curta, que o aluno pode revisar antes de salvar.

`Yes, I do.` é uma resposta curta gramaticalmente correta. A interface não deve
marcá-la como inglês incorreto; deve explicar que ela ainda não cumpre o objetivo
da atividade porque não reutiliza a linguagem-alvo. Exemplo de feedback:

> That's a correct short answer. Now expand it using "have a car" in a full sentence.

O sistema pode incentivar uma resposta real, mas não pode verificar se a
informação pessoal é verdadeira.

## Papel da IA e do código

A IA pode:

- gerar uma pergunta compatível com a expressão e o nível do aluno;
- avaliar se a resposta é contextual e suficientemente desenvolvida;
- sugerir uma correção curta e explicar o ponto principal.

O código deve:

- verificar resposta vazia e presença da expressão;
- selecionar e alternar os itens de Glossary;
- salvar a versão final confirmada pelo aluno;
- controlar frequência e próxima revisão;
- aplicar autenticação, limites de uso e isolamento por usuário.

## Dados recomendados

O Glossary atual usa registros de `takeaways`. Em vez de acrescentar uma única
coluna de texto ao takeaway, criar uma relação de exemplos, pois uma expressão
pode acumular vários exemplos ao longo do tempo.

Estrutura conceitual `glossary_examples`:

- `id`;
- `user_id`;
- `takeaway_id`;
- `question`;
- `answer` (versão final do aluno);
- `original_answer` opcional;
- `feedback` opcional;
- `created_at`;
- `last_reviewed_at` e `next_review_at`, se os exemplos entrarem no SRS.

Na interface, cada item do Glossary mostra a seção **My own examples**, com
resposta e data. A frase salva deve continuar pertencendo ao aluno; a IA sugere,
mas o aluno confirma ou edita a versão final.

## MVP recomendado

- Uma expressão por pergunta.
- Priorizar itens sem exemplo pessoal.
- Uma pergunta gerada por IA, com alternativa para trocar/pular.
- Verificação obrigatória do uso da expressão.
- Avaliação curta de completude e naturalidade.
- Edição antes da confirmação.
- Salvamento em **Glossary → My own examples**.
- Nova atividade dentro de Review, separada do ciclo Day 1/2/3 da música.

## Evoluções posteriores

- combinar duas expressões em uma resposta;
- reapresentar exemplos antigos para expansão ou reformulação;
- permitir resposta falada;
- usar interesses e contexto voluntariamente fornecidos para personalizar
  perguntas;
- medir evolução entre o exemplo original e exemplos posteriores.

## Decisões adotadas no MVP

- A atividade é opcional e não bloqueia as demais revisões.
- Ela aparece depois do SRS geral, separada do Day 3 de cada música.
- A sugestão da IA nunca substitui silenciosamente o texto: o aluno edita e
  confirma a versão final.
- Os itens entram em um ciclo próprio de repetição espaçada desde o primeiro
  exemplo, priorizando antes os itens nunca praticados.
