// Módulo Álbum: o aluno percorre um álbum conceitual inteiro. Cada faixa
// cantada é uma lição normal (StaticLesson + ciclo D1/D2/D3 por música);
// as instrumentais tocam como interlúdios (sem lição). Quando todas as
// faixas fecham o ciclo, desbloqueia um ciclo GLOBAL do álbum, e no fim os
// versos de todas as faixas compõem a "faixa do usuário".
//
// Só metadados aqui — nenhuma letra. As lições das faixas são geradas via
// lrclib pelo script scripts/generate-album-tracks.ts.

export interface AlbumTrackRef {
  /** feed_item_id da faixa (uma StaticLesson normal) — vazio até curar */
  songId: string
  /** ordem no álbum */
  title: string
  /** faixa instrumental: toca como interlúdio, não vira lição */
  instrumental?: boolean
}

import type { StudyLevel } from '@/lib/mvp'

export interface Album {
  id: string
  title: string
  artist: string
  year: number
  /** nível do app — a vitrine agrupa os álbuns em básico/intermediário/avançado */
  level: StudyLevel
  /** tema do álbum, em inglês (imersão) — o fio condutor da reflexão final */
  theme: string
  /** cores do gradiente da capa */
  cover: [string, string]
  /** pergunta de reflexão do ciclo global (Day 3 do álbum) */
  reflection: string
  tracks: AlbumTrackRef[]
}

import { getFeedItem } from '@/lib/feed'
import { AMERICAN_IDIOT } from '@/data/albums/american-idiot'

export const ALBUMS: Album[] = [AMERICAN_IDIOT]

export function getAlbum(id: string): Album | undefined {
  return ALBUMS.find((a) => a.id === id)
}

/** Só as faixas cantadas (as que viram lição). */
export function sungTracks(album: Album): AlbumTrackRef[] {
  return album.tracks.filter((t) => !t.instrumental && t.songId)
}

/** Faixas cantadas que JÁ têm lição curada (existem no feed). O ciclo global
 *  e a barra de progresso se baseiam nelas — uma faixa ainda não curada não
 *  trava o álbum. */
export function curatedSungTracks(album: Album): AlbumTrackRef[] {
  return sungTracks(album).filter((t) => getFeedItem(t.songId))
}

// ── Progresso do álbum ───────────────────────────────────────────────────────

export interface AlbumProgress {
  album_id: string
  album_day1_done_at: string | null
  album_day2_done_at: string | null
  album_day3_done_at: string | null
}

// O ciclo global só libera depois que todas as faixas CURADAS fecharam o
// próprio ciclo de 3 dias. `doneSongIds` = faixas com o ciclo completo.
export function albumCycleUnlocked(album: Album, doneSongIds: Set<string>): boolean {
  const sung = curatedSungTracks(album)
  return sung.length > 0 && sung.every((t) => doneSongIds.has(t.songId))
}

export interface AlbumCycleStep {
  day: 1 | 2 | 3
  available: boolean
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

// Mesmo gating de 1 dia entre etapas do ciclo por música.
export function nextAlbumStep(p: AlbumProgress | null): AlbumCycleStep | 'done' {
  const now = new Date()
  if (!p || !p.album_day1_done_at) return { day: 1, available: true }
  if (!p.album_day2_done_at) return { day: 2, available: !isSameCalendarDay(new Date(p.album_day1_done_at), now) }
  if (!p.album_day3_done_at) return { day: 3, available: !isSameCalendarDay(new Date(p.album_day2_done_at), now) }
  return 'done'
}
