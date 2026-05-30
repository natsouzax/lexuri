import { NextResponse } from 'next/server'
import { getOpenAIClient, safeJsonParse } from '@/lib/openai'
import { createClient } from '@/lib/supabase-server'
import type { ChunkAnalysis, ChunkItem } from '@/lib/types'

function buildSystemPrompt(nativeLang: string) {
  return `You are a neuro-informed English language analysis system specialized in detecting natural learning units for ${nativeLang} speakers.

Your goal is to identify chunks that the brain stores as single cognitive units — NOT isolated words.

DETECT (in order of priority):
- phrasal verbs: "give up", "freak out", "look forward to"
- idiomatic expressions: "at the end of the day", "no way", "kind of"
- collocations: words that naturally co-occur ("make a decision", "break the ice", "highly recommend")
- lexical chunks: multi-word units common in speech ("I've been thinking", "the thing is", "you know what I mean")
- formulaic sequences: fixed or semi-fixed phrases ("sounds good", "take your time", "as soon as possible")
- emotional expressions: ("freaking out", "I can't believe", "oh my god", "kind of freaking out")
- conversational patterns: discourse markers and fillers ("well", "I mean", "you know", "sort of", "kind of")
- grammar patterns with communicative value: ("I've been + gerund", "used to + verb", "I wish I could")

RULES:
- Return EXACT character offsets (start inclusive, end exclusive) relative to the original text — count from 0
- Overlapping chunks ARE allowed: "freaking out" can exist inside "kind of freaking out"
- Preserve contractions, slang, informal spelling, and oral patterns
- Do NOT split natural units into isolated words
- Translations must be in ${nativeLang} and reflect real meaning and emotional tone, NOT literal word-for-word renderings
- Use consistent colors per chunk type as specified below

COLOR CODES (use exactly as specified, per type):
- phrasal_verb: "#4CAF50"
- idiomatic: "#FF6B6B"
- collocation: "#4A90E2"
- lexical_chunk: "#9C27B0"
- formulaic: "#FF9800"
- grammar_pattern: "#00BCD4"
- emotional: "#E91E63"
- conversational: "#607D8B"

Return ONLY valid JSON. No markdown fences. No explanations outside JSON.`
}

function buildUserPrompt(text: string, level: string, nativeLang: string) {
  return `Analyze this English text and detect all natural language chunks for a ${level} learner.

Return exact character offsets for each chunk so the frontend can highlight them in the original text.
The "start" and "end" values must match the exact substring in the text below.

TEXT:
${text}

JSON schema to follow exactly:
{
  "original_text": "<the exact text above>",
  "chunks": [
    {
      "text": "<exact substring from the text>",
      "type": "phrasal_verb|collocation|idiomatic|lexical_chunk|formulaic|grammar_pattern|emotional|conversational",
      "start": <integer, 0-based character index>,
      "end": <integer, exclusive>,
      "literal_translation": "<word-for-word ${nativeLang}>",
      "contextual_translation": "<natural ${nativeLang} capturing tone and emotion>",
      "importance": "high|medium|low",
      "frequency_score": <integer 1-10>,
      "confidence": <float 0.0-1.0>,
      "color": "<hex from the color guide above>",
      "clickable": true,
      "flashcard_suggestion": true|false,
      "learner_level": "<CEFR: A1, A2, B1, B2, C1>",
      "why_it_matters": "<1-2 sentences on why this chunk helps fluency>"
    }
  ]
}`
}

function correctOffset(chunk: ChunkItem, text: string): ChunkItem | null {
  const slice = text.slice(chunk.start, chunk.end)
  if (slice.toLowerCase() === chunk.text.toLowerCase()) return chunk

  const idx = text.toLowerCase().indexOf(chunk.text.toLowerCase())
  if (idx === -1) return null
  return { ...chunk, start: idx, end: idx + chunk.text.length }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { text: string; level?: string }
    const { text, level = 'B1' } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
    }

    const { data: onboarding } = await supabase
      .from('onboarding')
      .select('native_language, current_level')
      .eq('user_id', user.id)
      .maybeSingle()

    const nativeLang = (onboarding?.native_language as string | null) ?? 'Portuguese'
    const userLevel = (level !== 'B1' ? level : (onboarding?.current_level as string | null)) ?? 'B1'

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildSystemPrompt(nativeLang) },
        { role: 'user', content: buildUserPrompt(text, userLevel, nativeLang) },
      ],
      temperature: 0.2,
    })

    const content = response.choices[0].message.content?.trim() ?? ''
    const parsed = safeJsonParse<ChunkAnalysis>(content)

    if (!parsed || !Array.isArray(parsed.chunks)) {
      return NextResponse.json({ error: 'Invalid response from AI.' }, { status: 500 })
    }

    const validChunks = parsed.chunks
      .filter((c): c is ChunkItem => typeof c.text === 'string' && c.text.trim().length > 0)
      .map((c) => correctOffset(c, text))
      .filter((c): c is ChunkItem => c !== null)

    return NextResponse.json({ original_text: text, chunks: validChunks } satisfies ChunkAnalysis)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
