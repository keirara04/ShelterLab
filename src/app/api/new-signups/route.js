import { supabaseServer } from '@/services/supabaseServer'
import { verifyAdmin } from '@/services/utils/verifyAdmin'

export async function GET(request) {
  const admin = await verifyAdmin(request)
  if (!admin) return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })

  try {
    // Get all users with their approval status, sorted by newest first
    const { data: allUsers, error: usersError } = await supabaseServer
      .from('profiles')
      .select('id, email, full_name, created_at')
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Get approved users
    const { data: approvedList } = await supabaseServer
      .from('approved_users')
      .select('email')

    const approvedEmails = new Set(approvedList?.map(a => a.email.toLowerCase()) || [])

    // Find new signups (created in last 24 hours and not yet approved)
    const oneDay = 24 * 60 * 60 * 1000
    const now = new Date()
    const newSignups = allUsers.filter(user => {
      const createdAt = new Date(user.created_at)
      const isNew = now - createdAt < oneDay
      const isNotApproved = !approvedEmails.has(user.email.toLowerCase())
      return isNew && isNotApproved
    })

    return Response.json({ success: true, data: newSignups })
  } catch (error) {
    console.error('Error fetching new signups:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
