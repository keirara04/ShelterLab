import { createClient } from '@supabase/supabase-js'
import { ALLOWED_UNIVERSITY_EMAIL_DOMAINS } from '@/services/utils/constants'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Authenticate the current user via Bearer token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: 'Missing authorization' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { university_email } = await request.json()

    if (!university_email || !university_email.includes('@')) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const emailLower = university_email.toLowerCase().trim()

    // Validate against allowed domains
    const isAllowed = ALLOWED_UNIVERSITY_EMAIL_DOMAINS.some(domain =>
      emailLower.endsWith(domain)
    )

    if (!isAllowed) {
      return Response.json(
        { error: `Email must end with an approved university domain (e.g. .ac.kr)` },
        { status: 400 }
      )
    }

    // Check this university email isn't already verified by another user
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('university_email', emailLower)
      .eq('university_email_verified', true)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return Response.json(
        { error: 'This university email is already linked to another account' },
        { status: 409 }
      )
    }

    // Store the university email on the profile (unverified for now)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ university_email: emailLower, university_email_verified: false })
      .eq('id', user.id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 })
    }

    // Send OTP via Supabase's built-in email delivery
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email: emailLower,
      options: { shouldCreateUser: true },
    })

    if (otpError) {
      return Response.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message || 'An error occurred' }, { status: 500 })
  }
}
