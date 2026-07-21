import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/feed'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          },
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile row exists (trigger may not fire on OAuth or in dev envs)
      await supabase.from('profiles').upsert(
        {
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '',
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          email_verified: !!data.user.email_confirmed_at,
        },
        { onConflict: 'id', ignoreDuplicates: true },
      )

      const redirectTo = next.startsWith('/') ? next : '/feed'
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
