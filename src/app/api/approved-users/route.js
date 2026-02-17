import { supabaseServer } from '@/services/supabaseServer'
import { verifyAdmin } from '@/services/utils/verifyAdmin'

export async function GET(req) {
  const admin = await verifyAdmin(req)
  if (!admin) return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { searchParams } = new URL(req.url)
    const includeAll = searchParams.get('includeAll') === 'true'

    if (includeAll) {
      // Get all auth users with their approval status
      const { data: authUsers, error: authError } = await supabaseServer
        .from('profiles')
        .select('id, email, full_name, created_at, university_email_verified')
        .order('created_at', { ascending: false })

      if (authError) throw authError

      // Get approved users
      const { data: approvedList } = await supabaseServer
        .from('approved_users')
        .select('email')

      const approvedEmails = new Set(approvedList?.map(a => a.email.toLowerCase()) || [])

      // Map profiles with approval status
      const usersWithStatus = authUsers.map(user => ({
        ...user,
        status: approvedEmails.has(user.email.toLowerCase()) ? 'approved' : 'pending'
      }))

      return Response.json({ success: true, data: usersWithStatus })
    } else {
      // Get all approved users only
      const { data, error } = await supabaseServer
        .from('approved_users')
        .select('*')
        .order('approved_at', { ascending: false })

      if (error) throw error

      return Response.json({ success: true, data })
    }
  } catch (error) {
    console.error('Error fetching approved users:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function POST(req) {
  const admin = await verifyAdmin(req)
  if (!admin) return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { email, approval_notes } = await req.json()

    if (!email) {
      return Response.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    // Check if email already exists
    const { data: existing } = await supabaseServer
      .from('approved_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return Response.json({ success: false, error: 'Email already approved' }, { status: 400 })
    }

    // Insert new approved user
    const { data, error } = await supabaseServer
      .from('approved_users')
      .insert([
        {
          email: email.toLowerCase(),
          status: 'approved',
          approval_notes: approval_notes || null,
        }
      ])
      .select()
      .single()

    if (error) throw error

    // Auto-confirm email in auth
    try {
      await supabaseServer.auth.admin.updateUserById(
        (await supabaseServer
          .from('profiles')
          .select('id')
          .eq('email', email.toLowerCase())
          .single()).data?.id,
        { email_confirm: true }
      )
    } catch (confirmError) {
      console.warn('Could not auto-confirm email:', confirmError)
      // Don't fail the approval if email confirmation fails
    }

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('Error adding approved user:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(req) {
  const admin = await verifyAdmin(req)
  if (!admin) return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    const { id, email } = await req.json()

    if (!id && !email) {
      return Response.json({ success: false, error: 'ID or email is required' }, { status: 400 })
    }

    // Remove from approved users (auth account stays intact)
    const query = supabaseServer.from('approved_users').delete()

    if (id) {
      query.eq('id', id)
    } else if (email) {
      query.eq('email', email.toLowerCase())
    }

    const { error } = await query

    if (error) throw error

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error deleting approved user:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
