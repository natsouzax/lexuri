// Testa candidatas via captura REAL do YouTube (não lrclib) — só entra na
// lista se a legenda vier de verdade, ancorada no vídeo certo.
import { getTranscript } from '../lib/media/youtube'

const CANDIDATES = [
  { id: 'music-rolling-in-the-deep', youtubeId: 'rYEDA3JcQqw', title: 'Rolling in the Deep' },
  { id: 'video-kurzgesagt-nihilism', youtubeId: 'MBRqu0YOH14', title: 'Optimistic Nihilism' },
  { id: 'music-californication',     youtubeId: 'YlUKcNNmywk', title: 'Californication' },
  { id: 'music-scar-tissue',         youtubeId: 'mzJj5-lubeM', title: 'Scar Tissue' },
  { id: 'music-otherside',           youtubeId: 'rn_YodiJO6k', title: 'Otherside' },
  { id: 'music-let-it-be',           youtubeId: 'QDYfEBY9NM4', title: 'Let It Be' },
  { id: 'music-hey-jude',            youtubeId: 'CG3jm4vvGXc', title: 'Hey Jude' },
  { id: 'music-yesterday',           youtubeId: 'NrgmdOz227I', title: 'Yesterday' },
  { id: 'music-come-together',       youtubeId: 'huD8whbMRvU', title: 'Come Together' },
  { id: 'music-in-my-life',          youtubeId: 'YBcdt6DsLQA', title: 'In My Life' },
]

async function main() {
  for (const c of CANDIDATES) {
    if (!c.youtubeId) { console.log(`[${c.id}] sem youtube_id conhecido — pulando`); continue }
    try {
      const { transcript, segments } = await getTranscript(`https://www.youtube.com/watch?v=${c.youtubeId}`)
      let prev = -1
      let bad = 0
      for (const s of segments) { if (s.start < prev) bad++; prev = s.start }
      console.log(`[${c.id}] OK — ${segments.length} segments, ${transcript.length} chars, ${bad} fora de ordem`)
    } catch (e) {
      console.log(`[${c.id}] FALHOU — ${e instanceof Error ? e.message.slice(0, 120) : String(e).slice(0, 120)}`)
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
