import { redirect } from 'next/navigation'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (!token_hash || !type) {
    return redirect('/signup?error=invalid-token')
  }

  // Redirect to login — the client-side login will exchange the token and
  // create a proper browser session via Supabase's PKCE/hash flow.
  return redirect('/login?confirmed=true')
}
