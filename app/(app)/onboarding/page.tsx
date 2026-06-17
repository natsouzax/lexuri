'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { recommendedLessons } from '@/lib/product'

const GOALS = [
  { id: 'travel', label: 'Travel' },
  { id: 'work', label: 'Work' },
  { id: 'fluency', label: 'Fluency' },
  { id: 'exams', label: 'Exams' },
  { id: 'conversation', label: 'Daily Conversation' },
]

const INTERESTS = [
  'Technology',
  'Business',
  'Science',
  'Sports',
  'Music',
  'Movies',
]

const LANGUAGES = [
  { code: 'pt', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'es', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ja', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'ko', flag: '🇰🇷', nativeName: '한국어' },
  { code: 'zh', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ar', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'ru', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'tr', flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'hi', flag: '🇮🇳', nativeName: 'हिंदी' },
]

const LANG_DB_NAME: Record<string, string> = {
  pt: 'Portuguese', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  ar: 'Arabic', ru: 'Russian', tr: 'Turkish', hi: 'Hindi',
}

const TUTORIAL_EN = [
  'Paste a YouTube video or song you want to study.',
  'The AI highlights key chunks — phrases native speakers actually use.',
  'Save chunks to your deck with one click.',
  'Review your saved chunks with flashcards every day.',
  'Earn XP, keep your streak, and track your progress.',
]

const TUTORIAL_TRANSLATIONS: Record<string, string[]> = {
  pt: [
    'Cole um vídeo do YouTube ou música que você quer estudar.',
    'A IA destaca os chunks principais — frases que falantes nativos realmente usam.',
    'Salve chunks no seu baralho com um clique.',
    'Revise seus chunks salvos com flashcards todos os dias.',
    'Ganhe XP, mantenha sua sequência e acompanhe seu progresso.',
  ],
  es: [
    'Pega un video de YouTube o una canción que quieras estudiar.',
    'La IA resalta los chunks clave — frases que los nativos realmente usan.',
    'Guarda chunks en tu mazo con un clic.',
    'Repasa tus chunks guardados con flashcards todos los días.',
    'Gana XP, mantén tu racha y sigue tu progreso.',
  ],
  fr: [
    'Colle une vidéo YouTube ou une chanson que tu veux étudier.',
    "L'IA met en évidence les chunks clés — des phrases que les locuteurs natifs utilisent vraiment.",
    'Sauvegarde des chunks dans ton deck en un clic.',
    'Révise tes chunks sauvegardés avec des flashcards tous les jours.',
    'Gagne des XP, maintiens ta série et suis ta progression.',
  ],
  de: [
    'Füge ein YouTube-Video oder Lied ein, das du lernen möchtest.',
    'Die KI hebt wichtige Chunks hervor — Phrasen, die Muttersprachler wirklich nutzen.',
    'Speichere Chunks mit einem Klick in deinem Deck.',
    'Wiederhole deine gespeicherten Chunks täglich mit Flashcards.',
    'Verdiene XP, halte deine Serie aufrecht und verfolge deinen Fortschritt.',
  ],
  it: [
    'Incolla un video YouTube o una canzone che vuoi studiare.',
    "L'IA evidenzia i chunk chiave — frasi che i madrelingua usano davvero.",
    'Salva i chunk nel tuo mazzo con un click.',
    'Ripassa i tuoi chunk salvati con flashcard ogni giorno.',
    'Guadagna XP, mantieni la tua serie e segui i tuoi progressi.',
  ],
  ja: [
    '勉強したいYouTube動画や曲を貼り付けよう。',
    'AIが重要なチャンク（ネイティブが実際に使うフレーズ）をハイライトします。',
    'ワンクリックでチャンクをデッキに保存しよう。',
    '毎日フラッシュカードで保存したチャンクを復習しよう。',
    'XPを獲得して、ストリークを維持し、進捗を追跡しよう。',
  ],
  ko: [
    '공부하고 싶은 YouTube 영상이나 노래를 붙여넣어 보세요.',
    'AI가 핵심 청크를 강조합니다 — 원어민이 실제로 사용하는 표현들이에요.',
    '클릭 한 번으로 청크를 덱에 저장하세요.',
    '매일 플래시카드로 저장된 청크를 복습하세요.',
    'XP를 모으고, 스트릭을 유지하며, 진행 상황을 추적하세요.',
  ],
  zh: [
    '粘贴你想学习的YouTube视频或歌曲。',
    'AI会高亮关键短语——母语者真正使用的表达方式。',
    '一键将短语保存到你的卡组。',
    '每天用闪卡复习你保存的短语。',
    '赚取XP，保持连续学习，追踪你的进度。',
  ],
  ar: [
    'الصق فيديو يوتيوب أو أغنية تريد دراستها.',
    'يبرز الذكاء الاصطناعي العبارات الرئيسية — جمل يستخدمها الناطقون الأصليون فعلًا.',
    'احفظ العبارات في مجموعتك بنقرة واحدة.',
    'راجع عباراتك المحفوظة بالبطاقات التعليمية كل يوم.',
    'اكسب نقاط XP، حافظ على سلسلتك، وتابع تقدمك.',
  ],
  ru: [
    'Вставь видео с YouTube или песню, которую хочешь изучить.',
    'ИИ выделяет ключевые чанки — фразы, которые реально используют носители языка.',
    'Сохраняй чанки в свою колоду одним кликом.',
    'Повторяй сохранённые чанки с флэш-картами каждый день.',
    'Зарабатывай XP, поддерживай серию и отслеживай прогресс.',
  ],
  tr: [
    'Çalışmak istediğin bir YouTube videosu veya şarkı yapıştır.',
    'Yapay zeka, anadil konuşucularının gerçekten kullandığı anahtar ifadeleri vurgular.',
    'Bir tıklamayla ifadeleri destene kaydet.',
    'Kaydettiğin ifadeleri her gün flash kartlarla tekrarla.',
    'XP kazan, serisini koru ve ilerlemenizi takip et.',
  ],
  hi: [
    'YouTube वीडियो या गाना चिपकाएं जिसे आप पढ़ना चाहते हैं।',
    'AI मुख्य chunks को हाइलाइट करता है — वाक्यांश जो native speakers वास्तव में उपयोग करते हैं।',
    'एक क्लिक से chunks को अपनी deck में सेव करें।',
    'हर दिन flashcards से अपने saved chunks को review करें।',
    'XP अर्जित करें, streak बनाए रखें और अपनी progress ट्रैक करें।',
  ],
}

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('fluency')
  const [interests, setInterests] = useState<string[]>(['Technology', 'Music'])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [nativeLang, setNativeLang] = useState<string | null>(null)
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [pickerSelected, setPickerSelected] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('lexuri_native_lang')
    if (stored && LANGUAGES.find(l => l.code === stored)) {
      setNativeLang(stored)
      return
    }
    const browserCode = navigator.language.split('-')[0]
    const match = LANGUAGES.find(l => l.code === browserCode)
    if (match) {
      setNativeLang(match.code)
      localStorage.setItem('lexuri_native_lang', match.code)
    } else {
      setShowLangPicker(true)
    }
  }, [])

  function confirmLanguage() {
    if (!pickerSelected) return
    setNativeLang(pickerSelected)
    localStorage.setItem('lexuri_native_lang', pickerSelected)
    setShowLangPicker(false)
  }

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    )
  }

  async function handleFinish() {
    if (!goal || interests.length === 0) {
      setError('Choose one goal and at least one interest.')
      return
    }

    setError('')
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error: dbError } = await supabase.from('onboarding').upsert({
      user_id: user.id,
      native_language: nativeLang ? LANG_DB_NAME[nativeLang] : 'Unknown',
      current_level: 'B1',
      learning_goals: [goal, ...interests.map((interest) => `interest:${interest}`)],
    })

    if (dbError) {
      setError(dbError.message)
      setSaving(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100
  const translations = nativeLang ? TUTORIAL_TRANSLATIONS[nativeLang] : null

  return (
    <div className="onboard-shell">
      {/* Language picker popup */}
      {showLangPicker && (
        <div className="lang-picker-overlay">
          <div className="lang-picker-modal">
            <div className="lang-picker-title">What's your native language?</div>
            <div className="lang-picker-subtitle">
              We'll show platform tips in your language so you feel right at home.
            </div>
            <div className="lang-picker-grid">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-picker-btn${pickerSelected === lang.code ? ' selected' : ''}`}
                  onClick={() => setPickerSelected(lang.code)}
                >
                  <span className="lang-picker-flag">{lang.flag}</span>
                  <span className="lang-picker-name">{lang.nativeName}</span>
                </button>
              ))}
            </div>
            <button
              className="onboard-btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={confirmLanguage}
              disabled={!pickerSelected}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="onboard-top">
        <span className="onboard-logo">Lexuri</span>
        <span className="onboard-step-counter">Step {step} of {TOTAL_STEPS}</span>
      </div>

      <div className="onboard-progress-track">
        <div className="onboard-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="onboard-body">
        {step === 1 && (
          <div className="onboard-step animate-fade-up">
            <h1 className="onboard-title">Choose your English goal.</h1>
            <p className="onboard-desc">
              Lexuri will recommend real content and chunks that match why you are learning.
            </p>
            <div className="onboard-goals-grid">
              {GOALS.map((item) => (
                <button
                  key={item.id}
                  className={`onboard-goal${goal === item.id ? ' selected' : ''}`}
                  onClick={() => setGoal(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboard-step animate-fade-up">
            <h1 className="onboard-title">Choose what you like to consume.</h1>
            <p className="onboard-desc">
              Your first lessons should feel like something you would actually watch or listen to.
            </p>
            <div className="onboard-options-grid">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  className={`onboard-option${interests.includes(interest) ? ' selected' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
            {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="onboard-step animate-fade-up">
            <h1 className="onboard-title">How Lexuri works.</h1>
            <p className="onboard-desc">
              A quick guide to your new learning loop.
            </p>
            <div className="onboard-tutorial-list">
              {TUTORIAL_EN.map((enText, i) => (
                <div key={i} className="onboard-tutorial-card">
                  <span className="onboard-tutorial-num">{i + 1}</span>
                  <div>
                    <div className="onboard-tutorial-en">{enText}</div>
                    {translations && (
                      <div className="onboard-tutorial-pt">{translations[i]}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onboard-step animate-fade-up">
            <h1 className="onboard-title">Your first lesson is ready.</h1>
            <p className="onboard-desc">
              Lexuri will start with a guided demo so you can see AI chunks, save your first three expressions, and complete a tiny review before you reach the dashboard.
            </p>
            <div style={{ border: '1px solid var(--auth-border)', borderRadius: 16, padding: 18, marginBottom: 18, background: 'rgba(248,250,252,0.04)' }}>
              <div style={{ color: 'var(--auth-text)', fontWeight: 900, marginBottom: 8 }}>First mission</div>
              <div style={{ display: 'grid', gap: 8, color: 'var(--auth-muted)', fontSize: '0.86rem' }}>
                <span>1. Reveal the AI chunk map</span>
                <span>2. Save three useful chunks</span>
                <span>3. Generate your first cards</span>
                <span>4. Review them once</span>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {recommendedLessons.slice(0, 3).map((lesson) => (
                <div key={lesson.title} className="onboard-summary-row" style={{ border: '1px solid var(--auth-border)', borderRadius: 12 }}>
                  <span className="onboard-summary-key">{lesson.source}</span>
                  <span className="onboard-summary-val">{lesson.title}</span>
                </div>
              ))}
            </div>
            {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
          </div>
        )}

        <div className="onboard-nav">
          {step > 1 && (
            <button className="onboard-btn-secondary" onClick={() => setStep((s) => s - 1)} disabled={saving}>
              Back
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button className="onboard-btn-primary" onClick={() => setStep((s) => s + 1)}>
              Continue
            </button>
          ) : (
            <button className="onboard-btn-primary" onClick={handleFinish} disabled={saving}>
              {saving ? <><span className="auth-spinner" />Saving...</> : "Let's go!"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
