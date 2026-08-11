import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome'

// O tradutor flutuante saiu daqui em 2026-08: ele chamava /api/llm/translate
// sem login, deixando a chave da OpenAI exposta a qualquer um da internet.
// Quem quiser experimentar tem a demo do "Happy" na landing (sem custo, texto
// estático) e o tradutor completo depois de entrar no app.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-shell">
      <MarketingHeader />
      <main className="mkt-main">{children}</main>
      <MarketingFooter />
    </div>
  )
}
