import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome'
import FloatingTranslator from '@/components/FloatingTranslator'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-shell">
      <MarketingHeader />
      <main className="mkt-main">{children}</main>
      <MarketingFooter />
      {/* Tradutor flutuante também na landing pública; sem login não salva
          na biblioteca, então canSave=false (só traduz + ouvir). */}
      <FloatingTranslator canSave={false} />
    </div>
  )
}
