'use client'

import SpotifyPitch from '@/components/spotify/SpotifyPitch'
import type { OnboardingCopy } from '@/lib/onboarding-i18n'

interface SpotifyStepProps {
  copy: OnboardingCopy
  onSkip: () => void
}

export default function SpotifyStep({ copy, onSkip }: SpotifyStepProps) {
  function handleConnect() {
    window.location.href = `/api/spotify/auth?return_to=${encodeURIComponent('/onboarding')}`
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.16)' }}>
        <SpotifyPitch
          onConnect={handleConnect}
          title={copy.spotifyTitle}
          unlockIntro={copy.spotifyUnlockIntro}
          benefits={copy.spotifyBenefits}
          privacyNote={copy.spotifyPrivacy}
        />
      </div>
      <button
        className="onboard-btn-secondary"
        style={{ width: '100%', marginTop: 12, justifyContent: 'center', display: 'flex' }}
        onClick={onSkip}
      >
        Skip for now
      </button>
    </div>
  )
}
