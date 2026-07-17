# Lexuri — Prompt de Reformulação Visual

> **Documento de referência para redesign do sistema de design.**
> Cada instrução foi verificada contra os arquivos reais.

---

## Contexto Técnico

- **Framework:** Next.js 16 App Router, React 19, TypeScript
- **CSS:** arquivo único `app/globals.css` com `@import "tailwindcss"` (Tailwind v4)
- **Fontes:** Fraunces (serif) + Manrope (sans-serif) via Google Fonts
- **Sem** shadcn, Radix, CSS Modules ou bibliotecas de UI externas
- **Regra:** Não usar `@apply` — CSS puro no globals.css

---

## Paleta — Preservar Exatamente

```css
--ink: #18211d;
--paper: #fffaf0;
--muted: #66716a;
--sage: #d7ead2;
--moss: #46624a;
--clay: #c86f4a;
--butter: #f6ca5f;
--sky: #bedceb;
```

Tokens dark:
```css
--dark-bg: #18211d;
--dark-surface: #1f2d25;
--clay-bright: #d97b54;
```

---

## Novos Tokens a Adicionar

```css
/* YouTube Studio */
--yt-bg: #080f1a; --yt-surface: #0d1929;
--yt-border: rgba(59,130,246,0.18); --yt-accent: #3b82f6;

/* Music Lab */
--ml-bg: #0e0818; --ml-surface: #1a0f2e;
--ml-border: rgba(139,92,246,0.2); --ml-accent: #8b5cf6; --ml-pink: #ec4899;

/* Timing */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--dur-fast: 120ms; --dur-mid: 240ms; --dur-slow: 400ms;

/* Chunk types */
--chunk-phrasal: #3b82f6; --chunk-idiomatic: #ef4444;
--chunk-collocation: #f59e0b; --chunk-lexical: #8b5cf6;
```

---

## Ordem de Implementação

1. Tokens (risco zero)
2. `.skeleton` shimmer
3. `.xp-bar-fill` gradiente
4. `.btn-primary` gradiente
5. `.input-field` border-radius 16px + focus lift
6. `.metric-value` gradiente texto
7. `.metrics-row-4`
8. Migrar `FeedItemCard.tsx`
9. Migrar `ChunkCard.tsx`
10. Tool heroes (YouTube + Music Lab)
11. Classes Leaderboard
12. Reports → design system
13. Micro-animações (fadeUp, stagger, chunkSaved)
14. Sidebar + MobileNav toolClass
15. Mobile breakpoints

---

## Regras Invioláveis

- ❌ Não alterar lógica TypeScript ou chamadas de API
- ❌ Não adicionar Framer Motion, shadcn ou libs de UI
- ❌ Não usar `@apply`
- ❌ Não criar `.module.css`
- ✅ Inline `style={{}}` só para valores genuinamente dinâmicos (chunk.color, levelColor)
- ✅ Testar cada etapa em 375px, 768px e 1280px
