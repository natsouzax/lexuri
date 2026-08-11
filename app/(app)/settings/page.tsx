import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AccountSettings from '@/components/settings/AccountSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const [{ data: profile }, { data: consents }] = await Promise.all([
    supabase.from('profiles')
      .select('full_name, marketing_consent')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.from('legal_consents')
      .select('document_version, accepted_at')
      .eq('user_id', user.id)
      .order('accepted_at', { ascending: false })
      .limit(1),
  ])
  const latestConsent = consents?.[0] ?? null

  return (
    <div className="page-wrap settings-page">
      <div className="settings-heading">
        <span className="mini-label">Account</span>
        <h1>Settings</h1>
        <p>Manage your profile, communication preference, privacy record, and account data.</p>
      </div>
      <AccountSettings
        email={user.email}
        initialFullName={profile?.full_name || user.user_metadata?.full_name || ''}
        initialMarketingConsent={Boolean(profile?.marketing_consent)}
        consentVersion={latestConsent?.document_version ?? null}
        consentAcceptedAt={latestConsent?.accepted_at ?? null}
      />
    </div>
  )
}
