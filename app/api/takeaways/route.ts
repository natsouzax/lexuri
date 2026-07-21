import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { callLLM, safeJsonParse } from '@/lib/openai'
import { errorMessage } from '@/lib/http'

// GET: glossário (takeaways) + música do usuário (versos).
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [{ data: takeaways }, { data: verses }] = await Promise.all([
      supabase.from('takeaways').select('id, song_id, text, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('user_verses').select('id, verse_text, takeaway_ids, created_at')
        .eq('user_id', user.id).order('created_at', { ascending: true }),
    ])

    return NextResponse.json({ takeaways: takeaways ?? [], verses: verses ?? [] })
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}

async function generateVerse(a: string, b: string): Promise<string> {
  const raw = await callLLM(
    `You write tiny song verses for English learners. Using these two personal learnings from a student:
1. "${a}"
2. "${b}"
Write ONE short verse (2 lines, simple English, ideally rhyming) that weaves both learnings in.
Return JSON: {"verse": "line one\\nline two"}`,
  )
  const parsed = safeJsonParse<{ verse?: string }>(raw)
  const verse = parsed.verse?.trim()
  // Fallback sem IA: junta os dois aprendizados como dístico simples.
  return verse || `${a}\n${b}`
}

// POST { song_id, texts: string[] } — grava os takeaways do Day 3 e,
// a cada 2 takeaways acumulados, gera um verso da música do usuário.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { song_id, texts } = (await request.json()) as { song_id: string; texts: string[] }
    const clean = (texts ?? []).map((t) => String(t ?? '').trim()).filter(Boolean).slice(0, 2)
    if (!song_id || clean.length === 0) {
      return NextResponse.json({ error: 'Escreva pelo menos um aprendizado.' }, { status: 400 })
    }

    const { error: insertError } = await supabase.from('takeaways').insert(
      clean.map((text) => ({ user_id: user.id, song_id, text })),
    )
    if (insertError) throw insertError

    // Pareia takeaways sem verso: cada 2 completos viram um verso novo.
    const [{ data: all }, { data: verses }] = await Promise.all([
      supabase.from('takeaways').select('id, text').eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase.from('user_verses').select('takeaway_ids').eq('user_id', user.id),
    ])

    const used = new Set((verses ?? []).flatMap((v: { takeaway_ids: string[] }) => v.takeaway_ids))
    const unpaired = (all ?? []).filter((t: { id: string }) => !used.has(t.id))

    const newVerses: string[] = []
    for (let i = 0; i + 1 < unpaired.length; i += 2) {
      const [a, b] = [unpaired[i], unpaired[i + 1]]
      const verseText = await generateVerse(a.text, b.text)
      const { error } = await supabase.from('user_verses').insert({
        user_id: user.id,
        verse_text: verseText,
        takeaway_ids: [a.id, b.id],
      })
      if (!error) newVerses.push(verseText)
    }

    return NextResponse.json({ saved: clean.length, newVerses })
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 })
  }
}
