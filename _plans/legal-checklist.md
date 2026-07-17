# Checklist Legal — Lexuri

> LGPD (Lei 13.709/2018) + requisitos gerais para SaaS B2C

---

## Status Atual

| Item | Status |
|---|---|
| Página `/terms` | ✅ Criada (2026-06-20) |
| Página `/privacy` | ✅ Criada (2026-06-20) |
| Checkbox ToS no cadastro (required) | ✅ |
| Checkbox Privacy no cadastro (required) | ✅ Atualizado (2026-06-20) |
| Checkbox marketing consent (optional) | ✅ |
| Consentimento registrado no banco | ✅ `marketing_consent` em `profiles.options` |
| Copyright no footer | ✅ |
| Links para /terms e /privacy no footer | ✅ Adicionado (2026-06-20) |

---

## Antes de Cobrar Clientes — Obrigatório

- [ ] **Revisar com advogado LGPD** — documentos atuais são funcionais para beta, não para produção comercial
- [ ] **Registrar DPO (Encarregado)** — para empresas. Para pessoa física, o próprio responsável é o DPO
- [ ] **Registrar CNPJ** — necessário antes de cobrar clientes PJ ou emitir nota fiscal
- [ ] **Contrato de processamento de dados com OpenAI** — verificar Data Processing Agreement (DPA) da OpenAI
- [ ] **Stripe Brazil compliance** — verificar se conta Stripe está configurada para receber pagamentos no Brasil
- [ ] **Política de cookies** — página `/cookies` ou banner (para usuários europeus via GDPR)
- [ ] **Mecanismo de exclusão de dados** — endpoint `/api/auth/delete-account` existe ✅, mas verificar se deleta dados em cascata (OpenAI logs, Stripe customer)

---

## Terceiros que Recebem Dados (declarados na Privacy Policy)

| Serviço | Dados | País | DPA |
|---|---|---|---|
| Supabase | Todos os dados do usuário | EUA (via Fly.io) | Disponível |
| OpenAI | Texto/áudio enviado pelo usuário | EUA | Disponível |
| Stripe | Dados de pagamento | EUA | Disponível |
| Resend | Email do usuário | EUA | Disponível |
| Genius | Nenhum (busca pública) | EUA | N/A |
| Vercel | Logs de acesso, IP | EUA | Disponível |

---

## Serviços Recomendados para Revisão Legal

| Serviço | Adequado para | Custo |
|---|---|---|
| [Termos de Uso BR](https://termos.host) | Documentos em PT-BR | Free–R$50/mês |
| [Iubenda](https://iubenda.com) | Gerador automático | $27/ano |
| Advogado LGPD | Revisão profissional | R$2k–8k |

---

## Direitos do Usuário (LGPD Art. 18) — Implementados?

| Direito | Canal atual | Precisa automatizar? |
|---|---|---|
| Acesso aos dados | Solicitar via email | Sim — self-service |
| Correção | Settings → Profile | ✅ |
| Exclusão | Settings → Delete Account | ✅ |
| Portabilidade | Não implementado | A implementar |
| Revogação do consentimento | Delete Account (workaround) | A implementar |
| Oposição ao tratamento | Não implementado | A implementar |
