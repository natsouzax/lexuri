// Erros de API legíveis: Error vira .message, erro do Supabase (objeto
// plano com .message) idem — nunca "[object Object]".
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    return e.message
  }
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}
