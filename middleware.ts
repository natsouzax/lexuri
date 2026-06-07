import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that redirect to /youtube when already logged in
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/youtube',
  '/flashcards',
  '/review',
  '/music',
  '/leaderboard',
  '/reports',
  '/settings',
  '/onboarding',
  '/feed',
  '/donate',
]

// Protected routes that also require completed onboarding
const REQUIRES_ONBOARDING = ['/youtube', '/flashcards', '/music', '/settings', '/review', '/leaderboard', '/reports']

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isProtected = PROTECTED_PREFIXES.some((r) => pathname.startsWith(r))
  const needsOnboarding = REQUIRES_ONBOARDING.some((r) => pathname.startsWith(r))

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/youtube', request.url))
  }

  // Redirect unauthenticated users away from protected pages
  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users who haven't completed onboarding
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
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
