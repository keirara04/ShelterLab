import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PUT(request) {
  try {
    const body = await request.json()
    const { full_name, avatar_url } = body

    // Get the user from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json(
        { error: 'Missing authorization' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only include fields that were actually provided
    const updates = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    // Update profile using admin client (bypasses RLS)
    const { error: updateError, data } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()

    if (updateError) {
      return Response.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    // Get the first item from the array
    const profile = Array.isArray(data) ? data[0] : data

    return Response.json(
      { success: true, profile },
      { status: 200 }
    )
  } catch (error) {
    return Response.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}