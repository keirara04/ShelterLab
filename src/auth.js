import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Verify authentication in API routes
 * Returns { authenticated: boolean, user: object | null, error: string | null }
 */
export async function verifyAuth() {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return {
        authenticated: false,
        user: null,
        error: 'Not authenticated',
      }
    }

    return {
      authenticated: true,
      user: session.user,
      error: null,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return {
      authenticated: false,
      user: null,
      error: error.message || 'Authentication failed',
    }
  }
}

/**
 * Middleware function to require authentication from Authorization header
 * Use this at the start of protected API routes
 */
export async function requireAuth(request) {
  try {
    // Check for Authorization header (Bearer token)
    const authHeader = request?.headers.get('authorization')

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

      if (!authError && user) {
        return { authenticated: true, user, error: null }
      }
    }

    // Fallback to cookie-based auth
    const auth = await verifyAuth()
    if (!auth.authenticated) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return auth
  } catch (error) {
    return Response.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}
