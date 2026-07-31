import MusicStudio from '@/components/music/MusicStudio'
import ProfileSidePanel from '@/components/ui/ProfileSidePanel'

export default function MySongPage() {
  return (
    <div className="dash-layout">
      <div className="dash-main">
        <div className="app-hero promo-banner music-studio-hero">
          <span className="promo-sparkle promo-sparkle-1">✦</span>
          <span className="promo-sparkle promo-sparkle-2">✦</span>
          <span className="promo-sparkle promo-sparkle-3">✦</span>
          <span className="mini-label">Lexuri Music Studio</span>
          <h1 className="app-hero-title">Turn your English into a song.</h1>
          <p className="app-hero-subtitle">Practice each sound, sing with a backing track, and keep the final recording.</p>
        </div>
        <MusicStudio />
      </div>
      <ProfileSidePanel />
    </div>
  )
}

