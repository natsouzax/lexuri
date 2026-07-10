'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LEVEL_COLORS } from '@/lib/cefr'

type Phase = 'intro' | 'quiz' | 'generating' | 'result'
type QuizState = 'loading' | 'showing' | 'evaluating' | 'feedback'

interface CurrentQuestion {
  question: string
  type: 'multiple_choice' | 'fill_in'
  options?: string[]
  correctOptionIndex?: number
  targetLevel: string
  done: false
}

interface DoneResponse {
  done: true
  result: QuizResult
}

interface QuizResult {
  level: string
  confidence: number
  strengths: string[]
  weaknesses: string[]
  summary: string
}

interface HistoryEntry {
  question: string
  userAnswer: string
  grade: 'correct' | 'partial' | 'wrong'
  targetLevel: string
}

interface FeedbackState {
  grade: 'correct' | 'partial' | 'wrong'
  feedback: string
  selectedAnswer: string
  correctAnswer?: string
}

interface PackFlashcard {
  front: string
  back: string
  example: string
  level: string
}

interface PackChunk {
  text: string
  type: string
  translation: string
  explanation: string
  example: string
  importance: string
}

interface RoadmapWeek {
  week: number
  focus: string
  activities: string[]
}

interface Suggestion {
  type: 'youtube' | 'music'
  query: string
  reason: string
}

interface StudyPack {
  flashcards: PackFlashcard[]
  chunks: PackChunk[]
  roadmap: RoadmapWeek[]
  suggestions: Suggestion[]
}

const TOTAL_ROUNDS = 8

