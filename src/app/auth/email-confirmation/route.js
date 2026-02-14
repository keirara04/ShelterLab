import { supabaseServer } from '@/services/supabaseServer'
import { redirect } from 'next/navigation'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (!token_hash || !type) {
      return redirect('/signup?error=invalid-token')
    }

    // Verify the token and confirm email with Supabase
    const { error } = await supabaseServer.auth.verifyOtp({
      token_hash,
      type: 'email',
    })

    if (error) {
      return redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    // Get the confirmed user's email
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser()

    if (userError || !user) {
      return redirect('/signup?error=could-not-verify')
    }

    // Auto-approve the user since they confirmed their email
    const { data: existingApproval } = await supabaseServer
      .from('approved_users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single()

    if (!existingApproval) {
      await supabaseServer
        .from('approved_users')
        .insert([
          {
            email: user.email.toLowerCase(),
            status: 'approved',
            approval_notes: 'Auto-approved via email confirmation',
          }
        ])
    }

    // Redirect to dashboard with success message
    return redirect('/profile?success=email-confirmed')
  } catch (error) {
    console.error('Email confirmation error:', error)
    return redirect(`/signup?error=confirmation-failed`)
  }
}
