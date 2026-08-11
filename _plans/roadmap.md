# Roadmap — Lexuri Validação

> Atualizado em 2026-08-11. Objetivo: validar se aprender inglês com músicas
> gera ativação, retorno e produção ativa de linguagem.

## Implementado no código

- [x] Landing de pesquisa gratuita, sem venda ou plano premium.
- [x] Auth por e-mail/senha; OAuth permanece desativado na interface.
- [x] Cadastro com elegibilidade etária, aceite legal versionado e marketing opcional.
- [x] Settings com perfil, opt-out de marketing e exclusão completa da conta.
- [x] Escolha de nível e catálogo curado por nível.
- [x] Player sincronizado, tradução, definições e biblioteca de palavras.
- [x] Ciclo Day 1 / Day 2 / Day 3 por música.
- [x] Takeaways, Glossary ativo, exemplos pessoais e geração de versos.
- [x] Álbuns e progresso por faixa.
- [x] Music Studio, gravação final opcional e feedback de pronúncia.
- [x] Speaking Review com repetição espaçada.
- [x] Gamificação, streak, missões, badges e leaderboard.
- [x] Feedback autenticado e limitado por usuário.
- [x] Quotas diárias para operações pagas de IA.
- [x] Runbook e consultas agregadas de ativação/retorno do beta.

## Gate pendente para abrir o grupo

- [ ] Aplicar migrations 0031–0034 no Supabase.
- [ ] Criar commit/tag da versão beta e publicar via `npm run deploy`.
- [ ] Conferir Redirect URL e email-confirmation no Supabase Auth.
- [ ] Configurar limite/alertas de gasto no projeto OpenAI.
- [ ] Executar `_plans/beta-test-runbook.md` com uma conta descartável.
- [ ] Organizar autorização de responsáveis se houver alunos de 13–17 anos.

## Conteúdo opcional antes/depois do piloto

- [ ] Recuperar músicas fora do catálogo por problemas de legenda: believer, sweet-child e californication.
- [ ] Brain mapping com lógica real; hoje existe apenas a estrutura de dados.
- [ ] Lembretes de revisão por e-mail, somente se o piloto mostrar necessidade.
- [ ] Exportação self-service de dados; durante o beta, portabilidade é atendida por e-mail.
- [ ] Dashboard administrativo de métricas; durante o beta, usar `beta-metrics.sql`.

## Fora de escopo do beta

- Cobrança, Stripe e planos premium.
- Importação livre de qualquer música pelo usuário.
- OAuth até o setup externo ser concluído e o aceite legal ser integrado.
- Analytics publicitário ou rastreadores de terceiros.
- LMS, venda B2B, campanhas de marketing e notificações comerciais.
