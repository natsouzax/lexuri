# Roadmap — Lexuri Validação (MVP)

> Atualizado em: 2026-07-21 · Objetivo único: validar se aprender inglês com músicas gera engajamento e retenção.

---

## Pronto (MVP)

- [x] Landing de pesquisa (1 página, sem venda)
- [x] Auth: login, registro, Google/GitHub OAuth
- [x] /level — escolha de nível em 1 clique (grava study_level)
- [x] Home por nível — "sua música da semana" + catálogo (13 músicas auditadas)
- [x] Tela de música: player sincronizado + toque-pra-traduzir + expressões-chave
- [x] Biblioteca de palavras (com origem por música)
- [x] Ciclo de revisão: Day 1 leitura · Day 2 jogo da memória · Day 3 complete-a-letra
- [x] Takeaways → glossário (só entra o que o usuário escreve)
- [x] Música do usuário: 1 verso a cada 2 takeaways (IA com fallback)
- [x] Estrutura pra brain mapping (profiles.brain_map jsonb, placeholder)

## Pendente pra lançar o teste

- [ ] Aplicar migration 0024 no Supabase (`npm run db:migrate`)
- [ ] Deploy Vercel (`npm run deploy`) + conferir redirect URLs no Supabase (lexuri-validacao.vercel.app)
- [ ] Testar o fluxo completo com 1 usuário real (registro → música → D1 → D2 → D3)
- [ ] Regenerar lições quebradas se quiser recuperá-las: believer, sweet-child, californication (scripts/)

## Depois da validação (se a hipótese confirmar)

- [ ] Gravação de voz + comparação de pronúncia (player já expõe currentTime/segmento)
- [ ] Músicas do próprio usuário (pipeline dos scripts vira endpoint)
- [ ] Brain mapping com lógica real
- [ ] Notificação/e-mail de "sua revisão de hoje"

## Fora de escopo (removido no pivô de 2026-07-21)

Gamificação, Stripe/planos, Spotify, Music Lab dinâmico, placement tests,
onboarding longo, analytics, notifications, e-mails, LMS, offline, marketing
de venda. Ver `decisions.md`.
