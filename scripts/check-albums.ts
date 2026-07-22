// Sonda o lrclib.net pra avaliar candidatos a "álbum" no módulo futuro.
// Pra cada faixa: existe letra sincronizada? duração? quantas linhas
// (proxy de densidade de conteúdo pra chunks)? Roda na sua máquina — o
// lrclib é bloqueado no ambiente do assistente.
//
// Uso: node --import=tsx scripts/check-albums.ts
//
// Só metadados (título/artista/duração) — nenhuma letra é impressa.

interface Hit {
  artistName: string
  trackName: string
  duration: number | null
  instrumental: boolean
  syncedLyrics: string | null
  plainLyrics: string | null
}

// Só TÍTULOS de faixa (metadados factuais). Candidatos "que contam história
// e fazem pensar", com tamanhos variados pra comparar viabilidade.
const ALBUMS: { artist: string; album: string; note: string; tracks: string[] }[] = [
  {
    artist: 'Pink Floyd',
    album: 'Wish You Were Here',
    note: 'Pequeno (5 faixas), tema: ausência/indústria/saúde mental. 2 faixas longas multi-parte.',
    tracks: [
      'Shine On You Crazy Diamond (Parts I-V)',
      'Welcome to the Machine',
      'Have a Cigar',
      'Wish You Were Here',
      'Shine On You Crazy Diamond (Parts VI-IX)',
    ],
  },
  {
    artist: 'Pink Floyd',
    album: 'The Dark Side of the Moon',
    note: 'Exemplo do Natan. Tema: tempo/dinheiro/loucura/morte. Várias faixas instrumentais.',
    tracks: [
      'Speak to Me', 'Breathe (In the Air)', 'On the Run', 'Time',
      'The Great Gig in the Sky', 'Money', 'Us and Them',
      'Any Colour You Like', 'Brain Damage', 'Eclipse',
    ],
  },
  {
    artist: 'Green Day',
    album: 'American Idiot',
    note: 'Ópera-rock narrativa; linguagem acessível (B1-B2). 13 faixas.',
    tracks: [
      'American Idiot', 'Jesus of Suburbia', 'Holiday', 'Boulevard of Broken Dreams',
      'Are We the Waiting', 'St. Jimmy', 'Give Me Novacaine', "She's a Rebel",
      'Extraordinary Girl', 'Letterbomb', 'Wake Me Up When September Ends',
      'Homecoming', 'Whatsername',
    ],
  },
  {
    artist: 'Simon & Garfunkel',
    album: 'Bridge over Troubled Water',
    note: 'Dicção clara, linguagem acessível, reflexivo. Ótimo pra learners.',
    tracks: [
      'Bridge over Troubled Water', 'El Condor Pasa (If I Could)', 'Cecilia',
      'Keep the Customer Satisfied', 'So Long, Frank Lloyd Wright', 'The Boxer',
      'Baby Driver', 'The Only Living Boy in New York', 'Why Don\'t You Write Me',
      'Bye Bye Love', 'Song for the Asking',
    ],
  },
  {
    artist: 'Taylor Swift',
    album: 'folklore',
    note: 'Narrativa em 3ª pessoa, linguagem rica mas acessível; cobertura lrclib excelente.',
    tracks: [
      'the 1', 'cardigan', 'the last great american dynasty', 'exile',
      'my tears ricochet', 'mirrorball', 'seven', 'august',
      'this is me trying', 'illicit affairs', 'invisible string',
      'mad woman', 'epiphany', 'betty', 'peace', 'hoax',
    ],
  },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function search(artist: string, track: string): Promise<Hit[]> {
  const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Lexuri/1.0 (album research)' } })
      if (res.ok) return (await res.json()) as Hit[]
    } catch {
      await sleep(1200 * (i + 1))
    }
  }
  return []
}

function lineCount(lrc: string | null): number {
  if (!lrc) return 0
  return lrc.split('\n').filter((l) => /^\[\d/.test(l) && l.replace(/^\[[^\]]+\]/, '').trim()).length
}

async function main() {
  for (const alb of ALBUMS) {
    console.log(`\n\n════════════════════════════════════════`)
    console.log(`${alb.artist} — ${alb.album}`)
    console.log(alb.note)
    console.log(`────────────────────────────────────────`)
    let synced = 0, totalSec = 0, totalLines = 0, sungTracks = 0
    for (const track of alb.tracks) {
      const hits = await search(alb.artist, track)
      const withSync = hits.find((h) => h.syncedLyrics && !h.instrumental)
      const best = withSync ?? hits[0]
      const dur = best?.duration ?? 0
      const lines = lineCount(withSync?.syncedLyrics ?? null)
      totalSec += dur
      if (withSync) { synced++; totalLines += lines }
      if (best && !best.instrumental && (best.syncedLyrics || best.plainLyrics)) sungTracks++
      const mark = withSync ? '✅ synced' : best?.instrumental ? '🎹 instrumental' : best ? '⚠️  plain only' : '❌ not found'
      console.log(`  ${mark.padEnd(16)} ${dur ? `${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')}` : '?:??'}  ${lines ? lines+' lines' : ''}  — ${track}`)
      await sleep(400)
    }
    const mins = Math.round(totalSec / 60)
    console.log(`────────────────────────────────────────`)
    console.log(`  ${synced}/${alb.tracks.length} faixas com letra sincronizada`)
    console.log(`  ~${mins} min total | ${sungTracks} faixas cantadas | ~${totalLines} linhas de letra`)
    console.log(`  Viabilidade: ${synced >= alb.tracks.length * 0.8 ? '🟢 boa' : synced >= alb.tracks.length * 0.5 ? '🟡 parcial' : '🔴 fraca'} (sync) · trabalho de curadoria ≈ ${sungTracks} faixas`)
  }
  console.log(`\n\nDica: "faixas cantadas" é o que vira lição; instrumentais entram só`)
  console.log(`como faixa do álbum (tocam, sem letra). Poucas linhas = pouco chunk.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
