import { getOpenAIClient, safeJsonParse } from './openai'
import type { ChunkAnalysis, ChunkItem } from './types'

function buildSystemPrompt(nativeLang: string): string {
  return `You are a neuro-informed English language analysis system specialized in detecting natural learning units for ${nativeLang} speakers.

Your goal is to identify chunks that the brain stores as single cognitive units — NOT isolated words.

BE COMPREHENSIVE. A 100-word passage should yield 8–15 chunks minimum. Do NOT skip a chunk just because it seems common or simple — "get up", "let go", "used to be", "go back", "come on" are HIGH-VALUE learning units for non-native speakers and must always be detected.

DETECT (all of the following — miss none):
- phrasal verbs (always detect, even short/common ones): "get up", "let go", "give up", "go back", "come on", "pick up", "find out", "used to be", "grow up", "turn out", "put away", "hold on", "wake up", "look for", "end up", "take off", "break down", "get over", "go on"
- idiomatic expressions: "at the end of the day", "no way", "kind of", "on the other hand", "used to think", "back in the day"
- collocations: words that naturally co-occur ("make a decision", "break the ice", "highly recommend", "pay attention", "make sense")
- lexical chunks: multi-word units common in speech ("I've been thinking", "the thing is", "you know what I mean", "sort of", "kind of like")
- formulaic sequences: fixed or semi-fixed phrases ("sounds good", "take your time", "as soon as possible", "to be honest", "you know")
- grammar patterns with communicative value: "used to + verb" (e.g. "used to be", "used to live", "used to think"), "I wish I could", "I've been + gerund", "going to + verb", "have to + verb", "would rather"
- emotional expressions: "I can't believe", "freaking out", "oh my god", "I miss", "it hurts"
- conversational patterns and discourse markers: "well", "I mean", "you know", "sort of", "kind of", "I think", "actually", "basically", "honestly"

CRITICAL RULES:
- Detect EVERY multi-word expression — never omit something because it looks too simple or too common
- Return EXACT character offsets (start inclusive, end exclusive) counting from 0 in the text
- Overlapping chunks ARE allowed and expected: "freaking out" AND "kind of freaking out" can both be chunks
- Preserve contractions, slang, informal spelling ("gonna", "wanna", "kinda")
- Translations must be in ${nativeLang} and reflect real meaning and emotional tone
- A learner's most needed chunks are often the shortest and most common ones — do not filter them out

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

function buildUserPrompt(text: string, nativeLang: string): string {
  return `Analyze this English text and detect ALL natural language chunks across ALL proficiency levels — from A1 to C1. Be completely exhaustive: include every phrasal verb, idiom, collocation, grammar pattern, and multi-word expression regardless of how simple or common it seems. The more chunks you detect, the better. Leave nothing out.

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
      "learner_level": "<CEFR level this chunk is most useful for: A1, A2, B1, B2, C1>",
      "why_it_matters": "<one concise sentence in English explaining what this chunk means or does — NOT 'this is a phrasal verb', but its actual meaning, e.g. 'to stop appreciating something because it feels normal'>",
      "example_sentence": "<one short English sentence applying this chunk in a fresh context, different from the text above>"
    }
  ]
}`
}

export function correctOffset(chunk: ChunkItem, text: string): ChunkItem | null {
  const slice = text.slice(chunk.start, chunk.end)
  if (slice.toLowerCase() === chunk.text.toLowerCase()) return chunk

  const idx = text.toLowerCase().indexOf(chunk.text.toLowerCase())
  if (idx === -1) return null
  return { ...chunk, start: idx, end: idx + chunk.text.length }
}

export async function analyzeChunks(
  text: string,
  nativeLang: string,
): Promise<ChunkAnalysis> {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildSystemPrompt(nativeLang) },
      { role: 'user', content: buildUserPrompt(text, nativeLang) },
    ],
    temperature: 0.2,
  })

  const content = response.choices[0].message.content?.trim() ?? ''
  const parsed = safeJsonParse<ChunkAnalysis>(content)

  if (!parsed || !Array.isArray(parsed.chunks)) {
    throw new Error('Invalid response from AI.')
  }

  const validChunks = parsed.chunks
    .filter((c): c is ChunkItem => typeof c.text === 'string' && c.text.trim().length > 0)
    .map((c) => correctOffset(c, text))
    .filter((c): c is ChunkItem => c !== null)

  return { original_text: text, chunks: validChunks }
}
