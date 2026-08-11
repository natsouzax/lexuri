import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import { errorMessage } from '@/lib/http'

async function deleteRecordings(userId: string) {
  const bucket = getAdminClient().storage.from('song-recordings')
  const { data: topLevel, error: topLevelError } = await bucket.list(userId, { limit: 1000 })
  if (topLevelError) throw topLevelError

  const directFiles = (topLevel ?? [])
    .filter((entry) => entry.id)
    .map((entry) => `${userId}/${entry.name}`)
  const folders = (topLevel ?? []).filter((entry) => !entry.id)
  const nestedFiles = (await Promise.all(folders.map(async (folder) => {
    const prefix = `${userId}/${folder.name}`
    const { data, error } = await bucket.list(prefix, { limit: 1000 })
    if (error) throw error
    return (data ?? []).filter((entry) => entry.id).map((entry) => `${prefix}/${entry.name}`)
  }))).flat()

  const paths = [...directFiles, ...nestedFiles]
  if (!paths.length) return
  const { error } = await bucket.remove(paths)
  if (error) throw error
}

export async function POST(request: Request) {
  try {
    const requestOrigin = request.headers.get('origin')
    if (!requestOrigin || requestOrigin !== new URL(request.url).origin) {
      return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { confirmation?: string }
    if (body.confirmation?.trim().toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Type your account email exactly to confirm deletion.' }, { status: 400 })
    }

    const admin = getAdminClient()
    await deleteRecordings(user.id)

    const cleanupResults = await Promise.all([
      admin.from('feedback').delete().eq('user_id', user.id),
      admin.from('analytics_events').delete().eq('user_id', user.id),
    ])
    const cleanupError = cleanupResults.find((result) => result.error)?.error
    if (cleanupError) throw cleanupError

    const { error: deletionError } = await admin.auth.admin.deleteUser(user.id)
    if (deletionError) throw deletionError

    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
