import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { errorMessage } from '@/lib/http'
import { getAlbum, sungTracks } from '@/lib/album'

// A "faixa do usuário": os versos gerados nas faixas do álbum (via takeaways)
// compilados numa peça única. Os versos já existem em user_verses; aqui só
// juntamos os que vieram das faixas DESTE álbum e persistimos o resultado.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const album = getAlbum(id)
    if (!album) return NextResponse.json({ error: 'Album not found.' }, { status: 404 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const songIds = sungTracks(album).map((t) => t.songId)

    // takeaways deste álbum → seus ids → versos que os referenciam.
    const { data: takeaways } = await supabase
      .from('takeaways').select('id').eq('user_id', user.id).in('song_id', songIds)
    const takeawayIds = new Set((takeaways ?? []).map((t: { id: string }) => t.id))

    const { data: verses } = await supabase
      .from('user_verses').select('id, verse_text, takeaway_ids, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: true })

    const albumVerses = (verses ?? []).filter((v: { takeaway_ids: string[] }) =>
      v.takeaway_ids.some((tid) => takeawayIds.has(tid)),
    )

    const compiledText = albumVerses.map((v: { verse_text: string }) => v.verse_text).join('\n\n')

    // Persiste (upsert) pra virar a "faixa do usuário" do álbum.
    if (albumVerses.length > 0) {
      await supabase.from('user_album_songs').upsert({
        user_id: user.id,
        album_id: id,
        compiled_text: compiledText,
        verse_ids: albumVerses.map((v: { id: string }) => v.id),
      }, { onConflict: 'user_id,album_id' })
    }

    return NextResponse.json({ compiledText, verseCount: albumVerses.length })
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
