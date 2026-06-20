# Decisões Arquiteturais — Lexuri

> Log de decisões relevantes. Formato: data + decisão + motivo + alternativas rejeitadas.

---

## 2026-06-20

### Middleware em arquivo separado `proxy.ts`
**Decisão:** Mantido como está — `middleware.ts` re-exporta de `proxy.ts`
**Motivo:** O conteúdo de `proxy.ts` foi gerado por IA e estava correto; a falta era apenas do ponto de entrada `middleware.ts`
**Alternativa rejeitada:** Mesclar tudo em `middleware.ts` e deletar `proxy.ts` — seria refatoração sem ganho

### Páginas legais como Server Components inline
**Decisão:** `/terms` e `/privacy` como Server Components com conteúdo inline (sem componente separado)
**Motivo:** Conteúdo estático, sem lógica — não justifica extrair componente. Segue padrão de `about/page.tsx`

### Documentação em `_docs/` e planos em `_plans/`
**Decisão:** Separar análises técnicas históricas (`_docs/`) de planos ativos (`_plans/`)
**Motivo:** Análises são snapshot de um momento; planos são documentos vivos
**Alternativa rejeitada:** Pasta `docs/` única — misturaria histórico com roadmap ativo

---

## Decisões Anteriores (inferidas do código)

### Tailwind v4 sem shadcn/Radix
**Decisão:** CSS puro em `globals.css` + Tailwind como utilitário de reset
**Motivo:** Controle total do design system; evita dependência de componentes terceiros que conflitam com a paleta custom

### Supabase Auth em vez de NextAuth
**Decisão:** Supabase SSR Auth com `@supabase/ssr`
**Motivo:** Supabase já é o banco — Auth integrado elimina uma dependência e um serviço externo

### SM-2 implementado do zero (`lib/srs.ts`)
**Decisão:** Algoritmo próprio, sem biblioteca
**Motivo:** SM-2 é simples (20 linhas), bibliotecas adicionariam overhead sem benefício; facilita testes unitários

### Gamificação server-side only
**Decisão:** Pontos calculados apenas no servidor (`/api/gamification/award`)
**Motivo:** Evita manipulação client-side dos pontos. O trigger de banco é um stub intencional.

### Offline via IndexedDB + Service Worker próprio
**Decisão:** `public/sw.js` escrito manualmente
**Motivo:** Workbox adicionaria ~30KB; o caso de uso é simples (cache estático + fila de mutações)
