// Vocabulário do MVP de validação: níveis de estudo, ciclo de revisão
// D1/D2/D3 e mapeamentos entre o catálogo (CEFR) e a UI (3 níveis).
import { FEED_ITEMS, type FeedItem } from './feed'

export type StudyLevel = 'beginner' | 'intermediate' | 'advanced'

export const STUDY_LEVELS: Record<StudyLevel, { label: string; icon: string; desc: string }> = {
  beginner:     { label: 'Beginner',     icon: '🌱', desc: 'Sei algumas palavras, mas frases completas são difíceis.' },
  intermediate: { label: 'Intermediate', icon: '🌿', desc: 'Acompanho bem, mas perco muitos detalhes.' },
  advanced:     { label: 'Advanced',     icon: '🌳', desc: 'Entendo quase tudo — quero soar mais natural.' },
}

export function cefrToStudyLevel(cefr: string): StudyLevel {
  if (cefr === 'A1' || cefr === 'A2') return 'beginner'
  if (cefr === 'B1') return 'intermediate'
  return 'advanced'
}

export function songsForLevel(level: StudyLevel): FeedItem[] {
  return FEED_ITEMS.filter((item) => cefrToStudyLevel(item.level) === level)
}

// ── Ciclo de revisão por música ──────────────────────────────────────────────

export interface SongProgress {
  song_id: string
  listened_at: string
  day1_done_at: string | null
  day2_done_at: string | null
  day3_done_at: string | null
}

export type ReviewDay = 1 | 2 | 3

export const DAY_INFO: Record<ReviewDay, { title: string; desc: string; icon: string }> = {
  1: { title: 'Day 1 — Flashcards', desc: 'Releia as palavras que você salvou. Só leitura, sem teste.', icon: '📖' },
  2: { title: 'Day 2 — Jogo da memória', desc: 'Encontre os pares palavra ↔ tradução.', icon: '🃏' },
  3: { title: 'Day 3 — Complete a letra', desc: 'Preencha os trechos da música e registre seus aprendizados.', icon: '✍️' },
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

// Estado do ciclo: qual dia está pendente e se já pode ser feito hoje.
// Day 1 libera imediatamente após ouvir; Day 2 no dia seguinte ao Day 1;
// Day 3 no dia seguinte ao Day 2.
export function nextReviewStep(p: SongProgress): { day: ReviewDay; available: boolean } | 'done' {
  const now = new Date()
  if (!p.day1_done_at) return { day: 1, available: true }
  if (!p.day2_done_at) return { day: 2, available: !isSameCalendarDay(new Date(p.day1_done_at), now) }
  if (!p.day3_done_at) return { day: 3, available: !isSameCalendarDay(new Date(p.day2_done_at), now) }
  return 'done'
}

// ── Takeaways e versos (glossário ativo) ─────────────────────────────────────

export interface Takeaway {
  id: string
  song_id: string
  text: string
  created_at: string
}

export interface UserVerse {
  id: string
  verse_text: string
  takeaway_ids: string[]
  created_at: string
}
