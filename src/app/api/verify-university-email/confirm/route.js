import { createClient } from '@supabase/supabase-js'

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

    const { otp } = await request.json()

    if (!otp || otp.length !== 8) {
      return Response.json({ error: 'Please enter the 8-digit code' }, { status: 400 })
    }

    // Get the pending university email from this user's profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('university_email, university_email_verified')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData?.university_email) {
      return Response.json({ error: 'No university email pending verification' }, { status: 400 })
    }

    if (profileData.university_email_verified) {
      return Response.json({ error: 'University email already verified' }, { status: 400 })
    }

    const emailLower = profileData.university_email.toLowerCase().trim()

    // Retrieve the latest unused verification code for this user
    const { data: verificationData, error: verifyError } = await supabaseAdmin
      .from('verification_codes')
      .select('id, code, expires_at, attempts')
      .eq('user_id', user.id)
      .eq('email', emailLower)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verifyError || !verificationData) {
      return Response.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 })
    }

    // Check if code has expired
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime > verificationData.expires_at) {
      return Response.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 })
    }

    // Check attempt limit (max 5 attempts)
    if (verificationData.attempts >= 5) {
      return Response.json({ error: 'Too many failed attempts. Please request a new verification code.' }, { status: 429 })
    }

    // Verify the code matches
    if (verificationData.code !== otp) {
      // Increment attempt counter
      const newAttempts = verificationData.attempts + 1
      await supabaseAdmin
        .from('verification_codes')
        .update({ attempts: newAttempts })
        .eq('id', verificationData.id)
        .catch(() => {}) // Silently fail attempt update

      const remainingAttempts = 5 - newAttempts
      return Response.json(
        { error: `Invalid code. ${remainingAttempts} attempts remaining.` },
        { status: 400 }
      )
    }

    // Mark verification code as used
    const { error: markUsedError } = await supabaseAdmin
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', verificationData.id)

    if (markUsedError) {
      // Still proceed even if marking as used fails - the code validation passed
      console.error('Failed to mark verification code as used:', markUsedError)
    }

    // Mark university email as verified on the user's profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ university_email_verified: true })
      .eq('id', user.id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message || 'An error occurred' }, { status: 500 })
  }
}
