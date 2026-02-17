import { supabaseServer } from '@/services/supabaseServer'
import { verifyAdmin } from '@/services/utils/verifyAdmin'

export async function DELETE(request) {
  try {
    const caller = await verifyAdmin(request)
    if (!caller) {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { user_id } = await request.json()

    if (!user_id) {
      return Response.json({ success: false, error: 'user_id is required' }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (user_id === caller.id) {
      return Response.json({ success: false, error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Get email before deletion so we can clean up approved_users
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('email')
      .eq('id', user_id)
      .single()

    // Remove from approved_users if present
    if (profile?.email) {
      await supabaseServer
        .from('approved_users')
        .delete()
        .eq('email', profile.email.toLowerCase())
    }

    // Delete user from Supabase Auth (cascades to profiles via foreign key)
    const { error: authError } = await supabaseServer.auth.admin.deleteUser(user_id)

    if (authError) throw authError

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
