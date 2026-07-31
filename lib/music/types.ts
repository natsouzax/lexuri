export type SongSectionType = 'verse' | 'chorus'
export type UserSongStatus = 'ready' | 'practicing' | 'completed'

export interface PersonalSongSection {
  id: string
  song_id: string
  section_order: number
  section_type: SongSectionType
  label: string
  lyrics: string
  takeaway_ids: string[]
  best_pronunciation_score: number | null
  last_practiced_at: string | null
}

export interface PersonalSong {
  id: string
  title: string
  status: UserSongStatus
  locale: string
  bpm: number
  backing_track: string
  source_takeaway_ids: string[]
  final_recording_path: string | null
  final_recording_mime: string | null
  completed_at: string | null
  created_at: string
  sections: PersonalSongSection[]
  recording_url?: string | null
}

export interface PronunciationScores {
  accuracy: number | null
  fluency: number | null
  completeness: number | null
  prosody: number | null
  pronunciation: number | null
}

export interface PronunciationPhoneme {
  phoneme: string
  accuracy: number | null
}

export interface PronunciationWord {
  word: string
  accuracy: number | null
  errorType: string
  phonemes: PronunciationPhoneme[]
}

export interface PronunciationResult {
  recognizedText: string
  scores: PronunciationScores
  words: PronunciationWord[]
  focusWords: PronunciationWord[]
  feedback: string
}

export interface PronunciationAttempt {
  id: string
  section_id: string
  recognized_text: string
  overall_scores: PronunciationScores
  word_scores: PronunciationWord[]
  feedback: string
  created_at: string
}

export interface MusicStudioData {
  requiredTakeaways: number
  totalTakeaways: number
  availableTakeawaysCount: number
  azureConfigured: boolean
  song: PersonalSong | null
  songHistory: Array<{
    id: string
    title: string
    status: UserSongStatus
    completed_at: string | null
    recording_url: string | null
  }>
  attempts: PronunciationAttempt[]
}
