/**
 * Runs pending Supabase migrations against the remote database.
 *
 * Usage:
 *   npm run db:migrate           — apply pending migrations
 *   npm run db:migrate -- --dry  — list pending without applying
 *
 * Requires DATABASE_URL in .env.local:
 *   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
 *   (get it from Supabase Dashboard → Settings → Database → Connection string → URI)
 */

import { Client } from 'pg'
import { readdirSync, readFileSync } from 'fs'
import { join, basename } from 'path'

// ── load .env.local ─────────────────────────────────────────────────────────
try {
  const env = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  for (const line of env.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch { /* .env.local optional */ }

const DATABASE_URL = process.env.DATABASE_URL
const DRY_RUN = process.argv.includes('--dry')

if (!DATABASE_URL) {
  console.error('\x1b[31m✖ DATABASE_URL not set in .env.local\x1b[0m')
  console.error('  Get it at: Supabase Dashboard → Settings → Database → Connection string → URI')
  console.error('  Add to .env.local:')
  console.error('  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres')
  process.exit(1)
}

// ── helpers ──────────────────────────────────────────────────────────────────
const green  = (s: string) => `\x1b[32m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`
const dim    = (s: string) => `\x1b[2m${s}\x1b[0m`
const bold   = (s: string) => `\x1b[1m${s}\x1b[0m`

function versionOf(filename: string): string {
  // "0001_flashcards.sql" → "0001_flashcards"
  return basename(filename, '.sql')
}

// ── discover migration files ──────────────────────────────────────────────────
const migrationsDir = join(process.cwd(), 'supabase', 'migrations')
const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

if (files.length === 0) {
  console.log(yellow('No migration files found in supabase/migrations/'))
  process.exit(0)
}

// ── connect ───────────────────────────────────────────────────────────────────
// Parse manually so percent-encoded chars in the password are decoded correctly
function parseDbUrl(url: string) {
  const u = new URL(url)
  return {
    host:     u.hostname,
    port:     parseInt(u.port || '5432'),
    user:     decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
    ssl:      { rejectUnauthorized: false },
  }
}

const client = new Client(parseDbUrl(DATABASE_URL))

async function main() {
  await client.connect()
  console.log(dim(`Connected to database.\n`))

  // Ensure the Supabase migrations tracking schema/table exist
  await client.query(`CREATE SCHEMA IF NOT EXISTS supabase_migrations`)
  await client.query(`
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version    text NOT NULL PRIMARY KEY,
      statements text[],
      name       text
    )
  `)

  // Fetch already-applied versions
  const { rows } = await client.query<{ version: string }>(
    `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version`
  )
  const applied = new Set(rows.map(r => r.version))

  const pending = files.filter(f => !applied.has(versionOf(f)))

  console.log(bold(`Migration status`))
  console.log(`  Total   : ${files.length}`)
  console.log(green(`  Applied : ${applied.size}`))
  console.log(pending.length > 0 ? yellow(`  Pending : ${pending.length}`) : green(`  Pending : 0`))
  console.log()

  if (pending.length === 0) {
    console.log(green('✔ Database is up to date.'))
    await client.end()
    return
  }

  if (DRY_RUN) {
    console.log(yellow('Dry run — these migrations would be applied:'))
    pending.forEach(f => console.log(`  ${dim('→')} ${f}`))
    await client.end()
    return
  }

  // Apply each pending migration inside its own transaction
  for (const file of pending) {
    const version = versionOf(file)
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    process.stdout.write(`  Running ${bold(file)} ... `)

    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query(
        `INSERT INTO supabase_migrations.schema_migrations (version, name)
         VALUES ($1, $2)
         ON CONFLICT (version) DO NOTHING`,
        [version, file]
      )
      await client.query('COMMIT')
      console.log(green('✔'))
    } catch (err) {
      await client.query('ROLLBACK')
      console.log(red('✖'))
      console.error(red(`\nFailed on ${file}:`))
      console.error(red((err as Error).message))
      await client.end()
      process.exit(1)
    }
  }

  console.log()
  console.log(green(`✔ Applied ${pending.length} migration(s) successfully.`))
  await client.end()
}

main().catch(async err => {
  console.error(red('\nUnexpected error:'), err.message)
  await client.end().catch(() => {})
  process.exit(1)
})
