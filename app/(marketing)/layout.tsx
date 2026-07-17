import MarketingNav from '@/components/marketing/MarketingNav'
import MarketingFooter from '@/components/marketing/MarketingFooter'
import LanguagePicker from '@/components/marketing/LanguagePicker'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-shell">
      <LanguagePicker />
      <MarketingNav />
      <main className="mkt-main">{children}</main>
      <MarketingFooter />
    </div>
  )
}
