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

    // Get the pending verification code from database
    const { data: verificationData, error: verifyQueryError } = await supabaseAdmin
      .from('verification_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (verifyQueryError || !verificationData) {
      return Response.json({ error: 'No active verification code found' }, { status: 400 })
    }

    // Check if code is expired
    const expiryTime = verificationData.expires_at
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (currentTime > expiryTime) {
      return Response.json({ error: 'Verification code expired. Please request a new one.' }, { status: 400 })
    }

    // Check attempt limit (max 5 attempts)
    if (verificationData.attempts >= 5) {
      return Response.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 })
    }

    // Verify the code
    if (verificationData.code !== otp) {
      // Increment attempt counter
      await supabaseAdmin
        .from('verification_codes')
        .update({ attempts: verificationData.attempts + 1 })
        .eq('id', verificationData.id)

      return Response.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
    }

    // Mark code as used
    await supabaseAdmin
      .from('verification_codes')
      .update({ is_used: true })
      .eq('id', verificationData.id)

    // Mark university email as verified on the user's profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ university_email_verified: true })
      .eq('id', user.id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 })
    }

    return Response.json({ success: true, message: 'University email verified successfully!' })
  } catch (err) {
    return Response.json({ error: err.message || 'An error occurred' }, { status: 500 })
  }
}
