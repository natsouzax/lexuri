import SpeakingReview from '@/components/review/SpeakingReview'
import ProfileSidePanel from '@/components/ui/ProfileSidePanel'

export default function SpeakingReviewPage() {
  return (
    <div className="dash-layout">
      <div className="dash-main">
        <div className="app-hero promo-banner">
          <span className="promo-sparkle promo-sparkle-1">✦</span>
          <span className="promo-sparkle promo-sparkle-2">✦</span>
          <span className="promo-sparkle promo-sparkle-3">✦</span>
          <h1 className="app-hero-title">Speaking practice</h1>
          <p className="app-hero-subtitle">Train the words the AI could not understand in your song.</p>
        </div>

        <SpeakingReviewIntro />
        <SpeakingReview />
      </div>
      <ProfileSidePanel />
    </div>
  )
}

function SpeakingReviewIntro() {
  return (
    <div className="speaking-review-intro panel">
      <span className="mini-label">How it works</span>
      <p>Hear the model, speak one word, and get instant AI feedback. Clear words return later through spaced repetition; unclear words stay here for another try.</p>
    </div>
  )
}
