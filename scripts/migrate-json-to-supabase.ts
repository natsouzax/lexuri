/**
 * Migrates flashcards from the old JSON file to Supabase.
 *
 * Usage:
 *   npx tsx scripts/migrate-json-to-supabase.ts --json <path-to-flashcards.json>
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
// Load .env.local manually since dotenv may not be installed
import { readFileSync as _readEnv } from 'fs'
try {
  const env = _readEnv('.env.local', 'utf-8')
  for (const line of env.split('\n')) {
    const [k, ...rest] = line.split('=')
    if (k && !k.startsWith('#')) process.env[k.trim()] = rest.join('=').trim()
  }
} catch { /* env file optional */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const jsonPath = process.argv[process.argv.indexOf('--json') + 1]

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

if (!jsonPath) {
  console.error('Usage: npx tsx scripts/migrate-json-to-supabase.ts --json <path>')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const raw = readFileSync(jsonPath, 'utf-8')
const parsed = JSON.parse(raw)
const cards: unknown[] = Array.isArray(parsed) ? parsed : (parsed.flashcards ?? [])

console.log(`Found ${cards.length} cards to migrate...`)

const { data, error } = await supabase
  .from('flashcards')
  .upsert(cards, { onConflict: 'id' })
  .select()

if (error) {
  console.error('Migration failed:', error.message)
  process.exit(1)
}

console.log(`Successfully migrated ${data?.length ?? 0} cards.`)
