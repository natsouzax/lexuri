import OpenAI from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.')
    client = new OpenAI({ apiKey })
  }
  return client
}

export async function callLLM(prompt: string): Promise<string> {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content:
            'You MUST return ONLY valid JSON. No explanations. No text outside JSON. If you fail, the system will break.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    })
    return response.choices[0].message.content?.trim() ?? ''
  } catch (e) {
    return JSON.stringify({ error: `LLM error: ${String(e)}` })
  }
}

export function extractJsonText(response: string): string {
  let content = response.trim()
  content = content.replace(/^```(?:json)?\n?|```$/gim, '').trim()

  if (content.startsWith('{') || content.startsWith('[')) return content

  const objectStart = content.indexOf('{')
  const arrayStart = content.indexOf('[')
  const candidates = [objectStart, arrayStart].filter((i) => i >= 0)
  if (!candidates.length) return content

  const start = Math.min(...candidates)
  const endChar = content[start] === '{' ? '}' : ']'
  const end = content.lastIndexOf(endChar)
  return end >= start ? content.slice(start, end + 1) : content
}

export function safeJsonParse<T = unknown>(response: string): T {
  try {
    return JSON.parse(extractJsonText(response)) as T
  } catch {
    return { error: 'Invalid JSON response from AI', raw: response } as T
  }
}
