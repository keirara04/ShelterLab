import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { user_id, email, full_name, university } = await request.json()

    if (!user_id || !email || !full_name || !university) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Wait a moment for user creation to propagate
    await new Promise(resolve => setTimeout(resolve, 500))

    // Verify the user exists in auth and email matches
    const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id)

    if (getUserError || !user) {
      return Response.json(
        { error: 'Invalid user' },
        { status: 400 }
      )
    }

    if (user.email !== email) {
      return Response.json(
        { error: 'Email mismatch' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existingProfile) {
      return Response.json(
        { success: true, message: 'Profile already exists' },
        { status: 200 }
      )
    }

    // Create profile with admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: user_id,
        full_name,
        email,
        university: university.trim(),
      })

    if (profileError) {
      return Response.json(
        { error: profileError.message },
        { status: 400 }
      )
    }

    return Response.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    return Response.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
