import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from '@/services/supabaseServer'
import { sendPushToAll } from '@/services/utils/sendPush'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request) {
  try {
    // Fetch the latest active notification from Supabase
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is fine
      throw error
    }

    return Response.json({
      success: true,
      data: data || null,
    })
  } catch (error) {
    console.error('Error fetching notification:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch notification' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    // Get the authenticated user from Auth header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.log('[API] No Authorization header')
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('[API] Token received:', token.substring(0, 20) + '...')

    // Get user directly from token using server client (simpler approach)
    console.log('[API] Verifying token...')
    let user = null
    
    try {
      const { data: { user: authUser }, error: authError } = await supabaseServer.auth.getUser(token)
      if (authUser) {
        user = authUser
      }
    } catch (e) {
      console.log('[API] Error getting user:', e.message)
    }

    // If server verification failed, try with anon client as fallback
    if (!user) {
      try {
        const { data: { user: fallbackUser } } = await supabase.auth.getUser(token)
        if (fallbackUser) {
          user = fallbackUser
        }
      } catch (e) {
        console.log('[API] Fallback also failed')
      }
    }

    if (!user) {
      console.log('[API] Auth failed - user not found')
      return Response.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is authorized admin
    const ADMIN_EMAIL = 'keiratestaccount@yahoo.com'
    console.log('[API] User email:', user.email, 'Admin email:', ADMIN_EMAIL)
    
    if (user.email !== ADMIN_EMAIL) {
      console.log('[API] User is not admin')
      return Response.json(
        { success: false, error: 'Only admin can push notifications' },
        { status: 403 }
      )
    }

    const { title, message } = await request.json()

    if (!title || !message) {
      console.log('[API] Missing title or message')
      return Response.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      )
    }

    console.log('[API] Deactivating previous notifications...')
    // Deactivate all other notifications
    await supabaseServer
      .from('notifications')
      .update({ is_active: false })
      .neq('id', 'null')

    console.log('[API] Inserting new notification...')
    // Insert new notification using service role
    const { data, error } = await supabaseServer
      .from('notifications')
      .insert([
        {
          title,
          message,
          is_active: true,
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.log('[API] Insert error:', error)
      throw error
    }

    console.log('[API] Notification created successfully, sending push notifications...')
    
    // Send push notification to all subscribers
    await sendPushToAll({
      title: data.title,
      body: data.message,
      tag: 'admin-notification',
      url: '/',
    })
    
    console.log('[API] Push notifications sent to all subscribers')
    return Response.json({
      success: true,
      data,
      message: 'Notification pushed to all users',
    })
  } catch (error) {
    console.error('[API] Error creating notification:', error)
    return Response.json(
      { success: false, error: 'Failed to create notification: ' + error.message },
      { status: 500 }
    )
  }
}
