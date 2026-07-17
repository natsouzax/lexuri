# Roadmap — Lexuri

> Atualizado em: 2026-06-20

---

## Em Produção (MVP)

- [x] YouTube Studio — transcrição + chunk detection + flashcards
- [x] Music Lab — Genius lyrics + chunk analysis
- [x] SRS Review — algoritmo SM-2
- [x] Feed curado CEFR (19 itens seed)
- [x] Gamificação — pontos, streak, badges, leaderboard
- [x] Onboarding — idioma nativo, nível CEFR, objetivos
- [x] Auth completo — login, cadastro, OAuth, reset, exclusão
- [x] Settings — perfil, senha, sessões, billing
- [x] Stripe — Checkout + Portal + Webhook
- [x] E-mails transacionais (Resend + React Email)
- [x] Offline mode (IndexedDB + Service Worker)
- [x] Middleware de autenticação (fix: 2026-06-20)
- [x] Páginas /terms e /privacy

---

## Próximos (Pré-lançamento comercial)

- [ ] Rate limiting por plano nas rotas de LLM
- [ ] Redesign visual — `REDESIGN_PROMPT.md` (_docs/)
- [ ] Consistência de UI — Leaderboard e Reports sem estilos inline
- [ ] PWA completo — manifest, install prompt, Web Push API
- [ ] Confirmar registro do Service Worker no layout root
- [ ] AI Tier Split — ver [`ai-tier-split.md`](./ai-tier-split.md)
- [ ] Export CSV/Anki (feature Pro listada, não implementada)
- [ ] Dark mode
- [ ] Suporte a mais idiomas (target language ≠ inglês)

---

## Médio Prazo (>500 usuários ativos)

- [ ] App Flutter (consumindo endpoints existentes)
- [ ] Push notifications (FCM)
- [ ] LMS Integration (UI frontend para o endpoint REST existente)
- [ ] Quiz adaptativo por CEFR

---

## Descartado / Pausado

- **`proxy.ts` standalone** — consolidado como `middleware.ts`
