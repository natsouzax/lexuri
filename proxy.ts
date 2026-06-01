import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
const PROTECTED_PREFIXES = ['/youtube', '/flashcards', '/music', '/onboarding', '/settings']

const REQUIRES_ONBOARDING = ['/youtube', '/flashcards', '/music', '/settings']

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isProtected = PROTECTED_PREFIXES.some((r) => pathname.startsWith(r))
  const needsOnboarding = REQUIRES_ONBOARDING.some((r) => pathname.startsWith(r))

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/youtube', request.url))
  }

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && needsOnboarding) {
    const { data: onboarding } = await supabase
      .from('onboarding')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!onboarding) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
