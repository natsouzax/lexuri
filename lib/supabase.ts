import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import type { Flashcard } from './types'

// Service-role client (server-only — never expose to browser)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase env vars are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  return createSupabaseAdmin(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function loadFlashcards(userId: string): Promise<Flashcard[]> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Flashcard[]
}

export async function upsertFlashcards(cards: Flashcard[], userId: string): Promise<Flashcard[]> {
  if (!cards.length) return []
  const supabase = getAdminClient()
  const cardsWithUser = cards.map((c) => ({ ...c, user_id: userId }))
  const { data, error } = await supabase
    .from('flashcards')
    .upsert(cardsWithUser, { onConflict: 'id' })
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []) as Flashcard[]
}

export async function updateFlashcard(
  id: string,
  updates: Partial<Flashcard>,
  userId: string,
): Promise<Flashcard> {
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Flashcard
}
