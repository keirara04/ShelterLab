import { createServerClient } from '@supabase/ssr'

/**
 * Verify the incoming request comes from the admin account.
 * Reads the session from cookies (works for all same-origin browser requests).
 * Returns the admin user object on success, or null if unauthorized.
 */
export async function verifyAdmin(request) {
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

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return null
  }

  return user
}