export default function PlacementQuizPage() {
  const router = useRouter()

  const [phase, setPhase]         = useState<Phase>('intro')
  const [quizState, setQuizState] = useState<QuizState>('loading')
  const [round, setRound]         = useState(1)

  const [currentQ, setCurrentQ]   = useState<CurrentQuestion | null>(null)
  const [history, setHistory]     = useState<HistoryEntry[]>([])
  const [feedback, setFeedback]   = useState<FeedbackState | null>(null)
  const [fillAnswer, setFillAnswer] = useState('')

  const [quizResult, setQuizResult] = useState<QuizResult | null>(null)
  const [studyPack, setStudyPack]   = useState<StudyPack | null>(null)
  const [resultTab, setResultTab]   = useState<'pack' | 'roadmap' | 'suggestions'>('pack')

  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState('')
  const [error, setError]         = useState('')

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current) }, [])

  // ─── Core fetch helpers ───────────────────────────────────────────────────

  async function fetchNextQuestion(h: HistoryEntry[], r: number): Promise<CurrentQuestion | null> {
    const res = await fetch('/api/ai-placement/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: h, roundNumber: r }),
    })
    const data = await res.json() as CurrentQuestion | DoneResponse
    if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)

    if ((data as DoneResponse).done) {
      const result = (data as DoneResponse).result
      setQuizResult(result)
      setPhase('generating')
      generatePack(result)
      return null
    }
    return data as CurrentQuestion
  }

  async function generatePack(result: QuizResult) {
    try {
      const res = await fetch('/api/ai-placement/generate-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: result.level, weaknesses: result.weaknesses, strengths: result.strengths }),
      })
      const pack = await res.json() as StudyPack
      setStudyPack(pack)
    } catch {
      setStudyPack({ flashcards: [], chunks: [], roadmap: [], suggestions: [] })
    } finally {
      setPhase('result')
    }
  }

  // ─── Quiz actions ─────────────────────────────────────────────────────────

  async function startQuiz() {
    setPhase('quiz')
    setQuizState('loading')
    setRound(1)
    setHistory([])
    setCurrentQ(null)
    setFeedback(null)
    setFillAnswer('')
    setError('')
    try {
      const q = await fetchNextQuestion([], 1)
      if (q) { setCurrentQ(q); setQuizState('showing') }
    } catch (e) {
      setError(String(e))
      setPhase('intro')
    }
  }

  async function advanceAfterFeedback(newHistory: HistoryEntry[]) {
    setQuizState('loading')
    setFeedback(null)
    setFillAnswer('')
    const nextRound = newHistory.length + 1
    setRound(nextRound)
    try {
      const q = await fetchNextQuestion(newHistory, nextRound)
      if (q) { setCurrentQ(q); setQuizState('showing') }
    } catch (e) {
      if (!String(e).includes('done')) {
        setError(String(e))
        setPhase('intro')
      }
    }
  }

  function commitAnswer(grade: 'correct' | 'partial' | 'wrong', feedbackMsg: string, answer: string, correctAnswer?: string) {
    if (!currentQ) return

    const fb: FeedbackState = { grade, feedback: feedbackMsg, selectedAnswer: answer, correctAnswer }
    setFeedback(fb)
    setQuizState('feedback')

    const newHistory: HistoryEntry[] = [
      ...history,
      { question: currentQ.question, userAnswer: answer, grade, targetLevel: currentQ.targetLevel },
    ]
    setHistory(newHistory)

    feedbackTimer.current = setTimeout(() => advanceAfterFeedback(newHistory), 1800)
  }

  function handleMultipleChoiceAnswer(selectedIdx: number) {
    if (!currentQ || quizState !== 'showing') return
    const isCorrect = selectedIdx === currentQ.correctOptionIndex
    const selectedAnswer = currentQ.options?.[selectedIdx] ?? ''
    const correctAnswer  = currentQ.options?.[currentQ.correctOptionIndex ?? 0] ?? ''
    const grade: 'correct' | 'wrong' = isCorrect ? 'correct' : 'wrong'
    const msg = isCorrect ? 'Correct!' : `The right answer is "${correctAnswer}"`
    commitAnswer(grade, msg, selectedAnswer, isCorrect ? undefined : correctAnswer)
  }

  async function handleFillInSubmit() {
    if (!currentQ || quizState !== 'showing' || !fillAnswer.trim()) return
    setQuizState('evaluating')
    try {
      const res = await fetch('/api/ai-placement/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentQ.question, userAnswer: fillAnswer.trim(), targetLevel: currentQ.targetLevel }),
      })
      const ev = await res.json() as { grade: 'correct' | 'partial' | 'wrong'; feedback: string; correctAnswer?: string }
      commitAnswer(ev.grade, ev.feedback, fillAnswer.trim(), ev.correctAnswer)
    } catch (e) {
      setError(String(e))
      setQuizState('showing')
    }
  }

  // ─── Save pack ────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!quizResult || !studyPack) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/ai-placement/save-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: quizResult.level, flashcards: studyPack.flashcards, chunks: studyPack.chunks }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed to save')
      }
      router.push('/dashboard')
    } catch (e) {
      setSaveError(String(e))
      setSaving(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const totalCards = (studyPack?.flashcards.length ?? 0) + (studyPack?.chunks.length ?? 0)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

      {/* ── Hero ── */}
      <div className="app-hero" style={{ marginLeft: -48, marginRight: -48, paddingLeft: 48, paddingRight: 48 }}>
        <p className="app-hero-subtitle">AI-Powered Assessment</p>
        <h1 className="app-hero-title">Placement Quiz</h1>
        <p className="app-hero-body">Adaptive questions · Live feedback · Personalized study pack</p>
      </div>

      {/* ── Intro ── */}
      {phase === 'intro' && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 20, color: 'var(--clay)' }}>◉</div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.6rem', marginBottom: 12 }}>
            Meet your AI tutor
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.8, maxWidth: 460, margin: '0 auto 28px' }}>
            {TOTAL_ROUNDS} adaptive questions that calibrate to your level in real time. Afterwards, we generate a personalized flashcard deck, language chunks, and a 4-week study plan — just for you.
          </p>
          {error && <div className="alert-error" style={{ marginBottom: 16 }}>{error}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <button className="btn-primary btn-wide" style={{ maxWidth: 280 }} onClick={startQuiz}>
              Start AI assessment →
            </button>
            <button
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.82rem', textDecoration: 'underline' }}
              onClick={() => router.push('/dashboard')}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* ── Quiz ── */}
      {phase === 'quiz' && (
        <div>
          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const filled = i < round - 1
              const active = i === round - 1 && quizState !== 'loading'
              return (
                <div key={i} style={{
                  width: active ? 22 : 10, height: 10, borderRadius: 999,
                  background: filled ? 'var(--clay)' : active ? 'var(--clay)' : 'var(--line)',
                  opacity: filled ? 0.9 : active ? 1 : 0.3,
                  transition: 'all 300ms ease',
                }} />
              )
            })}
          </div>

          {/* Loading skeleton */}
          {(quizState === 'loading' || quizState === 'evaluating') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                <div className="skeleton" style={{ height: 22, width: 52, borderRadius: 999 }} />
                <div className="skeleton" style={{ height: 22, width: 100, borderRadius: 6 }} />
              </div>
              <div className="skeleton" style={{ height: 68, borderRadius: 12 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {[70, 55, 65, 48].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: 52, borderRadius: 12, width: `${w}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Question card */}
          {(quizState === 'showing' || quizState === 'feedback') && currentQ && (
            <div className="animate-fade-up">
              {/* Level + round label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '3px 12px', borderRadius: 999,
                  background: (LEVEL_COLORS[currentQ.targetLevel] ?? '#999') + '1a',
                  color: LEVEL_COLORS[currentQ.targetLevel] ?? 'var(--muted)',
                }}>
                  {currentQ.targetLevel}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                  Question {Math.min(round, TOTAL_ROUNDS)} of {TOTAL_ROUNDS}
                </span>
              </div>

              {/* Question text */}
              <div style={{
                fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700,
                fontSize: '1.25rem', lineHeight: 1.6, marginBottom: 22, color: 'var(--ink)',
              }}>
                {currentQ.question}
              </div>

              {/* Multiple choice */}
              {currentQ.type === 'multiple_choice' && currentQ.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {currentQ.options.map((opt, i) => {
                    const isSelected = feedback?.selectedAnswer === opt
                    const isCorrect  = quizState === 'feedback' && i === currentQ.correctOptionIndex
                    const isWrong    = quizState === 'feedback' && isSelected && !isCorrect

                    const border = isCorrect ? 'var(--moss)' : isWrong ? '#e55' : 'var(--line)'
                    const bg     = isCorrect ? 'rgba(70,98,74,0.1)' : isWrong ? 'rgba(220,50,50,0.08)' : '#fff'
                    const color  = isCorrect ? 'var(--moss)' : isWrong ? '#c33' : 'var(--ink)'

                    return (
                      <button
                        key={i}
                        disabled={quizState === 'feedback'}
                        onClick={() => handleMultipleChoiceAnswer(i)}
                        style={{
                          padding: '14px 20px', borderRadius: 14,
                          border: `1.5px solid ${border}`, background: bg, color,
                          fontWeight: (isCorrect || isWrong) ? 700 : 500,
                          fontSize: '0.9rem', textAlign: 'left',
                          cursor: quizState === 'feedback' ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 12,
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'border-color 120ms, background 120ms, transform 80ms',
                        }}
                        onMouseEnter={(e) => {
                          if (quizState !== 'showing') return
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.borderColor = 'var(--clay)'
                          el.style.background = 'rgba(200,111,74,0.06)'
                          el.style.transform = 'translateX(4px)'
                        }}
                        onMouseLeave={(e) => {
                          if (quizState !== 'showing') return
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.borderColor = 'var(--line)'
                          el.style.background = '#fff'
                          el.style.transform = 'translateX(0)'
                        }}
                      >
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.45, textTransform: 'uppercase', flexShrink: 0 }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
                        {isWrong   && <span style={{ marginLeft: 'auto' }}>✗</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Fill in */}
              {currentQ.type === 'fill_in' && (
                <div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type your answer…"
                    value={fillAnswer}
                    onChange={(e) => setFillAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleFillInSubmit() }}
                    disabled={quizState === 'feedback'}
                    autoFocus
                    style={{ marginBottom: 12 }}
                  />
                  {quizState === 'showing' && (
                    <button className="btn-primary" onClick={handleFillInSubmit} disabled={!fillAnswer.trim()}>
                      Submit →
                    </button>
                  )}
                </div>
              )}

              {/* Feedback banner */}
              {quizState === 'feedback' && feedback && (
                <div className="animate-fade-up" style={{
                  marginTop: 18, padding: '14px 18px', borderRadius: 14,
                  background: feedback.grade === 'correct' ? 'rgba(70,98,74,0.1)' : feedback.grade === 'partial' ? 'rgba(255,152,0,0.08)' : 'rgba(220,50,50,0.08)',
                  border: `1.5px solid ${feedback.grade === 'correct' ? 'var(--moss)' : feedback.grade === 'partial' ? '#FF9800' : '#e55'}`,
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1.4 }}>
                    {feedback.grade === 'correct' ? '✓' : feedback.grade === 'partial' ? '◎' : '✗'}
                  </span>
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.88rem', marginBottom: 3,
                      color: feedback.grade === 'correct' ? 'var(--moss)' : feedback.grade === 'partial' ? '#c17000' : '#c33',
                    }}>
                      {feedback.grade === 'correct' ? 'Correct!' : feedback.grade === 'partial' ? 'Partially correct' : 'Incorrect'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.55 }}>
                      {feedback.feedback}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Generating ── */}
      {phase === 'generating' && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ fontSize: '2.8rem', color: 'var(--clay)', marginBottom: 20 }}>
            <span className="spinner" style={{ width: 48, height: 48, borderWidth: 3, borderTopColor: 'var(--clay)', display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1.4rem', marginBottom: 10 }}>
            Building your study pack…
          </h2>
          {quizResult && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: (LEVEL_COLORS[quizResult.level] ?? 'var(--clay)') + '18', borderRadius: 999, padding: '6px 18px', marginBottom: 16 }}>
              <span style={{ fontWeight: 900, fontSize: '1.1rem', color: LEVEL_COLORS[quizResult.level] ?? 'var(--clay)' }}>{quizResult.level}</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>· {Math.round(quizResult.confidence * 100)}% confidence</span>
            </div>
          )}
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>
            Generating personalized flashcards, language chunks,<br />and a 4-week study roadmap for you…
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, margin: '24px auto 0' }}>
            {[100, 80, 60].map((w, i) => (
              <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 6 }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Result ── */}
      {phase === 'result' && quizResult && (
        <div>
          {/* Level reveal */}
          <div style={{ textAlign: 'center', padding: '24px 0 22px', borderBottom: '1px solid var(--line)', marginBottom: 22 }}>
            <div className="animate-fade-up" style={{
              fontSize: '5.5rem', fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900,
              color: LEVEL_COLORS[quizResult.level] ?? 'var(--clay)', lineHeight: 1, marginBottom: 6,
            }}>
              {quizResult.level}
            </div>
            <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)', marginBottom: 14 }}>
              Your English level
            </div>

            {/* Confidence bar */}
            <div style={{ maxWidth: 260, margin: '0 auto 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Confidence</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{Math.round(quizResult.confidence * 100)}%</span>
              </div>
              <div className="xp-bar-track-light">
                <div className="xp-bar-fill" style={{ width: `${Math.round(quizResult.confidence * 100)}%`, background: LEVEL_COLORS[quizResult.level] ?? 'var(--clay)' }} />
              </div>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.75, maxWidth: 480, margin: '0 auto 14px' }}>
              {quizResult.summary}
            </p>

            {/* Strength / weakness chips */}
            <div style={{ display: 'flex', gap: 7, justifyContent: 'center', flexWrap: 'wrap' }}>
              {quizResult.strengths.map((s) => (
                <span key={s} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 999, background: 'rgba(70,98,74,0.12)', color: 'var(--moss)' }}>
                  ✓ {s}
                </span>
              ))}
              {quizResult.weaknesses.map((w) => (
                <span key={w} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 12px', borderRadius: 999, background: 'rgba(200,111,74,0.12)', color: 'var(--clay)' }}>
                  ⚠ {w}
                </span>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {(['pack', 'roadmap', 'suggestions'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setResultTab(t)}
                style={{
                  padding: '7px 16px', borderRadius: 999,
                  border: `1.5px solid ${resultTab === t ? 'var(--clay)' : 'var(--line)'}`,
                  background: resultTab === t ? 'var(--clay)' : 'transparent',
                  color: resultTab === t ? '#fff' : 'var(--muted)',
                  fontWeight: resultTab === t ? 700 : 400,
                  fontSize: '0.82rem', cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                {t === 'pack'        ? `Study Pack (${totalCards})`
                 : t === 'roadmap'   ? '4-Week Plan'
                 : 'Suggestions'}
              </button>
            ))}
          </div>

          {/* ─ Study Pack tab ─ */}
          {resultTab === 'pack' && studyPack && (
            <div>
              {studyPack.flashcards.length > 0 && (
                <>
                  <div className="section-title">Flashcards</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 20 }}>
                    {studyPack.flashcards.map((f, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', color: 'var(--ink)', marginBottom: 5 }}>
                          {f.front}
                        </div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--moss)', fontWeight: 700, marginBottom: 6 }}>
                          {f.back}
                        </div>
                        {f.example && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            &ldquo;{f.example}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {studyPack.chunks.length > 0 && (
                <>
                  <div className="section-title">Language Chunks</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studyPack.chunks.map((c, i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: 'rgba(200,111,74,0.12)', color: 'var(--clay)', flexShrink: 0, marginTop: 2 }}>
                          {c.type.replace(/_/g, ' ')}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink)', marginBottom: 3 }}>{c.text}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--moss)', fontWeight: 700, marginBottom: 4 }}>{c.translation}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>&ldquo;{c.example}&rdquo;</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {totalCards === 0 && (
                <div className="alert-info">Study pack is empty — the AI may have had trouble generating content. You can save your level and retake later.</div>
              )}
            </div>
          )}

          {/* ─ Roadmap tab ─ */}
          {resultTab === 'roadmap' && studyPack && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {studyPack.roadmap.length === 0 && <div className="alert-info">No roadmap generated.</div>}
              {studyPack.roadmap.map((week) => (
                <div key={week.week} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 16, padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--clay)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>
                      {week.week}
                    </div>
                    <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: '1rem', color: 'var(--ink)' }}>
                      Week {week.week}: {week.focus}
                    </div>
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {week.activities.map((act, i) => (
                      <li key={i} style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>{act}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* ─ Suggestions tab ─ */}
          {resultTab === 'suggestions' && studyPack && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {studyPack.suggestions.length === 0 && <div className="alert-info">No suggestions generated.</div>}
              {studyPack.suggestions.map((s, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: '14px 18px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: s.type === 'youtube' ? 'rgba(200,50,50,0.1)' : 'rgba(140,30,180,0.1)',
                    color: s.type === 'youtube' ? '#c33' : '#8c1eb4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                  }}>
                    {s.type === 'youtube' ? '▶' : '♪'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                      {s.type === 'youtube' ? 'YouTube Studio' : 'Music Lab'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink)', marginBottom: 3 }}>&ldquo;{s.query}&rdquo;</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>{s.reason}</div>
                  </div>
                  <a
                    href={s.type === 'youtube' ? '/youtube' : '/music'}
                    style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--clay)', textDecoration: 'none', flexShrink: 0, padding: '6px 14px', border: '1px solid var(--clay)', borderRadius: 999, whiteSpace: 'nowrap' }}
                  >
                    Try →
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Save CTA */}
          <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--line)', textAlign: 'center' }}>
            {saveError && <div className="alert-error" style={{ marginBottom: 12 }}>{saveError}</div>}
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.65, marginBottom: 16 }}>
              Saving adds {totalCards} cards to your review deck and awards you <strong>+50 XP</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
              <button
                className="btn-primary btn-wide"
                style={{ maxWidth: 320 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner" />Saving…</>
                  : `Save study pack (${quizResult.level}) → +50 XP`}
              </button>
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.82rem', textDecoration: 'underline' }}
                onClick={() => {
                  setPhase('intro'); setRound(1); setHistory([]); setCurrentQ(null)
                  setQuizResult(null); setStudyPack(null); setFeedback(null); setFillAnswer('')
                }}
              >
                Retake quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
