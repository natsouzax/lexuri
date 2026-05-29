import { createClient } from '@supabase/supabase-js'
import type { Flashcard } from './types'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase env vars are not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    )
  }
  return createClient(url, serviceKey)
}

export async function loadFlashcards(): Promise<Flashcard[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Flashcard[]
}

export async function upsertFlashcards(cards: Flashcard[]): Promise<Flashcard[]> {
  if (!cards.length) return []
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('flashcards')
    .upsert(cards, { onConflict: 'id' })
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []) as Flashcard[]
}

export async function updateFlashcard(
  id: string,
  updates: Partial<Flashcard>,
): Promise<Flashcard> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('flashcards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Flashcard
}
