import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Skip middleware for auth routes (login, signup, api/auth)
  const authPaths = ['/login', '/signup', '/api/auth']
  const isAuthPath = authPaths.some((path) => req.nextUrl.pathname.startsWith(path))

  if (isAuthPath) {
    return res
  }

  // Refresh session if expired - required for Server Components
  // Use getUser() instead of getSession() for proper JWT validation
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = [
    // Note: /sell, /my-listings and /listing/.*/edit are NOT protected here because
    // these pages handle their own auth checks. This prevents middleware
    // cookie timing issues where authenticated users get redirected to login.
  ]

  // Check if current path is protected
  const isProtectedPath = protectedPaths.some((path) => {
    const regex = new RegExp(`^${path}$`)
    return regex.test(req.nextUrl.pathname)
  })

  // Redirect to login if accessing protected route without user
  if (isProtectedPath && !user) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
