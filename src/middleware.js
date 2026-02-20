import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const SECURITY_HEADERS = {
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
}

function withSecurityHeaders(response) {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // 1. Skip middleware entirely for auth routes
  const authPaths = [
    '/login',
    '/signup',
    '/terms',
    '/privacy',
    '/api/auth',
    '/auth/callback',
    '/auth/email-confirmation',
    '/auth/university-email-confirmation',
  ]
  if (authPaths.some((p) => pathname.startsWith(p))) {
    return withSecurityHeaders(NextResponse.next({ request }))
  }

  // 2. Skip middleware for public routes (no auth needed)
  const publicApiPrefixes = ['/api/listings', '/api/notifications']
  const publicPagePaths = ['/', '/pasarmalam']
  const publicPagePrefixes = ['/listing/']
  if (
    publicPagePaths.includes(pathname) ||
    publicPagePrefixes.some((p) => pathname.startsWith(p)) ||
    publicApiPrefixes.some((p) => pathname.startsWith(p))
  ) {
    return withSecurityHeaders(NextResponse.next({ request }))
  }

  // 3. Protected routes — check session with correct @supabase/ssr v0.8 interface
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // If getUser fails, treat as unauthenticated
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return withSecurityHeaders(NextResponse.redirect(redirectUrl))
  }

  return withSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|txt|xml)$).*)',
  ],
}
