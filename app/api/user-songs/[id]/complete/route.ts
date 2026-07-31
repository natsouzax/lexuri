import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAdminClient } from '@/lib/supabase'
import { errorMessage } from '@/lib/http'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: songId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { recordingPath?: string; mimeType?: string; consent?: boolean }
    const recordingPath = String(body.recordingPath ?? '')
    const mimeType = String(body.mimeType ?? '')
    const expectedPrefix = `${user.id}/${songId}/`
    if (!body.consent || !recordingPath.startsWith(expectedPrefix) || !mimeType.startsWith('audio/')) {
      return NextResponse.json({ error: 'Invalid recording or missing audio consent.' }, { status: 400 })
    }

    const { data: song, error: songError } = await supabase
      .from('user_songs')
      .select('id, title')
      .eq('id', songId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (songError) throw songError
    if (!song) return NextResponse.json({ error: 'Song not found.' }, { status: 404 })

    const now = new Date().toISOString()
    const { error: updateError } = await supabase.from('user_songs').update({
      status: 'completed',
      final_recording_path: recordingPath,
      final_recording_mime: mimeType,
      consent_at: now,
      completed_at: now,
      updated_at: now,
    }).eq('id', songId).eq('user_id', user.id)
    if (updateError) throw updateError

    const admin = getAdminClient()
    const [{ data: admins }, userName] = await Promise.all([
      admin.from('profiles').select('id').eq('role', 'admin'),
      Promise.resolve(
        String(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'A student'),
      ),
    ])

    const recipients = new Set<string>([user.id, ...((admins ?? []) as Array<{ id: string }>).map((row) => row.id)])
    const notifications = Array.from(recipients).map((recipientId) => recipientId === user.id
      ? {
          user_id: recipientId,
          title: 'Your song is ready',
          body: `“${song.title}” is now in your Library.`,
          data: { type: 'user_song_completed', song_id: songId, href: '/my-song' },
        }
      : {
          user_id: recipientId,
          title: 'Student song completed',
          body: `${userName} finished “${song.title}”.`,
          data: { type: 'student_song_completed', song_id: songId, student_id: user.id },
        })
    await admin.from('notifications').insert(notifications)

    const { data: signed } = await supabase.storage
      .from('song-recordings')
      .createSignedUrl(recordingPath, 60 * 60)

    return NextResponse.json({ completed: true, recordingUrl: signed?.signedUrl ?? null })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

