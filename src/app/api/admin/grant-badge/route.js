import { supabaseServer } from '@/services/supabaseServer'

export async function PATCH(request) {
  try {
    const { user_id, grant } = await request.json()

    if (!user_id || typeof grant !== 'boolean') {
      return Response.json({ error: 'user_id and grant (boolean) are required' }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from('profiles')
      .update({ university_email_verified: grant })
      .eq('id', user_id)

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message || 'An error occurred' }, { status: 500 })
  }
}
