import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PATCH(request) {
  try {
    const { user_id, grant } = await request.json()

    if (!user_id) {
      return Response.json({ error: 'Missing user_id' }, { status: 400 })
    }

    if (typeof grant !== 'boolean') {
      return Response.json({ error: 'grant must be a boolean' }, { status: 400 })
    }

    // Update the user's badge status
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ university_email_verified: grant })
      .eq('id', user_id)

    if (error) {
      console.error('Error updating badge:', error)
      return Response.json({ error: 'Failed to update badge' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: grant ? 'Badge granted' : 'Badge revoked' 
    })
  } catch (err) {
    console.error('Grant badge error:', err)
    return Response.json({ error: err.message || 'An error occurred' }, { status: 500 })
  }
}
