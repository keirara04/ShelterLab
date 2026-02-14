import { createClient } from '@supabase/supabase-js'
import { sendOtpEmail } from '@/services/brevoEmail'
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

    // Generate 8-digit OTP code
    const otp = String(Math.floor(10000000 + Math.random() * 90000000))

    // Calculate expiry time (15 minutes from now) using Unix timestamp in seconds
    const currentTime = Math.floor(Date.now() / 1000)
    const expiresAt = currentTime + (15 * 60)

    // Store the university email on the profile (unverified for now)
    // Also store the OTP code and expiry directly in the profile for simpler verification
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        university_email: emailLower, 
        university_email_verified: false,
        verification_code: otp,
        verification_expires_at: expiresAt,
        verification_attempts: 0
      })
      .eq('id', user.id)

    if (updateError) {
      // If columns don't exist, try without them
      const { error: fallbackError } = await supabaseAdmin
        .from('profiles')
        .update({ university_email: emailLower, university_email_verified: false })
        .eq('id', user.id)
      
      if (fallbackError) {
        return Response.json({ error: fallbackError.message }, { status: 400 })
      }
    }

    // Try to store OTP in verification_codes table (non-blocking if table doesn't exist)
    try {
      await supabaseAdmin
        .from('verification_codes')
        .insert({
          user_id: user.id,
          email: emailLower,
          code: otp,
          created_at: currentTime,
          expires_at: expiresAt,
          attempts: 0,
          is_used: false
        })
    } catch (dbError) {
      // Table might not exist yet - continue anyway
      console.error('verification_codes insert error (table may not exist):', dbError?.message)
    }

    // Send OTP via Brevo email service
    const emailResult = await sendOtpEmail(emailLower, otp)

    if (!emailResult.success) {
      // Log the error but don't expose details to client
      if (process.env.NODE_ENV === 'development') {
        console.error('Brevo email send error:', emailResult.error)
      }
      return Response.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message || 'An error occurred' }, { status: 500 })
  }
}
