import { createServerClient } from '@supabase/ssr'

/**
 * Get the authenticated user from the incoming request's session cookies.
 * Returns the user object on success, or null if not authenticated.
 */
export async function getSessionUser(request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user || null
}
