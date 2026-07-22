import type { Album } from '@/lib/album'

// Mini-álbum de estreia do módulo: um recorte narrativo de 5 faixas de
// "American Idiot" (Green Day, 2004) — uma ópera-rock sobre desilusão,
// mídia e a busca por sentido nos anos 2000. Só metadados aqui; as lições
// de cada faixa são geradas via lrclib por scripts/generate-album-tracks.ts.
//
// songId aponta pro feed_item_id que o script de curação vai criar.
export const AMERICAN_IDIOT: Album = {
  id: 'american-idiot',
  title: 'American Idiot',
  artist: 'Green Day',
  year: 2004,
  level: 'intermediate',
  theme: 'Disillusionment, media noise, and searching for meaning in modern life.',
  cover: ['#c0392b', '#1a1a1a'],
  reflection: 'This album is about feeling lost in a loud, distracted world. Which two lines or ideas made you stop and think about your own life?',
  tracks: [
    { songId: 'album-ai-american-idiot',   title: 'American Idiot' },
    { songId: 'album-ai-holiday',          title: 'Holiday' },
    { songId: 'album-ai-boulevard',        title: 'Boulevard of Broken Dreams' },
    { songId: 'album-ai-wake-me-up',       title: 'Wake Me Up When September Ends' },
    { songId: 'album-ai-whatsername',      title: 'Whatsername' },
  ],
}
