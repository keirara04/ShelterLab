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

    // Verify the OTP server-side using a temporary anon client.
    // This does NOT affect the current user's browser session because it runs server-side.
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: verifyData, error: verifyError } = await tempClient.auth.verifyOtp({
      email: profileData.university_email,
      token: otp,
      type: 'email',
    })

    if (verifyError || !verifyData?.user) {
      return Response.json({ error: 'Invalid or expired code. Please request a new one.' }, { status: 400 })
    }

    // Mark university email as verified on the user's profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ university_email_verified: true })
      .eq('id', user.id)

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 400 })
    }

    // Clean up the temporary Supabase auth user created by the OTP flow
    if (verifyData.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(verifyData.user.id).catch(() => {})
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message || 'An error occurred' }, { status: 500 })
  }
}
