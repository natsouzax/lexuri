import { MarketingHeader, MarketingFooter } from '@/components/marketing/MarketingChrome'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-shell">
      <MarketingHeader />
      <main className="mkt-main">{children}</main>
      <MarketingFooter />
    </div>
  )
}
