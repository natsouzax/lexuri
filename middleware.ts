import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
const PROTECTED_PREFIXES = ['/youtube', '/flashcards', '/music', '/onboarding', '/settings']

// Routes that require onboarding to be complete
const REQUIRES_ONBOARDING = ['/youtube', '/flashcards', '/music', '/settings']

export async function middleware(request: NextRequest) {
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

  // Refresh session — must call getUser() not getSession()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isProtected = PROTECTED_PREFIXES.some((r) => pathname.startsWith(r))
  const needsOnboarding = REQUIRES_ONBOARDING.some((r) => pathname.startsWith(r))

  // Authenticated users hitting auth pages → send to app
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/youtube', request.url))
  }

  // Unauthenticated users hitting protected pages → send to login
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated users who haven't completed onboarding → send to onboarding
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
